#!/bin/bash

# 📈 TIER MIGRATION TRACKER
# Tracks user movement between tiers over time
# Generates historical reports and alerts

set -e

MONGO_CONTAINER=${MONGO_CONTAINER:-"calliotel_mongodb"}
REPORT_DIR="/var/log/calliotel/tier_reports"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Create report directory
mkdir -p $REPORT_DIR

TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
REPORT_FILE="${REPORT_DIR}/tier_migration_${TIMESTAMP}.json"

echo "📊 Generating tier migration report..."
echo ""

# Generate snapshot
docker exec $MONGO_CONTAINER mongosh --quiet --eval "
use calliotel_prod;

const profiles = db.gamification_profiles.find({}, {
    user_id: 1,
    total_points: 1,
    level: 1,
    created_at: 1
}).toArray();

const users = db.users.find({}, {
    _id: 1,
    email: 1,
    is_admin: 1,
    created_at: 1
}).toArray();

// Calculate tier for each user
const getTierName = (xp, isAdmin) => {
    if (isAdmin) return 'architect';
    if (xp >= 2500) return 'divine';
    if (xp >= 1000) return 'platinum';
    if (xp >= 500) return 'gold';
    if (xp >= 100) return 'silver';
    return 'bronze';
};

// Build user snapshots
const snapshots = profiles.map(p => {
    const user = users.find(u => u._id === p.user_id);
    const tier = getTierName(p.total_points || 0, user?.is_admin || false);
    
    return {
        user_id: p.user_id,
        email: user?.email || 'unknown',
        tier: tier,
        xp: p.total_points || 0,
        level: p.level || 1,
        account_age_days: Math.floor((Date.now() - new Date(user?.created_at)) / (1000 * 60 * 60 * 24))
    };
});

// Tier distribution
const distribution = {};
snapshots.forEach(s => {
    distribution[s.tier] = (distribution[s.tier] || 0) + 1;
});

// Output report
const report = {
    timestamp: new Date().toISOString(),
    total_users: snapshots.length,
    tier_distribution: distribution,
    top_10_warriors: snapshots.sort((a, b) => b.xp - a.xp).slice(0, 10),
    newest_warriors: snapshots.sort((a, b) => a.account_age_days - b.account_age_days).slice(0, 5)
};

print(JSON.stringify(report, null, 2));
" > $REPORT_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Report generated: ${REPORT_FILE}${NC}"
    echo ""
    
    # Display summary
    TOTAL=$(jq '.total_users' $REPORT_FILE)
    ARCHITECT=$(jq '.tier_distribution.architect // 0' $REPORT_FILE)
    DIVINE=$(jq '.tier_distribution.divine // 0' $REPORT_FILE)
    PLATINUM=$(jq '.tier_distribution.platinum // 0' $REPORT_FILE)
    GOLD=$(jq '.tier_distribution.gold // 0' $REPORT_FILE)
    SILVER=$(jq '.tier_distribution.silver // 0' $REPORT_FILE)
    BRONZE=$(jq '.tier_distribution.bronze // 0' $REPORT_FILE)
    
    echo "📊 TIER DISTRIBUTION:"
    echo "  Total Warriors: $TOTAL"
    echo "  👑 Architect:   $ARCHITECT"
    echo "  🟣 Divine:      $DIVINE"
    echo "  🔵 Platinum:    $PLATINUM"
    echo "  🟡 Gold:        $GOLD"
    echo "  ⚪ Silver:      $SILVER"
    echo "  🟤 Bronze:      $BRONZE"
    echo ""
    
    # Compare with previous report (if exists)
    PREV_REPORT=$(ls -t ${REPORT_DIR}/tier_migration_*.json 2>/dev/null | sed -n '2p')
    
    if [ -n "$PREV_REPORT" ]; then
        echo "📈 TIER MIGRATION (since last report):"
        
        PREV_ARCHITECT=$(jq '.tier_distribution.architect // 0' $PREV_REPORT)
        PREV_DIVINE=$(jq '.tier_distribution.divine // 0' $PREV_REPORT)
        PREV_PLATINUM=$(jq '.tier_distribution.platinum // 0' $PREV_REPORT)
        PREV_GOLD=$(jq '.tier_distribution.gold // 0' $PREV_REPORT)
        PREV_SILVER=$(jq '.tier_distribution.silver // 0' $PREV_REPORT)
        PREV_BRONZE=$(jq '.tier_distribution.bronze // 0' $PREV_REPORT)
        
        display_change() {
            local tier=$1
            local current=$2
            local previous=$3
            local diff=$((current - previous))
            
            if [ $diff -gt 0 ]; then
                echo -e "  $tier: ${GREEN}+${diff}${NC}"
            elif [ $diff -lt 0 ]; then
                echo -e "  $tier: ${RED}${diff}${NC}"
            else
                echo "  $tier: No change"
            fi
        }
        
        display_change "👑 Architect" $ARCHITECT $PREV_ARCHITECT
        display_change "🟣 Divine" $DIVINE $PREV_DIVINE
        display_change "🔵 Platinum" $PLATINUM $PREV_PLATINUM
        display_change "🟡 Gold" $GOLD $PREV_GOLD
        display_change "⚪ Silver" $SILVER $PREV_SILVER
        display_change "🟤 Bronze" $BRONZE $PREV_BRONZE
        
        echo ""
        echo "Previous report: $(basename $PREV_REPORT)"
    else
        echo "ℹ️  First snapshot - no comparison available"
    fi
    
    echo ""
    echo "💾 All reports stored in: $REPORT_DIR"
    
else
    echo -e "${RED}❌ Failed to generate report${NC}"
    exit 1
fi
