# 🔐 ENVIRONMENT VARIABLES - PRODUCTION TEMPLATE

## ⚠️ CRITICAL: NEVER COMMIT THIS FILE TO GIT

---

## 📋 **PRODUCTION .ENV CONFIGURATION**

### **Copy this template to `/var/www/calliotel/.env.prod` on your droplet**

```bash
# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# MongoDB Root Credentials
MONGO_ROOT_PASSWORD=CHANGE_ME_GENERATE_STRONG_PASSWORD_32_CHARS

# MongoDB Connection String (used by backend)
MONGO_URL=mongodb://admin:CHANGE_ME_SAME_AS_ABOVE@mongodb:27017

# Database Name
DB_NAME=calliotel_prod


# ==========================================
# JWT AUTHENTICATION
# ==========================================

# JWT Secret Key (256-bit recommended)
# Generate: openssl rand -hex 32
JWT_SECRET_KEY=CHANGE_ME_GENERATE_256_BIT_HEX_KEY

# JWT expiration (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=10080


# ==========================================
# BACKEND API CONFIGURATION
# ==========================================

# Frontend URL (used by backend for CORS)
FRONTEND_URL=https://calliotel.com

# Backend URL (used by frontend for API calls)
REACT_APP_BACKEND_URL=https://calliotel.com

# Environment
ENVIRONMENT=production


# ==========================================
# EMERGENT LLM KEY (OPTIONAL)
# ==========================================

# Universal key for OpenAI, Gemini, Claude
# Get from: Emergent Profile -> Universal Key
EMERGENT_LLM_KEY=your_emergent_key_here


# ==========================================
# EMAIL SERVICE (OPTIONAL)
# ==========================================

# SendGrid API Key
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@calliotel.com


# ==========================================
# SMS SERVICE (OPTIONAL)
# ==========================================

# Twilio Credentials
TWILIO_ACCOUNT_SID=AC_your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890


# ==========================================
# PAYMENT PROCESSING (OPTIONAL)
# ==========================================

# Stripe Keys (for premium features)
STRIPE_PUBLIC_KEY=pk_live_your_public_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here


# ==========================================
# MONITORING & ANALYTICS (OPTIONAL)
# ==========================================

# Sentry (Error Tracking)
SENTRY_DSN=https://your_sentry_dsn_here

# Google Analytics
GA_TRACKING_ID=G-your_tracking_id_here


# ==========================================
# ADMIN CONFIGURATION
# ==========================================

# Admin email (for initial setup)
ADMIN_EMAIL=admin@calliotel.com

# Admin password (change after first login)
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD


# ==========================================
# PERFORMANCE TUNING
# ==========================================

# Uvicorn workers (CPU cores * 2)
UVICORN_WORKERS=4

# WebSocket max connections per worker
WS_MAX_CONNECTIONS=500


# ==========================================
# BACKUP CONFIGURATION
# ==========================================

# S3 Bucket for backups (optional)
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BACKUP_BUCKET=calliotel-backups

```

---

## 🔑 **GENERATE SECURE KEYS**

### **1. JWT Secret Key (256-bit)**
```bash
openssl rand -hex 32
```

### **2. MongoDB Root Password**
```bash
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

### **3. Random Admin Password**
```bash
openssl rand -base64 24 | tr -d "=+/"
```

---

## ✅ **VALIDATION CHECKLIST**

Before deploying, ensure:

- [ ] All `CHANGE_ME_` placeholders replaced
- [ ] JWT secret is 64 characters (256-bit hex)
- [ ] MongoDB password is strong (32+ characters)
- [ ] REACT_APP_BACKEND_URL matches your domain
- [ ] MONGO_URL password matches MONGO_ROOT_PASSWORD
- [ ] File permissions set to 600 (`chmod 600 .env.prod`)
- [ ] File NOT committed to git (added to .gitignore)

---

## 🚨 **SECURITY NOTES**

1. **Never commit** this file to version control
2. **Rotate secrets** every 90 days
3. **Use environment-specific** .env files (dev, staging, prod)
4. **Backup** this file securely (encrypted storage)
5. **Restrict access** to root user only

```bash
# Set secure permissions
chmod 600 /var/www/calliotel/.env.prod
chown root:root /var/www/calliotel/.env.prod
```

---

## 📦 **LOADING ENVIRONMENT VARIABLES**

### **Docker Compose**
```bash
# Load .env file
export $(cat .env.prod | xargs)

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### **Systemd Service**
```bash
# Create systemd service with EnvironmentFile
[Service]
EnvironmentFile=/var/www/calliotel/.env.prod
```

---

## 🔄 **ENVIRONMENT VARIABLE UPDATES**

### **After Changing Variables**
```bash
# Reload environment
export $(cat .env.prod | xargs)

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Or rebuild if code changed
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 💎 **STATUS: ENVIRONMENT TEMPLATE READY**

All critical configuration documented and secured. 🔐

**Next Step**: Copy this template to production server and populate with real values.
