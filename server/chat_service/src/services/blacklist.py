import logging
from functools import lru_cache

from redis.asyncio import Redis
from fastapi import Depends

from chat_service.src.core.config import get_global_settings
from chat_service.src.db.redis import get_redis
from chat_service.src.services.send import SendService, get_send_service
from chat_service.src.utils.messages import ErrorMessages, Messages

settings = get_global_settings()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class BlacklistService:
    COUNT_REPORT_FOR_BAN = settings.count_report_for_ban
    REPORTS_KEY = 'reports'
    BLACKLIST_KEY = 'blacklist'

    def __init__(self, redis: Redis, send_service: SendService):
        self.redis = redis
        self.send_service = send_service

    async def report(self, reporter_ip: str, reported_ip: str) -> None:
        logger.info(f'User: {reporter_ip} reported user: {reported_ip}')

        reports_against_user = await self.get_user_reports(reported_ip)
        if reporter_ip in reports_against_user:
            await self.send_service.send(
                user_ip=reporter_ip,
                data={
                    'status': ErrorMessages.REPORT_ALREADY_EXISTS.status,
                    'detail': ErrorMessages.REPORT_ALREADY_EXISTS.detail
                }
            )
            return None

        report_count = await self.add_report_to_user(reporter_ip, reported_ip)
        await self.send_service.send(
            user_ip=reporter_ip,
            data={
                'status': Messages.REPORT_SENT.status,
                'detail': Messages.REPORT_SENT.detail
            }
        )

        if report_count >= self.COUNT_REPORT_FOR_BAN:
            await self.add_user_to_blacklist(reported_ip)

    async def add_report_to_user(self, reporter_ip: str, reported_ip: str) -> int:
        report_key = f'{self.REPORTS_KEY}:{reported_ip}'
        await self.redis.sadd(report_key, reporter_ip)
        return await self.redis.scard(report_key)

    async def get_user_reports(self, user_ip: str) -> set:
        report_key = f'{self.REPORTS_KEY}:{user_ip}'
        return await self.redis.smembers(report_key)

    async def add_user_to_blacklist(self, user_ip: str) -> None:
        logger.info(f'User: {user_ip} add to blacklist')
        await self.redis.sadd(self.BLACKLIST_KEY, user_ip)

    async def check_blacklist(self, user_ip: str) -> bool:
        return bool(await self.redis.sismember(self.BLACKLIST_KEY, user_ip))


@lru_cache()
def get_blacklist_service(
        redis: Redis = Depends(get_redis),
        send_service: SendService = Depends(get_send_service)
) -> BlacklistService:
    return BlacklistService(redis, send_service)
