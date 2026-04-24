import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = os.getenv("SECRET_KEY", "eagle-engine-2d-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/eagle_engine.db")

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

DEFAULT_STORAGE_QUOTA_BYTES = 500 * 1024 * 1024  # 500 MB

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_EMAIL = "admin@eagleengine.local"
DEFAULT_ADMIN_PASSWORD = "EagleAdmin2024!"

MAX_PLAYERS_PER_SESSION = 6
MIN_PLAYERS_PER_SESSION = 2

ALLOWED_ASSET_EXTENSIONS = {
    "image": {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"},
    "audio": {".mp3", ".wav", ".ogg", ".flac", ".aac"},
    "font":  {".ttf", ".otf", ".woff", ".woff2"},
    "data":  {".json", ".xml", ".csv", ".txt"},
    "shader": {".glsl", ".vert", ".frag"},
}

ALL_ALLOWED_EXTENSIONS: set[str] = set().union(*ALLOWED_ASSET_EXTENSIONS.values())
