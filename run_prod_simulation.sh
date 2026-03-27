#!/bin/bash

# 🔬 LOCAL PRODUCTION SIMULATION - DRY RUN SCRIPT
# Tests production stack locally before Digital Ocean deployment

set -e  # Exit on error

echo "🏛️ DIGITAL COLOSSEUM - LOCAL PRODUCTION DRY-RUN"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose not installed${NC}"; exit 1; }
echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Load environment variables
echo "🔑 Step 2: Loading environment variables..."
if [ ! -f .env.prod.local ]; then
    echo -e "${RED}❌ .env.prod.local not found${NC}"
    exit 1
fi
export $(cat .env.prod.local | grep -v '^#' | xargs)
echo -e "${GREEN}✅ Environment loaded${NC}"
echo ""

# Step 3: Build frontend (production build)
echo "🏗️ Step 3: Building React frontend..."
cd frontend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

echo "  - Installing dependencies..."
yarn install --frozen-lockfile

echo "  - Building production bundle..."
REACT_APP_BACKEND_URL=http://localhost:8080 yarn build

echo -e "${GREEN}✅ Frontend built${NC}"
cd ..
echo ""

# Step 4: Start Docker stack
echo "🐳 Step 4: Starting Docker Compose stack..."
docker-compose -f docker-compose.prod.local.yml down -v  # Clean start
docker-compose -f docker-compose.prod.local.yml up -d --build

echo "  - Waiting for services to start (30s)..."
sleep 30
echo ""

# Step 5: Health checks
echo "🩺 Step 5: Running health checks..."

echo "  - Checking MongoDB..."
if docker exec calliotel_mongodb_local mongosh --eval "db.runCommand('ping').ok" --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}    ✅ MongoDB healthy${NC}"
else
    echo -e "${RED}    ❌ MongoDB failed${NC}"
    docker logs calliotel_mongodb_local --tail=20
    exit 1
fi

echo "  - Checking Backend..."
BACKEND_HEALTH=$(curl -s http://localhost:8002/api/health || echo "FAILED")
if [[ "$BACKEND_HEALTH" == *"healthy"* ]]; then
    echo -e "${GREEN}    ✅ Backend healthy${NC}"
else
    echo -e "${RED}    ❌ Backend failed${NC}"
    docker logs calliotel_backend_local --tail=20
    exit 1
fi

echo "  - Checking Nginx..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo "000")
if [ "$NGINX_RESPONSE" == "200" ]; then
    echo -e "${GREEN}    ✅ Nginx healthy${NC}"
else
    echo -e "${RED}    ❌ Nginx failed (HTTP $NGINX_RESPONSE)${NC}"
    docker logs calliotel_nginx_local --tail=20
    exit 1
fi

echo -e "${GREEN}✅ All health checks passed${NC}"
echo ""

# Step 6: WebSocket connectivity test
echo "⚡ Step 6: Testing WebSocket connectivity..."

# Create WebSocket test script
cat > /tmp/ws_test.js << 'EOF'
const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection to Global Square...');

const ws = new WebSocket('ws://localhost:8080/api/global-square/ws/global-square');

ws.on('open', function open() {
    console.log('✅ WebSocket connected!');
    
    // Send auth message
    ws.send(JSON.stringify({
        token: 'test_token',
        user_id: 'test_user_1'
    }));
    
    setTimeout(() => {
        console.log('✅ Connection stable for 3 seconds');
        ws.close();
        process.exit(0);
    }, 3000);
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
    process.exit(1);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket closed');
});
EOF

# Run WebSocket test (if Node.js available)
if command -v node >/dev/null 2>&1; then
    if [ -d "frontend/node_modules/ws" ]; then
        cd frontend && node /tmp/ws_test.js && cd ..
    else
        echo -e "${YELLOW}  ⚠️ Skipping WebSocket test (ws module not found)${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️ Skipping WebSocket test (Node.js not installed)${NC}"
fi
echo ""

# Step 7: Display status
echo "📊 Step 7: Production Stack Status"
echo "===================================="
docker-compose -f docker-compose.prod.local.yml ps
echo ""

echo "🔗 Access Points:"
echo "  - Frontend:   http://localhost:8080"
echo "  - Backend:    http://localhost:8080/api"
echo "  - Health:     http://localhost:8080/api/health"
echo "  - MongoDB:    localhost:27018"
echo ""

echo "📝 Logs:"
echo "  - Backend:    docker logs -f calliotel_backend_local"
echo "  - Nginx:      docker logs -f calliotel_nginx_local"
echo "  - MongoDB:    docker logs -f calliotel_mongodb_local"
echo ""

echo "🛑 Shutdown:"
echo "  - Stop:       docker-compose -f docker-compose.prod.local.yml down"
echo "  - Clean:      docker-compose -f docker-compose.prod.local.yml down -v"
echo ""

echo -e "${GREEN}🎉 LOCAL PRODUCTION SIMULATION COMPLETE!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Test user registration and login"
echo "3. Navigate to Global Square and test chat"
echo "4. Create a Co-Op Stack room and test lobby"
echo "5. Run stress test: ./websocket_stress_test.sh"
echo ""
