from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def test_admin_can_list_users(admin_token: str, client: TestClient, test_user):
    response = client.get("/api/admin/users", headers=auth_headers(admin_token))

    assert response.status_code == 200
    users = response.json()
    emails = [user["email"] for user in users]
    assert test_user.email in emails
    assert any(user["role"] == "admin" for user in users)
    assert all("word_count" in user and "due_count" in user for user in users)


def test_regular_user_cannot_access_admin(auth_token: str, client: TestClient):
    response = client.get("/api/admin/users", headers=auth_headers(auth_token))
    assert response.status_code == 403
