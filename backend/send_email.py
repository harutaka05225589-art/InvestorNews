import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import traceback

# Config (User needs to fill this later, or we load from .env)
# Using generic placeholders for now
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "")
SENDER_PASSWORD = os.environ.get("SENDER_PASSWORD", "")

def send_alert_email(to_email, subject, body_html):
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("Skipping email: SENDER_EMAIL or SENDER_PASSWORD not set.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Investor News <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test
    pass
