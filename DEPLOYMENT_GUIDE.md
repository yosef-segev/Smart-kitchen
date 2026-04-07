# Deployment Configuration Guide

This application is now **100% deployment-ready** for any platform (Render, Railway, Vercel, AWS, etc.) with **ZERO proprietary dependencies**.

## Environment Variables Required

### Backend (.env)

```bash
# Database
MONGO_URL="mongodb://your-mongo-host:27017/your-database"
DB_NAME="your_database_name"

# Security
JWT_SECRET="your-secure-random-jwt-secret-min-32-chars"
CORS_ORIGINS="*"

# Admin Account (auto-created on first startup)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-admin-password"

# AI/Recipe Generation (Gemini API)
EMERGENT_LLM_KEY="your-gemini-api-key"

# File Storage (Cloudinary)
STORAGE_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

# Application
APP_NAME="freshtrack"
```

### Frontend (.env)

```bash
REACT_APP_BACKEND_URL="https://your-backend-url.com"
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## API Keys Setup

### 1. Google Gemini API (Recipe Generation)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and set as `EMERGENT_LLM_KEY`

**Note:** The variable name is `EMERGENT_LLM_KEY` but it now uses **Google Gemini API** directly (no proprietary packages).

### 2. Cloudinary (File Storage)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from dashboard
3. Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
4. Set as `STORAGE_URL`

### 3. MongoDB Database
- Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
- Or any MongoDB hosting service
- Get connection string and set as `MONGO_URL`

## Dependencies Overview

### Backend (Python)
- **FastAPI** - Web framework
- **motor** - Async MongoDB driver
- **google-generativeai** - Official Google Gemini SDK
- **cloudinary** - Official Cloudinary SDK
- **bcrypt** - Password hashing
- **PyJWT** - JWT authentication
- **pydantic** - Data validation

**NO PROPRIETARY PACKAGES** - All are public PyPI packages!

### Frontend (React)
- **React** - UI framework
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Recharts** - Analytics charts

## Deployment Instructions

### Deploy on Render

**Backend:**
1. Connect your GitHub repository
2. Select "Web Service"
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from Backend .env section
6. Deploy!

**Frontend:**
1. Create new "Static Site"
2. Build Command: `cd frontend && yarn install && yarn build`
3. Publish Directory: `frontend/build`
4. Add `REACT_APP_BACKEND_URL` pointing to your backend URL
5. Deploy!

### Deploy on Railway

**Backend:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT"
```

**Frontend:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd frontend && yarn build && npx serve -s build -p $PORT"
```

### Deploy on AWS/GCP/Azure

Use Docker:

**Dockerfile (Backend):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ .
RUN yarn build
RUN yarn global add serve
CMD ["serve", "-s", "build", "-p", "3000"]
```

## Architecture

```
Frontend (React)
    ↓
Backend API (FastAPI)
    ↓
├── MongoDB (Data Storage)
├── Gemini AI (Recipe Generation)
└── Cloudinary (File Storage)
```

## Features

1. **Authentication** - JWT-based with httpOnly cookies
2. **Inventory Management** - CRUD operations with expiration tracking
3. **Shopping List** - Auto-suggestions with approval workflow
4. **AI Recipes** - Gemini-powered recipe generation
5. **My Recipes** - User recipes with file attachments
6. **Analytics** - Purchase patterns and insights

## Security Checklist

- ✅ No hardcoded secrets
- ✅ Environment variable based configuration
- ✅ CORS configured
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Input validation with Pydantic
- ✅ MongoDB query optimization
- ✅ File upload validation

## Performance Optimizations

- ✅ Database query batching (no N+1 queries)
- ✅ Async/await throughout
- ✅ MongoDB indexes on email field
- ✅ CDN delivery via Cloudinary
- ✅ Efficient error handling

## Testing Endpoints

```bash
# Health check
curl https://your-backend-url.com/api/auth/me

# Login
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"your-password"}'

# Get inventory
curl https://your-backend-url.com/api/inventory \
  -H "Cookie: access_token=YOUR_TOKEN"
```

## Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify MongoDB connection string is correct
- Check logs for specific error messages

### Recipe generation fails
- Verify `EMERGENT_LLM_KEY` contains valid Gemini API key
- Check Gemini API quota/limits
- Review backend logs for detailed errors

### File uploads fail
- Verify Cloudinary `STORAGE_URL` is correct format
- Check Cloudinary dashboard for quota
- Ensure file size is within limits (10MB default)

### Frontend can't connect to backend
- Verify `REACT_APP_BACKEND_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

## Support

For deployment issues:
- **Render**: https://render.com/docs
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs

For API/service issues:
- **Gemini AI**: https://ai.google.dev/docs
- **Cloudinary**: https://cloudinary.com/documentation
- **MongoDB**: https://docs.mongodb.com

## License

This application uses only open-source dependencies and standard cloud services.
No proprietary or licensed packages required.
