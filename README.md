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
| Technician | `/technician/*` | `/api/v1/technicians/*` |
| Admin | `/admin/*` | `/api/v1/admin/*` |
| Chat (VLM) | `/chat` | `/api/v1/chat/*` |
| Appointments | `/user/appointments`, `/technician/appointments` | `/api/v1/appointments/*` |

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

# ✅ Next Steps

1. Create the repository with this folder skeleton (commit empty `.gitkeep` files in each folder).  
2. Add `README.md` files as above for guidance.  
3. Initialize virtual environments (`npm init vite`, `pip install fastapi`).  
4. Configure `.gitlab-ci.yml` for lint/test on merge requests.  
5. Start implementing features per module.

---