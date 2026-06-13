import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from data_tool import fetch_district_data

load_dotenv()  # this reads the .env file so as to inject the GEMINI_API_KEY into the environment before anything else tries to access it

# the client is created once at module load time so as to avoid the overhead of re-instantiating it on every single chat message
_API_KEY = os.getenv("GEMINI_API_KEY")
_client  = genai.Client(api_key=_API_KEY) if _API_KEY else None

SYSTEM_PROMPT = """You are an agricultural AI assistant integrated into a Millet Yield Forecasting dashboard.
Your primary role is to answer questions about all types of millets (agronomy, types, benefits, farming practices), the specific district yield data from 1993 to 2019 across India (which is focused on pearl millet), and the SHAP-based machine learning methodology used in this project.

When a user asks about specific district yield statistics or why a prediction was made, you MUST use the fetch_district_data(district_name, year) tool to retrieve real data from the project's dataset. 

Do not hallucinate data. If the tool returns an error or says data is missing, relay that clearly to the user.

Scope restrictions:
- Do not answer questions about non-millet crops (e.g., wheat, rice).
- Do not provide current or live weather forecasts.
- Do not provide market price predictions.
- If asked anything outside this scope, politely decline and steer the conversation back to millets, historical yields, or the dashboard's ML insights."""

def process_message(history: list, new_message: str) -> str: # this function is called by the /chat endpoint so as to process the user's message and return a response
    if not _client:
        return "System Error: The backend is missing the GEMINI_API_KEY in its .env file. Please add it to start chatting."

    # the history is rebuilt on each call so as to give the model full conversational context without storing any state server-side
    formatted_history = []
    for msg in history:
        role = 'user' if msg['role'] == 'user' else 'model'  # the frontend uses 'assistant' but the Gemini SDK expects 'model' so as to match its internal role schema
        formatted_history.append(
            types.Content(role=role, parts=[types.Part.from_text(text=msg['text'])])
        )

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.3,        # this is kept low so as to produce factual, consistent answers rather than creative or unpredictable ones
        max_output_tokens=300,  # this is capped so as to prevent the model from generating excessively long responses that waste API quota
        tools=[fetch_district_data]  # this registers the Python function as a callable tool so as to allow the model to fetch real data instead of hallucinating it
    )

    chat = _client.chats.create(
        model='gemini-2.5-flash',  # flash is used so as to balance response speed and cost — it is significantly cheaper than the pro variant for high-volume use
        config=config,
        history=formatted_history
    )

    try:# if the model decides it needs district data, the SDK will automatically pause, call fetch_district_data, and resume so as to produce a grounded final answer
        response = chat.send_message(new_message)
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "503" in error_msg:
            return "I'm currently experiencing a huge spike in traffic! Please give me a minute to catch my breath and ask me again."
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return "I've temporarily hit my message limit for the day. Please try asking again a bit later!"  # these are caught separately so as to give the user an actionable, human-readable explanation instead of a raw API error code
        return f"Oops! I ran into an internal error: {error_msg}"
