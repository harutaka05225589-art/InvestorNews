import os
import google.generativeai as genai
from dotenv import load_dotenv
import sys

# Load env from .env file explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found.")
    sys.exit(1)

print(f"Using Google Generative AI SDK Version: {genai.__version__}")
genai.configure(api_key=api_key)

print("\n--- Available Models for generateContent ---")
try:
    found = False
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            found = True
    if not found:
        print("No models found with 'generateContent' capability.")
except Exception as e:
    print(f"Error listing models: {e}")

print("\n--------------------------------------------")
