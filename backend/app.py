"""
Urban Design 3D Dashboard - Flask Backend API
---------------------------------------------

This Flask backend serves GeoJSON building data and enables natural language querying
of urban features using a Large Language Model (LLM) via the HuggingFace Inference API.

Endpoints:
----------
1. GET /api/buildings
   - Returns all building data in GeoJSON format.

2. POST /api/query
   - Accepts a natural language query string (e.g., "highlight buildings over 100 feet").
   - Uses a LLM (Mistral-7B) to parse the query into a structured JSON filter.
   - Responds with a parsed filter containing: "attribute", "operator", and "value".

Dependencies:
-------------
- Flask: Web server framework
- Flask-CORS: Enables cross-origin requests from the React frontend
- python-dotenv: Loads environment variables from .env
- requests: Makes HTTP requests to HuggingFace API
- llm_utils.py: Helper module that handles query parsing using the LLM

File Dependencies:
------------------
- Buildings_20250414.geojson: Local GeoJSON file containing Calgary building data

Usage:
------
Run locally:
    $ python app.py

Note:
Ensure the environment variable HUGGINGFACE_API_KEY is set,
either through your environment or a .env file.

Author: Elizabeth Szentmiklossy
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import llm_utils

app = Flask(__name__)
CORS(app)  # Allow requests from your React frontend

# Load building data once
with open("Buildings_20250414.geojson", "r") as f:
    building_data = json.load(f)

@app.route("/api/buildings")
def get_buildings():
    """Returns all buildings as a GeoJSON response."""
    return jsonify(building_data)

@app.route("/api/query", methods=["POST"])
def query_buildings():
    """
    Accepts a natural language query and returns a structured filter
    parsed by a language model (via HuggingFace).
    """
    user_input = request.json.get("query", "")
    llm_response = llm_utils.parse_query(user_input)

    # Validate the LLM response
    attribute = llm_response.get("attribute")
    operator = llm_response.get("operator")
    value = llm_response.get("value")

    if not (attribute and operator and value is not None):
        return jsonify({"error": "Invalid LLM output"}), 400

    # Return the filter to frontend 
    return jsonify(llm_response)


if __name__ == "__main__":
    app.run(debug=True)
