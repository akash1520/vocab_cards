import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.seed import seed_admin_user
from app.db.session import SessionLocal, init_db
from app.routers import admin, auth, words

app = FastAPI(title="Vocab Cards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(words.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    if os.getenv("DISABLE_STARTUP_SEED") == "1":
        return
    db = SessionLocal()
    try:
        seed_admin_user(db)
    finally:
        db.close()
