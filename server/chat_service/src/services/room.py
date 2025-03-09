import logging
import uuid
from functools import lru_cache

from fastapi import Depends

from chat_service.src.data import wait_rooms, active_rooms, active_connections
from chat_service.src.services.connection import ConnectionService, get_connection_service
from chat_service.src.services.message import MessageService, get_message_service
from chat_service.src.utils.messages import Messages

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class RoomService:
    def __init__(self, connection_service: ConnectionService, message_service: MessageService):
        self.connection_service = connection_service
        self.message_service = message_service

    @staticmethod
    async def get_wait_rooms() -> list:
        return list(wait_rooms.keys())

    @staticmethod
    async def delete_wait_room(user_ip) -> None:
        for key, value in list(wait_rooms.items()):
            if value == user_ip:
                del wait_rooms[key]
                logger.info(f'Delete wait room {key}')

    @staticmethod
    async def create_room(user_ips: tuple[str, ...]) -> str:
        room_id = str(uuid.uuid4())
        active_rooms[room_id] = user_ips
        for user_ip in user_ips:
            active_connections[user_ip]['room_id'] = room_id
        logger.info(f'Room created: {room_id}; room participants: {user_ips}')
        return room_id

    async def close_user_room(self, user_ip: str) -> None:
        user_connection = active_connections.get(user_ip)
        if user_connection:
            room_id = user_connection['room_id']
            if room_id:
                await self.delete_room(room_id)
            else:
                await self.delete_wait_room(user_ip)

    async def delete_room(self, room_id: str) -> None:
        user_ips = active_rooms.pop(room_id, None)
        logger.info(f'Room deleted: {room_id}; room participants: {user_ips}')
        if user_ips:
            for user_ip in user_ips:
                await self.connection_service.delete_user_connection(user_ip)

    async def connect_room(self, new_user_ip: str, chat_group: str) -> None:
        waiting_user_ip = wait_rooms.get(chat_group)
        new_user_websocket = active_connections[new_user_ip]

        if waiting_user_ip:
            room_id = await self.create_room(user_ips=(waiting_user_ip, new_user_ip))
            wait_rooms.pop(chat_group, None)
            await self.message_service.broadcast(
                room_id=room_id,
                data={
                    'status': Messages.CHAT_ROOM_CREATED.status,
                    'detail': Messages.CHAT_ROOM_CREATED.detail,
                    'room_id': room_id
                },
                data_type='json'
            )
            return

        wait_rooms[chat_group] = new_user_ip
        logger.info(f'Waiting room created: {chat_group}; participant: {new_user_ip}')

        await new_user_websocket['websocket'].send_json(data={'status': Messages.WAITING_ROOM_CREATED.status,
                                                              'detail': Messages.WAITING_ROOM_CREATED.detail})


@lru_cache()
def get_room_service(
        connection_service: ConnectionService = Depends(get_connection_service),
        message_service: MessageService = Depends(get_message_service)
) -> RoomService:
    return RoomService(connection_service, message_service)
