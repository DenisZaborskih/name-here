import uuid
import imghdr
import logging
from http import HTTPStatus

from fastapi import WebSocket, HTTPException

from chat_service.src.utils.messages import ErrorMessages, Messages


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


wait_rooms: dict[str, str] = {}
active_rooms: dict[str, tuple[str, ...]] = {}
active_connections: dict[str, {str, str | WebSocket}] = {}


class ChatService:
    @staticmethod
    async def connect(user_ip: str, websocket: WebSocket) -> None:
        if active_connections.get(user_ip):
            await websocket.close(code=1013, reason='This IP already has a connection')
            logger.error(f'User IP already connected {user_ip}')
            raise HTTPException(status_code=HTTPStatus.CONFLICT)

        await websocket.accept()
        active_connections[user_ip] = {
            'websocket': websocket,
            'room_id': None,
        }
        logger.info(f'User connected: {user_ip}')

    @staticmethod
    async def disconnect(websocket: WebSocket) -> None:
        try:
            await websocket.close(code=1000, reason='Disconnected by server')
        except RuntimeError:
            pass
        finally:
            logger.info(f'User disconnected: {websocket}')

    async def delete_user_connection(self, user_ip: str) -> None:
        user_connection = active_connections.pop(user_ip, None)
        logger.info(f'User connection delete: {user_ip}')
        if user_connection:
            await self.disconnect(user_connection['websocket'])

    async def close_user_room(self, user_ip: str) -> None:
        user_connection = active_connections.get(user_ip)
        if user_connection:
            room_id = user_connection['room_id']
            if room_id:
                await self.delete_room(room_id)
            else:
                await self.delete_wait_room(user_ip)

    @staticmethod
    async def create_room(user_ips: tuple[str, ...]) -> str:
        room_id = str(uuid.uuid4())
        active_rooms[room_id] = user_ips
        for user_ip in user_ips:
            active_connections[user_ip]['room_id'] = room_id
        logger.info(f'Room created: {room_id}; room participants: {user_ips}')
        return room_id

    async def delete_room(self, room_id: str) -> None:
        user_ips = active_rooms.pop(room_id, None)
        logger.info(f'Room deleted: {room_id}; room participants: {user_ips}')
        if user_ips:
            for user_ip in user_ips:
                await self.delete_user_connection(user_ip)

    async def connect_chat(self, new_user_ip: str, chat_group: str) -> None:
        waiting_user_ip = wait_rooms.get(chat_group)
        new_user_websocket = active_connections[new_user_ip]

        if waiting_user_ip:
            room_id = await self.create_room(user_ips=(waiting_user_ip, new_user_ip))
            wait_rooms.pop(chat_group, None)
            await self.broadcast(
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

    @staticmethod
    async def delete_wait_room(user_ip) -> None:
        for key, value in list(wait_rooms.items()):
            if value == user_ip:
                del wait_rooms[key]
                logger.info(f'Delete wait room {key}')

    @staticmethod
    async def get_user_connection(user_ip: str) -> dict | None:
        user_connection = active_connections.get(user_ip)
        if not user_connection:
            logger.error(f'User {user_ip} not connected')
            return
        if not user_connection['room_id']:
            await user_connection['websocket'].send_json(data={'status': ErrorMessages.ROOM_NOT_FOUND.status,
                                                               'detail': ErrorMessages.ROOM_NOT_FOUND.detail})
            return

        return user_connection

    async def send_message(self, user_ip: str, message: str) -> None:
        user_connection = await self.get_user_connection(user_ip)
        if not user_connection:
            return

        logger.info(f'Send message user_ip: {user_ip}, message: {message}')
        await self.broadcast(room_id=user_connection['room_id'], data=message)

    async def send_file(self, user_ip: str, data: bytes) -> None:
        user_connection = await self.get_user_connection(user_ip)
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


async def get_chat_service():
    return ChatService()
