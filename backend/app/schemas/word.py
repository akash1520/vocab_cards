from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

WordStatus = Literal["new", "learning", "review", "mastered"]


class Word(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    term: str
    part_of_speech: str
    definition: str
    synonyms: list[str]
    example_sentence: str
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_at: datetime | None
    status: WordStatus


class CreateWordInput(BaseModel):
    term: str = Field(min_length=1)
    part_of_speech: str = Field(min_length=1)
    definition: str = Field(min_length=1)
    synonyms: list[str] = Field(default_factory=list)
    example_sentence: str = Field(min_length=1)


class ReviewPayload(BaseModel):
    knew_it: bool


class EnrichWordRequest(BaseModel):
    term: str = Field(min_length=1)


class EnrichWordResponse(BaseModel):
    term: str
    part_of_speech: str
    definition: str
    synonyms: list[str]
    example_sentence: str
