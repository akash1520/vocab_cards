from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_register_and_login(client: TestClient):
    register_response = client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "password": "password123"},
    )
    assert register_response.status_code == 201
    assert register_response.json()["email"] == "newuser@example.com"
    assert register_response.json()["role"] == "user"

    login_response = client.post(
        "/api/auth/login",
        data={"username": "newuser@example.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/auth/me", headers=auth_headers(token))
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "newuser@example.com"


def test_register_rejects_duplicate_email(client: TestClient):
    payload = {"email": "duplicate@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_login_rejects_invalid_credentials(client: TestClient, test_user):
    response = client.post(
        "/api/auth/login",
        data={"username": test_user.email, "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_me_requires_auth(client: TestClient):
    assert client.get("/api/auth/me").status_code == 401
