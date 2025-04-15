"""
LLM Query Parsing Utility - llm_utils.py
----------------------------------------

This module handles natural language query parsing by calling the HuggingFace
Inference API (Mistral-7B-Instruct) to extract structured filters (attribute, operator, value)
for use in filtering 3D building visualizations.

Environment Variables:
----------------------
- HUGGINGFACE_API_KEY: Your Hugging Face Inference API key, loaded from a .env file.

Dependencies:
-------------
- requests: For making POST requests to the HuggingFace endpoint.
- dotenv: Loads environment variables from .env file.
- json, re: For parsing model responses and extracting filter logic.

Function:
---------
- parse_query(query: str) -> dict
    Sends a prompt to the LLM, parses the returned text for a valid filter in JSON format,
    and handles unit normalization (e.g., feet → meters) and zoning type conversion.
"""
import requests
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

def parse_query(query):

    """
    Parse a natural language query into a structured JSON filter using an LLM.

    Args:
        query (str): A user-entered query like "highlight buildings over 100 feet".

    Returns:
        dict: A JSON object with 'attribute', 'operator', and 'value', e.g.:
              {"attribute": "height", "operator": ">", "value": 30.48}

              Returns an empty dict on failure or invalid response.
    """
    prompt = f"""
    Extract a JSON filter from this request: "{query}"

    Respond ONLY with the JSON object. The format should include:
    - "attribute" (e.g. "height", "zoning", "value", "area")
    - "operator" (e.g. ">", "<", "==")
    - "value" (e.g. 100, "RC-G", 500000)

    If the query mentions "feet", assume it refers to building height and convert feet to meters (1 foot = 0.3048 meters). Use "height" as the attribute in that case.
    """

    try:
        response = requests.post(API_URL, headers=HEADERS, json={"inputs": prompt})
        response.raise_for_status()

        full_json = response.json()
        print("Hugging Face raw response:", full_json)

        generated_text = full_json[0].get("generated_text", "").strip()
        print("Raw generated text:", generated_text)

        matches = re.findall(r"\{.*?\}", generated_text, re.DOTALL)
        for match in matches:
            try:
                parsed_filter = json.loads(match)
                print("Parsed JSON:", parsed_filter)

                if all(k in parsed_filter for k in ("attribute", "operator", "value")):
                    # Convert feet to meters if needed
                    if "feet" in query.lower() and parsed_filter["attribute"] == "height":
                        parsed_filter["value"] = round(parsed_filter["value"] * 0.3048, 2)

                    # Convert zoning string digits to int
                    if parsed_filter.get("attribute") == "zoning" and isinstance(parsed_filter["value"], str) and parsed_filter["value"].isdigit():
                        parsed_filter["value"] = int(parsed_filter["value"])

                    print("Final parsed filter:", parsed_filter)
                    return parsed_filter

            except json.JSONDecodeError:
                continue

        print("No valid filter found in any JSON block.")
        return {}

    except Exception as e:
        print("LLM Error:", e)
        return {}



