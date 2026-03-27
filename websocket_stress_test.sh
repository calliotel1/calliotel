#!/bin/bash

# 🔥 WEBSOCKET STRESS TEST - 10 Concurrent Connections
# Tests Global Square under load

echo "⚡ WEBSOCKET STRESS TEST - GLOBAL SQUARE"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js to run this test."
    exit 1
fi

# Create stress test script
cat > /tmp/websocket_stress_test.js << 'EOF'
const WebSocket = require('ws');

const NUM_CONNECTIONS = 10;
const WS_URL = 'ws://localhost:8080/api/global-square/ws/global-square';

let connected = 0;
let failed = 0;
let messages_sent = 0;
let messages_received = 0;

const connections = [];

console.log(`🚀 Launching ${NUM_CONNECTIONS} concurrent WebSocket connections...`);
console.log('');

for (let i = 0; i < NUM_CONNECTIONS; i++) {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
        connected++;
        console.log(`✅ Connection ${connected}/${NUM_CONNECTIONS} established`);
        
        // Send auth message
        ws.send(JSON.stringify({
            token: 'test_token',
            user_id: `ghost_user_${i}`
        }));
        
        // Send test message every 2 seconds
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'send_message',
                    content: `Ghost message ${messages_sent} from connection ${i}`
                }));
                messages_sent++;
            } else {
                clearInterval(interval);
            }
        }, 2000);
        
        connections.push({ ws, interval });
    });
    
    ws.on('message', (data) => {
        messages_received++;
        // Uncomment to see all messages:
        // console.log(`📨 Message received:`, data.toString());
    });
    
    ws.on('error', (err) => {
        failed++;
        console.error(`❌ Connection ${i} failed:`, err.message);
    });
    
    ws.on('close', () => {
        console.log(`🔌 Connection ${i} closed`);
    });
}

// Monitor for 30 seconds
const startTime = Date.now();
const monitorInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r📊 Stats: ${connected} connected | ${failed} failed | ${messages_sent} sent | ${messages_received} received | ${elapsed}s elapsed`);
}, 500);

// Cleanup after 30 seconds
setTimeout(() => {
    clearInterval(monitorInterval);
    console.log('\n');
    console.log('🏁 Stress test complete!');
    console.log('========================');
    console.log(`✅ Successful connections: ${connected}/${NUM_CONNECTIONS}`);
    console.log(`❌ Failed connections: ${failed}/${NUM_CONNECTIONS}`);
    console.log(`📨 Messages sent: ${messages_sent}`);
    console.log(`📥 Messages received: ${messages_received}`);
    console.log(`📊 Success rate: ${(connected/NUM_CONNECTIONS*100).toFixed(1)}%`);
    console.log('');
    
    if (connected === NUM_CONNECTIONS) {
        console.log('🎉 ALL CONNECTIONS SUCCESSFUL - WebSocket stack is stable!');
    } else {
        console.log('⚠️ Some connections failed - check Nginx/backend logs');
    }
    
    // Close all connections
    connections.forEach(({ ws, interval }) => {
        clearInterval(interval);
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    });
    
    process.exit(connected === NUM_CONNECTIONS ? 0 : 1);
}, 30000);
EOF

# Check if ws module is available
if [ -d "frontend/node_modules/ws" ]; then
    cd frontend && node /tmp/websocket_stress_test.js
else
    echo "❌ 'ws' module not found in frontend/node_modules"
    echo "Installing ws module..."
    cd frontend && yarn add ws && node /tmp/websocket_stress_test.js
fi
