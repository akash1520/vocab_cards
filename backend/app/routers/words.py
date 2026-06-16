from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.word import WordRow
from app.schemas.word import (
    CreateWordInput,
    EnrichWordRequest,
    EnrichWordResponse,
    ReviewPayload,
    Word,
)
from app.services.ollama import enrich_word as enrich_word_with_ollama
from app.services.srs import compute_next_review, is_due, sort_by_urgency

router = APIRouter(prefix="/api/words", tags=["words"])


def _row_to_word(row: WordRow) -> Word:
    return Word.model_validate(row)


@router.get("", response_model=list[Word])
def list_words(db: Session = Depends(get_db)) -> list[Word]:
    rows = db.scalars(select(WordRow).order_by(WordRow.created_at)).all()
    return [_row_to_word(row) for row in rows]


@router.get("/due", response_model=list[Word])
def list_due_words(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Word]:
    now = datetime.now(UTC)
    rows = db.scalars(select(WordRow)).all()
    words = [_row_to_word(row) for row in rows]
    due_words = [word for word in words if is_due(word, now)]
    sorted_words = sort_by_urgency(due_words, now)
    return sorted_words[:limit]


@router.post("", response_model=Word, status_code=201)
def create_word(payload: CreateWordInput, db: Session = Depends(get_db)) -> Word:
    normalized_term = payload.term.strip()
    existing = db.scalar(
        select(WordRow).where(func.lower(WordRow.term) == normalized_term.lower()),
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="A word with this term already exists.")

    row = WordRow(
        term=normalized_term,
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
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_word(row)


@router.post("/enrich", response_model=EnrichWordResponse)
async def enrich_word(payload: EnrichWordRequest) -> EnrichWordResponse:
    return await enrich_word_with_ollama(payload.term.strip())


@router.post("/{word_id}/review", response_model=Word)
def review_word(
    word_id: str,
    payload: ReviewPayload,
    db: Session = Depends(get_db),
) -> Word:
    row = db.get(WordRow, word_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found.")

    word = _row_to_word(row)
    now = datetime.now(UTC)
    update = compute_next_review(word, payload.knew_it, now)

    row.status = update.status
    row.interval_days = update.interval_days
    row.repetitions = update.repetitions
    row.next_review_at = update.next_review_at
    row.ease_factor = update.ease_factor

    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_word(row)
