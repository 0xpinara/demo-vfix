# 🖥️ Frontend – Home Appliance VLM Platform

## Tech Stack
- React (Vite)
- TailwindCSS
- Framer Motion
- React Router
- Lucide Icons

## Folder Guide
| Folder | Purpose |
|---------|----------|
| `components/ui` | Base visual components |
| `pages/auth` | Login, Register, Password Reset |
| `pages/user` | User dashboard + appointment history |
| `pages/technician` | Technician workflow |
| `pages/admin` | Admin control panel |
| `lib/` | Helpers and API clients |
| `context/` | Global state management |
| `routes/` | Central routing config |

## Development
```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root and set the following:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🧭 Routing Conventions
| Route                                  | Access                   |
| -------------------------------------- | ------------------------ |
| `/login`, `/register`                  | Public                   |
| `/user/*`, `/technician/*`, `/admin/*` | Role-protected           |
| `/chat`                                | Shared AI chat interface |

## 💻 Coding Conventions
- Functional components + Hooks only
- TailwindCSS for styling
- PascalCase for components
- camelCase for functions/variables
- All new pages under src/pages/
- API access only through lib/api.js


## 🔐 Role-Based Access

- AuthContext exposes user.role → 'user' | 'technician' | 'admin'
- Protected routes automatically redirect unauthorized users


---
