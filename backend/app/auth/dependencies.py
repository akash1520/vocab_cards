from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import User
from app.services.jwt import get_subject_from_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return SqlAlchemyUserRepository(db)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    user_id = get_subject_from_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repo.find_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
