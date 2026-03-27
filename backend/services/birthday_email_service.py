"""
Birthday Email Service
Sends birthday notification emails using Resend
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Resend API configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'support@calliotel.com')


def get_birthday_email_template(name: str, age: int) -> str:
    """Generate beautiful HTML email template for birthday"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            .header {{
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                padding: 40px 20px;
                text-align: center;
                position: relative;
            }}
            .header::before {{
                content: '🎉';
                font-size: 80px;
                position: absolute;
                top: -20px;
                left: 20px;
                animation: float 3s ease-in-out infinite;
            }}
            .header::after {{
                content: '🎂';
                font-size: 80px;
                position: absolute;
                top: -20px;
                right: 20px;
                animation: float 3s ease-in-out infinite;
                animation-delay: 1.5s;
            }}
            @keyframes float {{
                0%, 100% {{ transform: translateY(0px); }}
                50% {{ transform: translateY(-10px); }}
            }}
            .header h1 {{
                color: white;
                font-size: 48px;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .content h2 {{
                color: #333;
                font-size: 32px;
                margin-bottom: 20px;
            }}
            .content p {{
                color: #666;
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 15px;
            }}
            .discount-badge {{
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                color: white;
                font-size: 24px;
                font-weight: bold;
                padding: 20px 40px;
                border-radius: 50px;
                display: inline-block;
                margin: 30px 0;
                box-shadow: 0 10px 30px rgba(250,112,154,0.4);
            }}
            .cta-button {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 40px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(102,126,234,0.4);
                transition: transform 0.3s;
            }}
            .cta-button:hover {{
                transform: scale(1.05);
            }}
            .footer {{
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #999;
                font-size: 14px;
            }}
            .balloons {{
                font-size: 40px;
                margin: 20px 0;
                letter-spacing: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Happy Birthday!</h1>
            </div>
            <div class="content">
                <h2>🎂 {name} 🎂</h2>
                <p>Today is your special day! You're turning <strong>{age}</strong> years old!</p>
                <div class="balloons">🎈🎈🎈🎈🎈</div>
                <p>We hope your birthday is filled with joy, laughter, and wonderful moments!</p>
                
                <div class="discount-badge">
                    🎁 10% OFF Today Only! 🎁
                </div>
                
                <p>As a birthday gift from us, enjoy <strong>10% OFF</strong> on all purchases today!</p>
                <p>Your discount is automatically applied to your account.</p>
                
                <a href="https://call-management-3.preview.emergentagent.com/dashboard" class="cta-button">
                    🎉 Go to Dashboard
                </a>
                
                <p style="margin-top: 30px; color: #999; font-size: 16px;">
                    Make this birthday unforgettable! 💜
                </p>
            </div>
            <div class="footer">
                <p>💜 With love from Team Calliotel 💜</p>
                <p>Developed by G & A Group</p>
                <p style="margin-top: 20px;">
                    <a href="https://call-management-3.preview.emergentagent.com" style="color: #667eea; text-decoration: none;">Visit Calliotel</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def get_friend_birthday_notification_template(friend_name: str, birthday_user_name: str) -> str:
    """Generate email template for friend birthday notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            .header {{
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                color: white;
                font-size: 36px;
                margin: 0;
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .content h2 {{
                color: #333;
                font-size: 28px;
                margin-bottom: 20px;
            }}
            .content p {{
                color: #666;
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 15px;
            }}
            .cta-button {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 40px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: bold;
                display: inline-block;
                margin: 20px 0;
                box-shadow: 0 10px 30px rgba(102,126,234,0.4);
            }}
            .footer {{
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #999;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎂 Birthday Reminder!</h1>
            </div>
            <div class="content">
                <h2>Today is {birthday_user_name}'s Birthday! 🎉</h2>
                <p>Your friend <strong>{birthday_user_name}</strong> is celebrating their birthday today!</p>
                <p>Don't forget to send them your warmest wishes! 💜</p>
                
                <a href="https://call-management-3.preview.emergentagent.com/dashboard" class="cta-button">
                    🎁 Send Birthday Wish
                </a>
                
                <p style="margin-top: 30px; color: #999; font-size: 16px;">
                    Make their day special with your message! ✨
                </p>
            </div>
            <div class="footer">
                <p>Team Calliotel</p>
                <p>Developed by G & A Group</p>
            </div>
        </div>
    </body>
    </html>
    """


async def send_birthday_email(to_email: str, name: str, age: int) -> bool:
    """Send birthday email to user"""
    try:
        import httpx
        
        if not RESEND_API_KEY:
            logger.error("RESEND_API_KEY not configured")
            return False
        
        html_content = get_birthday_email_template(name, age)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'from': FROM_EMAIL,
                    'to': [to_email],
                    'subject': f'🎂 Happy Birthday {name}! 🎉',
                    'html': html_content
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Birthday email sent to {to_email}")
                return True
            else:
                logger.error(f"Failed to send birthday email: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Error sending birthday email: {str(e)}")
        return False


async def send_friend_birthday_notification_email(to_email: str, friend_name: str, birthday_user_name: str) -> bool:
    """Send email notification to friend about someone's birthday"""
    try:
        import httpx
        
        if not RESEND_API_KEY:
            logger.error("RESEND_API_KEY not configured")
            return False
        
        html_content = get_friend_birthday_notification_template(friend_name, birthday_user_name)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {RESEND_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'from': FROM_EMAIL,
                    'to': [to_email],
                    'subject': f"🎂 {birthday_user_name}'s Birthday Today!",
                    'html': html_content
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Friend birthday notification sent to {to_email}")
                return True
            else:
                logger.error(f"Failed to send friend notification: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Error sending friend birthday notification: {str(e)}")
        return False
