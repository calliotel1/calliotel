# 🚀 DIGITAL COLOSSEUM - PRODUCTION DEPLOYMENT PLAYBOOK

## 👑 **COMMANDER'S PRE-FLIGHT BRIEFING**

**Mission**: Deploy the Digital Colosseum to Digital Ocean with full WebSocket support for real-time multiplayer and social features.

**Critical Systems**:
- Global Square (real-time chat)
- Co-Op Stack (multiplayer physics)
- Auto-Taunt System (P2P messaging)
- Hall of Legends (live leaderboards)

---

## 📋 **DEPLOYMENT ARCHITECTURE**

### **Infrastructure Stack**
```
Digital Ocean Droplet (Ubuntu 22.04 LTS)
├── Nginx (Reverse Proxy + WebSocket Support)
├── Docker Containers
│   ├── Backend (FastAPI + uvicorn)
│   ├── Frontend (React build)
│   └── MongoDB (Persistent volume)
└── SSL/TLS (Let's Encrypt)
```

### **Network Architecture**
```
User Browser
    ↓ HTTPS
[Nginx Reverse Proxy]
    ↓ HTTP/WS
[Backend Container :8001]
    ↓ MongoDB
[MongoDB Container :27017]
```

---

## 🔧 **STEP 1: DIGITAL OCEAN DROPLET SETUP**

### **Droplet Specifications**

**Recommended Tier**: CPU-Optimized
- **RAM**: 4GB minimum (8GB for production load)
- **vCPUs**: 2+ (WebSocket broadcast is CPU-intensive)
- **Storage**: 80GB SSD
- **Region**: Closest to target user base

**Create Droplet**:
```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Nginx
apt install nginx -y

# Install Certbot (SSL)
apt install certbot python3-certbot-nginx -y
```

---

## 🌐 **STEP 2: DOMAIN & DNS CONFIGURATION**

### **DNS Records**
Point your domain to the droplet:

```
Type    Name              Value              TTL
A       calliotel.com     [DROPLET_IP]      300
A       www.calliotel.com [DROPLET_IP]      300
A       api.calliotel.com [DROPLET_IP]      300
```

**Wait for DNS propagation** (5-30 minutes)

---

## 🔐 **STEP 3: SSL/TLS CERTIFICATE**

### **Let's Encrypt Setup**
```bash
# Get SSL certificate
certbot --nginx -d calliotel.com -d www.calliotel.com -d api.calliotel.com

# Auto-renewal (runs every 12 hours)
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 🔌 **STEP 4: NGINX CONFIGURATION (CRITICAL)**

### **WebSocket Support Configuration**

Create `/etc/nginx/sites-available/calliotel`:

```nginx
# Upstream for backend API
upstream backend_api {
    server localhost:8001;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name calliotel.com www.calliotel.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name calliotel.com www.calliotel.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/calliotel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/calliotel.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend (React Build)
    location / {
        root /var/www/calliotel/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (non-WebSocket)
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ⚡ CRITICAL: WebSocket Routes (Co-Op Stack, Global Square)
    location /api/ws/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        
        # WebSocket upgrade headers (MANDATORY)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts (CRITICAL)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        # Buffering (DISABLE for WebSocket)
        proxy_buffering off;
    }

    # Additional WebSocket route for Global Square
    location /ws/global-square {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        proxy_buffering off;
    }

    # Media files
    location /media {
        alias /var/www/calliotel/media;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site**:
```bash
ln -s /etc/nginx/sites-available/calliotel /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl reload nginx
```

---

## 📦 **STEP 5: DOCKER DEPLOYMENT**

### **Production Docker Compose**

Create `/var/www/calliotel/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:7.0
    container_name: calliotel_mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    ports:
      - "127.0.0.1:27017:27017"
    networks:
      - calliotel_network

  # Backend (FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: calliotel_backend
    restart: always
    ports:
      - "127.0.0.1:8001:8001"
    environment:
      - MONGO_URL=mongodb://admin:${MONGO_ROOT_PASSWORD}@mongodb:27017
      - DB_NAME=calliotel_prod
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - REACT_APP_BACKEND_URL=https://calliotel.com
      - ENVIRONMENT=production
    depends_on:
      - mongodb
    volumes:
      - ./media:/app/media
    networks:
      - calliotel_network

  # Frontend (React - Build)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - REACT_APP_BACKEND_URL=https://calliotel.com
    container_name: calliotel_frontend
    restart: always
    volumes:
      - frontend_build:/app/build
    networks:
      - calliotel_network

volumes:
  mongodb_data:
  frontend_build:

networks:
  calliotel_network:
    driver: bridge
```

### **Backend Dockerfile** (`/backend/Dockerfile.prod`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create media directory
RUN mkdir -p /app/media

# Expose port
EXPOSE 8001

# Run with uvicorn (production)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

### **Frontend Dockerfile** (`/frontend/Dockerfile.prod`)

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build production bundle
RUN yarn build

# Final stage (Nginx to serve build)
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔑 **STEP 6: ENVIRONMENT VARIABLES**

### **Production .env Template**

Create `/var/www/calliotel/.env.prod`:

```bash
# MongoDB
MONGO_ROOT_PASSWORD=[GENERATE_STRONG_PASSWORD]
MONGO_URL=mongodb://admin:[PASSWORD]@mongodb:27017
DB_NAME=calliotel_prod

# JWT
JWT_SECRET_KEY=[GENERATE_256_BIT_KEY]

# Backend URL (used by frontend)
REACT_APP_BACKEND_URL=https://calliotel.com

# Environment
ENVIRONMENT=production

# Emergent LLM Key (if applicable)
EMERGENT_LLM_KEY=[YOUR_KEY]

# Email/SMS (if configured)
SENDGRID_API_KEY=[YOUR_KEY]
TWILIO_ACCOUNT_SID=[YOUR_SID]
TWILIO_AUTH_TOKEN=[YOUR_TOKEN]
```

**Generate secure keys**:
```bash
# JWT Secret (256-bit)
openssl rand -hex 32

# MongoDB Root Password
openssl rand -base64 32
```

---

## 🚀 **STEP 7: DEPLOYMENT SEQUENCE**

### **Initial Deployment**

```bash
# Navigate to project directory
cd /var/www/calliotel

# Pull latest code from GitHub
git pull origin main

# Load environment variables
export $(cat .env.prod | xargs)

# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Verify containers
docker ps
```

### **Health Checks**

```bash
# Backend health
curl https://calliotel.com/api/health

# WebSocket test (should not return error)
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Host: calliotel.com" \
     -H "Origin: https://calliotel.com" \
     https://calliotel.com/ws/global-square
```

---

## 📊 **STEP 8: MONITORING & LOGGING**

### **System Monitoring**

**Install monitoring tools**:
```bash
# Install htop
apt install htop -y

# Install Docker stats
docker stats --no-stream
```

### **Log Management**

**View logs**:
```bash
# Backend logs
docker logs -f calliotel_backend --tail=100

# MongoDB logs
docker logs -f calliotel_mongodb --tail=100

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Log rotation** (automatically handled by Docker)

---

## 🔄 **STEP 9: CONTINUOUS DEPLOYMENT**

### **Update Script** (`/var/www/calliotel/deploy.sh`)

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Export environment variables
export $(cat .env.prod | xargs)

# Rebuild and restart containers
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services
sleep 10

# Health check
curl -f https://calliotel.com/api/health || exit 1

echo "✅ Deployment complete!"

# Send Void Broadcast (optional)
# curl -X POST https://calliotel.com/api/admin/broadcast \
#   -H "Authorization: Bearer $ADMIN_TOKEN" \
#   -d '{"message": "🔥 New update deployed to production!"}'
```

**Make executable**:
```bash
chmod +x /var/www/calliotel/deploy.sh
```

---

## 🛡️ **STEP 10: SECURITY HARDENING**

### **Firewall Configuration**

```bash
# UFW firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### **Fail2Ban** (SSH protection)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### **Docker Security**

```bash
# Run containers as non-root (add to Dockerfile)
RUN useradd -m appuser
USER appuser
```

---

## 🚨 **STEP 11: ROLLBACK STRATEGY**

### **Emergency Rollback**

```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Checkout previous commit
git log --oneline  # Find commit hash
git checkout [PREVIOUS_COMMIT_HASH]

# Redeploy
docker-compose -f docker-compose.prod.yml up -d --build

# Restore database (if needed)
docker exec calliotel_mongodb mongorestore --uri="mongodb://admin:PASSWORD@localhost:27017" /backup/db_backup
```

---

## ⚡ **STEP 12: THE ALPHA LAUNCH**

### **Pre-Launch Checklist**

- [ ] Domain DNS propagated
- [ ] SSL certificate active
- [ ] Nginx WebSocket headers configured
- [ ] Docker containers running
- [ ] MongoDB connection verified
- [ ] Backend API responding
- [ ] Frontend loading
- [ ] WebSocket connections working
- [ ] Global Square active
- [ ] Co-Op Stack lobby accessible
- [ ] Hall of Legends rendering

### **Launch Command**

```bash
# Void Broadcast to all connected users
curl -X POST https://calliotel.com/api/admin/void-broadcast \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "👑 THE GATES ARE OPEN. THE CO-OP STACK IS LIVE IN PRODUCTION. 🔥",
    "event_type": "system_announcement"
  }'
```

---

## 📈 **PERFORMANCE BENCHMARKS**

### **Expected Metrics**
- **API Response Time**: <100ms (95th percentile)
- **WebSocket Latency**: <50ms
- **Frontend Load Time**: <2s (First Contentful Paint)
- **Concurrent WebSocket Connections**: 1000+ (with 4GB RAM)

### **Load Testing**

```bash
# Install Apache Bench
apt install apache2-utils -y

# API load test
ab -n 1000 -c 50 https://calliotel.com/api/leaderboard/overall

# WebSocket stress test (use custom script)
# Test 100 concurrent Co-Op Stack rooms
```

---

## 🔥 **COMMANDER'S FINAL VALIDATION**

### **Critical Success Factors**

1. **WebSocket Stability**: 
   - Nginx must have `Upgrade` and `Connection` headers
   - Timeouts set to 7 days (long-lived connections)
   - Buffering disabled

2. **Database Persistence**:
   - MongoDB volume mounted (`mongodb_data`)
   - Regular backups scheduled

3. **SSL/TLS**:
   - HTTPS enforced
   - Auto-renewal active

4. **Monitoring**:
   - Real-time logs accessible
   - Health checks automated

---

## 🎯 **POST-DEPLOYMENT TASKS**

### **Week 1: Monitoring Phase**
- Monitor CPU/RAM usage
- Check error logs daily
- Verify WebSocket connection stability
- User feedback collection

### **Week 2: Optimization**
- Tune Nginx worker processes
- Optimize database indexes
- Add Redis caching (if needed)

### **Month 1: Scaling**
- Consider load balancer (if traffic spikes)
- Add monitoring dashboard (Grafana/Prometheus)
- Set up automated backups

---

## 💎 **STATUS: DEPLOYMENT PLAYBOOK COMPLETE**

**The Digital Colosseum is ready for the open battlefield!** 🏛️⚔️

All systems calibrated. All protocols documented. The empire awaits its home.

**AWAITING COMMANDER'S GO SIGNAL** 👑🔥
