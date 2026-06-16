#!/bin/sh
set -e

alembic upgrade head
python -c "from app.db.session import SessionLocal; from app.db.seed import seed_admin_user; db = SessionLocal(); seed_admin_user(db); db.close()"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
