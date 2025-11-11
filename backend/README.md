# ⚙️ Backend – Home Appliance VLM Platform

## Stack
- Python 3.11+
- FastAPI
- SQLAlchemy / Pydantic
- PostgreSQL (recommended)
- JWT Authentication

## Run (Development)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Folder Overview
| Folder          | Purpose                                     |
| --------------- | ------------------------------------------- |
| `core/`         | Configuration, logging, JWT helpers         |
| `api/v1/routes` | FastAPI route definitions grouped by domain |
| `models/`       | SQLAlchemy ORM models                       |
| `schemas/`      | Pydantic input/output schemas               |
| `services/`     | Business logic and integrations             |
| `database/`     | Connection and initialization               |
| `ml/`           | Vision-Language Model adapter               |
| `tests/`        | Unit and integration tests                  |


## API Versioning
All routes prefixed with `/api/v1/…`.
Future versions: `/api/v2/…`.

## Environment Variables (.env)
```ini
DATABASE_URL=postgresql://user:pass@localhost:5432/vlm_db
JWT_SECRET_KEY=changeme
JWT_ALGORITHM=HS256
VLM_MODEL_PATH=/models/vlm/
```

## Coding Conventions
- One route file per logical domain (auth.py, users.py, etc.)
- Business logic isolated in services/
- Pydantic schemas define request/response
- All APIs return standardized response objects:

```json
{ "status": "success", "data": {...}, "message": "..." }
```

## Testing
Run all tests:

```bash
pytest -v
```

---