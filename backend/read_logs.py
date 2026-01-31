
import os

# Try to locate the log file
log_paths = [
    os.path.expanduser('~/.pm2/logs/news-frontend-error.log'),
    os.path.expanduser('~/.pm2/logs/news-frontend-out.log'),
]

found = False
for path in log_paths:
    if os.path.exists(path):
        print(f"--- Reading Log: {path} ---")
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                # Read last 50 lines efficiently
                lines = f.readlines()[-50:]
                for line in lines:
                    print(line.strip())
            found = True
        except Exception as e:
            print(f"Error reading {path}: {e}")
        print("\n")

if not found:
    print("Could not find PM2 logs in standard locations.")
    print(f"Checked: {log_paths}")
