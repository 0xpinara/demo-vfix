```text
frontend/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── assets/                      # Images, logos, icons
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # Base UI (Button, Input, Badge, etc.)
│   │   ├── layout/                  # Header, Sidebar, Footer
│   │   ├── chat/                    # Chat-specific elements (MessageList, InputArea)
│   │   └── common/                  # Common components shared across pages
│   │
│   ├── pages/                       # Full-page views (used by Router)
│   │   ├── auth/                    # Login, Register, Reset Password
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── PasswordResetPage.jsx
│   │   │
│   │   ├── user/                    # End-user dashboard
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── AppointmentHistory.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── technician/              # Technician interface
│   │   │   ├── TechnicianDashboard.jsx
│   │   │   └── AppointmentUpdatePage.jsx
│   │   │
│   │   ├── admin/                   # Admin interface
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── GdprCompliancePage.jsx
│   │   │
│   │   └── ChatPage.jsx             # Shared chat with VLM
│   │
│   ├── routes/                      # Route configuration
│   │   └── AppRoutes.jsx
│   │
│   ├── context/                     # React Context API
│   │   ├── AuthContext.jsx
│   │   ├── ChatContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useChat.js
│   │   └── useApi.js
│   │
│   ├── lib/                         # Utility + API client
│   │   ├── api.js                   # Axios or Fetch wrapper
│   │   ├── constants.js
│   │   └── helpers.js
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── theme.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.js
│
├── .env.example                     # Sample environment vars (API base URL, etc.)
├── package.json
├── vite.config.js                   # Or webpack config
└── README.md
```