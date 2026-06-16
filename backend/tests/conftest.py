import os

os.environ["DISABLE_STARTUP_SEED"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.dependencies import get_user_repository
from app.db.session import get_db
from app.db.base import Base
from app.db.seed import seed_admin_user
from app.main import app
from app.models import user, word  # noqa: F401
from app.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.schemas.user import User
from app.services.jwt import create_access_token
from app.services.passwords import hash_password


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        seed_admin_user(session)
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def user_repo(db_session: Session) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(db_session)


@pytest.fixture()
def test_user(user_repo: SqlAlchemyUserRepository) -> User:
    return user_repo.create("user@example.com", hash_password("password123"), role="user")


@pytest.fixture()
def admin_user(user_repo: SqlAlchemyUserRepository) -> User:
    existing = user_repo.find_by_email("admin@example.com")
    if existing is not None:
        return existing
    return user_repo.create("admin@example.com", hash_password("adminpass123"), role="admin")


@pytest.fixture()
def auth_token(test_user: User) -> str:
    return create_access_token(test_user.id)


@pytest.fixture()
def admin_token(admin_user: User) -> str:
    return create_access_token(admin_user.id)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_user_repository() -> SqlAlchemyUserRepository:
        return SqlAlchemyUserRepository(db_session)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_user_repository] = override_get_user_repository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def authed_client(client: TestClient, test_user: User, auth_token: str) -> TestClient:
    client.headers.update(auth_headers(auth_token))
    return client
