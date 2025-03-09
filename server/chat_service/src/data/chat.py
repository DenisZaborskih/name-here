from fastapi import WebSocket


wait_rooms: dict[str, str] = {}
active_rooms: dict[str, tuple[str, ...]] = {}
active_connections: dict[str, {str, str | WebSocket}] = {}
