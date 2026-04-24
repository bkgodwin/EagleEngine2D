import asyncio
import json
import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    """Manages WebSocket connections grouped by multiplayer session rooms."""

    def __init__(self):
        # session_id -> list of (websocket, player_info)
        self._rooms: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, session_id: str, websocket: WebSocket, player_info: dict) -> bool:
        """Accept the connection and add to room. Returns False if room is full."""
        from config import MAX_PLAYERS_PER_SESSION

        await websocket.accept()
        async with self._lock:
            room = self._rooms[session_id]
            if len(room) >= MAX_PLAYERS_PER_SESSION:
                await websocket.send_json({"type": "error", "message": "Room is full"})
                await websocket.close(code=1008)
                return False
            room.append({"ws": websocket, "player": player_info})

        await self.broadcast(
            session_id,
            {"type": "player_joined", "player": player_info, "room_size": len(self._rooms[session_id])},
            exclude=websocket,
        )
        # Send current room state to the new player
        await websocket.send_json({
            "type": "room_state",
            "players": [c["player"] for c in self._rooms[session_id]],
        })
        return True

    async def disconnect(self, session_id: str, websocket: WebSocket):
        async with self._lock:
            room = self._rooms.get(session_id, [])
            remaining = [c for c in room if c["ws"] is not websocket]
            player_info = next((c["player"] for c in room if c["ws"] is websocket), None)
            if remaining:
                self._rooms[session_id] = remaining
            elif session_id in self._rooms:
                del self._rooms[session_id]

        if player_info:
            await self.broadcast(
                session_id,
                {"type": "player_left", "player": player_info, "room_size": len(self._rooms.get(session_id, []))},
            )

    # ------------------------------------------------------------------
    # Messaging
    # ------------------------------------------------------------------

    async def broadcast(self, session_id: str, message: dict, exclude: Optional[WebSocket] = None):
        """Send message to all connections in a room, optionally excluding one."""
        room = list(self._rooms.get(session_id, []))
        dead: List[WebSocket] = []
        for conn in room:
            ws: WebSocket = conn["ws"]
            if ws is exclude:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(session_id, ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as exc:
            logger.warning("Failed to send personal message: %s", exc)

    # ------------------------------------------------------------------
    # Inspection
    # ------------------------------------------------------------------

    def get_room_size(self, session_id: str) -> int:
        return len(self._rooms.get(session_id, []))

    def active_sessions(self) -> List[str]:
        return list(self._rooms.keys())


manager = ConnectionManager()
