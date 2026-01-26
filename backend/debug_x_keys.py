import os
from dotenv import load_dotenv

# Load env same way as send_x.py
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

print(f"Loading env from: {env_path}")

keys = {
    "X_API_KEY": os.getenv("X_API_KEY"),
    "X_API_SECRET": os.getenv("X_API_SECRET"),
    "X_ACCESS_TOKEN": os.getenv("X_ACCESS_TOKEN"),
    "X_ACCESS_SECRET": os.getenv("X_ACCESS_SECRET"),
}

print("-" * 30)
for name, val in keys.items():
    if val:
        masked = val[:4] + "*" * (len(val) - 8) + val[-4:] if len(val) > 8 else "****"
        print(f"{name}: {masked} (Length: {len(val)})")
    else:
        print(f"{name}: [MISSING!]")
print("-" * 30)
