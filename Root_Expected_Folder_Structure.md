```text
web-app/
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── .gitkeep
│   │   │
│   │   ├── components/
│   │   │   ├── ui/.gitkeep
│   │   │   ├── layout/.gitkeep
│   │   │   ├── chat/.gitkeep
│   │   │   └── common/.gitkeep
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/.gitkeep
│   │   │   ├── user/.gitkeep
│   │   │   ├── technician/.gitkeep
│   │   │   ├── admin/.gitkeep
│   │   │   └── ChatPage.jsx
│   │   │
│   │   ├── routes/.gitkeep
│   │   ├── context/.gitkeep
│   │   ├── hooks/.gitkeep
│   │   ├── lib/.gitkeep
│   │   ├── styles/.gitkeep
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.js
│   │
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── logger.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes/
│   │   │           ├── __init__.py
│   │   │           ├── auth.py
│   │   │           ├── users.py
│   │   │           ├── technicians.py
│   │   │           ├── admin.py
│   │   │           ├── chat.py
│   │   │           ├── appointments.py
│   │   │           └── uploads.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── technician.py
│   │   │   ├── admin.py
│   │   │   ├── appointment.py
│   │   │   └── chat_session.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user_schema.py
│   │   │   ├── auth_schema.py
│   │   │   ├── appointment_schema.py
│   │   │   └── chat_schema.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── technician_service.py
│   │   │   ├── chat_service.py
│   │   │   └── email_service.py
│   │   │
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   ├── base.py
│   │   │   └── init_db.py
│   │   │
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── inference.py
│   │   │   ├── preprocessing.py
│   │   │   └── postprocessing.py
│   │   │
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_auth.py
│   │       ├── test_user_routes.py
│   │       ├── test_chat_api.py
│   │       └── conftest.py
│   │
│   ├── .env.example
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── README.md
│
├── docs/
│   ├── requirements.md
│   ├── api_endpoints.md
│   ├── data_flow_diagram.png
│   └── ui_wireframes/.gitkeep
│
├── scripts/.gitkeep
├── .gitlab-ci.yml
├── docker-compose.yml
├── README.md
└── LICENSE

```