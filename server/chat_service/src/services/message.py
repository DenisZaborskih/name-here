import logging
import imghdr
from functools import lru_cache

from fastapi import Depends

from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.services.room import RoomService, get_room_service
from chat_service.src.services.send import SendService, get_send_service
from chat_service.src.utils.messages import ErrorMessages, Messages

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class MessageService:
    def __init__(self, connection_service: ConnectionService, send_service: SendService, room_service: RoomService):
        self.connection_service = connection_service
        self.send_service = send_service
        self.room_service = room_service

    async def _room_exist(self, user_connection: dict) -> bool:
        room_id = user_connection['room_id']
        if not room_id:
            await self.send_service.send(
                websocket=user_connection['websocket'],
                data={'status': ErrorMessages.ROOM_NOT_FOUND.status,
                      'detail': ErrorMessages.ROOM_NOT_FOUND.detail}
            )
            return False
        return True

    async def _chatmate_exist(self, user_connection: dict, chatmate_connection: dict) -> bool:
        if not chatmate_connection:
            await self.send_service.send(
                websocket=user_connection['websocket'],
                data={'status': Messages.PARTICIPANT_LEFT.status,
                      'detail': Messages.PARTICIPANT_LEFT.detail}
            )
            return False
        return True

    async def send_message(self, user_ip: str, message: str) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not await self._room_exist(user_connection):
            return
        chatmate_connection = await self.room_service.get_active_chatmate(user_ip, user_connection['room_id'])
        if not await self._chatmate_exist(user_connection, chatmate_connection):
            return

        logger.info(f'Send message user_ip: {user_ip}, message: {message}')
        await self.send_service.send(data=message, data_type='text', websocket=chatmate_connection['websocket'])
        await self.send_service.send(
            data={'status': Messages.SENT.status,
                  'detail': Messages.SENT.detail},
            data_type='json',
            websocket=user_connection['websocket']
        )

    async def send_file(self, user_ip: str, data: bytes) -> None:
        user_connection = await self.connection_service.get_user_connection(user_ip)
        if not await self._room_exist(user_connection):
            return
        chatmate_connection = await self.room_service.get_active_chatmate(user_ip, user_connection['room_id'])
        if not await self._chatmate_exist(user_connection, chatmate_connection):
            return

        image_type = imghdr.what(None, data)
        if image_type:
            logger.debug(f'Client {user_ip} sent {image_type} of size {len(data)} bytes, image: {data!r}')
            await self.send_service.send(data=data, data_type='bytes', websocket=chatmate_connection['websocket'])
            await self.send_service.send(
                data={'status': Messages.SENT.status,
                      'detail': Messages.SENT.detail},
                data_type='json',
                websocket=user_connection['websocket']
            )
        else:
            logger.info(f'Client {user_ip} sent a non-image file')
            await self.send_service.send(
                websocket=user_connection['websocket'],
                data={'status': ErrorMessages.INVALID_FILE_FORMAT.status,
                      'detail': ErrorMessages.INVALID_FILE_FORMAT.detail}
            )

    async def notify_of_blocking(self, user_ip: str) -> None:
        await self.send_service.send(
            data={'status': ErrorMessages.IP_IS_BLACKLISTED.status,
                  'detail': ErrorMessages.IP_IS_BLACKLISTED.detail},
            data_type='json',
            user_ip=user_ip
        )


@lru_cache()
def get_message_service(
        connection_service: ConnectionService = Depends(get_connection_service),
        send_service: SendService = Depends(get_send_service),
        room_service: RoomService = Depends(get_room_service)
) -> MessageService:
    return MessageService(connection_service, send_service, room_service)
