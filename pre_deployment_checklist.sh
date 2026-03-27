#!/bin/bash
# 🎯 PRE-DEPLOYMENT VERIFICATION CHECKLIST
# Run this before deploying to Digital Ocean to ensure everything is ready

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎯 DIGITAL COLOSSEUM - PRE-DEPLOYMENT CHECKLIST${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Check 1: Required files exist
echo -e "${BLUE}[1/10] Checking deployment scripts...${NC}"
REQUIRED_FILES=(
    "fortify_droplet.sh"
    "setup_ssl.sh"
    "deploy_to_digitalocean.sh"
    "nginx_production_hardened.conf"
    "db_cleanup_production.py"
    "db_health_check.sh"
    "production_monitoring_dashboard.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "  ${GREEN}✅ $file${NC}"
        ((PASSED++))
    else
        echo -e "  ${RED}❌ $file missing${NC}"
        ((FAILED++))
    fi
done
echo ""

# Check 2: Backend environment variables
echo -e "${BLUE}[2/10] Checking backend/.env configuration...${NC}"
if [[ -f "backend/.env" ]]; then
    echo -e "  ${GREEN}✅ backend/.env exists${NC}"
    
    # Check critical variables
    if grep -q "MONGO_URL=" backend/.env && grep -q "JWT_SECRET=" backend/.env; then
        echo -e "  ${GREEN}✅ Critical variables present${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Missing critical variables (MONGO_URL, JWT_SECRET)${NC}"
        ((WARNINGS++))
    fi
    
    # Check for placeholder values
    if grep -q "your-secret-here" backend/.env || grep -q "changeme" backend/.env; then
        echo -e "  ${RED}❌ Placeholder values detected - update before deploying${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${RED}❌ backend/.env not found${NC}"
    ((FAILED++))
fi
echo ""

# Check 3: Frontend environment variables
echo -e "${BLUE}[3/10] Checking frontend/.env configuration...${NC}"
if [[ -f "frontend/.env" ]]; then
    echo -e "  ${GREEN}✅ frontend/.env exists${NC}"
    
    if grep -q "REACT_APP_BACKEND_URL=" frontend/.env; then
        BACKEND_URL=$(grep "REACT_APP_BACKEND_URL=" frontend/.env | cut -d '=' -f2)
        if [[ "$BACKEND_URL" == "https://"* ]]; then
            echo -e "  ${GREEN}✅ Backend URL configured with HTTPS: $BACKEND_URL${NC}"
            ((PASSED++))
        else
            echo -e "  ${YELLOW}⚠️  Backend URL should use HTTPS for production${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "  ${RED}❌ REACT_APP_BACKEND_URL not set${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${RED}❌ frontend/.env not found${NC}"
    ((FAILED++))
fi
echo ""

# Check 4: Docker Compose files
echo -e "${BLUE}[4/10] Checking Docker configuration...${NC}"
if [[ -f "docker-compose.prod.yml" ]]; then
    echo -e "  ${GREEN}✅ docker-compose.prod.yml exists${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ docker-compose.prod.yml missing${NC}"
    ((FAILED++))
fi
echo ""

# Check 5: Nginx configuration
echo -e "${BLUE}[5/10] Validating Nginx configuration...${NC}"
if [[ -f "nginx_production_hardened.conf" ]]; then
    # Check for WebSocket configuration
    if grep -q "Upgrade" nginx_production_hardened.conf && grep -q "location /ws/" nginx_production_hardened.conf; then
        echo -e "  ${GREEN}✅ WebSocket proxy configuration present${NC}"
        ((PASSED++))
    else
        echo -e "  ${RED}❌ WebSocket configuration missing${NC}"
        ((FAILED++))
    fi
    
    # Check for rate limiting
    if grep -q "limit_req_zone" nginx_production_hardened.conf; then
        echo -e "  ${GREEN}✅ Rate limiting configured${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Rate limiting not configured${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "  ${RED}❌ nginx_production_hardened.conf missing${NC}"
    ((FAILED++))
fi
echo ""

# Check 6: Database cleanup script
echo -e "${BLUE}[6/10] Checking database management scripts...${NC}"
if [[ -f "db_cleanup_production.py" ]]; then
    echo -e "  ${GREEN}✅ Database cleanup script available${NC}"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠️  db_cleanup_production.py missing${NC}"
    ((WARNINGS++))
fi
echo ""

# Check 7: SSL setup script
echo -e "${BLUE}[7/10] Checking SSL certificate setup...${NC}"
if [[ -f "setup_ssl.sh" ]] && [[ -x "setup_ssl.sh" ]]; then
    echo -e "  ${GREEN}✅ SSL setup script ready${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ SSL setup script missing or not executable${NC}"
    ((FAILED++))
fi
echo ""

# Check 8: Security hardening script
echo -e "${BLUE}[8/10] Checking security hardening setup...${NC}"
if [[ -f "fortify_droplet.sh" ]] && [[ -x "fortify_droplet.sh" ]]; then
    echo -e "  ${GREEN}✅ Fortification script ready${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ Fortification script missing or not executable${NC}"
    ((FAILED++))
fi
echo ""

# Check 9: Monitoring tools
echo -e "${BLUE}[9/10] Checking monitoring tools...${NC}"
if [[ -f "production_monitoring_dashboard.sh" ]] && [[ -x "production_monitoring_dashboard.sh" ]]; then
    echo -e "  ${GREEN}✅ Monitoring dashboard available${NC}"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠️  Monitoring dashboard missing${NC}"
    ((WARNINGS++))
fi
echo ""

# Check 10: Documentation
echo -e "${BLUE}[10/10] Checking deployment documentation...${NC}"
if [[ -f "DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md" ]] && [[ -f "INFRASTRUCTURE_HARDENING_INDEX.md" ]]; then
    echo -e "  ${GREEN}✅ Complete documentation available${NC}"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠️  Some documentation files missing${NC}"
    ((WARNINGS++))
fi
echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Passed:   $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed:   $FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎯 ALL CRITICAL CHECKS PASSED!${NC}"
    echo ""
    echo -e "${BLUE}You are ready to deploy. Next steps:${NC}"
    echo -e "  1. Upload this folder to your Digital Ocean droplet"
    echo -e "  2. SSH into your droplet: ${YELLOW}ssh root@YOUR_DROPLET_IP${NC}"
    echo -e "  3. Run: ${YELLOW}./fortify_droplet.sh${NC}"
    echo -e "  4. Run: ${YELLOW}./deploy_to_digitalocean.sh${NC}"
    echo -e "  5. Run: ${YELLOW}./setup_ssl.sh${NC}"
    echo ""
    echo -e "${GREEN}🔥 THE DIGITAL COLOSSEUM IS READY FOR LAUNCH! 🔥${NC}"
else
    echo -e "${RED}⚠️  CRITICAL ISSUES DETECTED${NC}"
    echo -e "${RED}Fix the failed checks before deploying to production${NC}"
    echo ""
    echo -e "${YELLOW}Common fixes:${NC}"
    echo -e "  - Missing backend/.env: Copy from backend/.env.example and update values"
    echo -e "  - Missing frontend/.env: Create with REACT_APP_BACKEND_URL=https://yourdomain.com"
    echo -e "  - Scripts not executable: Run ${YELLOW}chmod +x *.sh${NC}"
fi
echo ""
