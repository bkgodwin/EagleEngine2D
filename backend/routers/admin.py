from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

import auth as auth_utils
from database import get_db
from models import Asset, MultiplayerSession, Project, PublishedGame, SystemSettings, User
from schemas import (
    GameOut,
    GameUpdate,
    SystemSettingsOut,
    SystemSettingsUpdate,
    SystemStats,
    UserOut,
    UserUpdate,
)
from routers.games import _game_out

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# System settings
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=SystemSettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    settings = db.query(SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not initialized")
    return settings


@router.patch("/settings", response_model=SystemSettingsOut)
def update_settings(
    payload: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    settings = db.query(SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not initialized")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/settings/toggle-registration", response_model=SystemSettingsOut)
def toggle_registration(
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    settings = db.query(SystemSettings).first()
    if not settings:
        raise HTTPException(status_code=500, detail="System settings not initialized")
    settings.registration_enabled = not settings.registration_enabled
    db.commit()
    db.refresh(settings)
    return settings


# ---------------------------------------------------------------------------
# System stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=SystemStats)
def get_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    total_storage = db.query(func.sum(User.storage_used)).scalar() or 0
    return SystemStats(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),  # noqa: E712
        total_projects=db.query(Project).count(),
        total_assets=db.query(Asset).count(),
        total_published_games=db.query(PublishedGame).count(),
        active_multiplayer_sessions=db.query(MultiplayerSession).filter(
            MultiplayerSession.is_active == True  # noqa: E712
        ).count(),
        total_storage_used_bytes=int(total_storage),
    )


# ---------------------------------------------------------------------------
# User management (admin shortcuts – full CRUD is in /api/users)
# ---------------------------------------------------------------------------

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(auth_utils.get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Content moderation
# ---------------------------------------------------------------------------

@router.get("/games", response_model=List[GameOut])
def list_all_games(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    games = db.query(PublishedGame).offset(skip).limit(limit).all()
    return [_game_out(g) for g in games]


@router.patch("/games/{game_id}", response_model=GameOut)
def moderate_game(
    game_id: int,
    payload: GameUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    game = db.query(PublishedGame).filter(PublishedGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(game, field, value)
    db.commit()
    db.refresh(game)
    return _game_out(game)


@router.delete("/games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(auth_utils.get_current_admin),
):
    game = db.query(PublishedGame).filter(PublishedGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    db.delete(game)
    db.commit()
