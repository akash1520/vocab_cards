from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.word import WordRow
from app.repositories.word_repository import WordRepository
from app.schemas.word import CreateWordInput, Word
from app.services.srs import SrsUpdate


class SqlAlchemyWordRepository(WordRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_all(self) -> list[Word]:
        rows = self._session.scalars(select(WordRow).order_by(WordRow.created_at)).all()
        return [Word.model_validate(row) for row in rows]

    def find_by_id(self, word_id: str) -> Word | None:
        row = self._session.get(WordRow, word_id)
        if row is None:
            return None
        return Word.model_validate(row)

    def find_by_term_case_insensitive(self, term: str) -> Word | None:
        row = self._session.scalar(
            select(WordRow).where(func.lower(WordRow.term) == term.lower()),
        )
        if row is None:
            return None
        return Word.model_validate(row)

    def create(self, payload: CreateWordInput) -> Word:
        row = WordRow(
            term=payload.term.strip(),
            part_of_speech=payload.part_of_speech.strip(),
            definition=payload.definition.strip(),
            synonyms=[synonym.strip() for synonym in payload.synonyms if synonym.strip()],
            example_sentence=payload.example_sentence.strip(),
            ease_factor=2.5,
            interval_days=0,
            repetitions=0,
            next_review_at=None,
            status="new",
        )
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return Word.model_validate(row)

    def apply_srs_update(self, word_id: str, update: SrsUpdate) -> Word | None:
        row = self._session.get(WordRow, word_id)
        if row is None:
            return None

        row.status = update.status
        row.interval_days = update.interval_days
        row.repetitions = update.repetitions
        row.next_review_at = update.next_review_at
        row.ease_factor = update.ease_factor

        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return Word.model_validate(row)
