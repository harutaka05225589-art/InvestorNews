import google.generativeai as genai
import os

# Config
# User needs to set this in .env or environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def summarize_text(text):
    if not GEMINI_API_KEY:
        print("Skipping AI summary: GEMINI_API_KEY not set.")
        return None

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash') # Free tier friendly model

        prompt = f"""
        あなたはプロの金融アナリストです。
        以下のニュース記事を、個人投資家にとって重要なポイントに絞って、3行程度の箇条書きで要約してください。
        
        記事:
        {text[:4000]} # Limit characters
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"AI Summary Failed: {e}")
        return None

if __name__ == "__main__":
    # Test
    sample = "ここにニュースの本文が入ります..."
    print(summarize_text(sample))
