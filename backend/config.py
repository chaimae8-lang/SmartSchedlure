from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./alfarabi.db"
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    anthropic_api_key: str = ""
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    use_claude: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
