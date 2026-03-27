#!/bin/bash
# 🏛️ DIGITAL COLOSSEUM - DROPLET FORTIFICATION SCRIPT
# Run this as root on your Digital Ocean droplet after initial setup
# Purpose: Lock down all ports, install Fail2Ban, configure security essentials

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️  DIGITAL COLOSSEUM - DROPLET FORTIFICATION${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}[1/6] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

echo -e "${GREEN}[2/6] Installing security essentials...${NC}"
apt-get install -y -qq ufw fail2ban curl openssl unattended-upgrades

echo -e "${GREEN}[3/6] Configuring UFW Firewall...${NC}"
# Reset UFW to default state
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (port 22)
ufw allow 22/tcp comment 'SSH Access'

# Allow HTTP (port 80) - needed for Let's Encrypt certificate validation
ufw allow 80/tcp comment 'HTTP - Certbot'

# Allow HTTPS (port 443) - main application + WebSockets
ufw allow 443/tcp comment 'HTTPS & WebSockets'

# Enable UFW
ufw --force enable

echo -e "${GREEN}[4/6] Configuring Fail2Ban...${NC}"

# Create custom jail configuration
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = admin@calliotel.com
sendername = Fail2Ban-Calliotel
action = %(action_mwl)s

# SSH Protection
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# Nginx HTTP Auth
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

# Nginx Bot Search (prevents directory scanning)
[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 7200

# Custom: API Brute Force Protection
[nginx-api-abuse]
enabled = true
filter = nginx-api-abuse
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 10
findtime = 60
bantime = 1800
EOF

# Create custom Fail2Ban filter for API abuse
cat > /etc/fail2ban/filter.d/nginx-api-abuse.conf <<'EOF'
[Definition]
failregex = ^<HOST> -.*"(POST|GET|PUT|DELETE) /api/.*" (429|401|403).*$
ignoreregex =
EOF

# Restart Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}[5/6] Configuring automatic security updates...${NC}"
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

echo -e "${GREEN}[6/6] Verifying configuration...${NC}"
echo ""
echo -e "${BLUE}📊 FORTIFICATION STATUS:${NC}"
echo -e "${GREEN}✅ UFW Firewall: $(ufw status | grep -q 'Status: active' && echo 'ACTIVE' || echo 'INACTIVE')${NC}"
echo -e "${GREEN}✅ Fail2Ban: $(systemctl is-active fail2ban)${NC}"
echo -e "${GREEN}✅ Open Ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)${NC}"
echo ""
echo -e "${BLUE}🔒 ACTIVE FAIL2BAN JAILS:${NC}"
fail2ban-client status | grep "Jail list" | sed 's/.*://'
echo ""
echo -e "${GREEN}🎯 DROPLET FORTIFICATION COMPLETE!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Deploy your Docker containers (docker-compose up -d)"
echo -e "  2. Configure SSL certificates (run ./setup_ssl.sh)"
echo -e "  3. Monitor Fail2Ban: fail2ban-client status"
echo ""
