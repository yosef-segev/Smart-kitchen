# Render.com Deployment Guide

This application is optimized for Render.com deployment with **zero hardcoded paths** and **flexible dependencies**.

## Pre-Deployment Checklist

✅ No absolute paths (all relative)
✅ No proprietary dependencies  
✅ Flexible version requirements
✅ Environment-based configuration
✅ Production-ready logging

## Backend Service Setup

### 1. Create Web Service

**Repository:** Connect your GitHub repository

**Build Settings:**
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`

### 2. Environment Variables

Add these in Render dashboard → Environment:

```bash
# Database (MongoDB Atlas recommended)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=freshtrack_prod

# Security (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters
CORS_ORIGINS=*

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!

# AI - Gemini API (get from https://aistudio.google.com/apikey)
EMERGENT_LLM_KEY=AIzaSy...your-gemini-api-key

# File Storage - Cloudinary (get from https://cloudinary.com)
STORAGE_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Application
APP_NAME=freshtrack
```

### 3. Advanced Settings

- **Auto-Deploy:** Yes (deploy on git push)
- **Health Check Path:** `/api/auth/me` (optional)
- **Instance Type:** Free or Starter

## Frontend Service Setup

### 1. Create Static Site

**Build Settings:**
- **Build Command:** `cd frontend && yarn install && yarn build`
- **Publish Directory:** `frontend/build`

### 2. Environment Variables

```bash
REACT_APP_BACKEND_URL=https://your-backend-service.onrender.com
```

## MongoDB Atlas Setup

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
4. Get connection string
5. Replace `<password>` and `<dbname>` in connection string

**Example:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/freshtrack
```

## Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create API key
3. Copy key (starts with `AIzaSy...`)
4. Add as `EMERGENT_LLM_KEY` in Render

**Free Tier Limits:**
- 15 requests per minute
- 1,500 requests per day
- No credit card required

## Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → Account Details
3. Copy: Cloud Name, API Key, API Secret
4. Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
5. Add as `STORAGE_URL` in Render

**Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- Perfect for prototypes

## Deployment Process

### First Deploy

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Render auto-builds** (5-10 minutes)

3. **Check Logs:**
   - Backend: Look for "Application startup complete"
   - Frontend: Look for build success

4. **Test Endpoints:**
   ```bash
   curl https://your-backend.onrender.com/api/auth/me
   ```

### Subsequent Deploys

Just push to GitHub:
```bash
git push origin main
```

Render auto-deploys on every push!

## Common Issues & Solutions

### Issue: "Module not found"
**Solution:** Check `requirements.txt` has all dependencies
```bash
pip freeze > backend/requirements.txt
```

### Issue: "Address already in use"
**Solution:** Use `$PORT` environment variable (Render provides it)
```python
# ✅ Correct
uvicorn server:app --host 0.0.0.0 --port $PORT

# ❌ Wrong
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Issue: "No such file or directory: /app/memory"
**Solution:** ✅ Already fixed! Using relative paths now.
```python
# ✅ Relative path (works everywhere)
memory_dir = ROOT_DIR / 'memory'

# ❌ Absolute path (Docker-specific)
memory_dir = Path('/app/memory')
```

### Issue: "CORS error"
**Solution:** Set `CORS_ORIGINS=*` or your frontend URL
```bash
CORS_ORIGINS=https://your-frontend.onrender.com
```

### Issue: "Database connection failed"
**Solution:** 
1. Check MongoDB Atlas whitelist includes `0.0.0.0/0`
2. Verify `MONGO_URL` is correct
3. Check database user permissions

### Issue: "Gemini API quota exceeded"
**Solution:**
- Free tier: 15 RPM, 1500 RPD
- Implement rate limiting
- Or upgrade to paid plan

## File Structure (Render-Compatible)

```
project/
├── backend/
│   ├── server.py          # ✅ Uses ROOT_DIR for paths
│   ├── requirements.txt   # ✅ Loose versioning
│   ├── memory/           # ✅ Created at runtime (relative)
│   └── .env              # ❌ DON'T COMMIT (use Render env vars)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env              # ❌ DON'T COMMIT
└── .gitignore            # ✅ Excludes .env and memory/
```

## Performance Tips

1. **Use Render Disks** for persistent storage (optional)
2. **Enable HTTP/2** in Render settings
3. **Set up CDN** for frontend static assets
4. **Monitor logs** for errors
5. **Use environment-specific configs**

## Security Checklist

- ✅ No secrets in code
- ✅ Strong JWT_SECRET (32+ chars)
- ✅ Secure ADMIN_PASSWORD
- ✅ HTTPS enforced (Render default)
- ✅ CORS configured properly
- ✅ .env files ignored in git

## Scaling

**Free Tier:**
- Backend: 750 hours/month
- Frontend: Unlimited bandwidth
- Good for: Development, prototypes

**Paid Plans:**
- Starter: $7/month (better performance)
- Standard: $25/month (autoscaling)
- Pro: Custom (enterprise)

## Monitoring

**Render Dashboard:**
- Deployment logs
- Runtime logs
- Metrics (CPU, memory)
- Request analytics

**External Tools:**
- Sentry (error tracking)
- LogRocket (session replay)
- DataDog (monitoring)

## Backup Strategy

1. **MongoDB:** Atlas automated backups (free tier)
2. **Cloudinary:** Files stored in cloud (redundant)
3. **Code:** GitHub (version control)

## Support

- **Render Docs:** https://render.com/docs
- **Community:** https://community.render.com
- **Status:** https://status.render.com

## Success Criteria

✅ Backend starts successfully
✅ Frontend loads without errors
✅ Login works
✅ API calls succeed
✅ Files upload to Cloudinary
✅ AI recipe generation works
✅ No hardcoded paths
✅ All features functional

**Your app is ready to deploy! 🚀**
