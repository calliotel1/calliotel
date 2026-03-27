#!/bin/bash
# 🚀 DIGITAL COLOSSEUM - ONE-COMMAND DEPLOYMENT
# Run this on your Digital Ocean droplet after initial setup
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Domain DNS pointing to droplet IP
#   - Git repository access configured

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DIGITAL COLOSSEUM - PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

APP_DIR="/var/www/calliotel"

echo -e "${GREEN}[1/8] Installing system dependencies...${NC}"
apt-get update -qq
apt-get install -y -qq docker.io docker-compose git nginx curl

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo -e "${GREEN}[2/8] Creating application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${GREEN}[3/8] Cloning/updating application code...${NC}"
if [[ -d ".git" ]]; then
    echo -e "${YELLOW}Existing repository found. Pulling latest changes...${NC}"
    git pull origin main
else
    echo -e "${YELLOW}📝 Enter your Git repository URL:${NC}"
    read -p "Repository URL: " REPO_URL
    git clone "$REPO_URL" .
fi

echo -e "${GREEN}[4/8] Setting up environment variables...${NC}"
if [[ ! -f "backend/.env" ]]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from template...${NC}"
    cat > backend/.env <<EOF
# MongoDB Configuration
MONGO_URL=mongodb://mongodb:27017/
DB_NAME=calliotel_production

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Application Settings
ENVIRONMENT=production
DEBUG=false

# External Services (Add your keys here)
# STRIPE_SECRET_KEY=
# TELNYX_API_KEY=
# SENDGRID_API_KEY=
EOF
    echo -e "${RED}⚠️  IMPORTANT: Edit backend/.env and add your API keys${NC}"
    echo -e "${YELLOW}Press Enter after updating the file...${NC}"
    read
fi

if [[ ! -f "frontend/.env" ]]; then
    echo -e "${YELLOW}Creating frontend/.env...${NC}"
    echo -e "${YELLOW}📝 Enter your domain (e.g., https://calliotel.com):${NC}"
    read -p "Domain: " DOMAIN_URL
    cat > frontend/.env <<EOF
REACT_APP_BACKEND_URL=${DOMAIN_URL}
REACT_APP_WS_URL=${DOMAIN_URL}
EOF
fi

echo -e "${GREEN}[5/8] Building Docker containers...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${GREEN}[6/8] Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}[7/8] Configuring Nginx reverse proxy...${NC}"
cp nginx_production_hardened.conf /etc/nginx/sites-available/calliotel.conf
ln -sf /etc/nginx/sites-available/calliotel.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

if [[ $? -eq 0 ]]; then
    systemctl restart nginx
    systemctl enable nginx
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "${GREEN}[8/8] Verifying deployment...${NC}"
sleep 5

# Check container status
DOCKER_STATUS=$(docker-compose -f docker-compose.prod.yml ps)
echo -e "${BLUE}📊 Container Status:${NC}"
echo "$DOCKER_STATUS"

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health || echo "000")
if [[ "$BACKEND_HEALTH" == "200" ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}⚠️  Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
fi

echo ""
echo -e "${GREEN}🎯 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Next Steps:${NC}"
echo -e "  1. Run security hardening: ${YELLOW}./fortify_droplet.sh${NC}"
echo -e "  2. Setup SSL certificate: ${YELLOW}./setup_ssl.sh${NC}"
echo -e "  3. Test the application: ${YELLOW}curl http://localhost${NC}"
echo -e "  4. Monitor logs: ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo ""
echo -e "${BLUE}🔗 Access your application:${NC}"
echo -e "   HTTP: http://$(curl -s ifconfig.me)${NC}"
echo -e "   (Configure DNS and SSL for production access)${NC}"
echo ""
