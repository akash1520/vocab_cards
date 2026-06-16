from fastapi import APIRouter, Depends

from app.auth.dependencies import get_user_repository, require_admin
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminUserSummary, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(
    _: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[AdminUserSummary]:
    return user_repo.list_all_with_stats()
