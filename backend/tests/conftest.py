import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.main import app
from app.models import word  # noqa: F401
from app.repositories.dependencies import get_word_repository
from app.repositories.sqlalchemy_word_repository import SqlAlchemyWordRepository


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
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def override_get_word_repository() -> SqlAlchemyWordRepository:
        return SqlAlchemyWordRepository(db_session)

    app.dependency_overrides[get_word_repository] = override_get_word_repository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
