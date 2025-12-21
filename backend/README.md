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
All routes are currently under `/api/...` (chat feedback uses `/api/chat/feedback`).
Future versions: `/api/v2/…`.

## Chat Session and Message Endpoints
- `POST /api/chat/sessions` — create a new chat session. Body: optional `title`.
- `GET /api/chat/sessions` — list chat sessions for the authenticated user (sorted by created_at descending, limit 50 by default).
- `GET /api/chat/sessions/{session_id}` — get a chat session with all its messages (decrypted).
- `PUT /api/chat/sessions/{session_id}` — update a session (title, problem_solved, technician_dispatched).
- `DELETE /api/chat/sessions/{session_id}` — delete a session and all its messages.
- `POST /api/chat/sessions/{session_id}/messages` — add a message to a session. Body: `role` ("user" or "assistant"), optional `content`, optional `images` (array of base64 strings).

**Note:** All messages are encrypted at rest using Fernet encryption. Content and images are automatically encrypted when saved and decrypted when retrieved.

## Chat Feedback Endpoints
- `POST /api/chat/feedback` — create or update feedback for a chat session. Body: `session_id` (string), `rating` (1-5), optional `comment`, optional `session_title`.
- `GET /api/chat/feedback/{session_id}` — fetch feedback for the current user and chat session.
- `GET /api/chat/feedback` — list recent feedback for the authenticated user (limit 50 by default).

## Technician Feedback Endpoints
- `POST /api/technicians/feedback` — submit technician feedback after a field visit. Requires technician role. Body: `rating` (1-5), optional `comment`, `diagnosis_correct` (bool), `parts_sufficient` (bool), `second_trip_required` (bool), optional `chat_session_id`, and conditional fields (`actual_problem`, `actual_solution`, etc.) when diagnosis was incorrect.
- `GET /api/technicians/feedback` — list all feedback submitted by the authenticated technician (with optional `limit` query param, default 50).
- `GET /api/technicians/feedback/{feedback_id}` — retrieve a specific feedback entry by ID (only accessible by the technician who created it).

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

## Database Migrations
Run the chat database migration to create chat session and message tables:

```bash
python -m app.database.migrate_chat
```

This creates:
- `chat_sessions` table (with nullable `session_key` for legacy compatibility)
- `chat_messages` table (with encrypted `content` and `images` fields)

## Testing
Run all tests:

```bash
pytest -v
pytest app/tests/test_chat_feedback.py
pytest app/tests/test_chat_sessions.py  # Comprehensive tests for chat persistence
pytest app/tests/test_technician_feedback.py
```

**Note:** Test warnings are suppressed via `pytest.ini`. GZip middleware is disabled during tests to prevent I/O errors.

---