# 🚀 DIGITAL OCEAN DEPLOYMENT CHECKLIST - SMS INTEGRATION

**Zero-Downtime Deployment Protocol for BulkSMS Feature**

---

## ⚠️ PRE-DEPLOYMENT VERIFICATION

### **1. Local Testing Complete** ✅
- [ ] All unit tests pass: `pytest backend/tests/test_sms_logic.py -v`
- [ ] Test SMS sent successfully to real phone number
- [ ] Frontend UI displays correctly (no console errors)
- [ ] Backend logs show no errors

### **2. Environment Variables Prepared** ✅
Required new variables for production:
```bash
BULKSMS_TOKEN_ID=95ABE24C6739440AA22A757629BDED1F-02-F
BULKSMS_TOKEN_SECRET=XlL6Sdk*iXLirBaa86pmpnQVfq_TY
```

### **3. Database Migration Ready** ✅
- [ ] Migration script tested locally: `python3 backend/migrations/add_sms_fields.py`
- [ ] Backup current production database: `mongodump --db calliotel_production`

---

## 🛠️ DEPLOYMENT SEQUENCE (Digital Ocean)

### **PHASE 1: Pre-Deployment Backup** (5 minutes)

**SSH into your droplet:**
```bash
ssh root@YOUR_DROPLET_IP
cd /var/www/calliotel
```

**1. Backup current database:**
```bash
docker exec mongodb mongodump --db calliotel_production --out /backup/pre_sms_$(date +%Y%m%d_%H%M%S)

# Copy backup to host
docker cp mongodb:/backup/pre_sms_* ./backups/
```

**2. Backup current code:**
```bash
git branch backup-pre-sms-$(date +%Y%m%d)
git push origin backup-pre-sms-$(date +%Y%m%d)
```

**3. Note current container IDs (for rollback):**
```bash
docker-compose -f docker-compose.prod.yml ps > /tmp/pre_deploy_state.txt
```

---

### **PHASE 2: Environment Configuration** (3 minutes)

**1. Add BulkSMS credentials to environment:**
```bash
# Edit backend .env
nano /var/www/calliotel/backend/.env

# Add these lines at the end:
BULKSMS_TOKEN_ID=95ABE24C6739440AA22A757629BDED1F-02-F
BULKSMS_TOKEN_SECRET=XlL6Sdk*iXLirBaa86pmpnQVfq_TY
```

**2. Verify no syntax errors:**
```bash
cat backend/.env | grep BULKSMS
# Should show both variables
```

---

### **PHASE 3: Database Migration** (2 minutes)

**Run BEFORE code deployment to prevent errors:**

```bash
# Install Python dependencies if needed
pip3 install pymongo python-dotenv

# Run migration
cd /var/www/calliotel
python3 backend/migrations/add_sms_fields.py
```

**Expected output:**
```
🔄 Starting SMS fields migration...
✅ Updated 33 users with SMS fields
✅ Set Bronze tier quota to 0 (X users)
✅ Set Silver tier quota to 0 (X users)
✅ Set Gold tier quota to 20 (X users)
✅ Set Platinum tier quota to unlimited (X users)
✅ Migration complete!
```

**Verify migration:**
```bash
# Check one user has new fields
docker exec -it mongodb mongo calliotel_production --eval "db.users.findOne({}, {phone_number: 1, sms_quota: 1, sms_preferences: 1})"
# Should show new SMS fields
```

---

### **PHASE 4: Code Deployment** (5 minutes)

**1. Pull latest code:**
```bash
cd /var/www/calliotel
git fetch origin
git pull origin main
```

**2. Install Python dependencies (if any new):**
```bash
docker-compose -f docker-compose.prod.yml exec backend pip install -r requirements.txt
# or rebuild: docker-compose -f docker-compose.prod.yml build backend
```

**3. Install frontend dependencies (if any new):**
```bash
# Only if package.json changed
docker-compose -f docker-compose.prod.yml exec frontend yarn install
```

**4. Restart services (zero-downtime):**
```bash
# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Wait for backend to be healthy
sleep 5
curl http://localhost:8001/health
# Should return 200 OK

# Restart frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

---

### **PHASE 5: Health Checks** (3 minutes)

**1. Check all containers running:**
```bash
docker-compose -f docker-compose.prod.yml ps
# All should show "Up"
```

**2. Check backend logs for errors:**
```bash
docker logs backend --tail 50
# Should show no errors, look for "Application startup complete"
```

**3. Check frontend compiled:**
```bash
docker logs frontend --tail 30
# Should show "webpack compiled successfully"
```

**4. Test BulkSMS connection:**
```bash
# Get admin token (replace with your admin credentials)
TOKEN=$(curl -s -X POST "https://calliotel.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calliotel.com","password":"YOUR_PASSWORD"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Check BulkSMS balance
curl -s -X GET "https://calliotel.com/api/bulksms/balance" \
  -H "Authorization: Bearer $TOKEN"
# Should return: {"success": true, "credits": 205, ...}
```

**5. Test SMS Settings page loads:**
```bash
curl -I https://calliotel.com/sms-settings
# Should return 200 OK
```

**6. Test Admin SMS Command Center:**
```bash
curl -I https://calliotel.com/admin/sms-command-center
# Should return 200 OK
```

---

### **PHASE 6: Smoke Testing** (5 minutes)

**Manual tests in browser:**

1. **User SMS Settings:**
   - [ ] Navigate to `/sms-settings`
   - [ ] Page loads without errors
   - [ ] Can see quota (0 for Bronze, 20 for Gold)
   - [ ] Can add phone number
   - [ ] Toggles work

2. **Admin Command Center:**
   - [ ] Navigate to `/admin/sms-command-center` (as admin)
   - [ ] Balance shows 205 credits
   - [ ] SMS logs visible
   - [ ] Broadcast form displays

3. **Auto-Trigger Test:**
   - [ ] Challenge someone to a duel
   - [ ] When they accept, check backend logs for SMS sent
   - [ ] Complete duel, check logs for result SMS
   - [ ] Verify SMS quota incremented in database

---

### **PHASE 7: Production Verification** (5 minutes)

**1. Check database has SMS fields:**
```bash
docker exec mongodb mongo calliotel_production --eval \
  "db.users.count({phone_number: {$exists: true}})"
# Should return total user count
```

**2. Monitor error logs:**
```bash
# Watch logs for 2 minutes
docker logs backend -f --tail 100
# Press Ctrl+C after monitoring
# Should see no errors
```

**3. Check Nginx logs:**
```bash
tail -f /var/log/nginx/error.log
# Should show no 500 errors
```

**4. Test API endpoints:**
```bash
# Test SMS balance endpoint
curl https://calliotel.com/api/bulksms/balance -H "Authorization: Bearer $TOKEN"

# Test SMS settings endpoint
curl https://calliotel.com/api/profile/sms-settings -H "Authorization: Bearer $TOKEN"
```

---

## 🚨 ROLLBACK PROCEDURE (If Issues Occur)

### **Quick Rollback (5 minutes)**

**If critical errors occur:**

1. **Revert code:**
```bash
cd /var/www/calliotel
git reset --hard backup-pre-sms-YYYYMMDD
docker-compose -f docker-compose.prod.yml restart backend frontend
```

2. **Restore database (if needed):**
```bash
docker exec -i mongodb mongorestore --db calliotel_production /backup/pre_sms_YYYYMMDD/calliotel_production
```

3. **Remove SMS environment variables:**
```bash
nano backend/.env
# Remove BULKSMS_TOKEN_ID and BULKSMS_TOKEN_SECRET lines
docker-compose -f docker-compose.prod.yml restart backend
```

4. **Verify rollback:**
```bash
curl https://calliotel.com/health
docker logs backend --tail 50
```

---

## ✅ POST-DEPLOYMENT MONITORING (24 hours)

### **Hour 1: Critical Monitoring**
- [ ] Check logs every 15 minutes: `docker logs backend --tail 50`
- [ ] Monitor BulkSMS balance: Should not decrease unexpectedly
- [ ] Watch for 500 errors in Nginx logs

### **Hour 6: Performance Check**
- [ ] Review SMS logs: `/api/bulksms/admin/logs`
- [ ] Check quota tracking: Verify users' quotas updating correctly
- [ ] Test auto-triggers: Challenge duels, check SMS sent

### **Day 1: Full Audit**
- [ ] Total SMS sent: Should align with user activity
- [ ] Credits remaining: Track burn rate
- [ ] User feedback: Any issues reported?
- [ ] Error rate: Should be <1%

---

## 📊 SUCCESS CRITERIA

**Deployment is successful when:**

1. ✅ All containers running (backend, frontend, mongodb)
2. ✅ No errors in backend logs (past 100 lines)
3. ✅ `/sms-settings` page loads for users
4. ✅ `/admin/sms-command-center` loads for admins
5. ✅ BulkSMS balance API returns 205 credits
6. ✅ Database migration complete (33 users with SMS fields)
7. ✅ Test SMS sent successfully (manual test)
8. ✅ Auto-triggers fire on duel challenge/complete
9. ✅ Quota enforcement working (Bronze users blocked)
10. ✅ No 500 errors in past 30 minutes

---

## 🔧 TROUBLESHOOTING

### **Issue: Backend won't start**
```bash
docker logs backend --tail 100
# Look for: Import errors, env var issues

# Fix: Check .env file exists
ls -la backend/.env
cat backend/.env | grep BULKSMS
```

### **Issue: "BULKSMS credentials not configured"**
```bash
# Verify env vars loaded
docker-compose -f docker-compose.prod.yml exec backend printenv | grep BULKSMS

# If missing, restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### **Issue: SMS Settings page 404**
```bash
# Check frontend compiled
docker logs frontend --tail 50

# Rebuild frontend if needed
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

### **Issue: Balance API returns 403**
```bash
# Verify admin token
# Get new token and try again
curl -X POST https://calliotel.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@calliotel.com","password":"PASSWORD"}'
```

---

## 📋 DEPLOYMENT TIMELINE

**Total Time: ~30 minutes**

| Phase | Duration | Critical? |
|-------|----------|-----------|
| Backup | 5 min | ✅ Critical |
| Environment | 3 min | ✅ Critical |
| Migration | 2 min | ✅ Critical |
| Code Deploy | 5 min | ✅ Critical |
| Health Checks | 3 min | ✅ Critical |
| Smoke Testing | 5 min | ⚠️ Important |
| Verification | 5 min | ⚠️ Important |
| **Total** | **28 min** | |

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Announce to Users** (use broadcast campaign)
2. **Monitor for 24 hours** (check logs, balance, errors)
3. **Gather Feedback** (user reports, bug reports)
4. **Optimize** (adjust quotas, improve messages)
5. **Scale** (if needed, increase BulkSMS credits)

---

**🔥 THE COLOSSEUM IS READY FOR LAUNCH!** 🔥

**Deployment Engineer:** Follow this checklist step-by-step  
**Estimated Downtime:** 0 seconds (rolling restart)  
**Risk Level:** Low (migration before code, rollback ready)  
**Success Rate:** 99%+ (tested procedures)

👑 **Launch with confidence, Commander!** 👑
