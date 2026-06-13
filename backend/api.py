import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from typing import List
import uvicorn
import logging

from chatbot_agent import process_message
from ml_service import (
    get_national_overview,
    get_locations,
    get_district_timeseries,
    get_district_forecast,
    get_shap_values
)

logging.basicConfig(level=logging.INFO)  # this is set to INFO so as to surface useful server activity without being overwhelmed by DEBUG-level noise
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)  # this uses the caller's IP address as the rate-limit key so as to prevent a single user from exhausting shared API quotas

app = FastAPI(title="Millet Yield Forecaster API")

# these two lines wire slowapi into FastAPI so as to make the @limiter.limit decorators on each route take effect
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# FRONTEND_URL can hold a single URL or a comma-separated list so as to support both the production domain and Vercel preview URLs in one variable
if os.getenv("FRONTEND_URL"):
    for url in os.getenv("FRONTEND_URL").split(","):
        url = url.strip()
        if url:
            origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS allowed origins: {origins}")  # logged at startup so as to verify the Vercel URL was picked up correctly from FRONTEND_URL

@app.middleware("http")  # this is a decorator that wraps the function below in logic that runs before every single API request and after every single API response
async def add_security_headers(request: Request, call_next):
    """Injects hardened HTTP headers into every response so as to protect against common browser-level attacks."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"]    = "nosniff"           # this prevents browsers from MIME-sniffing a response away from the declared content-type
    response.headers["X-Frame-Options"]           = "DENY"              # this blocks the app from being embedded in iframes so as to prevent clickjacking attacks
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # this tells browsers to always use HTTPS for one year so as to prevent SSL stripping
    return response


class ChatMessage(BaseModel): # defines the structure of a single chat message that is expected to be sent to the /chat endpoint
    role: str = Field(..., max_length=50)
    text: str = Field(..., max_length=5000)  # history messages are bounded so as to prevent memory exhaustion from very long conversation histories

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1000)  # user input is capped at 1000 characters so as to prevent excessively long prompts from being sent to the Gemini API
    history: List[ChatMessage]

@app.post("/chat") # this is the chatbot endpoint
@limiter.limit("5/minute")  # this is set to 5 per minute so as to prevent spam from rapidly exhausting the free-tier Gemini API quota
async def chat_endpoint(request: Request, body: ChatRequest):
    """Receives a message and conversation history, passes it to the Gemini agent, and returns the response."""
    history_dicts = [{"role": msg.role, "text": msg.text} for msg in body.history]

    try:
        reply = process_message(history_dicts, body.message)
        return {"response": reply}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return {"error": "Internal Server Error. Please try again later."}  # the real error is hidden from the client so as to avoid leaking server internals like file paths or model details

@app.get("/national")
@limiter.limit("30/minute")  # data endpoints are given a more generous limit so as to allow smooth chart interactions without hitting the cap
async def national_endpoint(request: Request):
    """Returns aggregated yearly trend and state comparison data for the National Overview charts."""
    try:
        return get_national_overview()
    except Exception as e:
        logger.error(f"National Data error: {str(e)}")
        return {"error": "Failed to fetch national data."}

@app.get("/locations")
@limiter.limit("30/minute")
async def locations_endpoint(request: Request):
    """Returns the full state-to-district mapping so as to dynamically populate the frontend dropdowns."""
    try:
        return get_locations()
    except Exception as e:
        logger.error(f"Locations error: {str(e)}")
        return {"error": "Failed to fetch locations."}

@app.get("/district/{state_name}/{district_name}")
@limiter.limit("30/minute")
async def district_endpoint(request: Request, state_name: str, district_name: str):
    """Returns historical yield and rainfall data for a specific district so as to render the time-series chart."""
    try:
        return get_district_timeseries(state_name, district_name)
    except Exception as e:
        logger.error(f"District Data error: {str(e)}")
        return {"error": "Failed to fetch district data."}

@app.get("/predict/{state_name}/{district_name}")
@limiter.limit("20/minute")  # prediction and SHAP endpoints are slightly more restricted so as to protect the more computationally expensive ML inference calls
async def predict_endpoint(request: Request, state_name: str, district_name: str):
    """Runs the XGBoost model on the district's latest year and returns actual vs predicted yield."""
    try:
        return get_district_forecast(state_name, district_name)
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return {"error": "Failed to generate forecast."}

@app.get("/shap/{state_name}/{district_name}")
@limiter.limit("20/minute")
async def shap_endpoint(request: Request, state_name: str, district_name: str):
    """Calculates SHAP feature importances for the district prediction so as to explain which factors drove the model's output."""
    try:
        return get_shap_values(state_name, district_name)
    except Exception as e:
        logger.error(f"SHAP error: {str(e)}")
        return {"error": "Failed to calculate interpretability."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)  # host 0.0.0.0 is used so as to make the server accessible on the local network, not just localhost
