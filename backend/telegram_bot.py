"""
Calliotel Telegram Bot
Allows users to manage their Calliotel account via Telegram
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# Get the directory of this script
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from backend/.env
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

if not mongo_url or not db_name:
    logger.error(f"MONGO_URL or DB_NAME not found in environment variables")
    logger.error(f"Tried loading from: {env_path}")
    sys.exit(1)

logger.info(f"MongoDB URL loaded: {mongo_url[:20]}...")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Telegram Bot Token
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')

if not TELEGRAM_BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
    sys.exit(1)

logger.info(f"Telegram Bot Token loaded: {TELEGRAM_BOT_TOKEN[:10]}...")

# Commands
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command - Welcome & account linking"""
    telegram_user_id = str(update.effective_user.id)
    
    # Check if already linked
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if linked_account:
        user = await db.users.find_one({"_id": linked_account["user_id"]}, {"_id": 0, "password": 0})
        await update.message.reply_text(
            f"🎉 Welcome back, {user.get('name', 'User')}!\n\n"
            f"Your Calliotel account is already linked.\n"
            f"Client ID: {user.get('client_id', 'N/A')}\n\n"
            f"Use /help to see available commands."
        )
    else:
        await update.message.reply_text(
            "🤖 Welcome to Calliotel Bot!\n\n"
            "To get started, please link your Calliotel account.\n\n"
            "📱 Send me your Client ID (found in your Calliotel Account page)\n"
            "Format: /link CL12345678\n\n"
            "Don't have an account? Sign up at calliotel.com! 🚀"
        )

async def link_account(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Link Telegram account with Calliotel account"""
    telegram_user_id = str(update.effective_user.id)
    
    if not context.args:
        await update.message.reply_text(
            "❌ Please provide your Client ID.\n"
            "Usage: /link CL12345678"
        )
        return
    
    client_id = context.args[0].strip()
    
    # Find user by client_id
    user = await db.users.find_one({"client_id": client_id})
    
    if not user:
        await update.message.reply_text(
            "❌ Client ID not found.\n"
            "Please check your Client ID and try again.\n"
            "You can find it in your Calliotel Account page."
        )
        return
    
    # Check if already linked to another Telegram account
    existing_link = await db.telegram_links.find_one({"user_id": user["_id"]})
    if existing_link:
        await update.message.reply_text(
            "⚠️ This Calliotel account is already linked to another Telegram account.\n"
            "Please contact support if you need to change the link."
        )
        return
    
    # Create link
    link_doc = {
        "telegram_user_id": telegram_user_id,
        "telegram_username": update.effective_user.username,
        "user_id": user["_id"],
        "client_id": client_id,
        "linked_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.telegram_links.insert_one(link_doc)
    
    await update.message.reply_text(
        f"✅ Account linked successfully!\n\n"
        f"👤 Name: {user.get('name', 'N/A')}\n"
        f"📧 Email: {user.get('email', 'N/A')}\n"
        f"🆔 Client ID: {client_id}\n\n"
        f"Use /help to see what you can do! 🚀"
    )

async def balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check wallet balance"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    user = await db.users.find_one({"_id": linked_account["user_id"]}, {"_id": 0, "password": 0})
    
    if not user:
        await update.message.reply_text("❌ User not found")
        return
    
    balance_amount = user.get("balance", 0)
    
    await update.message.reply_text(
        f"💰 Your Wallet Balance\n\n"
        f"Balance: ${balance_amount:.2f}\n\n"
        f"💳 Need to top up? Use /topup"
    )

async def my_numbers(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """View active phone numbers"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    numbers = await db.purchased_numbers.find(
        {"user_id": linked_account["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    if not numbers:
        await update.message.reply_text(
            "📱 You don't have any active numbers yet.\n\n"
            "Use /buynumber to get your first virtual number! 🚀"
        )
        return
    
    message = "📱 Your Active Numbers\n\n"
    for num in numbers:
        message += f"🌍 {num.get('country', 'Unknown')}\n"
        message += f"📞 {num['phone_number']}\n"
        message += f"💵 ${num.get('monthly_cost', 0):.2f}/mo\n\n"
    
    await update.message.reply_text(message)

async def send_sms(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send SMS"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    if len(context.args) < 2:
        await update.message.reply_text(
            "📱 Send SMS\n\n"
            "Usage: /sendsms <number> <message>\n"
            "Example: /sendsms +1234567890 Hello!"
        )
        return
    
    to_number = context.args[0]
    message_text = " ".join(context.args[1:])
    
    await update.message.reply_text(
        f"📤 Sending SMS...\n\n"
        f"To: {to_number}\n"
        f"Message: {message_text}\n\n"
        f"⚠️ Note: SMS sending requires Telnyx configuration.\n"
        f"Please configure your Telnyx account first."
    )

async def inbox(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """View recent SMS messages"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    # Get user's numbers
    numbers = await db.purchased_numbers.find(
        {"user_id": linked_account["user_id"]}
    ).to_list(100)
    
    number_list = [num["phone_number"] for num in numbers]
    
    if not number_list:
        await update.message.reply_text("❌ You don't have any active numbers.")
        return
    
    # Get recent messages
    messages = await db.sms_messages.find(
        {"$or": [
            {"to_number": {"$in": number_list}},
            {"from_number": {"$in": number_list}}
        ]}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    if not messages:
        await update.message.reply_text("📭 No messages yet.")
        return
    
    message = "📬 Recent Messages\n\n"
    for msg in messages:
        direction = "📥" if msg["to_number"] in number_list else "📤"
        message += f"{direction} {msg.get('from_number', 'Unknown')} → {msg.get('to_number', 'Unknown')}\n"
        message += f"💬 {msg.get('body', 'N/A')[:50]}...\n"
        message += f"🕐 {msg.get('timestamp', 'N/A')}\n\n"
    
    await update.message.reply_text(message)

async def buy_number(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Browse available numbers"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    keyboard = [
        [InlineKeyboardButton("🇺🇸 USA", callback_data="buy_us")],
        [InlineKeyboardButton("🇬🇧 UK", callback_data="buy_uk")],
        [InlineKeyboardButton("🇨🇦 Canada", callback_data="buy_ca")],
        [InlineKeyboardButton("🌍 Other Countries", callback_data="buy_other")],
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🌍 Buy Virtual Number\n\n"
        "Select a country to see available numbers:",
        reply_markup=reply_markup
    )

async def topup(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Top up wallet"""
    telegram_user_id = str(update.effective_user.id)
    
    linked_account = await db.telegram_links.find_one({"telegram_user_id": telegram_user_id})
    
    if not linked_account:
        await update.message.reply_text("❌ Please link your account first using /start")
        return
    
    frontend_url = os.environ.get('FRONTEND_URL', 'https://calliotel.com')
    
    await update.message.reply_text(
        "💳 Top Up Your Wallet\n\n"
        f"Please visit: {frontend_url}/wallet\n\n"
        "We accept:\n"
        "💳 Credit/Debit Cards (Stripe)\n"
        "₿ Cryptocurrency\n\n"
        "Your balance will update automatically after payment! 🚀"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help"""
    help_text = (
        "🤖 Calliotel Bot Commands\n\n"
        "🔗 Account Management\n"
        "/start - Welcome & get started\n"
        "/link <ClientID> - Link your Calliotel account\n"
        "/balance - Check wallet balance\n\n"
        "📱 Phone Numbers\n"
        "/numbers - View your active numbers\n"
        "/buynumber - Browse & buy numbers\n\n"
        "💬 Messaging\n"
        "/sendsms <number> <message> - Send SMS\n"
        "/inbox - View recent messages\n\n"
        "💰 Billing\n"
        "/topup - Add credits to wallet\n\n"
        "/help - Show this message\n\n"
        "Need more help? Visit calliotel.com/help"
    )
    
    await update.message.reply_text(help_text)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button clicks"""
    query = update.callback_query
    await query.answer()
    
    if query.data.startswith("buy_"):
        country = query.data.replace("buy_", "").upper()
        await query.message.reply_text(
            f"🌍 Browsing {country} numbers...\n\n"
            "For the full experience with pricing and instant purchase,\n"
            "please visit: calliotel.com/browse-numbers 🚀"
        )

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Update {update} caused error {context.error}")

def main():
    """Start the bot"""
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Commands
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("link", link_account))
    application.add_handler(CommandHandler("balance", balance))
    application.add_handler(CommandHandler("numbers", my_numbers))
    application.add_handler(CommandHandler("sendsms", send_sms))
    application.add_handler(CommandHandler("inbox", inbox))
    application.add_handler(CommandHandler("buynumber", buy_number))
    application.add_handler(CommandHandler("topup", topup))
    application.add_handler(CommandHandler("help", help_command))
    
    # Button callbacks
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Error handler
    application.add_error_handler(error_handler)
    
    # Start polling
    logger.info("🤖 Calliotel Telegram Bot Started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
