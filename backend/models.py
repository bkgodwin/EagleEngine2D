import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    storage_quota = Column(BigInteger, nullable=False)  # bytes
    storage_used = Column(BigInteger, default=0, nullable=False)  # bytes
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="owner", cascade="all, delete-orphan")
    published_games = relationship("PublishedGame", back_populates="author", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    data = Column(Text, default="{}")          # JSON blob (scenes, settings, etc.)
    thumbnail_url = Column(String(512), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="projects")


class AssetTypeEnum(str, enum.Enum):
    image = "image"
    audio = "audio"
    font = "font"
    data = "data"
    shader = "shader"
    other = "other"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(512), nullable=False)          # original filename
    stored_filename = Column(String(512), nullable=False)   # UUID-based on-disk name
    asset_type = Column(Enum(AssetTypeEnum), default=AssetTypeEnum.other, nullable=False)
    mime_type = Column(String(128), nullable=True)
    size_bytes = Column(BigInteger, default=0, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="assets")


class PublishedGame(Base):
    __tablename__ = "published_games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    thumbnail_url = Column(String(512), nullable=True)
    game_data = Column(Text, default="{}")  # full project JSON snapshot
    tags = Column(String(512), default="")  # comma-separated
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)  # moderation flag
    play_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="published_games")


class MultiplayerSession(Base):
    __tablename__ = "multiplayer_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    game_id = Column(Integer, ForeignKey("published_games.id", ondelete="SET NULL"), nullable=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    max_players = Column(Integer, default=4, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    ended_at = Column(DateTime, nullable=True)


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    registration_enabled = Column(Boolean, default=True, nullable=False)
    max_upload_size_bytes = Column(BigInteger, default=50 * 1024 * 1024, nullable=False)
