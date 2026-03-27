# 🩺 HEALTH CHECK & MONITORING ENDPOINTS

## 👑 **COMMANDER'S SYSTEM DIAGNOSTICS**

---

## 🔍 **HEALTH CHECK ENDPOINTS**

### **1. Backend API Health**

**Endpoint**: `GET /api/health`

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-23T12:00:00Z",
  "services": {
    "database": "connected",
    "websocket": "active"
  }
}
```

**cURL Test**:
```bash
curl https://calliotel.com/api/health
```

---

### **2. Database Connection**

**Endpoint**: `GET /api/db/health`

**Expected Response**:
```json
{
  "status": "connected",
  "database": "calliotel_prod",
  "collections": 15,
  "avg_response_time_ms": 2.5
}
```

---

### **3. WebSocket Connectivity**

**Test Global Square**:
```bash
# Browser Console
const ws = new WebSocket('wss://calliotel.com/api/global-square/ws/global-square');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

**Test Co-Op Stack**:
```bash
# Browser Console (replace ROOM_ID)
const ws = new WebSocket('wss://calliotel.com/api/ws/coop/ROOM_ID');
ws.onopen = () => console.log('✅ Co-Op Stack connected');
```

---

## 📊 **MONITORING DASHBOARD (CLI)**

### **System Resources**

```bash
#!/bin/bash
# /var/www/calliotel/monitor.sh

echo "🏛️ DIGITAL COLOSSEUM - SYSTEM STATUS"
echo "===================================="
echo ""

echo "📊 SYSTEM RESOURCES:"
echo "--------------------"
free -h
echo ""

echo "💾 DISK USAGE:"
echo "--------------------"
df -h /
echo ""

echo "🐳 DOCKER CONTAINERS:"
echo "--------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔌 DOCKER STATS (5s snapshot):"
echo "--------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

echo "🌐 NGINX STATUS:"
echo "--------------------"
systemctl status nginx | grep Active
echo ""

echo "📡 ACTIVE CONNECTIONS:"
echo "--------------------"
ss -s
echo ""

echo "🔥 BACKEND LOGS (Last 10 lines):"
echo "--------------------"
docker logs calliotel_backend --tail=10 2>&1 | grep -v "GET /api/health"
echo ""

echo "✅ Monitoring complete!"
```

**Make executable and run**:
```bash
chmod +x /var/www/calliotel/monitor.sh
./monitor.sh
```

---

## 🚨 **ALERTING SYSTEM**

### **Uptime Monitoring**

**Option 1: UptimeRobot** (Free)
- Add monitor: `https://calliotel.com/api/health`
- Check interval: 5 minutes
- Alert via: Email, SMS, Slack

**Option 2: Self-Hosted (cron + curl)**

```bash
# /etc/cron.d/calliotel-health
*/5 * * * * root /var/www/calliotel/health_check.sh

# /var/www/calliotel/health_check.sh
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://calliotel.com/api/health)

if [ $RESPONSE != "200" ]; then
    echo "🚨 ALERT: Backend health check failed! HTTP $RESPONSE" | \
    mail -s "Calliotel Down" admin@calliotel.com
fi
```

---

## 📈 **PERFORMANCE METRICS**

### **Key Metrics to Monitor**

1. **Response Time**
   - Target: <100ms (95th percentile)
   - Monitor: `/api/leaderboard/overall`, `/api/profile/me`

2. **WebSocket Latency**
   - Target: <50ms
   - Monitor: Global Square ping/pong

3. **CPU Usage**
   - Target: <70% average
   - Monitor: `docker stats`

4. **Memory Usage**
   - Target: <75% of available RAM
   - Monitor: `free -h`

5. **Active Connections**
   - Target: <1000 concurrent WebSockets
   - Monitor: `ss -s`

---

## 🔬 **LOAD TESTING**

### **API Stress Test**

```bash
# Install Apache Bench
apt install apache2-utils -y

# Test leaderboard endpoint
ab -n 1000 -c 50 https://calliotel.com/api/leaderboard/overall

# Expected results:
# Requests per second: >100
# Time per request: <500ms (mean)
# Failed requests: 0
```

### **WebSocket Stress Test**

```javascript
// websocket_stress_test.js
const WebSocket = require('ws');

const NUM_CONNECTIONS = 100;
let connected = 0;

for (let i = 0; i < NUM_CONNECTIONS; i++) {
  const ws = new WebSocket('wss://calliotel.com/api/global-square/ws/global-square');
  
  ws.on('open', () => {
    connected++;
    console.log(`✅ Connection ${connected}/${NUM_CONNECTIONS}`);
    
    ws.send(JSON.stringify({
      token: 'test_token',
      user_id: `test_user_${i}`
    }));
  });
  
  ws.on('error', (err) => {
    console.error(`❌ Connection ${i} failed:`, err.message);
  });
}

setTimeout(() => {
  console.log(`\n🎯 Final: ${connected}/${NUM_CONNECTIONS} connections established`);
  process.exit(0);
}, 10000);
```

**Run**:
```bash
node websocket_stress_test.js
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **1. WebSocket Connection Refused**
```bash
# Check Nginx WebSocket config
nginx -t
cat /etc/nginx/sites-enabled/calliotel | grep -A 10 "location /api/ws/"

# Verify upgrade headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://calliotel.com/api/ws/coop/TEST
```

#### **2. High CPU Usage**
```bash
# Check which container is using CPU
docker stats --no-stream

# Restart container
docker restart calliotel_backend
```

#### **3. Database Connection Failed**
```bash
# Check MongoDB status
docker logs calliotel_mongodb --tail=50

# Test connection
docker exec calliotel_backend python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; client = AsyncIOMotorClient(os.environ['MONGO_URL']); print('✅ Connected')"
```

#### **4. SSL Certificate Expired**
```bash
# Check expiration
certbot certificates

# Renew manually
certbot renew --nginx

# Test auto-renewal
certbot renew --dry-run
```

---

## 📱 **MONITORING DASHBOARD (WEB)**

### **Grafana + Prometheus Setup** (Optional)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: always

volumes:
  prometheus_data:
  grafana_data:
```

**Access**: `http://your_droplet_ip:3001`

---

## 💎 **STATUS: MONITORING INFRASTRUCTURE READY**

All diagnostic tools and health checks documented! 🩺✅

**Commander's Dashboard**: CLI monitoring script provides real-time snapshot of the empire's vitals.
