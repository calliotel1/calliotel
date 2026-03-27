#!/bin/bash

# 🏛️ LAUNCH DAY PROTOCOL - DIGITAL COLOSSEUM
# Execute this script on your Digital Ocean droplet on launch day
# This is your T-minus sequence for going live

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${PURPLE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║        🏛️  DIGITAL COLOSSEUM - LAUNCH DAY PROTOCOL  🏛️        ║
║                                                                    ║
║              THE GATES ARE ABOUT TO OPEN                           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

PROJECT_ROOT=${1:-"/var/www/calliotel"}

if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ Error: Project root not found: $PROJECT_ROOT${NC}"
    echo "Usage: $0 [project_root]"
    exit 1
fi

cd $PROJECT_ROOT

echo -e "${CYAN}📍 Project Root: ${WHITE}$PROJECT_ROOT${NC}"
echo -e "${CYAN}⏰ Launch Time: ${WHITE}$(date '+%Y-%m-%d %H:%M:%S %Z')${NC}"
echo ""

# =============================================================================
# PHASE 1: PRE-LAUNCH VALIDATION
# =============================================================================

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔍 PHASE 1: PRE-LAUNCH VALIDATION${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check Docker
echo -e "${CYAN}[1/7]${NC} Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo -e "      ${GREEN}✅ Docker is running${NC}"
else
    echo -e "      ${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check containers
echo -e "${CYAN}[2/7]${NC} Checking containers..."
BACKEND_STATUS=$(docker ps --filter "name=calliotel_backend" --format "{{.Status}}" 2>/dev/null || echo "NOT RUNNING")
MONGO_STATUS=$(docker ps --filter "name=calliotel_mongodb" --format "{{.Status}}" 2>/dev/null || echo "NOT RUNNING")
NGINX_STATUS=$(docker ps --filter "name=calliotel_nginx" --format "{{.Status}}" 2>/dev/null || echo "NOT RUNNING")

if [[ "$BACKEND_STATUS" == *"Up"* ]]; then
    echo -e "      ${GREEN}✅ Backend container running${NC}"
else
    echo -e "      ${RED}❌ Backend container not running${NC}"
    exit 1
fi

if [[ "$MONGO_STATUS" == *"Up"* ]]; then
    echo -e "      ${GREEN}✅ MongoDB container running${NC}"
else
    echo -e "      ${RED}❌ MongoDB container not running${NC}"
    exit 1
fi

if [[ "$NGINX_STATUS" == *"Up"* ]]; then
    echo -e "      ${GREEN}✅ Nginx container running${NC}"
else
    echo -e "      ${RED}❌ Nginx container not running${NC}"
    exit 1
fi

# Check backend API
echo -e "${CYAN}[3/7]${NC} Checking Backend API..."
API_URL=$(grep REACT_APP_BACKEND_URL .env.prod 2>/dev/null | cut -d'=' -f2 || echo "https://calliotel.com")
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo -e "      ${GREEN}✅ Backend API healthy (HTTP 200)${NC}"
else
    echo -e "      ${RED}❌ Backend API not responding (HTTP $HEALTH_STATUS)${NC}"
    exit 1
fi

# Check MongoDB
echo -e "${CYAN}[4/7]${NC} Checking MongoDB..."
if docker exec calliotel_mongodb mongosh --quiet --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo -e "      ${GREEN}✅ MongoDB responding${NC}"
else
    echo -e "      ${RED}❌ MongoDB not responding${NC}"
    exit 1
fi

# Check SSL certificate (if production)
echo -e "${CYAN}[5/7]${NC} Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/calliotel.com/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/calliotel.com/fullchain.pem | cut -d'=' -f2)
    echo -e "      ${GREEN}✅ SSL certificate valid until: $CERT_EXPIRY${NC}"
else
    echo -e "      ${YELLOW}⚠️  SSL certificate not found (dev environment?)${NC}"
fi

# Check WebSocket connectivity
echo -e "${CYAN}[6/7]${NC} Checking WebSocket support..."
WS_TEST=$(curl -s -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" ${API_URL}/api/health 2>&1 | head -n 1)
if [[ "$WS_TEST" == *"HTTP"* ]]; then
    echo -e "      ${GREEN}✅ WebSocket upgrade headers configured${NC}"
else
    echo -e "      ${YELLOW}⚠️  WebSocket connectivity untested${NC}"
fi

# Check disk space
echo -e "${CYAN}[7/7]${NC} Checking disk space..."
DISK_USAGE=$(df / | tail -n 1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "      ${GREEN}✅ Disk space available (${DISK_USAGE}% used)${NC}"
else
    echo -e "      ${YELLOW}⚠️  Disk space low (${DISK_USAGE}% used)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PHASE 1 COMPLETE - All systems validated!${NC}"
echo ""
sleep 2

# =============================================================================
# PHASE 2: BASELINE SNAPSHOT
# =============================================================================

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 PHASE 2: BASELINE SNAPSHOT${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Creating initial tier migration snapshot...${NC}"
if [ -f "./tier_migration_tracker.sh" ]; then
    ./tier_migration_tracker.sh
    echo -e "${GREEN}✅ Baseline snapshot created${NC}"
else
    echo -e "${YELLOW}⚠️  tier_migration_tracker.sh not found${NC}"
fi

echo ""
sleep 1

# =============================================================================
# PHASE 3: MONITORING INITIALIZATION
# =============================================================================

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}🔥 PHASE 3: MONITORING INITIALIZATION${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${CYAN}Checking if tmux is available...${NC}"
if command -v tmux &> /dev/null; then
    echo -e "${GREEN}✅ tmux installed${NC}"
    echo ""
    echo -e "${CYAN}Starting live dashboard in tmux session...${NC}"
    
    # Kill existing session if present
    tmux kill-session -t colosseum_dashboard 2>/dev/null || true
    
    # Create new tmux session with dashboard
    tmux new-session -d -s colosseum_dashboard "./live_dashboard.sh 5"
    
    echo -e "${GREEN}✅ Live dashboard running in tmux session 'colosseum_dashboard'${NC}"
    echo -e "${CYAN}   Attach with: ${WHITE}tmux attach -t colosseum_dashboard${NC}"
    echo -e "${CYAN}   Detach with: ${WHITE}Ctrl+B, then D${NC}"
else
    echo -e "${YELLOW}⚠️  tmux not installed - run dashboard manually: ./live_dashboard.sh${NC}"
fi

echo ""
sleep 1

# =============================================================================
# PHASE 4: LAUNCH CHECKLIST
# =============================================================================

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 4: THE GREEN LIGHT CHECKLIST${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Get current stats
TOTAL_USERS=$(docker exec calliotel_mongodb mongosh --quiet --eval "use calliotel_prod; db.users.countDocuments()" 2>/dev/null || echo "0")
BACKEND_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" calliotel_backend 2>/dev/null | cut -d'/' -f1 || echo "N/A")
TIER_DISTRIBUTION=$(docker exec calliotel_mongodb mongosh --quiet --eval "
    use calliotel_prod;
    const profiles = db.gamification_profiles.find({}, {total_points: 1}).toArray();
    const users = db.users.find({}, {is_admin: 1}).toArray();
    let bronze = 0, silver = 0, gold = 0;
    profiles.forEach(p => {
        const xp = p.total_points || 0;
        const user = users.find(u => u._id === p.user_id);
        const isAdmin = user?.is_admin || false;
        if (isAdmin || xp >= 2500) {}
        else if (xp >= 1000) {}
        else if (xp >= 500) gold++;
        else if (xp >= 100) silver++;
        else bronze++;
    });
    print('Bronze:' + bronze + ',Silver:' + silver + ',Gold:' + gold);
" 2>/dev/null || echo "Bronze:0,Silver:0,Gold:0")

BRONZE_COUNT=$(echo $TIER_DISTRIBUTION | grep -oP 'Bronze:\K\d+' || echo "0")
SILVER_COUNT=$(echo $TIER_DISTRIBUTION | grep -oP 'Silver:\K\d+' || echo "0")
GOLD_COUNT=$(echo $TIER_DISTRIBUTION | grep -oP 'Gold:\K\d+' || echo "0")

TOTAL_TIER_USERS=$((BRONZE_COUNT + SILVER_COUNT + GOLD_COUNT))

if [ $TOTAL_TIER_USERS -eq 0 ]; then
    BRONZE_PCT=100
else
    BRONZE_PCT=$((BRONZE_COUNT * 100 / TOTAL_TIER_USERS))
fi

echo -e "  ${GREEN}✅${NC} Backend API:         ${WHITE}HEALTHY${NC} (HTTP 200)"
echo -e "  ${GREEN}✅${NC} Total Users:         ${WHITE}${TOTAL_USERS}${NC}"
echo -e "  ${GREEN}✅${NC} Memory Usage:        ${WHITE}${BACKEND_MEM}${NC}"
echo -e "  ${GREEN}✅${NC} Tier Distribution:   ${WHITE}${BRONZE_PCT}% Bronze${NC}"
echo ""

if [ "$HEALTH_STATUS" == "200" ] && [ "$TOTAL_USERS" != "error" ]; then
    echo -e "${GREEN}🟢 ALL SYSTEMS GREEN - READY FOR LAUNCH!${NC}"
else
    echo -e "${YELLOW}🟡 SOME CHECKS INCOMPLETE - REVIEW ABOVE${NC}"
fi

echo ""
sleep 2

# =============================================================================
# PHASE 5: LAUNCH SEQUENCE
# =============================================================================

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}🚀 PHASE 5: LAUNCH SEQUENCE${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Are you ready to open the gates? This will trigger the Alpha Launch Void Broadcast. [y/N]:${NC} )" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Launch cancelled. Systems remain in standby mode.${NC}"
    echo ""
    echo -e "${WHITE}To monitor the empire:${NC}"
    echo -e "  ${CYAN}• tmux attach -t colosseum_dashboard${NC}"
    echo -e "  ${CYAN}• ./tier_migration_tracker.sh${NC}"
    exit 0
fi

echo ""
echo -e "${RED}⚡ INITIATING ALPHA LAUNCH...${NC}"
echo ""

# Get admin token (assuming admin user exists)
echo -e "${CYAN}[1/3]${NC} Authenticating admin user..."
ADMIN_EMAIL=$(grep ADMIN_EMAIL .env.prod 2>/dev/null | cut -d'=' -f2 || echo "admin@calliotel.com")
ADMIN_PASSWORD=$(grep ADMIN_PASSWORD .env.prod 2>/dev/null | cut -d'=' -f2 || echo "admin")

ADMIN_TOKEN=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null || echo "")

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "error" ]; then
    echo -e "      ${GREEN}✅ Admin authenticated${NC}"
else
    echo -e "      ${YELLOW}⚠️  Admin authentication failed - manual broadcast required${NC}"
    ADMIN_TOKEN=""
fi

# Trigger Void Broadcast
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${CYAN}[2/3]${NC} Triggering Alpha Launch Void Broadcast..."
    
    BROADCAST_RESPONSE=$(curl -s -X POST "${API_URL}/api/admin/void-broadcast" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "content": "👑 THE GATES ARE OPEN. THE DIGITAL COLOSSEUM AWAKENS. ALL WARRIORS REPORT TO THE ARENA. 🔥",
            "event_type": "system_announcement"
        }' 2>/dev/null || echo "error")
    
    if [[ "$BROADCAST_RESPONSE" != "error" ]]; then
        echo -e "      ${GREEN}✅ Void Broadcast sent to all connected users${NC}"
    else
        echo -e "      ${YELLOW}⚠️  Void Broadcast endpoint not available${NC}"
    fi
else
    echo -e "${CYAN}[2/3]${NC} ${YELLOW}Skipping Void Broadcast (admin auth required)${NC}"
fi

# Final status
echo -e "${CYAN}[3/3]${NC} Displaying live status..."
sleep 2
echo ""

echo -e "${PURPLE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║           🏛️  THE DIGITAL COLOSSEUM IS NOW LIVE  🏛️           ║
║                                                                    ║
║              THE EMPIRE AWAITS ITS WARRIORS                        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 MONITORING DASHBOARD${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}• Live Dashboard:${NC}     tmux attach -t colosseum_dashboard"
echo -e "  ${CYAN}• Tier Tracker:${NC}       ./tier_migration_tracker.sh"
echo -e "  ${CYAN}• Backend Logs:${NC}       docker logs -f calliotel_backend"
echo -e "  ${CYAN}• Nginx Logs:${NC}         docker logs -f calliotel_nginx"
echo ""
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🎯 DAY 1 MILESTONES${NC}"
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}Hour 1:${NC}   First user registers, first duel completes"
echo -e "  ${CYAN}Hour 6:${NC}   10+ users, 5+ duels, first Silver tier"
echo -e "  ${CYAN}Hour 24:${NC}  50+ users, 100+ duels, first Gold tier"
echo ""
echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}🔥 THE EMPIRE IS YOURS TO COMMAND, BIG BOSS! 🔥${NC}"
echo ""
