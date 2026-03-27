# 📊 DAY 1 MONITORING GUIDE - THE EMPIRE'S EYES

## 👑 **COMMANDER'S MONITORING PROTOCOL**

After deploying to Digital Ocean, use these tools to monitor the Digital Colosseum in real-time.

---

## 🔥 **LIVE DASHBOARD**

### **Launch the Real-Time Monitor**

```bash
ssh root@your_droplet_ip
cd /var/www/calliotel

# Start live dashboard (10s refresh)
./live_dashboard.sh

# Or faster refresh (5s)
./live_dashboard.sh 5
```

### **What It Shows**

**1. System Health** 🩺
- Backend API status (✅ or ❌)
- Memory usage (MB)
- CPU usage (%)

**2. Empire Statistics** 📊
- Total warriors (registered users)
- Active today (logged in last 24h)
- Total duels fought
- Active duels (in progress)

**3. Hierarchy of Power** 👑
- Visual tier distribution bars
- Percentage breakdown
- User count per tier

**4. Alpha Throne** 🏆
- Top 5 warriors by XP
- Current level
- Tier indicators

**5. Recent Battles** ⚔️
- Last 5 duel victories
- XP gained
- Time ago

---

## 📈 **TIER MIGRATION TRACKER**

### **Generate Snapshots**

```bash
# Generate current snapshot
./tier_migration_tracker.sh

# View reports
ls -lh /var/log/calliotel/tier_reports/

# Read latest report
cat /var/log/calliotel/tier_reports/tier_migration_*.json | jq '.'
```

### **Automated Tracking with Cron**

```bash
# Track tier migration every hour
crontab -e

# Add this line:
0 * * * * /var/www/calliotel/tier_migration_tracker.sh >> /var/log/calliotel/tier_tracker.log 2>&1
```

### **What It Tracks**

- Current tier distribution
- Top 10 warriors (highest XP)
- Newest warriors (most recent)
- Tier changes since last snapshot
- Growth rates per tier

---

## 🚨 **KEY METRICS TO WATCH**

### **Day 1 Success Indicators**

**User Engagement**:
- [ ] >50% of registered users active today
- [ ] Average session >10 minutes
- [ ] >5 duels per active user

**Tier Progression**:
- [ ] >30% of users move from Bronze to Silver in first week
- [ ] At least 1 user reaches Gold tier
- [ ] Divine tier achievable within 2 weeks

**System Health**:
- [ ] Backend API uptime >99%
- [ ] Average API response <100ms
- [ ] Zero 502/504 errors
- [ ] WebSocket connections stable

**Social Layer**:
- [ ] Global Square has active conversations
- [ ] >10 messages per hour during peak
- [ ] Co-Op Stack rooms created

---

## 📊 **DASHBOARD INTERPRETATION**

### **Tier Distribution Patterns**

**Healthy Empire**:
```
👑 Architect  [█]                                 1% (1-2 users)
🟣 Divine     [████]                              5% (top players)
🔵 Platinum   [████████]                         10% (engaged)
🟡 Gold       [████████████████]                 20% (active)
⚪ Silver     [████████████████████████]         30% (grinding)
🟤 Bronze     [████████████████████████████████] 34% (new)
```

**Unhealthy Empire** (needs intervention):
```
👑 Architect  []                                  0% (no admins)
🟣 Divine     []                                  0% (unreachable)
🔵 Platinum   [█]                                 1% (too hard)
🟡 Gold       [██]                                2% (grind wall)
⚪ Silver     [████]                              5% (slow climb)
🟤 Bronze     [██████████████████████████████]  92% (trapped)
```

**If you see the unhealthy pattern**: Adjust XP rewards, lower tier thresholds, or add XP boost events.

---

## 🔔 **ALERTING SETUP**

### **Critical Alerts (Immediate Response)**

```bash
# Create alert script
cat > /var/www/calliotel/alert_monitor.sh << 'EOF'
#!/bin/bash

API_URL="http://localhost:8080"
ALERT_EMAIL="admin@calliotel.com"

# Check backend health
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/health)

if [ "$STATUS" != "200" ]; then
    echo "🚨 ALERT: Backend health check failed (HTTP $STATUS)" | \
    mail -s "URGENT: Calliotel Backend Down" $ALERT_EMAIL
fi

# Check container status
if ! docker ps | grep -q "calliotel_backend.*Up"; then
    echo "🚨 ALERT: Backend container is down!" | \
    mail -s "URGENT: Calliotel Container Crashed" $ALERT_EMAIL
fi

# Check MongoDB
if ! docker exec calliotel_mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "🚨 ALERT: MongoDB is unreachable!" | \
    mail -s "URGENT: Calliotel Database Down" $ALERT_EMAIL
fi
EOF

chmod +x /var/www/calliotel/alert_monitor.sh

# Run every 5 minutes
crontab -e
# Add:
*/5 * * * * /var/www/calliotel/alert_monitor.sh
```

### **Growth Alerts (Monitor Tier Movement)**

```bash
# Alert when first user reaches Divine tier
# Add to tier_migration_tracker.sh output parsing
```

---

## 📱 **REMOTE MONITORING**

### **Access Dashboard from Anywhere**

**Option 1: SSH + Terminal**
```bash
# From your local machine
ssh root@your_droplet_ip "./var/www/calliotel/live_dashboard.sh"
```

**Option 2: tmux Session** (persistent)
```bash
# On droplet
tmux new -s dashboard
./live_dashboard.sh

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t dashboard
```

**Option 3: Web Dashboard** (optional - requires setup)
```bash
# Install simple HTTP dashboard
# Serves tier reports as JSON endpoints
```

---

## 🎯 **DAY 1 MILESTONES**

### **Hour 1: Launch Validation**
- [ ] Backend health check passes
- [ ] First user registers successfully
- [ ] First duel completed
- [ ] Global Square receives first message

### **Hour 6: Early Engagement**
- [ ] 10+ registered users
- [ ] 5+ active duels
- [ ] At least 1 user in Silver tier
- [ ] Global Square has active conversations

### **Hour 24: Momentum Check**
- [ ] 50+ registered users
- [ ] 100+ total duels
- [ ] 20+ active users (logged in today)
- [ ] First Gold tier user
- [ ] Co-Op Stack room created

### **Day 7: Empire Established**
- [ ] 200+ registered users
- [ ] First Divine tier user
- [ ] Active Global Square community
- [ ] Regular Co-Op Stack sessions
- [ ] Void Broadcasts triggering (Architect victories)

---

## 🔥 **METRICS EXPORT**

### **Daily Reports**

```bash
# Generate comprehensive daily report
./tier_migration_tracker.sh > /var/log/calliotel/daily_$(date +%Y%m%d).json

# Email daily summary
cat /var/log/calliotel/daily_$(date +%Y%m%d).json | \
  mail -s "Calliotel Daily Report" admin@calliotel.com
```

### **Weekly Analytics**

```bash
# Compare week-over-week growth
# Use tier_migration reports for trend analysis
```

---

## 💎 **COMMANDER'S DASHBOARD SUMMARY**

**Real-Time Tools**:
- ✅ `live_dashboard.sh` - Live system monitor (10s refresh)
- ✅ `tier_migration_tracker.sh` - Tier distribution snapshots
- ✅ `alert_monitor.sh` - Critical system alerts

**Key Metrics**:
- System health (API, containers, database)
- User engagement (active, duels, sessions)
- Tier distribution (hierarchy balance)
- Recent activity (battle feed)
- Top players (alpha throne)

**Success Indicators**:
- Healthy tier pyramid (Bronze → Divine)
- Active battles (5+ duels per hour)
- Growing Divine tier (top 5%)
- Stable system (>99% uptime)

---

## 🏛️ **THE EMPIRE'S PULSE IS NOW VISIBLE**

Run `./live_dashboard.sh` on Day 1 and watch your Digital Colosseum come alive! 👑🔥
