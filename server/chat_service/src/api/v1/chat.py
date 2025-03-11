import logging
from random import choice
from http import HTTPStatus

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, HTTPException

from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.services.message import MessageService, get_message_service
from chat_service.src.services.room import RoomService, get_room_service
from chat_service.src.core.config import get_global_settings

settings = get_global_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket('/ws/{chat_group}')
async def websocket_chat(
        websocket: WebSocket,
        chat_group: str,
        room_service: RoomService = Depends(get_room_service),
        connection_service: ConnectionService = Depends(get_connection_service),
        message_service: MessageService = Depends(get_message_service)
) -> None:
    if not websocket.client:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail='Missing client address')

    user_ip = websocket.client.host
    if settings.debug:
        user_ip += choice('qwertyuikopasdfghjklzxcvbnm')

    await connection_service.connect(user_ip, websocket)

    try:
        await room_service.connect_room(user_ip, chat_group)

        while True:
            data = await websocket.receive()
            if data.get('text'):
                await message_service.send_message(user_ip, data['text'])
            elif data.get('bytes'):
                logger.info(f'Client {user_ip} sent a binary message')
                await message_service.send_file(user_ip, data['bytes'])
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
        await room_service.close_user_room(user_ip)
