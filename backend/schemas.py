from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Auth / User
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    storage_quota: Optional[int] = None  # bytes


class UserPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool
    is_active: bool
    storage_quota: int
    storage_used: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    data: Any = {}
    is_public: bool = False


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    data: Optional[Any] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    data: Any
    thumbnail_url: Optional[str]
    owner_id: int
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Asset
# ---------------------------------------------------------------------------

class AssetOut(BaseModel):
    id: int
    filename: str
    stored_filename: str
    asset_type: str
    mime_type: Optional[str]
    size_bytes: int
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Published Game
# ---------------------------------------------------------------------------

class GamePublish(BaseModel):
    project_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    tags: str = ""
    thumbnail_url: Optional[str] = None


class GameUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_hidden: Optional[bool] = None


class GameOut(BaseModel):
    id: int
    title: str
    description: str
    thumbnail_url: Optional[str]
    tags: str
    author_id: int
    author_username: Optional[str] = None
    is_featured: bool
    is_hidden: bool
    play_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GameDetailOut(GameOut):
    game_data: Any


# ---------------------------------------------------------------------------
# Multiplayer
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    game_id: Optional[int] = None
    max_players: int = Field(4, ge=2, le=6)


class SessionOut(BaseModel):
    id: int
    session_id: str
    game_id: Optional[int]
    host_id: Optional[int]
    max_players: int
    is_active: bool
    created_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Admin / System
# ---------------------------------------------------------------------------

class SystemSettingsOut(BaseModel):
    id: int
    registration_enabled: bool
    max_upload_size_bytes: int

    model_config = {"from_attributes": True}


class SystemSettingsUpdate(BaseModel):
    registration_enabled: Optional[bool] = None
    max_upload_size_bytes: Optional[int] = None


class SystemStats(BaseModel):
    total_users: int
    active_users: int
    total_projects: int
    total_assets: int
    total_published_games: int
    active_multiplayer_sessions: int
    total_storage_used_bytes: int
