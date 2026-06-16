from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth.dependencies import get_current_user, get_user_repository
from app.repositories.user_repository import UserRepository
from app.schemas.user import Token, User, UserCreate
from app.services.jwt import create_access_token
from app.services.passwords import hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=User, status_code=201)
def register(
    payload: UserCreate,
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    if user_repo.email_exists(payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    return user_repo.create(payload.email, hash_password(payload.password), role="user")


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepository = Depends(get_user_repository),
) -> Token:
    user = user_repo.authenticate(form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)
    return Token(access_token=access_token)


@router.get("/me", response_model=User)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
