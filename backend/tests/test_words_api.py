from datetime import UTC, datetime

from fastapi.testclient import TestClient


def _create_word(client: TestClient, term: str = "ephemeral") -> dict:
    response = client.post(
        "/api/words",
        json={
            "term": term,
            "part_of_speech": "adjective",
            "definition": "lasting a very short time",
            "synonyms": ["fleeting", "transient"],
            "example_sentence": "The ephemeral beauty of cherry blossoms draws crowds each spring.",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_word_initializes_srs_defaults(client: TestClient):
    created = _create_word(client)

    assert created["status"] == "new"
    assert created["ease_factor"] == 2.5
    assert created["interval_days"] == 0
    assert created["repetitions"] == 0
    assert created["next_review_at"] is None


def test_create_word_rejects_duplicate_term(client: TestClient):
    _create_word(client, "ephemeral")
    response = client.post(
        "/api/words",
        json={
            "term": "EPHEMERAL",
            "part_of_speech": "adjective",
            "definition": "duplicate",
            "example_sentence": "duplicate sentence.",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "A word with this term already exists."


def test_list_words_returns_all_words(client: TestClient):
    _create_word(client, "alpha")
    _create_word(client, "beta")

    response = client.get("/api/words")

    assert response.status_code == 200
    terms = [word["term"] for word in response.json()]
    assert terms == ["alpha", "beta"]


def test_due_words_returns_new_and_overdue_words(client: TestClient):
    created = _create_word(client, "due-word")
    future = _create_word(client, "future-word")

    review_response = client.post(
        f"/api/words/{future['id']}/review",
        json={"knew_it": True},
    )
    assert review_response.status_code == 200

    response = client.get("/api/words/due?limit=20")

    assert response.status_code == 200
    due_terms = [word["term"] for word in response.json()]
    assert "due-word" in due_terms
    assert "future-word" not in due_terms


def test_review_updates_srs_fields(client: TestClient):
    created = _create_word(client, "review-word")

    response = client.post(
        f"/api/words/{created['id']}/review",
        json={"knew_it": True},
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "learning"
    assert updated["repetitions"] == 1
    assert updated["interval_days"] == 1
    assert updated["next_review_at"] is not None


def test_review_returns_404_for_missing_word(client: TestClient):
    response = client.post("/api/words/missing/review", json={"knew_it": True})

    assert response.status_code == 404
