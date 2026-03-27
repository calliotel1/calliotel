import os
import resend
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.environ.get('RESEND_API_KEY')
        self.from_email = os.environ.get('FROM_EMAIL', 'Calliotel <support@calliotel.com>')
        if self.api_key:
            resend.api_key = self.api_key
    
    def send_verification_email(self, to_email: str, verification_token: str, frontend_url: str):
        """
        Send email verification link to user.
        """
        if not self.api_key:
            logger.warning("Resend not configured. Verification email not sent.")
            return False
        
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to Calliotel!</h1>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Thank you for signing up! Please verify your email address to activate your account and start using Calliotel's virtual phone services.</p>
                    <p style="text-align: center;">
                        <a href="{verification_link}" class="button">Verify Email Address</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="background: white; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 12px;">{verification_link}</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours. If you didn't create an account with Calliotel, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Calliotel. All rights reserved.</p>
                    <p>support@calliotel.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": "Verify Your Calliotel Email Address",
                "html": html_content,
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Verification email sent to {to_email}. Email ID: {email.get('id')}")
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            return False
    
    def send_welcome_email(self, to_email: str, user_name: str = None):
        """
        Send welcome email after verification.
        """
        if not self.api_key:
            return False
        
        name = user_name or "there"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .header h1 {{ color: white; margin: 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Email Verified!</h1>
                </div>
                <div class="content">
                    <h2>Welcome to Calliotel, {name}!</h2>
                    <p>Your email has been successfully verified. You're all set to start using Calliotel's virtual phone services!</p>
                    <p><strong>What's next?</strong></p>
                    <ul>
                        <li>Browse available virtual numbers from 50+ countries</li>
                        <li>Set up your first virtual phone number</li>
                        <li>Start making calls and sending SMS globally</li>
                    </ul>
                    <p>If you have any questions, our support team is here to help at support@calliotel.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        try:
            params = {
                "from": self.from_email,
                "to": [to_email],
                "subject": "Welcome to Calliotel! 🎉",
                "html": html_content,
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Welcome email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")
            return False

email_service = EmailService()


async def send_password_reset_email(to_email: str, name: str, reset_token: str):
    """Send password reset email"""
    if not email_service.api_key:
        logger.warning("Resend not configured. Password reset email not sent.")
        return False
    
    frontend_url = os.environ.get('FRONTEND_URL', 'https://call-management-3.preview.emergentagent.com')
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello{' ' + name if name else ''}!</h2>
                <p>We received a request to reset your Calliotel account password.</p>
                <p>Click the button below to choose a new password:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="background: white; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 12px;">{reset_link}</p>
                
                <div class="warning">
                    <p style="margin: 0; font-weight: bold;">⚠️ Important:</p>
                    <ul style="margin: 10px 0 0 0;">
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn't request this, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">Need help? Contact us at support@calliotel.com</p>
            </div>
            <div class="footer">
                <p>© 2025 Calliotel. All rights reserved.</p>
                <p>Global Virtual Phone Solutions</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        response = resend.Emails.send({
            "from": email_service.from_email,
            "to": to_email,
            "subject": "Reset Your Calliotel Password",
            "html": html_content
        })
        logger.info(f"Password reset email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False


async def send_balance_added_email(to_email: str, name: str, amount: float, new_balance: float, payment_method: str = "Card"):
    """Send email confirmation when user adds balance to wallet"""
    if not email_service.api_key:
        logger.warning("Resend not configured. Balance confirmation email not sent.")
        return False
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .amount-box {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }}
            .amount {{ font-size: 36px; font-weight: bold; margin: 0; }}
            .details {{ background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Balance Added Successfully!</h1>
            </div>
            <div class="content">
                <h2>Hi{' ' + name if name else ''}!</h2>
                <p>Great news! Your wallet has been credited successfully.</p>
                
                <div class="amount-box">
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">Amount Added</p>
                    <p class="amount">${amount:.2f}</p>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span style="color: #666;">Payment Method:</span>
                        <span style="font-weight: bold;">{payment_method}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">New Balance:</span>
                        <span style="font-weight: bold; color: #10b981;">${new_balance:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Date:</span>
                        <span style="font-weight: bold;">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</span>
                    </div>
                </div>
                
                <p><strong>What can you do now?</strong></p>
                <ul>
                    <li>📞 Purchase virtual numbers from 50+ countries</li>
                    <li>💬 Send SMS messages globally</li>
                    <li>☎️ Make international calls at low rates</li>
                </ul>
                
                <p style="margin-top: 30px;">Thank you for choosing Calliotel! We're excited to help you connect globally.</p>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions? Contact us at support@calliotel.com</p>
            </div>
            <div class="footer">
                <p>© 2025 Calliotel. All rights reserved.</p>
                <p>Global Virtual Phone Solutions</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        response = resend.Emails.send({
            "from": email_service.from_email,
            "to": to_email,
            "subject": f"✅ ${amount:.2f} Added to Your Calliotel Wallet",
            "html": html_content
        })
        logger.info(f"Balance confirmation email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send balance confirmation email: {str(e)}")
        return False


async def send_number_purchase_email(to_email: str, name: str, phone_number: str, country: str, monthly_cost: float, new_balance: float, next_billing_date: str):
    """Send email confirmation when user purchases a virtual number"""
    if not email_service.api_key:
        logger.warning("Resend not configured. Purchase confirmation email not sent.")
        return False
    
    from datetime import datetime
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f97316 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .number-box {{ background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }}
            .number {{ font-size: 32px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }}
            .details {{ background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .success-badge {{ background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin: 10px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Number Purchased Successfully!</h1>
            </div>
            <div class="content">
                <h2>Congratulations{' ' + name if name else ''}!</h2>
                <p>Your virtual number is now active and ready to use.</p>
                
                <div class="number-box">
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your New Number</p>
                    <p class="number">{phone_number}</p>
                    <span class="success-badge">✓ Active</span>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span style="color: #666;">Country:</span>
                        <span style="font-weight: bold;">{country}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Monthly Cost:</span>
                        <span style="font-weight: bold;">${monthly_cost:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Amount Deducted:</span>
                        <span style="font-weight: bold; color: #f97316;">${monthly_cost:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">New Wallet Balance:</span>
                        <span style="font-weight: bold; color: #10b981;">${new_balance:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Next Billing Date:</span>
                        <span style="font-weight: bold;">{next_billing_date}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Purchase Date:</span>
                        <span style="font-weight: bold;">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</span>
                    </div>
                </div>
                
                <p><strong>What's next?</strong></p>
                <ul>
                    <li>📞 Start receiving calls on your new number</li>
                    <li>💬 Send and receive SMS messages</li>
                    <li>⚙️ Configure call forwarding and voicemail</li>
                    <li>📊 View analytics and call logs</li>
                </ul>
                
                <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>💡 Pro Tip:</strong> Auto-renew is enabled by default. Your number will automatically renew 30 days from now. You can manage this in "My Numbers" section.
                </p>
                
                <p style="margin-top: 30px;">Thank you for choosing Calliotel! We're here to help you stay connected globally.</p>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">Questions or need help? Contact us at support@calliotel.com</p>
            </div>
            <div class="footer">
                <p>© 2025 Calliotel. All rights reserved.</p>
                <p>Global Virtual Phone Solutions | support@calliotel.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        response = resend.Emails.send({
            "from": email_service.from_email,
            "to": to_email,
            "subject": f"🎉 Your New Number {phone_number} is Active!",
            "html": html_content
        })
        logger.info(f"Purchase confirmation email sent to {to_email} for number {phone_number}")
        return True
    except Exception as e:
        logger.error(f"Failed to send purchase confirmation email: {str(e)}")
        return False
