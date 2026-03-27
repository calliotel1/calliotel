#!/bin/bash

# 🏛️ DIGITAL COLOSSEUM - LIVE METRICS DASHBOARD
# Real-time monitoring for tier migration, engagement, and system health
# Run this on your Digital Ocean droplet after deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
REFRESH_INTERVAL=${1:-10}  # Default 10 seconds
API_URL=${REACT_APP_BACKEND_URL:-"http://localhost:8080"}
MONGO_CONTAINER=${MONGO_CONTAINER:-"calliotel_mongodb"}

# Clear screen function
clear_screen() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}          🏛️  DIGITAL COLOSSEUM - LIVE DASHBOARD  🏛️          ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📊 Monitoring Mode: Real-time (${REFRESH_INTERVAL}s refresh)${NC}"
    echo -e "${CYAN}🌐 API Endpoint: ${API_URL}${NC}"
    echo -e "${CYAN}⏰ Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
}

# Get MongoDB stats
get_mongo_stats() {
    docker exec $MONGO_CONTAINER mongosh --quiet --eval "
        use calliotel_prod;
        print('TOTAL_USERS:' + db.users.countDocuments());
        print('ACTIVE_TODAY:' + db.users.countDocuments({last_login: {\$gte: new Date(Date.now() - 24*60*60*1000)}}));
        print('TOTAL_DUELS:' + db.duels.countDocuments());
        print('ACTIVE_DUELS:' + db.duels.countDocuments({status: 'in_progress'}));
    " 2>/dev/null || echo "MONGO_ERROR"
}

# Get tier distribution
get_tier_distribution() {
    docker exec $MONGO_CONTAINER mongosh --quiet --eval "
        use calliotel_prod;
        const profiles = db.gamification_profiles.find({}, {total_points: 1}).toArray();
        const users = db.users.find({}, {is_admin: 1}).toArray();
        
        let tiers = {
            architect: 0,
            divine: 0,
            platinum: 0,
            gold: 0,
            silver: 0,
            bronze: 0
        };
        
        profiles.forEach(p => {
            const xp = p.total_points || 0;
            const user = users.find(u => u._id === p.user_id);
            const isAdmin = user?.is_admin || false;
            
            if (isAdmin) tiers.architect++;
            else if (xp >= 2500) tiers.divine++;
            else if (xp >= 1000) tiers.platinum++;
            else if (xp >= 500) tiers.gold++;
            else if (xp >= 100) tiers.silver++;
            else tiers.bronze++;
        });
        
        print('ARCHITECT:' + tiers.architect);
        print('DIVINE:' + tiers.divine);
        print('PLATINUM:' + tiers.platinum);
        print('GOLD:' + tiers.gold);
        print('SILVER:' + tiers.silver);
        print('BRONZE:' + tiers.bronze);
    " 2>/dev/null || echo "TIER_ERROR"
}

# Get top 5 players
get_top_players() {
    docker exec $MONGO_CONTAINER mongosh --quiet --eval "
        use calliotel_prod;
        const top = db.gamification_profiles.aggregate([
            {
                \$lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { \$unwind: '\$user' },
            { \$sort: { total_points: -1 } },
            { \$limit: 5 },
            {
                \$project: {
                    email: '\$user.email',
                    xp: '\$total_points',
                    level: '\$level'
                }
            }
        ]).toArray();
        
        top.forEach((p, i) => {
            print((i+1) + '|' + p.email.split('@')[0] + '|' + p.xp + '|' + p.level);
        });
    " 2>/dev/null || echo "TOP_ERROR"
}

# Get recent activity
get_recent_activity() {
    docker exec $MONGO_CONTAINER mongosh --quiet --eval "
        use calliotel_prod;
        const recent = db.duels.aggregate([
            { \$match: { status: 'completed' } },
            { \$sort: { completed_at: -1 } },
            { \$limit: 5 },
            {
                \$lookup: {
                    from: 'users',
                    localField: 'winner_id',
                    foreignField: '_id',
                    as: 'winner'
                }
            },
            { \$unwind: '\$winner' },
            {
                \$project: {
                    winner: '\$winner.email',
                    wager: '\$wager_amount',
                    time: '\$completed_at'
                }
            }
        ]).toArray();
        
        recent.forEach(d => {
            const name = d.winner.split('@')[0];
            const timeAgo = Math.floor((Date.now() - new Date(d.time)) / 60000);
            print(name + '|' + d.wager + '|' + timeAgo);
        });
    " 2>/dev/null || echo "ACTIVITY_ERROR"
}

# Get system health
get_system_health() {
    # Backend health
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/api/health 2>/dev/null || echo "000")
    
    # Container stats
    BACKEND_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" calliotel_backend 2>/dev/null | cut -d'/' -f1 || echo "N/A")
    BACKEND_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" calliotel_backend 2>/dev/null || echo "N/A")
    
    echo "BACKEND_STATUS:${BACKEND_STATUS}"
    echo "BACKEND_MEM:${BACKEND_MEM}"
    echo "BACKEND_CPU:${BACKEND_CPU}"
}

# Display tier bar
display_tier_bar() {
    local tier=$1
    local count=$2
    local total=$3
    local color=$4
    
    local percentage=0
    if [ $total -gt 0 ]; then
        percentage=$((count * 100 / total))
    fi
    
    local bar_length=$((percentage / 2))  # Max 50 chars
    local bar=$(printf "█%.0s" $(seq 1 $bar_length))
    
    printf "${color}%-12s${NC} [%-50s] %3d%% (%d users)\n" "$tier" "$bar" "$percentage" "$count"
}

# Main dashboard loop
main() {
    while true; do
        clear_screen
        
        # System Health
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}🩺 SYSTEM HEALTH${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        HEALTH_DATA=$(get_system_health)
        BACKEND_STATUS=$(echo "$HEALTH_DATA" | grep "BACKEND_STATUS" | cut -d':' -f2)
        BACKEND_MEM=$(echo "$HEALTH_DATA" | grep "BACKEND_MEM" | cut -d':' -f2)
        BACKEND_CPU=$(echo "$HEALTH_DATA" | grep "BACKEND_CPU" | cut -d':' -f2)
        
        if [ "$BACKEND_STATUS" == "200" ]; then
            echo -e "  Backend API:    ${GREEN}✅ HEALTHY${NC} (HTTP 200)"
        else
            echo -e "  Backend API:    ${RED}❌ DOWN${NC} (HTTP $BACKEND_STATUS)"
        fi
        
        echo -e "  Memory Usage:   ${CYAN}${BACKEND_MEM}${NC}"
        echo -e "  CPU Usage:      ${CYAN}${BACKEND_CPU}${NC}"
        echo ""
        
        # MongoDB Stats
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}📊 EMPIRE STATISTICS${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        MONGO_DATA=$(get_mongo_stats)
        TOTAL_USERS=$(echo "$MONGO_DATA" | grep "TOTAL_USERS" | cut -d':' -f2)
        ACTIVE_TODAY=$(echo "$MONGO_DATA" | grep "ACTIVE_TODAY" | cut -d':' -f2)
        TOTAL_DUELS=$(echo "$MONGO_DATA" | grep "TOTAL_DUELS" | cut -d':' -f2)
        ACTIVE_DUELS=$(echo "$MONGO_DATA" | grep "ACTIVE_DUELS" | cut -d':' -f2)
        
        echo -e "  Total Warriors:      ${WHITE}${TOTAL_USERS:-0}${NC}"
        echo -e "  Active Today:        ${GREEN}${ACTIVE_TODAY:-0}${NC}"
        echo -e "  Total Duels:         ${YELLOW}${TOTAL_DUELS:-0}${NC}"
        echo -e "  Active Duels:        ${RED}${ACTIVE_DUELS:-0}${NC}"
        echo ""
        
        # Tier Distribution
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${PURPLE}👑 HIERARCHY OF POWER (TIER DISTRIBUTION)${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        TIER_DATA=$(get_tier_distribution)
        ARCHITECT=$(echo "$TIER_DATA" | grep "ARCHITECT" | cut -d':' -f2)
        DIVINE=$(echo "$TIER_DATA" | grep "DIVINE" | cut -d':' -f2)
        PLATINUM=$(echo "$TIER_DATA" | grep "PLATINUM" | cut -d':' -f2)
        GOLD=$(echo "$TIER_DATA" | grep "GOLD" | cut -d':' -f2)
        SILVER=$(echo "$TIER_DATA" | grep "SILVER" | cut -d':' -f2)
        BRONZE=$(echo "$TIER_DATA" | grep "BRONZE" | cut -d':' -f2)
        
        TOTAL_TIER_USERS=$((ARCHITECT + DIVINE + PLATINUM + GOLD + SILVER + BRONZE))
        
        display_tier_bar "👑 Architect" ${ARCHITECT:-0} $TOTAL_TIER_USERS "${PURPLE}"
        display_tier_bar "🟣 Divine" ${DIVINE:-0} $TOTAL_TIER_USERS "${PURPLE}"
        display_tier_bar "🔵 Platinum" ${PLATINUM:-0} $TOTAL_TIER_USERS "${BLUE}"
        display_tier_bar "🟡 Gold" ${GOLD:-0} $TOTAL_TIER_USERS "${YELLOW}"
        display_tier_bar "⚪ Silver" ${SILVER:-0} $TOTAL_TIER_USERS "${WHITE}"
        display_tier_bar "🟤 Bronze" ${BRONZE:-0} $TOTAL_TIER_USERS "${CYAN}"
        
        echo ""
        
        # Top 5 Players
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}🏆 ALPHA THRONE (TOP 5 WARRIORS)${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        TOP_DATA=$(get_top_players)
        if [ -n "$TOP_DATA" ] && [ "$TOP_DATA" != "TOP_ERROR" ]; then
            echo "$TOP_DATA" | while IFS='|' read -r rank name xp level; do
                case $rank in
                    1) MEDAL="${YELLOW}👑${NC}" ;;
                    2) MEDAL="${WHITE}🥈${NC}" ;;
                    3) MEDAL="${CYAN}🥉${NC}" ;;
                    *) MEDAL="  ${rank}." ;;
                esac
                printf "  ${MEDAL} %-20s ${WHITE}%6s XP${NC}  (Lvl %s)\n" "$name" "$xp" "$level"
            done
        else
            echo -e "  ${CYAN}No players yet - The Colosseum awaits its first warriors${NC}"
        fi
        
        echo ""
        
        # Recent Activity
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}⚔️  RECENT BATTLES${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        ACTIVITY_DATA=$(get_recent_activity)
        if [ -n "$ACTIVITY_DATA" ] && [ "$ACTIVITY_DATA" != "ACTIVITY_ERROR" ]; then
            echo "$ACTIVITY_DATA" | while IFS='|' read -r winner wager timeago; do
                printf "  ${GREEN}⚡${NC} %-20s won ${YELLOW}%3d XP${NC}  (${CYAN}%dm ago${NC})\n" "$winner" "$wager" "$timeago"
            done
        else
            echo -e "  ${CYAN}No recent battles - The arena is quiet${NC}"
        fi
        
        echo ""
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}🔄 Refreshing in ${REFRESH_INTERVAL}s... (Ctrl+C to stop)${NC}"
        echo -e "${WHITE}═══════════════════════════════════════════════════════════════════${NC}"
        
        sleep $REFRESH_INTERVAL
    done
}

# Usage info
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "🏛️ Digital Colosseum - Live Dashboard"
    echo ""
    echo "Usage: $0 [refresh_interval]"
    echo ""
    echo "Arguments:"
    echo "  refresh_interval    Seconds between updates (default: 10)"
    echo ""
    echo "Environment Variables:"
    echo "  REACT_APP_BACKEND_URL    Backend API URL"
    echo "  MONGO_CONTAINER          MongoDB container name (default: calliotel_mongodb)"
    echo ""
    echo "Examples:"
    echo "  $0              # Refresh every 10 seconds"
    echo "  $0 5            # Refresh every 5 seconds"
    echo ""
    exit 0
fi

# Run dashboard
main
