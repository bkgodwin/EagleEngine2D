import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from auth import get_user_from_token
import auth as auth_utils
from config import MAX_PLAYERS_PER_SESSION, MIN_PLAYERS_PER_SESSION
from database import get_db
from models import MultiplayerSession, User
from schemas import SessionCreate, SessionOut
from websocket_manager import manager

logger = logging.getLogger("multiplayer")
router = APIRouter(tags=["multiplayer"])


# ---------------------------------------------------------------------------
# REST: Session management
# ---------------------------------------------------------------------------

@router.get("/api/sessions/", response_model=List[SessionOut])
def list_sessions(
    active_only: bool = True,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    query = db.query(MultiplayerSession)
    if active_only:
        query = query.filter(MultiplayerSession.is_active == True)  # noqa: E712
    if not current_user.is_admin:
        query = query.filter(MultiplayerSession.host_id == current_user.id)
    return query.offset(skip).limit(limit).all()


@router.post("/api/sessions/", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    if not (MIN_PLAYERS_PER_SESSION <= payload.max_players <= MAX_PLAYERS_PER_SESSION):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"max_players must be between {MIN_PLAYERS_PER_SESSION} and {MAX_PLAYERS_PER_SESSION}",
        )
    session = MultiplayerSession(
        session_id=uuid.uuid4().hex,
        game_id=payload.game_id,
        host_id=current_user.id,
        max_players=payload.max_players,
        is_active=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/api/sessions/{session_id}", response_model=SessionOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    session = db.query(MultiplayerSession).filter(MultiplayerSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def close_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    session = db.query(MultiplayerSession).filter(MultiplayerSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.host_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    session.is_active = False
    session.ended_at = datetime.now(timezone.utc)
    db.commit()


# ---------------------------------------------------------------------------
# WebSocket: Real-time multiplayer
# ---------------------------------------------------------------------------

@router.websocket("/ws/multiplayer/{session_id}")
async def multiplayer_ws(
    session_id: str,
    websocket: WebSocket,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time multiplayer communication.

    Query param: ?token=<JWT>

    Message types received from client:
      - position_update  : { type, x, y, player_id }
      - game_event       : { type, event_name, payload }
      - chat             : { type, message }
      - ping             : { type }

    Message types broadcast to room:
      - player_joined    : { type, player, room_size }
      - player_left      : { type, player, room_size }
      - position_update  : forwarded to all others
      - game_event       : forwarded to all others
      - chat             : forwarded to all with sender info
      - pong             : { type } – sent only to sender
      - room_state       : { type, players } – sent on join
      - error            : { type, message }
    """
    # Authenticate via query param token
    if not token:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Authentication token required"})
        await websocket.close(code=1008)
        return

    try:
        user = get_user_from_token(token, db)
    except HTTPException:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Invalid or expired token"})
        await websocket.close(code=1008)
        return

    if not user.is_active:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Account inactive"})
        await websocket.close(code=1008)
        return

    # Verify session exists and is active
    db_session = (
        db.query(MultiplayerSession)
        .filter(MultiplayerSession.session_id == session_id, MultiplayerSession.is_active == True)  # noqa: E712
        .first()
    )
    if not db_session:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Session not found or inactive"})
        await websocket.close(code=1008)
        return

    player_info = {"id": user.id, "username": user.username}
    connected = await manager.connect(session_id, websocket, player_info)
    if not connected:
        return

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                await manager.send_personal(websocket, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await manager.send_personal(websocket, {"type": "pong"})

            elif msg_type == "position_update":
                # Enrich with sender info and broadcast
                msg["player_id"] = user.id
                msg["username"] = user.username
                await manager.broadcast(session_id, msg, exclude=websocket)

            elif msg_type == "game_event":
                msg["sender_id"] = user.id
                msg["sender_username"] = user.username
                await manager.broadcast(session_id, msg, exclude=websocket)

            elif msg_type == "chat":
                text = str(msg.get("message", ""))[:500]  # cap message length
                await manager.broadcast(
                    session_id,
                    {
                        "type": "chat",
                        "sender_id": user.id,
                        "sender_username": user.username,
                        "message": text,
                    },
                )

            else:
                await manager.send_personal(
                    websocket, {"type": "error", "message": f"Unknown message type: {msg_type}"}
                )

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.exception("Unexpected error in WebSocket handler for session %s: %s", session_id, exc)
    finally:
        await manager.disconnect(session_id, websocket)
