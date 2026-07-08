"""
WebSocket Connection Manager — broadcasts order status updates to connected clients.
"""
from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    """Manages WebSocket connections keyed by order_id."""

    def __init__(self):
        # order_id -> list of connected websockets
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self._connections:
            self._connections[order_id] = []
        self._connections[order_id].append(websocket)

    def disconnect(self, websocket: WebSocket, order_id: str):
        if order_id in self._connections:
            try:
                self._connections[order_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[order_id]:
                del self._connections[order_id]

    async def broadcast_order_update(self, order_id: str, payload: dict):
        """Send a JSON update to all clients watching this order."""
        if order_id not in self._connections:
            return
        dead: List[WebSocket] = []
        for ws in list(self._connections[order_id]):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, order_id)


# Singleton — imported by routes
manager = ConnectionManager()
