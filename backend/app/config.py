from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://vocab:vocab@localhost:5433/vocab_cards"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"


settings = Settings()
