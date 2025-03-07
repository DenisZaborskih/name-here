import logging
from random import choice
from http import HTTPStatus

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, HTTPException

from chat_service.src.services.chat import ChatService, get_chat_service
from chat_service.src.core.config import get_global_settings

settings = get_global_settings()

logging.basicConfig(filename='Chat.log', level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{chat_group}")
async def websocket_chat(
        websocket: WebSocket,
        chat_group: str,
        websocket_service: ChatService = Depends(get_chat_service)
):
    if not websocket.client:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Missing client address")

    user_ip = websocket.client.host
    if settings.debug:
        user_ip += choice('qwertyuikopasdfghjklzxcvbnm')

    await websocket_service.connect(user_ip, websocket)

    try:
        await websocket_service.connect_chat(user_ip, chat_group)
        while True:
            data = await websocket.receive_text()
            await websocket_service.send_message(user_ip, f"Client says: {data}")
    except WebSocketDisconnect:
        logger.info(f"Client {user_ip} disconnected from chat group {chat_group}")
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        await websocket_service.close_user_room(user_ip)
