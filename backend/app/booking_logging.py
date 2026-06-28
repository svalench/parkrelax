"""Ротационный файловый лог бронирований и оплат."""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler

from app.config import PROJECT_ROOT

BOOKING_LOG_NAME = "app.booking"
LOG_DIR = PROJECT_ROOT / "logs"
LOG_FILE = LOG_DIR / "booking.log"
MAX_BYTES = 5 * 1024 * 1024
BACKUP_COUNT = 10


def setup_booking_logger() -> logging.Logger:
    """Инициализировать logger с ротацией по размеру файла."""
    logger = logging.getLogger(BOOKING_LOG_NAME)
    if logger.handlers:
        return logger

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    )
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


booking_logger = setup_booking_logger()
