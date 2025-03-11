from pydantic import BaseModel


class Message(BaseModel):
    status: int
    detail: str


class ErrorMessages:
    IP_IS_BLACKLISTED = Message(status=1012, detail='IP is blacklisted')
    UNSUPPORTED_ACTION = Message(status=1013, detail='Unsupported action')
    ROOM_NOT_FOUND = Message(status=1014, detail='Room not found')
    INVALID_FILE_FORMAT = Message(status=1015, detail='Invalid file format')
    REPORT_ALREADY_EXISTS = Message(status=1016, detail='Report already exist')


class Messages:
    SENT = Message(status=1100, detail='Message sent')
    CHAT_ROOM_CREATED = Message(status=1101, detail='Chat room created')
    WAITING_ROOM_CREATED = Message(status=1102, detail='Waiting room created')
    PARTICIPANT_LEFT = Message(status=1103, detail='Participant left')
    REPORT_SENT = Message(status=1104, detail='Report sent')
