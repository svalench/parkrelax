import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Project root is one level up from backend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    app_id: str = ""
    app_secret: str = ""
    database_url: str = ""
    kimi_auth_url: str = ""
    kimi_open_url: str = ""
    owner_union_id: str = ""
    node_env: str = "development"

    class Config:
        env_file = str(PROJECT_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def is_production(self) -> bool:
        return self.node_env == "production"

    def _clean_url(self, url: str) -> str:
        # Strip inline comments that some .env files leave behind
        url = url.split("#")[0].strip()
        return url

    @property
    def async_database_url(self) -> str:
        url = self._clean_url(self.database_url)
        if url:
            # Convert sync MySQL URL to async
            if url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+asyncmy://", 1)
            elif url.startswith("mysql+mysqlconnector://"):
                url = url.replace("mysql+mysqlconnector://", "mysql+asyncmy://", 1)
            elif url.startswith("mysql+pymysql://"):
                url = url.replace("mysql+pymysql://", "mysql+asyncmy://", 1)
            return url
        # Default to SQLite in project root
        db_path = PROJECT_ROOT / "local.db"
        return f"sqlite+aiosqlite:///{db_path}"

    @property
    def sync_database_url(self) -> str:
        url = self.async_database_url
        if url.startswith("sqlite+aiosqlite://"):
            return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
        if url.startswith("mysql+asyncmy://"):
            return url.replace("mysql+asyncmy://", "mysql+pymysql://", 1)
        return url


settings = Settings()
