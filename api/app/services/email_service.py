import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

# Global dictionary to hold latest OTP for inspection & on-screen fallback
LATEST_DEV_OTPS = {}

def send_otp_email(to_email: str, otp_code: str, purpose: str = "registration") -> bool:
    """
    Sends an OTP code via SMTP if configured (e.g. Gmail App Password),
    and always records & logs it to console and dev store.
    """
    normalized_email = to_email.lower().strip()
    LATEST_DEV_OTPS[normalized_email] = {
        "otp": otp_code,
        "purpose": purpose
    }
    
    print("\n" + "="*60)
    print(f"📧 [EMAIL SERVICE] OTP DISPATCH")
    print(f"   Recipient: {normalized_email}")
    print(f"   Purpose:   {purpose.upper()}")
    print(f"   OTP Code:  👉 {otp_code} 👈 (Valid for {settings.OTP_EXPIRE_MINUTES} minutes)")
    print("="*60 + "\n")

    # If SMTP is configured, send real email
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            subject = f"Your RoomMates Verification Code: {otp_code}"
            if purpose == "password_reset":
                subject = f"Reset Your RoomMates Password: {otp_code}"

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            from_addr = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{from_addr}>"
            msg["To"] = normalized_email

            text_content = f"Your 6-digit RoomMates verification code is: {otp_code}. It is valid for {settings.OTP_EXPIRE_MINUTES} minutes."
            html_content = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="display: flex; align-items: center; margin-bottom: 24px;">
                    <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: inline-block; vertical-align: middle; text-align: center; line-height: 36px; color: #ffffff; font-weight: bold; font-size: 18px; margin-right: 12px;">R</div>
                    <span style="font-size: 20px; font-weight: 700; color: #0f172a; vertical-align: middle;">RoomMates</span>
                </div>
                <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Verification Code</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
                    Please enter the following 6-digit OTP code to complete your {purpose.replace('_', ' ')}. This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.
                </p>
                <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5;">{otp_code}</span>
                </div>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    If you did not request this verification code, please ignore this email.
                </p>
            </div>
            """
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            clean_password = settings.SMTP_PASSWORD.replace(" ", "").strip()
            if settings.SMTP_PORT == 465:
                with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                    server.login(settings.SMTP_USER, clean_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, clean_password)
                    server.send_message(msg)

            print(f"✅ [EMAIL SERVICE] Email successfully sent to {normalized_email} via SMTP ({settings.SMTP_HOST})")
            return True
        except Exception as e:
            print(f"⚠️ [EMAIL SERVICE] SMTP Delivery Warning: {e}")
            return False
    else:
        print(f"ℹ️ [EMAIL SERVICE] Real SMTP not yet configured in backend/.env. Using on-screen & console OTP mode.")
        return True

def get_latest_dev_otp(email: str) -> str | None:
    data = LATEST_DEV_OTPS.get(email.lower().strip())
    return data["otp"] if data else None
