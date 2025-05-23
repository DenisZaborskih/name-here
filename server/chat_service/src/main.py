from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from chat_service.src.api.v1 import chat, rooms
from chat_service.src.core.config import get_global_settings, get_redis_settings
from chat_service.src.db import redis

settings = get_global_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_settings = get_redis_settings()
    redis.redis_client = Redis(host=redis_settings.host, port=redis_settings.port, decode_responses=True)
    yield
    await redis.redis_client.close()

app = FastAPI(
    title=settings.project_name,
    docs_url='/api/openapi',
    openapi_url='/api/openapi.json',
    lifespan=lifespan
)

app.include_router(chat.router, prefix='/api/v1/chat', tags=['chat'])
app.include_router(rooms.router, prefix='/api/v1/rooms', tags=['rooms'])
