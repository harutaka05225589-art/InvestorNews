from send_email import send_alert_email
import os
from dotenv import load_dotenv

load_dotenv()

# Config from env is used by send_email
recipient = os.environ.get("SENDER_EMAIL") # Send to self for test

if __name__ == "__main__":
    print(f"Testing email to {recipient}...")
    success = send_alert_email(
        recipient, 
        "Test Email from Investor News", 
        "<h1>Hello</h1><p>This is a test email to verify credentials.</p>"
    )
    
    if success:
        print("Success! Email sent.")
    else:
        print("Failed. Please check credentials or App Password settings.")
