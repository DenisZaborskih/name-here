import logging
from functools import lru_cache

from fastapi import Depends, WebSocket

from chat_service.src.data import active_rooms
from chat_service.src.services.connection import ConnectionService, get_connection_service

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class SendService:
    def __init__(self, connection_service: ConnectionService):
        self.connection_service = connection_service

    async def send(self, data: dict, user_ip: str | None = None, websocket: WebSocket | None = None) -> None:
        if not (user_ip or websocket):
            raise ValueError("Either user_id or websocket must be provided")

        if not websocket:
            user_connection = await self.connection_service.get_user_connection(user_ip)
            if not user_connection:
                return None
            websocket = user_connection['websocket']
        await websocket.send_json(data)

    async def broadcast(self, room_id: str, data: object, data_type: str = 'text') -> None:
        user_ips = active_rooms.get(room_id)

        if user_ips:
            for user_ip in user_ips:
                user_connection = await self.connection_service.get_user_connection(user_ip)
                if user_connection:
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


@lru_cache()
def get_send_service(
        connection_service: ConnectionService = Depends(get_connection_service)
) -> SendService:
    return SendService(connection_service)
