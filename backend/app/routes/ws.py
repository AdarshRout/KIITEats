"""
WebSocket route — allows clients to subscribe to live order status updates.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from bson import ObjectId
from app.core.database import get_database
from app.core.ws_manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/orders/{order_id}")
async def order_status_ws(
    websocket: WebSocket,
    order_id: str,
    db=Depends(get_database),
):
    """
    WebSocket endpoint. The client connects here to receive real-time
    status updates for a specific order.

    On connect, sends the current order state immediately.
    Thereafter, receives push notifications whenever the order changes.
    """
    await manager.connect(websocket, order_id)
    try:
        # Send latest order state on connect
        if ObjectId.is_valid(order_id):
            order = await db.orders.find_one({"_id": ObjectId(order_id)})
            if order:
                order["_id"] = str(order["_id"])
                await websocket.send_json({
                    "type": "order_update",
                    "order_id": order_id,
                    "status": order.get("status"),
                    "payment_status": order.get("payment_status"),
                    "token_number": order.get("token_number"),
                    "verification_id": order.get("verification_id"),
                })

        # Keep connection alive, waiting for disconnect
        while True:
            # We don't expect messages from client, but we need to keep reading
            # to detect disconnects
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket, order_id)
