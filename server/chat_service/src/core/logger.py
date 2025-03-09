import logging.config

LOG_FORMAT = '%(levelname)s:     %(message)s | %(asctime)s | %(name)s'
LOG_DEFAULT_HANDLERS = ['console', 'file_handler']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': LOG_FORMAT
        },
        'default': {
            '()': 'uvicorn.logging.DefaultFormatter',
            'fmt': '%(levelprefix)s %(message)s',
            'use_colors': None,
        },
        'access': {
            '()': 'uvicorn.logging.AccessFormatter',
            'fmt': "%(levelprefix)s %(client_addr)s - '%(request_line)s' %(status_code)s",
        },
    },
    'handlers': {
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'default': {
            'formatter': 'default',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
        },
        'access': {
            'formatter': 'access',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
        },
        'file_handler': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'logs/app.log',
            'formatter': 'verbose',
        },
        'chat_file_handler': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'logs/chat.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        '': {
            'handlers': LOG_DEFAULT_HANDLERS,
            'level': 'DEBUG',
        },
        'uvicorn.error': {
            'level': 'INFO',
        },
        'uvicorn.access': {
            'handlers': ['access'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

chat_loggers_config = [
    'chat_service.src.api.v1.chat',
    'chat_service.src.services.connection',
    'chat_service.src.services.message',
    'chat_service.src.services.room',
]

for logger_name in chat_loggers_config:
    LOGGING['loggers'][logger_name] = {
        'handlers': ['console', 'chat_file_handler'],
        'level': 'DEBUG',
        'propagate': False,
    }


def setup_logging(debug=False):
    if debug:
        LOGGING['handlers']['console']['level'] = 'INFO'
    logging.config.dictConfig(LOGGING)
