# Millet Yield Forecaster & Explainable AI Chatbot

A comprehensive machine learning project for forecasting pearl millet yields across 334 Indian districts (1993–2019) using Explainable AI (XAI) and a Tool-Augmented LLM Agent.

## The Problem Statement
While India's agricultural policy has historically focused on the Green Revolution (wheat and rice), there's a growing need to understand and promote climate-resilient crops like millets. This project attempts to capture district-level yield growth and predict future yields, addressing a critical gap in local-level, explainable agricultural forecasting.

## Data Engineering
The foundation of this project is a 30-year panel dataset built from the **ICRISAT District Level Database** covering 334 districts across India. 

- **Geocoding & Climate Data**: Every district was geocoded, and historical monsoon data was pulled from the **NASA POWER API**.
- **Feature Engineering**: Extensive feature engineering was performed, revealing that the previous year's yield (`yield_lag1`) is the strongest predictor of current yield.

## The Ablation Study
The model development followed a rigorous sequential ablation study, starting from a baseline and progressively adding complexity to address limitations:

1. **XGBoost v1 (R² 0.961, RMSE 152):** Baseline model proving historical yield as the dominant factor.
2. **XGBoost v2 (R² 0.974, RMSE 118):** Incorporated hyperparameter tuning and rainfall interactions, reducing error by 22%.
3. **LSTM v1 (R² 0.989, RMSE 79):** Deep learning approach with temporal sequencing (sequence length 1).
4. **LSTM v2 (R² 0.997, RMSE 43):** The absolute best research model, utilizing a 3-year sequence window to capture long-term trends perfectly.

### The Product Decision: Why XGBoost?
Despite LSTM v2's superior metrics, **XGBoost v2 was explicitly chosen for the production dashboard**. 
The reason? **Explainability**. Deep learning SHAP computations are slow and approximate. XGBoost allows for exact, lightning-fast SHAP values, enabling real-time, explainable predictions that tell the user *why* a forecast was made.

## The Agentic Chatbot (No RAG)
Instead of a standard Retrieval-Augmented Generation (RAG) system, this project features a **Tool-Augmented Agent** built with Langchain and Gemini 2.5 Flash.

When a user asks, *"What was the yield in Anantapur in 2010?"*, the LLM autonomously pauses, executes a custom Python tool to read the exact data row from the CSV, and incorporates that factual data into its response. This eliminates hallucinations and ensures complete data accuracy.

## Repository Structure
This repository follows an MLOps-style structure:
- `data/`: Contains raw datasets and processed final data for the model.
- `notebooks/`: Jupyter notebooks detailing the EDA, feature engineering, and ablation study.
- `models/`: Pickled XGBoost and PyTorch LSTM models, alongside data scalers.
- `media/`: Charts, presentations, and demo videos.
- `backend/`: FastAPI stateless REST API with strict security controls (rate limiting, input validation).
- `dashboard/`: React frontend providing the interactive visual interface.

## How to Run Locally

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Start the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
uvicorn api:app --reload
```

### 2. Start the Frontend
```bash
cd dashboard
npm install
npm run dev
```

Visit `http://localhost:5173` to interact with the dashboard.
