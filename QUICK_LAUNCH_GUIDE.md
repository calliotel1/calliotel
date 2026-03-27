# 🚀 DIGITAL COLOSSEUM - QUICK START GUIDE

**Welcome, Commander!** This is your express path to launching the Digital Colosseum on Digital Ocean.

---

## ⚡ FASTEST PATH TO LAUNCH (30 Minutes)

### Prerequisites
- [ ] Digital Ocean account ([Sign up](https://www.digitalocean.com/))
- [ ] Domain name purchased and DNS accessible
- [ ] SSH client installed on your machine
- [ ] All files from `/app` folder downloaded

---

## 🎯 STEP-BY-STEP LAUNCH SEQUENCE

### 1️⃣ **CREATE DIGITAL OCEAN DROPLET** (5 minutes)

1. Log into Digital Ocean
2. Click **"Create"** → **"Droplets"**
3. Select configuration:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU**: 2 vCPUs / 4GB RAM / 80GB SSD ($24/month)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `calliotel-production`

4. Click **"Create Droplet"**
5. **Note your droplet IP address** (e.g., `142.93.45.123`)

---

### 2️⃣ **CONFIGURE DNS** (5 minutes)

Point your domain to the droplet:

**At your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_DROPLET_IP` | 300 |
| A | www | `YOUR_DROPLET_IP` | 300 |

**Wait 5-10 minutes for DNS propagation.**

Verify: `ping calliotel.com` should return your droplet IP.

---

### 3️⃣ **PREPARE APPLICATION FILES** (5 minutes)

On your **local machine**:

```bash
# Navigate to the downloaded calliotel folder
cd /path/to/calliotel

# Edit backend environment variables
nano backend/.env
```

**Update these critical values:**
```env
MONGO_URL=mongodb://mongodb:27017/
DB_NAME=calliotel_production
JWT_SECRET=<run: openssl rand -hex 32>
JWT_REFRESH_SECRET=<run: openssl rand -hex 32>
ENVIRONMENT=production
DEBUG=false

# Add your API keys (if you have them)
STRIPE_SECRET_KEY=sk_live_...
TELNYX_API_KEY=...
SENDGRID_API_KEY=...
```

```bash
# Edit frontend environment variables
nano frontend/.env
```

**Update your domain:**
```env
REACT_APP_BACKEND_URL=https://calliotel.com
REACT_APP_WS_URL=https://calliotel.com
```

```bash
# Run pre-deployment checklist
./pre_deployment_checklist.sh
```

**Verify all checks pass** before proceeding.

---

### 4️⃣ **UPLOAD TO DROPLET** (3 minutes)

```bash
# From your local machine, upload the entire folder
scp -r /path/to/calliotel root@YOUR_DROPLET_IP:/var/www/

# This may take 2-3 minutes depending on your connection
```

---

### 5️⃣ **HARDEN SECURITY** (2 minutes)

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Navigate to app directory
cd /var/www/calliotel

# Run fortification script
./fortify_droplet.sh
```

**This configures:**
- ✅ UFW Firewall (only ports 22, 80, 443 open)
- ✅ Fail2Ban (auto-bans attackers)
- ✅ Automatic security updates

---

### 6️⃣ **DEPLOY APPLICATION** (5 minutes)

```bash
# Still on your droplet
./deploy_to_digitalocean.sh
```

**Follow the prompts:**
- Enter your Git repository URL (if using Git) or skip
- The script will:
  - Install Docker and Docker Compose
  - Build and start all containers
  - Configure Nginx reverse proxy

**Verify deployment:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show **"Up"**.

---

### 7️⃣ **SETUP SSL CERTIFICATE** (3 minutes)

```bash
# Run SSL setup script
./setup_ssl.sh
```

**Enter when prompted:**
- Domain name: `calliotel.com`
- Email: `your-email@example.com`

**This will:**
- ✅ Obtain Let's Encrypt certificate
- ✅ Configure auto-renewal (certificates renew automatically)
- ✅ Achieve A+ SSL rating

**Test your SSL:** Visit `https://www.ssllabs.com/ssltest/analyze.html?d=calliotel.com`

---

### 8️⃣ **CLEAN DATABASE** (2 minutes)

```bash
# Install Python MongoDB client
apt install python3-pip -y
pip3 install pymongo

# Run database cleanup (removes test data)
python3 db_cleanup_production.py
```

**When prompted:**
- Type `DELETE` to confirm
- Edit the script first to preserve your admin email addresses

---

### 9️⃣ **VERIFY DEPLOYMENT** (3 minutes)

```bash
# Check database health
./db_health_check.sh

# Start monitoring dashboard (Ctrl+C to exit)
./production_monitoring_dashboard.sh
```

**Test your application:**
1. Visit `https://calliotel.com` in your browser
2. Create a test account
3. Test login
4. Send a message in Global Square
5. Challenge someone to a duel

---

### 🔟 **STRESS TEST** (Optional - 2 minutes)

```bash
# Test WebSocket connections under load
./websocket_stress_test.sh
```

This simulates 10 concurrent users connecting to the Global Square.

---

## ✅ POST-LAUNCH CHECKLIST

After deployment, verify:

- [ ] Website loads at `https://calliotel.com`
- [ ] SSL certificate shows (green padlock in browser)
- [ ] User registration works
- [ ] Login authentication works
- [ ] Global Square chat messages send/receive
- [ ] Duels can be challenged and played
- [ ] Speed Dialer game works
- [ ] Phish Finder game works
- [ ] Co-Op Stack game works
- [ ] Profile settings save correctly
- [ ] Avatar uploads work
- [ ] Tier system displays correctly
- [ ] Hall of Legends shows rankings

---

## 🎯 MONITORING YOUR EMPIRE

### Real-Time Dashboard
```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/calliotel
./production_monitoring_dashboard.sh
```

### View Logs
```bash
# Backend logs
docker logs backend -f

# Frontend logs
docker logs frontend -f

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Check Security
```bash
# Firewall status
ufw status

# Fail2Ban status
fail2ban-client status

# Banned IPs
fail2ban-client status sshd
fail2ban-client status nginx-http-auth
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

### Update Application
```bash
cd /var/www/calliotel
git pull origin main  # If using Git
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup
docker exec mongodb mongodump --db calliotel_production --out /backup

# Copy to host machine
docker cp mongodb:/backup ./mongodb_backup_$(date +%Y%m%d)

# Download to local machine
scp -r root@YOUR_DROPLET_IP:/var/www/calliotel/mongodb_backup_* ./
```

---

## 🆘 TROUBLESHOOTING

### Website Not Loading
```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Check Nginx status
systemctl status nginx

# Check backend logs for errors
docker logs backend --tail 100
```

### SSL Certificate Issues
```bash
# Verify certificate
certbot certificates

# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
systemctl reload nginx
```

### WebSocket Connection Failures
```bash
# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://calliotel.com/ws/global-square

# Check firewall
ufw status

# Verify Nginx WebSocket config
cat /etc/nginx/sites-available/calliotel.conf | grep -A 10 "location /ws/"
```

### High CPU/Memory Usage
```bash
# Check resource usage
docker stats

# System resources
htop  # Install: apt install htop

# Consider upgrading droplet to 8GB RAM
```

---

## 📞 SUPPORT RESOURCES

- **Infrastructure Guide**: `INFRASTRUCTURE_HARDENING_INDEX.md`
- **Full Deployment Guide**: `DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md`
- **Operations Manual**: `OPERATIONS_MASTER_INDEX.md`

---

## 🎉 SUCCESS!

**Your Digital Colosseum is now live and battle-ready!** 🔥

**Share your empire:**
- 🌐 Website: `https://calliotel.com`
- 👥 Invite warriors to join
- 🏆 Watch the Hall of Legends fill with champions
- 💬 Monitor the Global Square for activity

**The gates are open. Let the battles begin!** ⚔️👑

---

## 🚀 NEXT STEPS (Future Expansion)

After your empire is stable:
1. **Referee Bot** - Automated duel management
2. **Spectate Mode** - Watch live battles
3. **Tournament System** - Organized competitions
4. **Core Business Integrations** - Telnyx, Stripe, Clickatell

---

**DEPLOYMENT TIME: ~30 minutes**  
**COST: $24/month (4GB droplet) + Domain ($10-15/year)**  
**CAPACITY: 500-1,000 concurrent warriors**

🔥 **THE DIGITAL COLOSSEUM AWAITS ITS COMMANDER** 🔥
