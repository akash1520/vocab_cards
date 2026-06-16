from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db
from app.routers import words

app = FastAPI(title="Vocab Cards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(words.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    init_db()
