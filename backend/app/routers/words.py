from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.repositories.dependencies import get_word_repository
from app.repositories.word_repository import WordRepository
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


@router.get("", response_model=list[Word])
def list_words(repo: WordRepository = Depends(get_word_repository)) -> list[Word]:
    return repo.list_all()


@router.get("/due", response_model=list[Word])
def list_due_words(
    limit: int = Query(default=20, ge=1, le=100),
    repo: WordRepository = Depends(get_word_repository),
) -> list[Word]:
    now = datetime.now(UTC)
    words = repo.list_all()
    due_words = [word for word in words if is_due(word, now)]
    sorted_words = sort_by_urgency(due_words, now)
    return sorted_words[:limit]


@router.post("", response_model=Word, status_code=201)
def create_word(
    payload: CreateWordInput,
    repo: WordRepository = Depends(get_word_repository),
) -> Word:
    normalized_term = payload.term.strip()
    existing = repo.find_by_term_case_insensitive(normalized_term)
    if existing is not None:
        raise HTTPException(status_code=409, detail="A word with this term already exists.")

    return repo.create(payload)


@router.post("/enrich", response_model=EnrichWordResponse)
async def enrich_word(payload: EnrichWordRequest) -> EnrichWordResponse:
    return await enrich_word_with_ollama(payload.term.strip())


@router.post("/{word_id}/review", response_model=Word)
def review_word(
    word_id: str,
    payload: ReviewPayload,
    repo: WordRepository = Depends(get_word_repository),
) -> Word:
    word = repo.find_by_id(word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found.")

    now = datetime.now(UTC)
    update = compute_next_review(word, payload.knew_it, now)
    updated = repo.apply_srs_update(word_id, update)
    if updated is None:
        raise HTTPException(status_code=404, detail="Word not found.")

    return updated
