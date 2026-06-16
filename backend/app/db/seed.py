from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import UserRow
from app.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.services.passwords import hash_password


def seed_admin_user(session: Session) -> None:
    user_repo = SqlAlchemyUserRepository(session)
    if user_repo.admin_exists():
        return

    if not settings.admin_email or not settings.admin_password:
        return

    existing = user_repo.find_by_email(settings.admin_email)
    if existing is not None:
        row = session.get(UserRow, existing.id)
        if row is not None:
            row.role = "admin"
            session.add(row)
            session.commit()
        return

    user_repo.create(
        settings.admin_email,
        hash_password(settings.admin_password),
        role="admin",
    )
