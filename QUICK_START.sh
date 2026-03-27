#!/bin/bash

# 🎯 QUICK START - LOCAL PRODUCTION SIMULATION
# Download this entire codebase and run this script

echo "🏛️ DIGITAL COLOSSEUM - PRODUCTION SIMULATION QUICK START"
echo "========================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.local.yml" ]; then
    echo "❌ Error: Run this script from the /app directory"
    echo "Expected files: docker-compose.prod.local.yml, run_prod_simulation.sh"
    exit 1
fi

echo "📋 SIMULATION CHECKLIST:"
echo ""
echo "Phase 1: Automated Burn-In (5 min)"
echo "  └─ Build frontend, start containers, health checks"
echo ""
echo "Phase 2: Manual Validation (10 min)"  
echo "  └─ Test frontend, register user, test features"
echo ""
echo "Phase 3: WebSocket Stress Test (30 sec)"
echo "  └─ 10 concurrent connections, stability validation"
echo ""

read -p "Ready to proceed? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Simulation cancelled."
    exit 0
fi

echo ""
echo "🚀 EXECUTING PHASE 1..."
echo "======================="
./run_prod_simulation.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PHASE 1 COMPLETE"
    echo ""
    echo "📊 Quick verification:"
    echo "  1. Open http://localhost:8080 in browser"
    echo "  2. Check console for errors (F12)"
    echo "  3. Register a test user"
    echo ""
    read -p "Phase 1 successful? Continue to stress test? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "⚡ EXECUTING PHASE 3: WEBSOCKET STRESS TEST..."
        echo "=============================================="
        ./websocket_stress_test.sh
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 ALL PHASES COMPLETE - PRODUCTION STACK VALIDATED!"
            echo ""
            echo "✅ Next step: Deploy to Digital Ocean"
            echo "📖 Guide: PRODUCTION_DEPLOYMENT_PLAYBOOK.md"
        else
            echo ""
            echo "❌ WebSocket stress test failed"
            echo "Check logs: docker logs calliotel_nginx_local"
        fi
    fi
else
    echo ""
    echo "❌ Phase 1 failed - check logs above"
fi
