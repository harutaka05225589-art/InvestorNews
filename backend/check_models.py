import os
from google import genai
from dotenv import load_dotenv
import sys

# Load env from .env file explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found.")
    sys.exit(1)

print("Using new google-genai SDK")
client = genai.Client(api_key=api_key)

print("\n--- Available Models ---")
try:
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

print("\n--------------------------------------------")
