#!/bin/bash

# 🏛️ POST-MORTEM SNAPSHOT GENERATOR
# Automatically captures system state for post-mortem analysis

set -e

TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
SNAPSHOT_DIR="/var/log/calliotel/post_mortem_snapshots"
SNAPSHOT_FILE="${SNAPSHOT_DIR}/snapshot_${TIMESTAMP}.txt"

mkdir -p $SNAPSHOT_DIR

echo "📸 Generating Post-Mortem Snapshot..."
echo "Time: $TIMESTAMP"
echo ""

# Start snapshot
cat > $SNAPSHOT_FILE << EOF
═══════════════════════════════════════════════════════════════════
🏛️ DIGITAL COLOSSEUM - POST-MORTEM SNAPSHOT
═══════════════════════════════════════════════════════════════════
Generated: $TIMESTAMP
═══════════════════════════════════════════════════════════════════

EOF

# System Health
echo "🩺 SYSTEM HEALTH" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
echo "Docker Containers:" >> $SNAPSHOT_FILE
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> $SNAPSHOT_FILE 2>&1 || echo "Error: Docker not available" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

echo "Backend API Health:" >> $SNAPSHOT_FILE
API_URL=$(grep REACT_APP_BACKEND_URL .env.prod 2>/dev/null | cut -d'=' -f2 || echo "http://localhost:8080")
curl -s "${API_URL}/api/health" >> $SNAPSHOT_FILE 2>&1 || echo "Error: Backend not responding" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# System Resources
echo "💻 SYSTEM RESOURCES" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
echo "Memory Usage:" >> $SNAPSHOT_FILE
free -h >> $SNAPSHOT_FILE 2>&1
echo "" >> $SNAPSHOT_FILE
echo "Disk Usage:" >> $SNAPSHOT_FILE
df -h / >> $SNAPSHOT_FILE 2>&1
echo "" >> $SNAPSHOT_FILE
echo "Docker Stats:" >> $SNAPSHOT_FILE
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" >> $SNAPSHOT_FILE 2>&1 || echo "Error capturing stats" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# MongoDB Stats
echo "📊 DATABASE STATISTICS" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
docker exec calliotel_mongodb mongosh --quiet --eval "
use calliotel_prod;
print('Total Users: ' + db.users.countDocuments());
print('Active Today: ' + db.users.countDocuments({last_login: {\$gte: new Date(Date.now() - 24*60*60*1000)}}));
print('Total Duels: ' + db.duels.countDocuments());
print('Completed Duels: ' + db.duels.countDocuments({status: 'completed'}));
print('Active Duels: ' + db.duels.countDocuments({status: 'in_progress'}));
print('Global Square Messages: ' + db.global_messages.countDocuments());
" >> $SNAPSHOT_FILE 2>&1 || echo "Error querying MongoDB" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# Tier Distribution
echo "👑 TIER DISTRIBUTION" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
./tier_migration_tracker.sh >> $SNAPSHOT_FILE 2>&1 || echo "Error generating tier report" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# Recent Logs (Last 50 lines)
echo "📝 RECENT LOGS (Backend)" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
docker logs calliotel_backend --tail=50 >> $SNAPSHOT_FILE 2>&1 || echo "Error capturing backend logs" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

echo "📝 RECENT LOGS (Nginx)" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
docker logs calliotel_nginx --tail=50 >> $SNAPSHOT_FILE 2>&1 || echo "Error capturing nginx logs" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# Network Stats
echo "🌐 NETWORK STATISTICS" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE
echo "Active Connections:" >> $SNAPSHOT_FILE
ss -s >> $SNAPSHOT_FILE 2>&1 || netstat -s >> $SNAPSHOT_FILE 2>&1 || echo "Error capturing network stats" >> $SNAPSHOT_FILE
echo "" >> $SNAPSHOT_FILE

# End snapshot
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE
echo "Snapshot Complete: $TIMESTAMP" >> $SNAPSHOT_FILE
echo "═══════════════════════════════════════════════════════════════════" >> $SNAPSHOT_FILE

echo "✅ Snapshot saved: $SNAPSHOT_FILE"
echo ""
echo "To view:"
echo "  cat $SNAPSHOT_FILE"
echo ""
echo "To generate at regular intervals:"
echo "  # Add to crontab:"
echo "  */15 * * * * /var/www/calliotel/post_mortem_snapshot.sh"
