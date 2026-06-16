from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import UserRow
from app.models.word import WordRow
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminUserSummary, User, UserRole
from app.schemas.word import Word
from app.services.passwords import verify_password
from app.services.srs import is_due


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def find_by_id(self, user_id: str) -> User | None:
        row = self._session.get(UserRow, user_id)
        if row is None:
            return None
        return User.model_validate(row)

    def find_by_email(self, email: str) -> User | None:
        row = self._session.scalar(
            select(UserRow).where(func.lower(UserRow.email) == email.lower()),
        )
        if row is None:
            return None
        return User.model_validate(row)

    def email_exists(self, email: str) -> bool:
        return self.find_by_email(email) is not None

    def create(self, email: str, hashed_password: str, role: UserRole = "user") -> User:
        row = UserRow(
            email=email.strip().lower(),
            hashed_password=hashed_password,
            role=role,
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return User.model_validate(row)

    def admin_exists(self) -> bool:
        row = self._session.scalar(select(UserRow).where(UserRow.role == "admin").limit(1))
        return row is not None

    def authenticate(self, email: str, plain_password: str) -> User | None:
        row = self._session.scalar(
            select(UserRow).where(func.lower(UserRow.email) == email.lower()),
        )
        if row is None or not verify_password(plain_password, row.hashed_password):
            return None
        return User.model_validate(row)

    def list_all_with_stats(self) -> list[AdminUserSummary]:
        now = datetime.now(UTC)
        users = self._session.scalars(select(UserRow).order_by(UserRow.created_at)).all()
        summaries: list[AdminUserSummary] = []

        for user in users:
            words = self._session.scalars(
                select(WordRow).where(WordRow.user_id == user.id),
            ).all()
            word_models = [Word.model_validate(word) for word in words]
            due_count = sum(1 for word in word_models if is_due(word, now))
            summaries.append(
                AdminUserSummary(
                    id=user.id,
                    email=user.email,
                    role=user.role,
                    created_at=user.created_at,
                    word_count=len(words),
                    due_count=due_count,
                ),
            )

        return summaries
