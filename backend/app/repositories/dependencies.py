from fastapi import Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.repositories.sqlalchemy_word_repository import SqlAlchemyWordRepository
from app.repositories.word_repository import WordRepository
from app.schemas.user import User


def get_word_repository(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WordRepository:
    return SqlAlchemyWordRepository(db, current_user.id)
