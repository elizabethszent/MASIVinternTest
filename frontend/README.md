# MASIV 2025 Intern Test – Urban Design 3D Dashboard

This project is a full-stack urban dashboard that visualizes Calgary buildings in 3D using React Three Fiber. It includes an experimental natural language interface powered by a large language model (LLM) that converts queries like “highlight buildings over 100 feet” into structured filters.

---

## Tech Stack

- **Frontend**: React + Three.js via `@react-three/fiber`
- **Backend**: Flask (Python)
- **LLM Integration**: Hugging Face Inference API (Mistral-7B)
- **Data Format**: GeoJSON (Calgary buildings)

---
NOTE: Due to GitHub’s 100 MB file limit, the `Buildings_20250414.geojson` file is not included in this repository.

To run the backend locally or deploy it publicly, please manually place the file in:
## How to Run

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Add your Hugging Face key to .env
python app.py

## 🚀 How to Run Locally

### 🔙 Backend

```bash
cd backend
python -m venv venv
# Activate the environment:
source venv/bin/activate    # Mac/Linux
# OR
venv\Scripts\activate       # Windows

pip install -r requirements.txt
# Make sure to add your Hugging Face key in `.env`
python app.py


cd frontend
npm install
npm start