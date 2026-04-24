import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import auth as auth_utils
from database import get_db
from models import Project, PublishedGame, User
from schemas import GameDetailOut, GameOut, GamePublish, GameUpdate

router = APIRouter(prefix="/api/games", tags=["games"])


def _game_out(game: PublishedGame, detail: bool = False):
    author_username = game.author.username if game.author else None
    base = dict(
        id=game.id,
        title=game.title,
        description=game.description or "",
        thumbnail_url=game.thumbnail_url,
        tags=game.tags or "",
        author_id=game.author_id,
        author_username=author_username,
        is_featured=game.is_featured,
        is_hidden=game.is_hidden,
        play_count=game.play_count,
        created_at=game.created_at,
        updated_at=game.updated_at,
    )
    if detail:
        try:
            game_data = json.loads(game.game_data) if game.game_data else {}
        except (ValueError, TypeError):
            game_data = {}
        return GameDetailOut(**base, game_data=game_data)
    return GameOut(**base)


# ---------------------------------------------------------------------------
# Public endpoints (no auth required)
# ---------------------------------------------------------------------------

@router.get("/public", response_model=List[GameOut])
def list_public_games(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(PublishedGame).filter(PublishedGame.is_hidden == False)  # noqa: E712
    if search:
        like = f"%{search}%"
        query = query.filter(
            PublishedGame.title.ilike(like) | PublishedGame.description.ilike(like)
        )
    if tag:
        query = query.filter(PublishedGame.tags.ilike(f"%{tag}%"))
    if featured is not None:
        query = query.filter(PublishedGame.is_featured == featured)
    return [_game_out(g) for g in query.offset(skip).limit(limit).all()]


@router.get("/public/{game_id}", response_model=GameDetailOut)
def get_public_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(PublishedGame).filter(
        PublishedGame.id == game_id, PublishedGame.is_hidden == False  # noqa: E712
    ).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    game.play_count += 1
    db.commit()
    db.refresh(game)
    return _game_out(game, detail=True)


# ---------------------------------------------------------------------------
# Authenticated endpoints
# ---------------------------------------------------------------------------

@router.post("/publish", response_model=GameOut, status_code=status.HTTP_201_CREATED)
def publish_game(
    payload: GamePublish,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    game = PublishedGame(
        title=payload.title,
        description=payload.description,
        thumbnail_url=payload.thumbnail_url,
        game_data=project.data,
        tags=payload.tags,
        author_id=current_user.id,
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return _game_out(game)


@router.get("/my", response_model=List[GameOut])
def my_games(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    games = (
        db.query(PublishedGame)
        .filter(PublishedGame.author_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_game_out(g) for g in games]


@router.patch("/{game_id}", response_model=GameOut)
def update_game(
    game_id: int,
    payload: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    game = db.query(PublishedGame).filter(PublishedGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = payload.model_dump(exclude_none=True)
    # Only admins may set is_featured / is_hidden via this endpoint
    if not current_user.is_admin:
        update_data.pop("is_featured", None)
        update_data.pop("is_hidden", None)

    for field, value in update_data.items():
        setattr(game, field, value)
    db.commit()
    db.refresh(game)
    return _game_out(game)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    game = db.query(PublishedGame).filter(PublishedGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if game.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    db.delete(game)
    db.commit()
