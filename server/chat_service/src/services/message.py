import logging
import imghdr
from functools import lru_cache

from fastapi import Depends

from chat_service.src.data import active_rooms, active_connections
from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.utils.messages import ErrorMessages

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class MessageService:
    def __init__(self, connection_service: ConnectionService):
        self.connection_service = connection_service

    @staticmethod
    async def broadcast(room_id: str, data: object, data_type: str = 'text') -> None:
        user_ips = active_rooms.get(room_id, None)

        if user_ips:
            for user_ip in user_ips:
                websocket = active_connections[user_ip]['websocket']
                match data_type:
                    case 'text':
                        await websocket.send_text(data)
                    case 'json':
                        await websocket.send_json(data)
                    case 'bytes':
                        await websocket.send_bytes(data)
                    case _:
                        logger.error(f'Unsupported data type: {data_type}; room: {room_id}')

    async def send_message(self, user_ip: str, message: str) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not user_connection:
            return

        logger.info(f'Send message user_ip: {user_ip}, message: {message}')
        await self.broadcast(room_id=user_connection['room_id'], data=message)

    async def send_file(self, user_ip: str, data: bytes) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not user_connection:
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
