from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_service_key: str = "placeholder-service-key"
    supabase_jwt_secret: str = "placeholder-jwt-secret"
    database_url: str = ""
    firebase_credentials: str = "firebase-service-account.json"
    vapid_private_key: str = ""
    cors_origins: str = "http://localhost:5173"

    @property
    def has_database(self) -> bool:
        return bool(self.database_url) and self.database_url != ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
