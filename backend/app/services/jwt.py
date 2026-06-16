from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from app.config import settings


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def get_subject_from_token(token: str) -> str | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
