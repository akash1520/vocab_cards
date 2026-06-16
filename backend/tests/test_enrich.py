from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi.testclient import TestClient


def test_enrich_word_returns_suggested_fields(client: TestClient):
    with patch(
        "app.services.ollama._call_ollama",
        new=AsyncMock(
            return_value='{"part_of_speech":"adjective","definition":"lasting a very short time","synonyms":["fleeting","transient"],"example_sentence":"The ephemeral beauty of cherry blossoms draws crowds each spring."}',
        ),
    ):
        response = client.post("/api/words/enrich", json={"term": "ephemeral"})

    assert response.status_code == 200
    body = response.json()
    assert body["term"] == "ephemeral"
    assert body["part_of_speech"] == "adjective"
    assert body["synonyms"] == ["fleeting", "transient"]


def test_enrich_word_returns_503_when_ollama_unreachable(client: TestClient):
    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=httpx.ConnectError("connection refused"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch("app.services.ollama.httpx.AsyncClient", return_value=mock_client):
        response = client.post("/api/words/enrich", json={"term": "ephemeral"})

    assert response.status_code == 503
    assert "Ollama is unreachable" in response.json()["detail"]


def test_enrich_word_returns_502_after_unparseable_json_retry(client: TestClient):
    with patch(
        "app.services.ollama._call_ollama",
        new=AsyncMock(return_value="not json"),
    ):
        response = client.post("/api/words/enrich", json={"term": "ephemeral"})

    assert response.status_code == 502
    assert "unparseable JSON" in response.json()["detail"]
