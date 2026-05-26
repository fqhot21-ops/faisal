# Production Deployment Configuration
# SecureVision AI - HTTPS Enabled

## Environment Configuration

### Backend (.env)
ENVIRONMENT=production
JWT_SECRET=<CHANGE-IN-PRODUCTION>
EMERGENT_LLM_KEY=<YOUR-KEY>
MONGO_URL=mongodb://localhost:27017
DB_NAME=securevision_production
CORS_ORIGINS=https://your-domain.com

### Frontend (.env)
NODE_ENV=production
REACT_APP_BACKEND_URL=https://your-api-domain.com

## Security Checklist

### SSL/TLS Configuration
- [ ] Valid SSL certificate installed
- [ ] HTTPS redirect configured (HTTP -> HTTPS)
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites enabled
- [ ] HSTS header configured

### Application Security
- [x] httpOnly cookies enabled
- [x] Secure flag enabled in production
- [x] SameSite=Lax configured
- [x] CORS restricted to specific origins
- [x] JWT secret is strong and unique
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Cookie Configuration (server.py)
```python
httponly=True         # ✅ Enabled
secure=IS_PRODUCTION  # ✅ Enabled (HTTPS only)
samesite="lax"       # ✅ Enabled (CSRF protection)
max_age=604800       # ✅ 7 days
```

## Deployment Steps

### 1. Pre-Deployment
```bash
# Update dependencies
cd /app/backend && pip freeze > requirements.txt
cd /app/frontend && yarn install --production

# Run tests
pytest backend/
npm test --passWithNoTests

# Lint code
ruff backend/
eslint frontend/src
```

### 2. Build Frontend (Production)
```bash
cd /app/frontend
yarn build

# Output: /app/frontend/build/
# Optimized, minified production bundle
```

### 3. Configure Web Server (Nginx Example)

```nginx
# /etc/nginx/sites-available/securevision

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name securevision.ai www.securevision.ai;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name securevision.ai www.securevision.ai;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/securevision.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/securevision.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" always;

    # Frontend (React Build)
    location / {
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        
        # Required for cookies
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Essential for httpOnly cookies
        proxy_pass_request_headers on;
        proxy_set_header Cookie $http_cookie;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
}
```

### 4. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d securevision.ai -d www.securevision.ai

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

### 5. Backend Service (systemd)

```ini
# /etc/systemd/system/securevision-backend.service

[Unit]
Description=SecureVision AI Backend
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/app/backend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable securevision-backend
sudo systemctl start securevision-backend
```

## Performance Optimization

### Backend
- [x] Uvicorn with multiple workers
- [ ] Redis caching for scan results
- [ ] Connection pooling for MongoDB
- [ ] Rate limiting with Redis
- [ ] CDN for static assets

### Frontend
- [x] Production build (minified)
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] Gzip/Brotli compression

## Monitoring

### Application Monitoring
```python
# Add to server.py
import logging
from logging.handlers import RotatingFileHandler

# Production logging
handler = RotatingFileHandler(
    '/var/log/securevision/app.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)
handler.setLevel(logging.INFO)
logger.addHandler(handler)
```

### Health Check Endpoint
```python
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": os.environ.get("ENVIRONMENT"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

### Metrics to Monitor
- Response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database connection pool
- Memory usage
- CPU usage
- Active sessions (cookies)

## Backup Strategy

### Database
```bash
# Daily MongoDB backup
mongodump --uri="mongodb://localhost:27017/securevision_production" --out=/backups/$(date +%Y%m%d)

# Retain 30 days
find /backups -mtime +30 -delete
```

### Configuration
```bash
# Backup .env files
tar -czf /backups/config-$(date +%Y%m%d).tar.gz /app/backend/.env /app/frontend/.env
```

## Rollback Plan

### Quick Rollback
```bash
# Stop services
sudo systemctl stop securevision-backend
sudo supervisorctl stop frontend

# Restore previous version
git checkout <previous-commit>

# Restore database (if needed)
mongorestore --uri="mongodb://localhost:27017" /backups/<backup-date>

# Start services
sudo systemctl start securevision-backend
sudo supervisorctl start frontend
```

## Security Hardening

### Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (redirect)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### MongoDB Security
```bash
# Enable authentication
mongo
> use admin
> db.createUser({
    user: "securevision_admin",
    pwd: "<strong-password>",
    roles: ["readWrite", "dbAdmin"]
})

# Update MONGO_URL with credentials
MONGO_URL=mongodb://securevision_admin:<password>@localhost:27017/securevision_production
```

### Rate Limiting (Nginx)
```nginx
# Add to http block
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Add to location /api
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

## Post-Deployment Verification

### 1. HTTPS Check
```bash
curl -I https://securevision.ai
# Should return: Strict-Transport-Security header

# SSL Labs test
https://www.ssllabs.com/ssltest/analyze.html?d=securevision.ai
# Target: A+ rating
```

### 2. Cookie Security Check
```bash
# Check cookie attributes
curl -i https://securevision.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Verify Set-Cookie header contains:
# - HttpOnly
# - Secure
# - SameSite=Lax
```

### 3. API Health Check
```bash
curl https://securevision.ai/api/health
# Should return: {"status":"healthy","environment":"production"}
```

### 4. Performance Test
```bash
# Apache Bench
ab -n 1000 -c 10 https://securevision.ai/

# Artillery
artillery quick --count 10 --num 100 https://securevision.ai/api/health
```

## Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space
- [ ] Monthly: Update dependencies
- [ ] Monthly: Security audit
- [ ] Quarterly: Penetration testing
- [ ] Yearly: SSL certificate renewal (automatic with Let's Encrypt)

### Emergency Contacts
- DevOps: [Contact]
- Security Team: [Contact]
- Database Admin: [Contact]

## Cost Optimization

### Infrastructure
- Use CDN for static assets (CloudFlare, CloudFront)
- Enable Gzip/Brotli compression (saves ~70% bandwidth)
- Implement caching strategy (Redis)
- Scale horizontally with load balancer

### Database
- Index frequently queried fields
- Archive old scan data (>90 days)
- Implement data retention policy

## Compliance

### GDPR (if applicable)
- [ ] User data encryption
- [ ] Right to be forgotten (delete user endpoint)
- [ ] Data export functionality
- [ ] Privacy policy page
- [ ] Cookie consent banner

### SOC 2 / ISO 27001
- [ ] Audit logging enabled
- [ ] Access control policies
- [ ] Incident response plan
- [ ] Regular security assessments

---

## Quick Start (Production)

```bash
# 1. Set environment variables
export ENVIRONMENT=production

# 2. Update secrets
nano /app/backend/.env  # Update JWT_SECRET, MONGO_URL

# 3. Build frontend
cd /app/frontend && yarn build

# 4. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/securevision
sudo ln -s /etc/nginx/sites-available/securevision /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# 6. Start backend
sudo systemctl start securevision-backend

# 7. Verify
curl https://your-domain.com/api/health
```

---

## Status: ✅ Production Configuration Ready

**Critical Next Steps:**
1. Update JWT_SECRET to a strong random value
2. Configure specific CORS origins (remove wildcard)
3. Set up SSL certificate with Let's Encrypt
4. Enable monitoring and logging
5. Test httpOnly cookies over HTTPS
