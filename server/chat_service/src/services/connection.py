import logging
from functools import lru_cache
from http import HTTPStatus

from fastapi import WebSocket, HTTPException

from chat_service.src.data import active_connections


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class ConnectionService:
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

    @staticmethod
    async def get_user_connection(user_ip: str) -> dict[str, str | WebSocket] | None:
        return active_connections.get(user_ip)

    async def delete_user_connection(self, user_ip: str) -> None:
        user_connection = active_connections.pop(user_ip, None)
        logger.info(f'User connection delete: {user_ip}')
        if user_connection:
            await self.disconnect(user_connection['websocket'])


@lru_cache()
def get_connection_service() -> ConnectionService:
    return ConnectionService()
