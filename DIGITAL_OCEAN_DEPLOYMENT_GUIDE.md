# 🚀 DIGITAL COLOSSEUM - DIGITAL OCEAN DEPLOYMENT GUIDE

## 🎯 QUICK START (3-Step Launch)

### Prerequisites
- Digital Ocean account with a Droplet (Ubuntu 22.04 LTS recommended)
- Domain name with DNS pointing to your droplet IP
- SSH access to your droplet

---

## 🛠️ STEP 1: INITIAL DROPLET SETUP

### 1.1 Create a Digital Ocean Droplet
```bash
# Recommended Specs (Starter)
Plan: Basic Droplet
CPU: 2 vCPUs
RAM: 4 GB
Storage: 80 GB SSD
OS: Ubuntu 22.04 LTS
Datacenter: Choose closest to your users
```

### 1.2 Connect via SSH
```bash
ssh root@YOUR_DROPLET_IP
```

### 1.3 Update System
```bash
apt update && apt upgrade -y
```

### 1.4 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

---

## 🛡️ STEP 2: SECURITY HARDENING

### 2.1 Upload Your Application Files
```bash
# From your local machine (where you downloaded the Calliotel code)
scp -r /path/to/calliotel root@YOUR_DROPLET_IP:/var/www/

# Or clone from Git
ssh root@YOUR_DROPLET_IP
cd /var/www
git clone YOUR_REPO_URL calliotel
cd calliotel
```

### 2.2 Run Fortification Script
```bash
cd /var/www/calliotel
chmod +x fortify_droplet.sh
./fortify_droplet.sh
```

**What this does:**
- ✅ Configures UFW firewall (only ports 22, 80, 443 open)
- ✅ Installs and configures Fail2Ban (auto-bans attackers)
- ✅ Enables automatic security updates

---

## 🚀 STEP 3: DEPLOY THE APPLICATION

### 3.1 Configure Environment Variables
```bash
cd /var/www/calliotel

# Edit backend environment
nano backend/.env
```

**Required variables:**
```env
MONGO_URL=mongodb://mongodb:27017/
DB_NAME=calliotel_production
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>
ENVIRONMENT=production

# Add your API keys
STRIPE_SECRET_KEY=sk_live_...
TELNYX_API_KEY=...
SENDGRID_API_KEY=...
```

**Generate secrets:**
```bash
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
```

### 3.2 Configure Frontend URL
```bash
nano frontend/.env
```

```env
REACT_APP_BACKEND_URL=https://calliotel.com
REACT_APP_WS_URL=https://calliotel.com
```

### 3.3 Deploy with Docker
```bash
chmod +x deploy_to_digitalocean.sh
./deploy_to_digitalocean.sh
```

**What this does:**
- ✅ Builds Docker containers
- ✅ Starts backend, frontend, and MongoDB
- ✅ Configures Nginx reverse proxy
- ✅ Sets up automatic restarts

### 3.4 Setup SSL Certificate
```bash
chmod +x setup_ssl.sh
./setup_ssl.sh
```

**Follow prompts to:**
- Enter your domain name (e.g., calliotel.com)
- Enter your email (for Let's Encrypt notifications)
- Auto-renewal is configured automatically

---

## 🧹 STEP 4: DATABASE PREPARATION

### 4.1 Clean Test Data
```bash
cd /var/www/calliotel

# Install Python MongoDB client
apt install python3-pip -y
pip3 install pymongo

# Run cleanup script
python3 db_cleanup_production.py
```

**This will:**
- ✅ Remove all test users (except admins you specify)
- ✅ Clear game history
- ✅ Clear chat messages
- ✅ Optimize database indexes

### 4.2 Verify Database Health
```bash
chmod +x db_health_check.sh
./db_health_check.sh
```

---

## 📊 STEP 5: MONITORING & VERIFICATION

### 5.1 Start Live Monitoring Dashboard
```bash
chmod +x production_monitoring_dashboard.sh
./production_monitoring_dashboard.sh
```

### 5.2 Check Container Status
```bash
cd /var/www/calliotel
docker-compose -f docker-compose.prod.yml ps
```

### 5.3 View Logs
```bash
# Backend logs
docker logs backend -f

# Frontend logs
docker logs frontend -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 5.4 Test WebSocket Connections
```bash
chmod +x websocket_stress_test.sh
./websocket_stress_test.sh
```

---

## 🔧 COMMON OPERATIONS

### Restart Services
```bash
# Restart all containers
cd /var/www/calliotel
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Restart Nginx
systemctl restart nginx
```

### Update Application Code
```bash
cd /var/www/calliotel
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup
docker exec mongodb mongodump --db calliotel_production --out /backup

# Copy to host
docker cp mongodb:/backup ./mongodb_backup_$(date +%Y%m%d)

# Compress
tar -czf mongodb_backup_$(date +%Y%m%d).tar.gz mongodb_backup_$(date +%Y%m%d)
```

### Restore Database
```bash
# Upload backup to droplet
scp mongodb_backup.tar.gz root@YOUR_DROPLET_IP:/tmp/

# Extract and restore
tar -xzf /tmp/mongodb_backup.tar.gz
docker exec -i mongodb mongorestore --db calliotel_production /path/to/backup
```

---

## 🔥 TROUBLESHOOTING

### Backend Not Starting
```bash
# Check logs
docker logs backend --tail 100

# Common fixes
1. Verify .env file exists in backend/
2. Check MongoDB connection: docker exec -it mongodb mongo
3. Restart container: docker-compose restart backend
```

### WebSocket Connection Failures
```bash
# Verify Nginx WebSocket config
nginx -t
cat /etc/nginx/sites-available/calliotel.conf | grep -A 10 "location /ws/"

# Check firewall
ufw status

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://calliotel.com/ws/global-square
```

### SSL Certificate Issues
```bash
# Test certificate
openssl s_client -connect calliotel.com:443 -servername calliotel.com

# Renew certificate manually
certbot renew --force-renewal
systemctl reload nginx
```

### High CPU/Memory Usage
```bash
# Check container resources
docker stats

# Check system resources
htop

# Restart containers with limits
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 PERFORMANCE OPTIMIZATION

### 1. Enable MongoDB Replication (for high availability)
```bash
# Add to docker-compose.prod.yml
mongodb:
  command: mongod --replSet rs0
```

### 2. Configure Nginx Caching
```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /api/static/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://backend;
}
```

### 3. Database Connection Pooling
```python
# In backend/server.py
from pymongo import MongoClient

client = MongoClient(
    mongo_url,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=30000
)
```

---

## 📞 SUPPORT RESOURCES

- **Digital Ocean Docs**: https://docs.digitalocean.com/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Docker Compose**: https://docs.docker.com/compose/
- **Nginx**: https://nginx.org/en/docs/

---

## 🎯 SUCCESS CHECKLIST

- [ ] Droplet created and accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] UFW firewall configured (ports 22, 80, 443 open)
- [ ] Fail2Ban installed and running
- [ ] Application code deployed to /var/www/calliotel
- [ ] Environment variables configured (.env files)
- [ ] Docker containers running (backend, frontend, mongodb)
- [ ] SSL certificate obtained and auto-renewal configured
- [ ] Database cleaned and optimized
- [ ] Nginx reverse proxy configured
- [ ] WebSocket connections tested
- [ ] Monitoring dashboard accessible
- [ ] Domain resolves to https://calliotel.com
- [ ] First admin account created and tested

---

**🔥 YOUR DIGITAL COLOSSEUM IS NOW LIVE! 🔥**
