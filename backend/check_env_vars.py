import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"Loading env from: {env_path}")
load_dotenv(env_path, override=True)

keys = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"]
missing = []

for k in keys:
    val = os.getenv(k)
    if not val:
        missing.append(k)
    else:
        # Print first 2 chars to check if loaded (security conscious)
        print(f"{k}: {val[:2]}***")

if missing:
    print(f"\n[ERROR] Missing keys: {missing}")
else:
    print("\n[OK] All X API keys found.")
