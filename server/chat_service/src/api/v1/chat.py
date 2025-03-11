import json
import logging
from http import HTTPStatus

from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect, HTTPException

from chat_service.src.services.blacklist import BlacklistService, get_blacklist_service
from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.services.message import MessageService, get_message_service
from chat_service.src.services.room import RoomService, get_room_service
from chat_service.src.services.send import get_send_service, SendService
from chat_service.src.core.config import get_global_settings
from chat_service.src.utils.messages import ErrorMessages

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
        send_service: SendService = Depends(get_send_service),
        message_service: MessageService = Depends(get_message_service),
        blacklist_service: BlacklistService = Depends(get_blacklist_service)
) -> None:
    logger.debug(f'Client handshake request {websocket.__dict__}')

    headers = websocket.scope.get('headers')
    real_ip = next((value for key, value in headers if key == b'x-real-ip'), None)
    if real_ip:
        user_ip = real_ip.decode()
    else:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail='Missing client address')

    if settings.debug:
        user_ip += f':{websocket.client.port}'

    await connection_service.connect(user_ip, websocket)

    if await blacklist_service.check_blacklist(user_ip):
        await message_service.notify_of_blocking(user_ip)
        logger.info(f'Blacklisted user {user_ip} trued to connect to {chat_group}')
        await connection_service.delete_user_connection(user_ip)
        return

    try:
        await room_service.connect_room(user_ip, chat_group)

        while True:
            data = await websocket.receive()
            if data.get('text'):
                try:
                    json_data = json.loads(data['text'])
                    action = json_data.get('action')
                    if action == 'report':
                        chatmate_ip = await room_service.get_chatmate_ip(user_ip)
                        await blacklist_service.report(user_ip, chatmate_ip)
                    elif action == 'send':
                        await message_service.send_message(user_ip, data['text'])
                    else:
                        await send_service.send(
                            user_ip=user_ip,
                            data={
                                'status': ErrorMessages.UNSUPPORTED_ACTION.status,
                                'detail': ErrorMessages.UNSUPPORTED_ACTION.detail
                            }
                        )
                        logger.error(f'User {user_ip} send not supported action: {action}')
                except json.JSONDecodeError:
                    logger.error(f'User {user_ip} send not JSON serializable data: {data["text"]}')
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
        await room_service.leave_room(user_ip)
