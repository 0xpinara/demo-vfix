```
backend/
│
├── app/
│ ├── main.py # FastAPI entrypoint
│ ├── core/ # Core settings and utils
│ │ ├── config.py # Env, settings, CORS, etc.
│ │ ├── security.py # JWT, password hashing
│ │ ├── logger.py
│ │ └── dependencies.py # Common FastAPI dependencies
│ │
│ ├── api/ # All route modules
│ │ ├── v1/
│ │ │ ├── routes/
│ │ │ │ ├── auth.py
│ │ │ │ ├── users.py
│ │ │ │ ├── technicians.py
│ │ │ │ ├── admin.py
│ │ │ │ ├── chat.py
│ │ │ │ ├── appointments.py
│ │ │ │ └── uploads.py
│ │ │ └── init.py
│ │ └── init.py
│ │
│ ├── models/ # ORM models
│ │ ├── user.py
│ │ ├── technician.py
│ │ ├── admin.py
│ │ ├── appointment.py
│ │ └── chat_session.py
│ │
│ ├── schemas/ # Pydantic models
│ │ ├── user_schema.py
│ │ ├── auth_schema.py
│ │ ├── appointment_schema.py
│ │ └── chat_schema.py
│ │
│ ├── services/ # Business logic / utilities
│ │ ├── auth_service.py
│ │ ├── user_service.py
│ │ ├── technician_service.py
│ │ ├── chat_service.py # Interface to Vision-Language Model
│ │ └── email_service.py
│ │
│ ├── database/ # Database setup & seed
│ │ ├── session.py
│ │ ├── base.py
│ │ └── init_db.py
│ │
│ ├── ml/ # Vision-Language Model Integration
│ │ ├── inference.py
│ │ ├── preprocessing.py
│ │ └── postprocessing.py
│ │
│ └── tests/
│ ├── test_auth.py
│ ├── test_user_routes.py
│ ├── test_chat_api.py
│ └── conftest.py
│
├── .env.example
├── requirements.txt
├── pyproject.toml # Optional (Poetry)
└── README.md
```