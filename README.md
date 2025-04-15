# MASIV 2025 Intern Test – Urban Design 3D Dashboard

This project is a full-stack urban dashboard that visualizes Calgary buildings in 3D using React Three Fiber. It includes an experimental natural language interface powered by a large language model (LLM) that converts queries like “highlight buildings over 100 feet” into structured filters.

---

## 🚀 Live Demo

- **Frontend Dashboard**: [https://masi-vintern-test.vercel.app/](https://masi-vintern-test.vercel.app/)
- **Backend API (GeoJSON Endpoint)**: [https://masivinterntest.onrender.com/api/buildings](https://masivinterntest.onrender.com/api/buildings)

> No installation required — just click the links to explore the full project!

---

## 🛠 Tech Stack

- **Frontend**: React + Three.js via `@react-three/fiber`
- **Backend**: Flask (Python)
- **LLM Integration**: Hugging Face Inference API (Mistral-7B)
- **Data Format**: GeoJSON (Calgary buildings)

> ⚠️ **Note**: Due to GitHub’s 100 MB file limit, the `Buildings_20250414.geojson` file is excluded. The hosted backend uses a reduced version (~1MB) for deployment.

---

## 💻 Run Locally

### 🔙 Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Add your Hugging Face API key to a .env file
echo HUGGINGFACE_API_KEY=your_api_key_here > .env

# Run the Flask backend
python app.py