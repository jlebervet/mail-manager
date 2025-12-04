from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    MONGO_URL: str
    DB_NAME: str
    CORS_ORIGINS: str = "*"
    AZURE_TENANT_ID: str
    AZURE_CLIENT_ID: str
    AZURE_SCOPE: str
    
    @property
    def SCOPE_DESCRIPTION(self) -> str:
        return "Access API as user"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
