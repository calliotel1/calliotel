#!/bin/bash
# 📊 DATABASE HEALTH CHECK
# Run this before and after deployment to verify MongoDB performance

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 DIGITAL COLOSSEUM - DATABASE HEALTH CHECK${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Get MongoDB connection details
if [[ -f "backend/.env" ]]; then
    source backend/.env
else
    MONGO_URL="mongodb://localhost:27017/"
    DB_NAME="calliotel_production"
fi

echo -e "${YELLOW}Connecting to: $MONGO_URL${NC}"
echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo ""

# Check if MongoDB is accessible
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    echo -e "${RED}❌ MongoDB client not found. Install mongosh or mongo CLI${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] Testing MongoDB connection...${NC}"
$MONGO_CMD "$MONGO_URL" --quiet --eval "db.adminCommand('ping')" > /dev/null
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ MongoDB is accessible${NC}"
else
    echo -e "${RED}❌ Cannot connect to MongoDB${NC}"
    exit 1
fi

echo -e "${GREEN}[2/5] Checking database statistics...${NC}"
$MONGO_CMD "$MONGO_URL$DB_NAME" --quiet --eval "
    var stats = db.stats();
    print('Collections: ' + stats.collections);
    print('Data Size: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
    print('Storage Size: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
    print('Indexes: ' + stats.indexes);
    print('Index Size: ' + (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB');
"

echo ""
echo -e "${GREEN}[3/5] Checking collection counts...${NC}"
$MONGO_CMD "$MONGO_URL$DB_NAME" --quiet --eval "
    print('users: ' + db.users.countDocuments({}));
    print('duels: ' + db.duels.countDocuments({}));
    print('global_square_messages: ' + db.global_square_messages.countDocuments({}));
    print('achievements: ' + db.achievements.countDocuments({}));
    print('speed_dialer_sessions: ' + db.speed_dialer_sessions.countDocuments({}));
    print('phish_finder_sessions: ' + db.phish_finder_sessions.countDocuments({}));
    print('coop_stack_sessions: ' + db.coop_stack_sessions.countDocuments({}));
"

echo ""
echo -e "${GREEN}[4/5] Verifying indexes...${NC}"
$MONGO_CMD "$MONGO_URL$DB_NAME" --quiet --eval "
    var collections = ['users', 'duels', 'global_square_messages', 'achievements'];
    collections.forEach(function(coll) {
        var indexes = db[coll].getIndexes();
        print(coll + ': ' + indexes.length + ' indexes');
        indexes.forEach(function(idx) {
            print('  - ' + idx.name);
        });
    });
"

echo ""
echo -e "${GREEN}[5/5] Checking slow queries (if profiling enabled)...${NC}"
$MONGO_CMD "$MONGO_URL$DB_NAME" --quiet --eval "
    var slowQueries = db.system.profile.find({millis: {\$gt: 100}}).limit(5).toArray();
    if (slowQueries.length > 0) {
        print('Found ' + slowQueries.length + ' slow queries (>100ms):');
        slowQueries.forEach(function(q) {
            print('  - ' + q.op + ' on ' + q.ns + ' took ' + q.millis + 'ms');
        });
    } else {
        print('No slow queries detected (or profiling not enabled)');
    }
" || echo -e "${YELLOW}Profiling not enabled (this is normal for production)${NC}"

echo ""
echo -e "${GREEN}🎯 DATABASE HEALTH CHECK COMPLETE${NC}"
echo -e "${BLUE}Recommendations:${NC}"
echo -e "  - Data size < 100 MB: ${GREEN}Excellent for initial launch${NC}"
echo -e "  - Index size should be < 50% of data size"
echo -e "  - Enable monitoring: db.setProfilingLevel(1, {slowms: 100})"
echo ""
