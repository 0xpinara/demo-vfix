# 🧠 Global Conventions and Collaboration

## GitLab Branch Naming
| Type | Example | Description |
|------|----------|-------------|
| Feature | `feature/login-api` | New functionality |
| Fix | `fix/image-upload` | Bugfix |
| Refactor | `refactor/chat-context` | Non-functional changes |
| Docs | `docs/update-readme` | Documentation updates |

## Commit Messages
- feat(auth): add JWT role-based authorization
- fix(chat): resolve websocket disconnect bug
- docs: add FastAPI setup steps

## Code Style
- **Frontend:** ESLint + Prettier, enforced via CI  
- **Backend:** Black + isort + flake8  

## Testing
- Frontend: React Testing Library + Vitest  
- Backend: pytest + HTTPX test client  

## Routing Summary
| Area | Frontend Path | Backend Endpoint |
|------|----------------|------------------|
| Auth | `/login`, `/register` | `/api/v1/auth/*` |
| User Dashboard | `/user/*` | `/api/v1/users/*` |
| Technician | `/technician/*`, `/technician/feedback` | `/api/v1/technicians/*` |
| Admin | `/admin/*` | `/api/v1/admin/*` |
| Chat (VLM) | `/chat` | `/api/v1/chat/*` |
| Appointments | `/user/appointments`, `/technician/appointments` | `/api/v1/appointments/*` |
| Feedback | Chat: `/chat` (modal), Technician: `/technician/feedback` | `/api/chat/feedback`, `/api/technicians/feedback` |

---

# 🧩 Suggested Team Division

| Role | Area | Branch |
|------|------|--------|
| Frontend Auth Dev | Login, Register pages | `feature/frontend-auth` |
| Frontend Chat Dev | Chat UI + sockets | `feature/frontend-chat` |
| Frontend Dashboard Dev | Layout, user/tech/admin dashboards | `feature/frontend-dashboards` |
| Backend Auth Dev | JWT, OAuth | `feature/backend-auth` |
| Backend Model Dev | VLM integration | `feature/backend-ml` |
| Backend Data Dev | DB models, appointments | `feature/backend-db` |
| DevOps | Docker, CI/CD | `feature/devops-pipeline` |

---

# 🚀 Build & Setup Instructions

## Prerequisites

### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.11+
brew install python@3.11

# Install Node.js 18+
brew install node

# Install PostgreSQL (optional, for production)
brew install postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (optional, for production)
sudo apt install postgresql postgresql-contrib

# Install build dependencies (for psycopg2-binary, optional)
sudo apt install python3-dev libpq-dev
```

### Linux (Fedora/RHEL)
```bash
# Install Python 3.11+
sudo dnf install python3.11 python3-pip

# Install Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install PostgreSQL (optional, for production)
sudo dnf install postgresql postgresql-server

# Install build dependencies (for psycopg2-binary, optional)
sudo dnf install python3-devel postgresql-devel
```

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Note:** If `psycopg2-binary` fails to install (PostgreSQL driver), it's optional. The app works with SQLite by default. To use PostgreSQL later:
```bash
# macOS
brew install postgresql
pip install psycopg2-binary

# Linux
sudo apt install python3-dev libpq-dev  # Ubuntu/Debian
# or
sudo dnf install python3-devel postgresql-devel  # Fedora
pip install psycopg2-binary
```

### 4. Configure environment variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env and set your values:
# DATABASE_URL=sqlite:///./vfix_db.sqlite  # Default (SQLite)
# DATABASE_URL=postgresql://user:pass@localhost/vfix_db  # PostgreSQL
# SECRET_KEY=your-secret-key-here
# ENCRYPTION_KEY=your-encryption-key-here  # For field-level encryption
```

### 5. Run database migrations (if using Alembic)
```bash
alembic upgrade head
```

### 6. Start backend server
```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Backend will be available at:** http://127.0.0.1:8000
**API Documentation:** http://127.0.0.1:8000/api/docs

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment (optional)
```bash
# Create .env file for custom backend URL
echo "VITE_API_URL=http://127.0.0.1:8000" > .env
```

**Note:** By default, the frontend uses a Vite proxy that forwards `/api` requests to `http://127.0.0.1:8000`. You only need to set `VITE_API_URL` if your backend runs on a different port.

### 4. Start development server
```bash
npm run dev
```

**Frontend will be available at:** http://localhost:5173

### 5. Build for production
```bash
npm run build
npm run preview  # Preview production build
```

---

## Quick Start (All-in-One)

### macOS/Linux:
```bash
# Terminal 1: Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

Then open:
- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://127.0.0.1:8000/api/docs

---

## Verify Installation

### Test Backend
```bash
curl http://127.0.0.1:8000/health
# Should return: {"status":"ok",...}
```

### Test Frontend
```bash
curl http://localhost:5173
# Should return HTML
```

### Test Frontend-Backend Connection
```bash
# From frontend, test API proxy
curl http://localhost:5173/api/health
# Should return backend health status
```

---

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# macOS/Linux: Find and kill process
lsof -ti:8000 | xargs kill -9  # macOS/Linux
# or
sudo fuser -k 8000/tcp  # Linux
```

**Module not found errors:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Database connection errors:**
- Check `.env` file has correct `DATABASE_URL`
- For SQLite: Ensure write permissions in `backend/` directory
- For PostgreSQL: Ensure PostgreSQL is running and credentials are correct

### Frontend Issues

**Port already in use:**
```bash
# Vite will automatically use next available port (5174, 5175, etc.)
# Or specify custom port:
npm run dev -- --port 3000
```

**API connection fails:**
- Ensure backend is running on port 8000
- Check `vite.config.js` proxy configuration
- Verify `VITE_API_URL` in `.env` if set

**npm install fails:**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

# ✅ Next Steps

1. Create the repository with this folder skeleton (commit empty `.gitkeep` files in each folder).  
2. Add `README.md` files as above for guidance.  
3. Initialize virtual environments (`npm init vite`, `pip install fastapi`).  
4. Configure `.gitlab-ci.yml` for lint/test on merge requests.  
5. Start implementing features per module.

---