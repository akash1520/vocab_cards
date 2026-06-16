from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.sqlalchemy_word_repository import SqlAlchemyWordRepository
from app.repositories.word_repository import WordRepository


def get_word_repository(db: Session = Depends(get_db)) -> WordRepository:
    return SqlAlchemyWordRepository(db)
