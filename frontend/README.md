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
VITE_API_URL=http://localhost:8000/api
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

## ⭐ Chat Feedback
- Past chats now show a **Değerlendir** button per session (sidebar) and a top button for the active chat.
- Feedback modal collects a 1–5 star rating plus an optional comment and sends it to `/api/chat/feedback`.
- Existing feedback is prefilled when reopening the modal.

## 🔧 Technician Feedback
- Accessible at `/technician/feedback` (requires technician or senior_technician role).
- Comprehensive survey form for technicians to provide feedback after field visits:
  - General rating (1-5 stars) and optional comment
  - Diagnostic accuracy checkboxes (AI diagnosis correct, parts sufficient, second trip required)
  - Conditional "Actual Findings" section (shown when diagnosis was incorrect) with required fields: actual problem, actual solution
  - Conditional "Required Parts" section (shown when parts were not sufficient)
- Form validates required fields and submits to `/api/technicians/feedback`.
- Success message displayed after submission, with automatic feedback list refresh.

## 🧪 Testing
```bash
npm test
```
Vitest + Testing Library run component and service tests, including:
- Chat feedback modal and API client (`FeedbackModal.test.jsx`, `feedback.test.js`)
- Technician feedback form, page, and service (`TechnicianFeedbackForm.test.jsx`, `TechnicianFeedback.test.jsx`, `technicianFeedback.test.js`)
- All 48 frontend tests passing for technician feedback feature


## 🔐 Role-Based Access

- AuthContext exposes user.role → 'user' | 'technician' | 'admin'
- Protected routes automatically redirect unauthorized users


---
