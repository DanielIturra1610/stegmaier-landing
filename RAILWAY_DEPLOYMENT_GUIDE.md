# 🚀 Railway Deployment Guide - Stegmaier LMS

## 📋 Pre-Deployment Checklist

### ✅ Required Files Created
- [x] `railway.json` - Railway deployment configuration
- [x] `backend/Dockerfile.prod` - Production-optimized Dockerfile
- [x] `.env.example` - Environment variables template
- [x] `RAILWAY_DEPLOYMENT_GUIDE.md` - This guide

## 🛠️ Railway Setup Instructions

### Step 1: Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### Step 2: Connect MongoDB Service
```bash
# Add MongoDB service to your Railway project
railway add --service mongodb

# This will automatically provide MONGODB_URL environment variable
```

### Step 3: Configure Environment Variables

**Copy these variables to your Railway project environment:**

```bash
# CRITICAL SECURITY SETTINGS
ENVIRONMENT=production
JWT_SECRET_KEY=your_super_secure_jwt_secret_key_minimum_32_characters_long
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# FRONTEND/CORS CONFIGURATION  
FRONTEND_URL=https://your-frontend.railway.app
ADMIN_URL=https://your-admin.railway.app

# RATE LIMITING (Works without Redis)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# MEDIA/FILE UPLOAD SETTINGS
MEDIA_ROOT=/app/media
MAX_VIDEO_SIZE=52428800
MAX_IMAGE_SIZE=5242880
MAX_TOTAL_UPLOAD_SIZE=104857600

# SECURITY HEADERS
SECURITY_HEADERS_ENABLED=true
```

### Step 4: Deploy Backend API
```bash
# From project root directory
railway up --service backend

# Or use Railway Dashboard to connect GitHub repository
```

### Step 5: Deploy Frontend (Optional - Can use Vercel)

**Option A: Deploy Frontend on Railway**
```bash
# Create separate service for frontend
railway add --service frontend
# Configure build command: npm run build
# Configure start command: npm run preview
```

**Option B: Deploy Frontend on Vercel (Recommended)**
```bash
# Connect your GitHub repo to Vercel
# Set VITE_API_URL=https://your-backend.railway.app/api/v1
```

## 🔒 Security Configuration

### Environment Variables Priority
1. **CRITICAL - Must Set:**
   - `JWT_SECRET_KEY` (32+ characters)
   - `ENVIRONMENT=production`
   - `FRONTEND_URL` (your actual frontend domain)

2. **Important - Should Set:**
   - `RATE_LIMIT_ENABLED=true`
   - `SECURITY_HEADERS_ENABLED=true`
   - `MAX_VIDEO_SIZE`, `MAX_IMAGE_SIZE`

3. **Optional - Can Use Defaults:**
   - `ACCESS_TOKEN_EXPIRE_MINUTES`
   - Rate limiting parameters

### CORS Configuration
- Production CORS only allows domains from `FRONTEND_URL` and `ADMIN_URL`
- No wildcard origins in production
- Additional domains via `ADDITIONAL_CORS_ORIGINS`

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Basic**: `GET /api/v1/health` (Public)
- **Detailed**: `GET /api/v1/health/detailed` (Admin only)
- **Metrics**: `GET /api/v1/metrics` (Admin only)
- **Status**: `GET /api/v1/status` (Simple check)

### Railway Health Check
Railway automatically uses `/api/v1/health` with:
- Timeout: 300 seconds
- Restart policy: ON_FAILURE
- Max retries: 3

## 🗂️ File Upload Configuration

### Production File Limits
- **Videos**: 50MB per file
- **Images**: 5MB per file  
- **Total upload**: 100MB per request
- **Max files**: 5 files per request

### Storage Location
- Files stored in `/app/media/` within container
- Automatic directory creation on startup
- Served via FastAPI StaticFiles in production

## 🚨 Troubleshooting

### Common Issues

**1. "Redis connection failed"**
```
✅ SOLUTION: This is NORMAL - Rate limiting uses in-memory fallback
⚠️  INFO: App continues to work normally
🔧 OPTIONAL: Add Redis service if you need shared rate limiting
```

**2. "JWT_SECRET_KEY not secure"**
```
❌ ERROR: JWT secret too short or not set
✅ SOLUTION: Set JWT_SECRET_KEY with 32+ characters
🔧 GENERATE: Use `openssl rand -base64 32` for secure key
```

**3. "CORS error from frontend"**
```
❌ ERROR: Frontend domain not in CORS origins
✅ SOLUTION: Set correct FRONTEND_URL in Railway environment
🔧 CHECK: Ensure HTTPS for production domains
```

**4. "Database connection failed"**
```
❌ ERROR: MongoDB service not connected
✅ SOLUTION: Add MongoDB service in Railway dashboard
🔧 VERIFY: MONGODB_URL environment variable set automatically
```

## 📈 Performance Optimization

### Production Settings
- **Workers**: 2 Uvicorn workers (configured in Dockerfile.prod)
- **Rate Limiting**: Enabled with memory fallback
- **Caching**: HTTP caching headers configured
- **Logging**: Structured JSON logging for Railway logs
- **Security**: All security headers enabled

### Resource Usage
- **CPU**: ~200-400mb base memory usage
- **Memory**: Scales with concurrent users
- **Storage**: Dynamic based on uploaded files

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/deploy@v1
        with:
          service: 'backend'
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## 📞 Support & Maintenance

### Logs Access
```bash
# View live logs
railway logs --service backend

# View specific service logs
railway logs --service mongodb
```

### Database Access
```bash
# Connect to MongoDB via Railway CLI
railway connect mongodb
```

### Environment Updates
```bash
# List environment variables
railway variables

# Set new variable
railway variables set KEY=value
```

## ✅ Post-Deployment Verification

1. **Health Check**: Visit `https://your-app.railway.app/api/v1/health`
2. **API Docs**: Visit `https://your-app.railway.app/api/docs`
3. **Admin Access**: Test admin login functionality
4. **File Upload**: Test media upload functionality
5. **Rate Limiting**: Verify rate limiting is working (check logs)

## 🎯 Production Ready Features

### ✅ Implemented
- [x] Health checks for Railway
- [x] Production-optimized Docker container
- [x] Rate limiting with fallback
- [x] Security headers
- [x] CORS protection
- [x] Structured logging
- [x] File upload limits
- [x] Error handling
- [x] JWT authentication
- [x] MongoDB integration

### 🔄 Optional Enhancements
- [ ] Redis for shared rate limiting
- [ ] CDN for static files
- [ ] Database backups
- [ ] Performance monitoring (Sentry)
- [ ] Email service integration
- [ ] SSL/TLS certificates (Railway handles automatically)

---

## 🚀 **READY FOR PRODUCTION DEPLOYMENT**

Your Stegmaier LMS is now configured for production deployment on Railway with:
- **Zero-downtime deployment**
- **Automatic health checks**
- **Production security settings**
- **Scalable architecture**
- **Comprehensive monitoring**

**Total deployment time: ~5-10 minutes** ⚡