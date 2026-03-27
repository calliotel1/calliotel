#!/bin/bash
# 📊 PRODUCTION MONITORING DASHBOARD
# Run this on your Digital Ocean droplet to monitor system health in real-time

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Function to get container status
get_container_status() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "$container"; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Stopped${NC}"
    fi
}

# Function to get container resource usage
get_container_resources() {
    local container=$1
    docker stats --no-stream --format "CPU: {{.CPUPerc}} | MEM: {{.MemUsage}}" $container 2>/dev/null || echo "N/A"
}

# Function to count active WebSocket connections
get_websocket_count() {
    netstat -an | grep :8001 | grep ESTABLISHED | wc -l
}

# Function to get recent errors from logs
get_recent_errors() {
    docker logs backend --since 5m 2>&1 | grep -i "error\|exception\|failed" | tail -3
}

# Main monitoring loop
while true; do
    clear
    echo -e "${BOLD}${BLUE}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${BOLD}${BLUE}│  🏛️  DIGITAL COLOSSEUM - LIVE MONITORING  🏛️   │${NC}"
    echo -e "${BOLD}${BLUE}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "${BOLD}Refreshed: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # System Overview
    echo -e "${BLUE}┌─── ${BOLD}SYSTEM OVERVIEW${NC}${BLUE} ────────────────────────────┐${NC}"
    echo -e "${BLUE}│${NC} CPU Load:    $(uptime | awk -F'load average:' '{print $2}' | xargs)"
    echo -e "${BLUE}│${NC} Memory:      $(free -h | awk 'NR==2{printf "%s / %s (%.0f%% used)", $3, $2, $3/$2*100}')"
    echo -e "${BLUE}│${NC} Disk Usage:  $(df -h / | awk 'NR==2{printf "%s / %s (%s used)", $3, $2, $5}')"
    echo -e "${BLUE}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Container Status
    echo -e "${BLUE}┌─── ${BOLD}DOCKER CONTAINERS${NC}${BLUE} ────────────────────────────┐${NC}"
    echo -e "${BLUE}│${NC} Backend:     $(get_container_status backend)"
    echo -e "${BLUE}│${NC}   ↳ $(get_container_resources backend)"
    echo -e "${BLUE}│${NC} Frontend:    $(get_container_status frontend)"
    echo -e "${BLUE}│${NC}   ↳ $(get_container_resources frontend)"
    echo -e "${BLUE}│${NC} MongoDB:     $(get_container_status mongodb)"
    echo -e "${BLUE}│${NC}   ↳ $(get_container_resources mongodb)"
    echo -e "${BLUE}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Network Status
    echo -e "${BLUE}┌─── ${BOLD}NETWORK STATUS${NC}${BLUE} ──────────────────────────────┐${NC}"
    WS_COUNT=$(get_websocket_count)
    if [[ $WS_COUNT -gt 0 ]]; then
        echo -e "${BLUE}│${NC} Active WebSocket Connections: ${GREEN}${WS_COUNT}${NC}"
    else
        echo -e "${BLUE}│${NC} Active WebSocket Connections: ${YELLOW}${WS_COUNT}${NC}"
    fi
    
    # HTTP connection count
    HTTP_COUNT=$(netstat -an | grep :443 | grep ESTABLISHED | wc -l)
    echo -e "${BLUE}│${NC} HTTPS Connections: ${HTTP_COUNT}"
    
    # Nginx status
    if systemctl is-active --quiet nginx; then
        echo -e "${BLUE}│${NC} Nginx: ${GREEN}✅ Running${NC}"
    else
        echo -e "${BLUE}│${NC} Nginx: ${RED}❌ Stopped${NC}"
    fi
    echo -e "${BLUE}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Recent Errors
    echo -e "${BLUE}┌─── ${BOLD}RECENT ERRORS (Last 5 min)${NC}${BLUE} ───────────────────┐${NC}"
    ERRORS=$(get_recent_errors)
    if [[ -z "$ERRORS" ]]; then
        echo -e "${BLUE}│${NC} ${GREEN}No errors detected ✅${NC}"
    else
        echo -e "${BLUE}│${NC} ${RED}$ERRORS${NC}"
    fi
    echo -e "${BLUE}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    
    # Quick Commands
    echo -e "${YELLOW}Quick Commands:${NC}"
    echo -e "  [Ctrl+C] Exit   |   docker logs backend -f   |   docker-compose restart backend"
    echo ""
    
    # Auto-refresh every 5 seconds
    sleep 5
done
