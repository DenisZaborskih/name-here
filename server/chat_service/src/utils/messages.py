from pydantic import BaseModel


class Message(BaseModel):
    status: int
    detail: str


class ErrorMessages:
    ROOM_NOT_FOUND = Message(status=1104, detail='Room not found')
    INVALID_FILE_FORMAT = Message(status=1105, detail='Invalid file format')


class Messages:
    CHAT_ROOM_CREATED = Message(status=1100, detail='Chat room created')
    WAITING_ROOM_CREATED = Message(status=1101, detail='Waiting room created')
    PARTICIPANT_LEFT = Message(status=1102, detail='Participant left')
