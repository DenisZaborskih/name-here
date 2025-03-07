import logging
from random import choice
from http import HTTPStatus

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, HTTPException

from chat_service.src.services.chat import ChatService, get_chat_service
from chat_service.src.core.config import get_global_settings

settings = get_global_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket('/ws/{chat_group}')
async def websocket_chat(
        websocket: WebSocket,
        chat_group: str,
        websocket_service: ChatService = Depends(get_chat_service)
):
    if not websocket.client:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail='Missing client address')

    user_ip = websocket.client.host
    if settings.debug:
        user_ip += choice('qwertyuikopasdfghjklzxcvbnm')

    await websocket_service.connect(user_ip, websocket)

    try:
        await websocket_service.connect_chat(user_ip, chat_group)

        while True:
            data = await websocket.receive()
            if data.get('text'):
                await websocket_service.send_message(user_ip, data['text'])
            elif data.get('bytes'):
                logger.info(f'Client {user_ip} sent a binary message')
                await websocket_service.send_file(user_ip, data['bytes'])
            elif data.get('type') != 'websocket.disconnect':
                logger.error(f'Invalid message format from {user_ip}: {data}')
                await websocket.close(code=1008, reason='Invalid message format')

    except WebSocketDisconnect:
        logger.info(f'Client {user_ip} disconnected from chat group {chat_group}')
    except Exception as e:
        if 'Cannot call "receive" once a disconnect message has been received' in str(e):
            pass
        else:
            logger.error(f'Error: {e}')
    finally:
        await websocket_service.close_user_room(user_ip)
