import json
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError

from app.config import settings
from app.schemas.word import EnrichWordResponse


class _OllamaCardFields(BaseModel):
    part_of_speech: str = Field(min_length=1)
    definition: str = Field(min_length=1)
    synonyms: list[str] = Field(min_length=1)
    example_sentence: str = Field(min_length=1)


ENRICH_PROMPT = """You are a vocabulary flashcard assistant.
Given the English word "{term}", return JSON with exactly these keys:
- part_of_speech: lowercase part of speech (noun, verb, adjective, adverb, etc.)
- definition: a concise dictionary-style definition
- synonyms: array of 2 to 4 synonym strings
- example_sentence: one natural English sentence that uses the word

Return only valid JSON, no markdown."""

STRICT_ENRICH_PROMPT = """Return only a JSON object with keys part_of_speech, definition, synonyms, example_sentence for the word "{term}".
synonyms must be a JSON array of strings. No markdown fences or extra text."""


async def _call_ollama(prompt: str) -> str:
    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Ollama is unreachable. Start Ollama and pull a model.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Ollama request failed.",
        ) from exc

    data = response.json()
    text = data.get("response", "")
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=502, detail="Ollama returned an empty response.")
    return text


def _parse_card_fields(raw: str) -> _OllamaCardFields:
    try:
        parsed: Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("invalid json") from exc

    return _OllamaCardFields.model_validate(parsed)


async def enrich_word(term: str) -> EnrichWordResponse:
    normalized_term = term.strip()
    prompts = [
        ENRICH_PROMPT.format(term=normalized_term),
        STRICT_ENRICH_PROMPT.format(term=normalized_term),
    ]

    last_error: Exception | None = None
    for prompt in prompts:
        raw = await _call_ollama(prompt)
        try:
            fields = _parse_card_fields(raw)
            return EnrichWordResponse(
                term=normalized_term,
                part_of_speech=fields.part_of_speech.strip().lower(),
                definition=fields.definition.strip(),
                synonyms=[synonym.strip() for synonym in fields.synonyms if synonym.strip()],
                example_sentence=fields.example_sentence.strip(),
            )
        except (ValidationError, ValueError) as exc:
            last_error = exc
            continue

    raise HTTPException(
        status_code=502,
        detail="Ollama returned unparseable JSON after retry.",
    ) from last_error
