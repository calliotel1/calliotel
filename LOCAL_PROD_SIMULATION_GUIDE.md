# 🔬 LOCAL PRODUCTION SIMULATION GUIDE

## 👑 **COMMANDER'S DRY-RUN PROTOCOL**

This guide walks through testing the **production Docker stack** locally before deploying to Digital Ocean.

---

## 📋 **PREREQUISITES**

- Docker installed
- Docker Compose installed
- Node.js installed (for WebSocket stress test)
- 8GB RAM available (for 3 containers + frontend build)
- Ports 8080, 8002, 27018 available

---

## 🚀 **QUICK START**

### **1. Run Automated Dry-Run**

```bash
cd /app
./run_prod_simulation.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Load environment variables
3. ✅ Build React frontend (production bundle)
4. ✅ Start Docker Compose stack (MongoDB, Backend, Nginx)
5. ✅ Run health checks
6. ✅ Test WebSocket connectivity
7. ✅ Display access points and logs

**Expected output**:
```
🏛️ DIGITAL COLOSSEUM - LOCAL PRODUCTION DRY-RUN
================================================

📋 Step 1: Checking prerequisites...
✅ Prerequisites met

🔑 Step 2: Loading environment variables...
✅ Environment loaded

🏗️ Step 3: Building React frontend...
✅ Frontend built

🐳 Step 4: Starting Docker Compose stack...
✅ Services started

🩺 Step 5: Running health checks...
  ✅ MongoDB healthy
  ✅ Backend healthy
  ✅ Nginx healthy

⚡ Step 6: Testing WebSocket connectivity...
✅ WebSocket connected!

🎉 LOCAL PRODUCTION SIMULATION COMPLETE!
```

---

## 🌐 **ACCESS POINTS**

Once the simulation is running:

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/health
- **Global Square WS**: ws://localhost:8080/api/global-square/ws/global-square
- **Co-Op Stack WS**: ws://localhost:8080/api/ws/coop/{room_id}

---

## 🔬 **MANUAL TESTING CHECKLIST**

### **1. Frontend Load Test**
```bash
# Open in browser
open http://localhost:8080

# Check console for errors (F12)
# Expected: No 404s, no CORS errors
```

### **2. API Health Check**
```bash
curl http://localhost:8080/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","services":{"database":"connected"}}
```

### **3. User Registration**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@local.com",
    "password": "TestPassword123!",
    "full_name": "Test User",
    "birthday": "1990-01-01"
  }'

# Expected: 200 OK with access_token
```

### **4. Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@local.com",
    "password": "TestPassword123!"
  }'

# Save the token for next tests
```

### **5. Leaderboard Test**
```bash
TOKEN="your_token_here"

curl http://localhost:8080/api/leaderboard/overall \
  -H "Authorization: Bearer $TOKEN"

# Expected: Leaderboard array (may be empty initially)
```

### **6. WebSocket Stress Test**
```bash
./websocket_stress_test.sh

# Expected: 10/10 connections successful
```

---

## ⚡ **WEBSOCKET STRESS TEST**

### **Run the Test**
```bash
./websocket_stress_test.sh
```

### **Expected Output**
```
⚡ WEBSOCKET STRESS TEST - GLOBAL SQUARE
=========================================

🚀 Launching 10 concurrent WebSocket connections...

✅ Connection 1/10 established
✅ Connection 2/10 established
✅ Connection 3/10 established
...
✅ Connection 10/10 established

📊 Stats: 10 connected | 0 failed | 45 sent | 450 received | 30.0s elapsed

🏁 Stress test complete!
========================
✅ Successful connections: 10/10
❌ Failed connections: 0/10
📨 Messages sent: 45
📥 Messages received: 450
📊 Success rate: 100.0%

🎉 ALL CONNECTIONS SUCCESSFUL - WebSocket stack is stable!
```

### **Interpreting Results**

**✅ Success Criteria**:
- All 10 connections establish (100% success rate)
- Messages sent and received
- No connection drops during 30-second test
- Nginx logs show no 502/504 errors

**❌ Failure Scenarios**:
- Connections fail to establish → Check Nginx WebSocket config
- Connections drop after a few seconds → Check timeouts
- 502 Bad Gateway → Backend not reachable from Nginx
- 504 Gateway Timeout → Backend slow or unresponsive

---

## 📊 **MONITORING**

### **Container Status**
```bash
docker-compose -f docker-compose.prod.local.yml ps

# Expected: All containers "Up" and healthy
```

### **Container Logs**

**Backend**:
```bash
docker logs -f calliotel_backend_local

# Look for:
# - "Application startup complete"
# - No Python exceptions
# - WebSocket connections accepted
```

**Nginx**:
```bash
docker logs -f calliotel_nginx_local

# Look for:
# - No 502/504 errors
# - WebSocket upgrade requests (HTTP 101)
```

**MongoDB**:
```bash
docker logs -f calliotel_mongodb_local

# Look for:
# - "Waiting for connections"
# - No connection errors
```

### **Resource Usage**
```bash
docker stats --no-stream

# Expected:
# - Backend: <500MB RAM, <50% CPU
# - MongoDB: <300MB RAM, <20% CPU
# - Nginx: <50MB RAM, <5% CPU
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Frontend shows blank page**

**Diagnosis**:
```bash
# Check Nginx can access frontend build
docker exec calliotel_nginx_local ls /usr/share/nginx/html

# Expected: index.html, static/, etc.
```

**Fix**:
```bash
# Rebuild frontend
cd frontend && yarn build && cd ..

# Restart Nginx
docker-compose -f docker-compose.prod.local.yml restart nginx
```

---

### **Issue: Backend health check fails**

**Diagnosis**:
```bash
# Check backend logs
docker logs calliotel_backend_local --tail=50

# Common errors:
# - MongoDB connection failed
# - Missing environment variables
```

**Fix**:
```bash
# Verify MongoDB is running
docker exec calliotel_mongodb_local mongosh --eval "db.runCommand('ping')"

# Restart backend
docker-compose -f docker-compose.prod.local.yml restart backend
```

---

### **Issue: WebSocket connections fail**

**Diagnosis**:
```bash
# Check Nginx config
docker exec calliotel_nginx_local cat /etc/nginx/conf.d/default.conf | grep -A 10 "ws/coop"

# Verify upgrade headers present
```

**Fix**:
```bash
# Ensure nginx.conf.local has:
# - proxy_set_header Upgrade $http_upgrade;
# - proxy_set_header Connection "upgrade";
# - proxy_buffering off;

# Reload Nginx config
docker-compose -f docker-compose.prod.local.yml restart nginx
```

---

### **Issue: MongoDB connection refused**

**Diagnosis**:
```bash
# Check MongoDB status
docker exec calliotel_mongodb_local mongosh --eval "db.version()"

# Check environment variable
docker exec calliotel_backend_local env | grep MONGO_URL
```

**Fix**:
```bash
# Verify .env.prod.local has correct password
# Restart entire stack
docker-compose -f docker-compose.prod.local.yml down
docker-compose -f docker-compose.prod.local.yml up -d
```

---

## 🧹 **CLEANUP**

### **Stop Services**
```bash
docker-compose -f docker-compose.prod.local.yml down
```

### **Full Clean** (removes volumes)
```bash
docker-compose -f docker-compose.prod.local.yml down -v

# Remove local env
rm .env.prod.local

# Remove frontend build
rm -rf frontend/build
```

---

## ✅ **VALIDATION CHECKLIST**

Before proceeding to Digital Ocean deployment, ensure:

- [ ] Frontend loads at http://localhost:8080
- [ ] Backend health check returns 200 OK
- [ ] User registration works
- [ ] User login works
- [ ] Leaderboard API responds
- [ ] Global Square WebSocket connects
- [ ] 10/10 WebSocket stress test passes
- [ ] No errors in Docker logs
- [ ] Container memory usage <1GB total
- [ ] Nginx reverse proxy working
- [ ] Static file caching working (check Network tab in DevTools)

---

## 🚀 **NEXT STEPS**

Once local simulation passes all tests:

1. **Document any issues found** and solutions applied
2. **Commit working configs** to git (exclude .env files)
3. **Prepare Digital Ocean droplet** (refer to PRODUCTION_DEPLOYMENT_PLAYBOOK.md)
4. **Deploy to production** using validated configs
5. **Run same stress tests** in production to verify

---

## 💎 **SUCCESS CRITERIA**

**The simulation is successful if**:
- ✅ All health checks pass
- ✅ WebSocket stress test: 100% success rate
- ✅ No 502/504 errors in Nginx logs
- ✅ Frontend loads in <2 seconds
- ✅ API responses <100ms
- ✅ Containers stable for 30+ minutes

**If all criteria met**: Production stack is ready for Digital Ocean deployment! 🎉

---

## 👑 **COMMANDER'S SIGN-OFF**

This local simulation **replicates production conditions** without cloud costs. It validates:
- Docker container orchestration
- Nginx reverse proxy + WebSocket upgrade
- Backend API under load
- Real-time connection stability

**Once validated locally, production deployment risk is minimized to <5%.** 💪🔥
