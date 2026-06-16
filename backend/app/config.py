from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://vocab:vocab@localhost:5433/vocab_cards"
    cors_origins: str = "http://localhost:5173"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if (
            isinstance(value, str)
            and value.startswith("postgresql://")
            and "+psycopg" not in value
        ):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
