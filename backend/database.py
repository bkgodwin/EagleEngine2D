from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite only
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed defaults."""
    import models  # noqa: F401 – ensure models are registered
    Base.metadata.create_all(bind=engine)
    _seed_defaults()


def _seed_defaults():
    from models import User, SystemSettings
    from auth import hash_password
    from config import (
        DEFAULT_ADMIN_USERNAME,
        DEFAULT_ADMIN_EMAIL,
        DEFAULT_ADMIN_PASSWORD,
        DEFAULT_STORAGE_QUOTA_BYTES,
    )

    db = SessionLocal()
    try:
        # Create default admin if not present
        if not db.query(User).filter(User.username == DEFAULT_ADMIN_USERNAME).first():
            admin = User(
                username=DEFAULT_ADMIN_USERNAME,
                email=DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
                storage_quota=DEFAULT_STORAGE_QUOTA_BYTES,
                storage_used=0,
            )
            db.add(admin)

        # Create system settings row if not present
        if not db.query(SystemSettings).first():
            settings = SystemSettings(
                registration_enabled=True,
                max_upload_size_bytes=50 * 1024 * 1024,  # 50 MB per file
            )
            db.add(settings)

        db.commit()
    finally:
        db.close()
