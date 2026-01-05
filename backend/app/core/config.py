from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "egouda.xyz Backend"
    API_V1_STR: str = "/api/v1"
    LOCAL: bool = False

    # Database
    DATABASE_URL: str = "postgresql://app:changeme@localhost:5432/egoudaxyz"

    # AI Provider settings
    PYDANTIC_AI_GATEWAY_API_KEY: str = ""
    MONITOR_MODEL: str = "gateway/google-vertex:gemini-2.5-flash"

    # Logfire observability
    LOGFIRE_TOKEN: str = ""

    # Scheduler settings
    MONITOR_INTERVAL_MINUTES: int = 15

    # CORS - allow all origins in dev
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
