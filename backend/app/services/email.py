import resend
from app.utils.config import settings

def send_verification_email(to_email: str, code: str):
    if not settings.RESEND_API_KEY:
        print("Warning: RESEND_API_KEY not set. Cannot send email.")
        return False
        
    resend.api_key = settings.RESEND_API_KEY
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ThetaHealth Reset Password</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #0E1726;
                color: #ffffff;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #1E293B;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                text-align: center;
                border: 1px solid #334155;
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                color: #06b6d4;
                margin-bottom: 20px;
            }}
            h1 {{
                font-size: 20px;
                margin-bottom: 20px;
                color: #f1f5f9;
            }}
            p {{
                font-size: 14px;
                color: #94a3b8;
                line-height: 1.6;
                margin-bottom: 30px;
            }}
            .code-box {{
                background-color: #0f172a;
                border: 2px dashed #06b6d4;
                border-radius: 8px;
                padding: 20px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 6px;
                color: #ffffff;
                margin-bottom: 30px;
                display: inline-block;
            }}
            .footer {{
                font-size: 12px;
                color: #64748b;
                margin-top: 40px;
                border-top: 1px solid #334155;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ThetaHealth AI</div>
            <h1>Password Reset Verification Code</h1>
            <p>You requested a password reset for your ThetaHealth account. Please use the following 6-digit code to reset your password. This code will expire in 15 minutes.</p>
            
            <div class="code-box">
                {code}
            </div>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="footer">
                &copy; 2026 ThetaHealth AI. All rights reserved.<br>
                This is an automated message, please do not reply.
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        r = resend.Emails.send({
            "from": "ThetaHealth <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "ThetaHealth AI - Password Reset Code",
            "html": html_content
        })
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
