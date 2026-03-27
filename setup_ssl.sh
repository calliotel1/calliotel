#!/bin/bash
# 🔒 SSL/TLS CERTIFICATE SETUP using Let's Encrypt
# Run this AFTER deploying your application to Digital Ocean
# Prerequisites: Domain DNS must point to your droplet IP

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 SSL CERTIFICATE SETUP - Let's Encrypt${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Prompt for domain name
echo -e "${YELLOW}📝 Enter your domain name (e.g., calliotel.com):${NC}"
read -p "Domain: " DOMAIN

if [[ -z "$DOMAIN" ]]; then
    echo -e "${RED}❌ Domain name cannot be empty${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Enter your email for SSL certificate notifications:${NC}"
read -p "Email: " EMAIL

if [[ -z "$EMAIL" ]]; then
    echo -e "${RED}❌ Email cannot be empty${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/5] Installing Certbot...${NC}"
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

echo -e "${GREEN}[2/5] Creating webroot directory...${NC}"
mkdir -p /var/www/certbot

echo -e "${GREEN}[3/5] Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}⚠️  This will validate domain ownership via HTTP-01 challenge${NC}"
echo -e "${YELLOW}⚠️  Ensure port 80 is open and DNS points to this server${NC}"
echo ""

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Certificate generation failed. Check DNS and firewall settings.${NC}"
    exit 1
fi

echo -e "${GREEN}[4/5] Configuring Nginx to use SSL certificate...${NC}"

# Update nginx_production_hardened.conf with actual domain
if [[ -f "/etc/nginx/sites-available/calliotel.conf" ]]; then
    sed -i "s/calliotel\.com/$DOMAIN/g" /etc/nginx/sites-available/calliotel.conf
    nginx -t
    systemctl reload nginx
else
    echo -e "${YELLOW}⚠️  Nginx config not found at /etc/nginx/sites-available/calliotel.conf${NC}"
    echo -e "${YELLOW}   Please manually update your Nginx configuration with SSL paths:${NC}"
    echo -e "   ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo -e "   ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
fi

echo -e "${GREEN}[5/5] Setting up automatic certificate renewal...${NC}"

# Create renewal hook
cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh <<'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Test renewal process (dry run)
echo -e "${YELLOW}Testing certificate renewal (dry run)...${NC}"
certbot renew --dry-run

if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}🎯 SSL CERTIFICATE SETUP COMPLETE!${NC}"
    echo ""
    echo -e "${BLUE}📊 Certificate Details:${NC}"
    echo -e "   Domain: $DOMAIN"
    echo -e "   Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo -e "   Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
    echo -e "   Expiry: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)"
    echo ""
    echo -e "${GREEN}✅ Auto-renewal is configured (certbot renew runs twice daily)${NC}"
    echo -e "${BLUE}🔗 Test your SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN${NC}"
else
    echo -e "${RED}❌ Auto-renewal test failed. Manual intervention may be required.${NC}"
fi
