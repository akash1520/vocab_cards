from fastapi.testclient import TestClient

from app.services.jwt import create_access_token
from app.services.passwords import hash_password
from tests.conftest import auth_headers


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


def test_list_words_requires_auth(client: TestClient):
    response = client.get("/api/words")
    assert response.status_code == 401


def test_create_word_initializes_srs_defaults(authed_client: TestClient):
    created = _create_word(authed_client)

    assert created["status"] == "new"
    assert created["ease_factor"] == 2.5
    assert created["interval_days"] == 0
    assert created["repetitions"] == 0
    assert created["next_review_at"] is None


def test_create_word_rejects_duplicate_term(authed_client: TestClient):
    _create_word(authed_client, "ephemeral")
    response = authed_client.post(
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


def test_list_words_returns_all_words(authed_client: TestClient):
    _create_word(authed_client, "alpha")
    _create_word(authed_client, "beta")

    response = authed_client.get("/api/words")

    assert response.status_code == 200
    terms = [word["term"] for word in response.json()]
    assert terms == ["alpha", "beta"]


def test_due_words_returns_new_and_overdue_words(authed_client: TestClient):
    _create_word(authed_client, "due-word")
    future = _create_word(authed_client, "future-word")

    review_response = authed_client.post(
        f"/api/words/{future['id']}/review",
        json={"knew_it": True},
    )
    assert review_response.status_code == 200

    response = authed_client.get("/api/words/due?limit=20")

    assert response.status_code == 200
    due_terms = [word["term"] for word in response.json()]
    assert "due-word" in due_terms
    assert "future-word" not in due_terms


def test_review_updates_srs_fields(authed_client: TestClient):
    created = _create_word(authed_client, "review-word")

    response = authed_client.post(
        f"/api/words/{created['id']}/review",
        json={"knew_it": True},
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "learning"
    assert updated["repetitions"] == 1
    assert updated["interval_days"] == 1
    assert updated["next_review_at"] is not None


def test_review_returns_404_for_missing_word(authed_client: TestClient):
    response = authed_client.post("/api/words/missing/review", json={"knew_it": True})

    assert response.status_code == 404


def test_words_are_isolated_between_users(
    user_repo,
    test_user,
    client: TestClient,
    auth_token: str,
):
    from app.main import app

    other_user = user_repo.create("other@example.com", hash_password("password123"), role="user")
    other_token = create_access_token(other_user.id)

    other_client = TestClient(app)
    other_client.headers.update(auth_headers(other_token))
    _create_word(other_client, "shared-term")

    client.headers.update(auth_headers(auth_token))
    created = _create_word(client, "shared-term")
    assert created["term"] == "shared-term"

    listed = client.get("/api/words").json()
    assert len(listed) == 1
    assert listed[0]["term"] == "shared-term"
