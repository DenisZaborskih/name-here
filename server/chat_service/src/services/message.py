import logging
import imghdr
from functools import lru_cache

from fastapi import Depends, WebSocket

from chat_service.src.data import active_rooms
from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.utils.messages import ErrorMessages, Messages

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class MessageService:
    def __init__(self, connection_service: ConnectionService):
        self.connection_service = connection_service

    async def broadcast(self, room_id: str, data: object, data_type: str = 'text') -> None:
        user_ips = active_rooms.get(room_id)

        if user_ips:
            for user_ip in user_ips:
                user_connection = await self.connection_service.get_user_connection(user_ip)
                websocket = user_connection['websocket']
                match data_type:
                    case 'text':
                        await websocket.send_text(data)
                    case 'json':
                        await websocket.send_json(data)
                    case 'bytes':
                        await websocket.send_bytes(data)
                    case _:
                        logger.error(f'Unsupported data type: {data_type}; room: {room_id}')

    async def get_recipient(self, user_ip: str, room_id: str | None = None) -> dict[str, str | WebSocket] | None:
        if not room_id:
            user_connection = await self.connection_service.get_user_connection(user_ip)
            room_id = user_connection['room_id']

        user_ips = active_rooms.get(room_id)
        recipient_ip = next(ip for ip in user_ips if ip != user_ip)
        recipient_connection = await self.connection_service.get_user_connection(recipient_ip)
        if not recipient_connection or recipient_connection['room_id'] != room_id:
            return None

        return recipient_connection

    async def _validate_send_conditions(self, user_ip: str, user_connection: dict) -> bool:
        room_id = user_connection['room_id']
        if not room_id:
            await user_connection['websocket'].send_json(data={'status': ErrorMessages.ROOM_NOT_FOUND.status,
                                                               'detail': ErrorMessages.ROOM_NOT_FOUND.detail})
            return False
        if not await self.get_recipient(user_ip, room_id):
            await user_connection['websocket'].send_json(data={'status': Messages.PARTICIPANT_LEFT.status,
                                                               'detail': Messages.PARTICIPANT_LEFT.detail})
            return False
        return True

    async def send_message(self, user_ip: str, message: str) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not user_connection:
            return
        if not await self._validate_send_conditions(user_ip, user_connection):
            return

        logger.info(f'Send message user_ip: {user_ip}, message: {message}')
        await self.broadcast(room_id=user_connection['room_id'], data=message)

    async def send_file(self, user_ip: str, data: bytes) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not user_connection:
            return
        if not await self._validate_send_conditions(user_ip, user_connection):
            return

        image_type = imghdr.what(None, data)
        if image_type:
            logger.debug(f'Client {user_ip} sent {image_type} image: {data}')
            await self.broadcast(room_id=user_connection['room_id'], data=data, data_type='bytes')
        else:
            logger.info(f'Client {user_ip} sent a non-image file')
            await user_connection['websocket'].send_json(data={'status': ErrorMessages.INVALID_FILE_FORMAT.status,
                                                               'detail': ErrorMessages.INVALID_FILE_FORMAT.detail})


@lru_cache()
def get_message_service(
        connection_service: ConnectionService = Depends(get_connection_service)
) -> MessageService:
    return MessageService(connection_service)
