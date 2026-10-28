"""Idempotently add HTTP Basic Auth blocks for /admin, /api/admin, and /api/investors
to the nginx site config for rich-investor-news.com, test with `nginx -t`, and reload nginx.

Run with sudo AFTER creating /etc/nginx/.htpasswd:
    sudo python3 backend/setup_nginx_admin_auth.py
"""
import glob
import os
import re
import shutil
import subprocess
import sys

HTPASSWD = "/etc/nginx/.htpasswd"

ADMIN_BLOCKS = """    # --- Admin Basic Auth (auto-configured) ---
    location ^~ /admin {
        auth_basic "Admin";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /api/admin {
        auth_basic "Admin";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /api/investors {
        limit_except GET {
            auth_basic "Admin";
            auth_basic_user_file /etc/nginx/.htpasswd;
        }
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # --- End Admin Basic Auth ---

"""

def main():
    if os.geteuid() != 0:
        sys.exit("ERROR: Please run with sudo: sudo python3 backend/setup_nginx_admin_auth.py")

    if not os.path.exists(HTPASSWD):
        sys.exit("ERROR: /etc/nginx/.htpasswd not found. Run `sudo htpasswd -c /etc/nginx/.htpasswd admin` first.")

    target = None
    for path in sorted(glob.glob("/etc/nginx/sites-enabled/*")):
        real = os.path.realpath(path)
        if os.path.isfile(real):
            with open(real, "r", encoding="utf-8", errors="ignore") as f:
                if "rich-investor-news.com" in f.read():
                    target = real
                    break

    if not target:
        sys.exit("ERROR: Could not find nginx config containing rich-investor-news.com in /etc/nginx/sites-enabled/")

    with open(target, "r", encoding="utf-8") as f:
        original = f.read()

    if "location ^~ /admin" in original:
        print(f"Admin Basic Auth is already configured in {target}.")
        subprocess.run(["nginx", "-t"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)
        print("nginx reloaded successfully.")
        return

    backup = "/root/investor-news.nginx.bak"
    shutil.copy2(target, backup)
    print(f"Backed up {target} -> {backup}")

    # Insert right before each `location / {` block
    updated, count = re.subn(r"(^\s*location\s+/\s*\{)", ADMIN_BLOCKS + r"\1", original, flags=re.MULTILINE)
    if count == 0:
        sys.exit(f"ERROR: Could not find `location / {{` in {target}. Original untouched.")

    with open(target, "w", encoding="utf-8") as f:
        f.write(updated)

    res = subprocess.run(["nginx", "-t"])
    if res.returncode != 0:
        shutil.copy2(backup, target)
        sys.exit("ERROR: `nginx -t` failed; restored original config.")

    subprocess.run(["systemctl", "reload", "nginx"], check=True)
    print(f"SUCCESS: Admin Basic Auth added to {target} ({count} server block(s)) and nginx reloaded.")

if __name__ == "__main__":
    main()
