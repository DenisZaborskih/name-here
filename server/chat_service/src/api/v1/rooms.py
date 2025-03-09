from fastapi import APIRouter, Depends

from chat_service.src.services.room import RoomService, get_room_service

router = APIRouter()


@router.get('/wait')
async def get_wait_rooms(
        room_service: RoomService = Depends(get_room_service)
):
    return await room_service.get_wait_rooms()
