# -*- coding: utf-8 -*-
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler


class UTF8ConsoleHandler(logging.StreamHandler):
    """Custom console handler that handles UTF-8 encoding properly on Windows"""
    def __init__(self, stream=None):
        if stream is None:
            stream = sys.stdout
        super().__init__(stream)
        
        # Set encoding to UTF-8 on Windows
        if sys.platform == 'win32' and hasattr(stream, 'reconfigure'):
            try:
                stream.reconfigure(encoding='utf-8', errors='replace')
            except:
                pass  # Fallback if reconfigure fails

# Setup paths
BASE_DIR = Path(__file__).parent.parent
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

LOG_LEVEL = "INFO"
LOG_RETENTION_DAYS = 30

def setup_logger(name="sofiya"):
    """Setup logger with file and console handlers"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler with UTF-8 encoding
    console_handler = UTF8ConsoleHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Prevent propagation to avoid duplicate logs
    logger.propagate = False
    
    # File handler (rotating) with UTF-8 encoding
    log_file = LOGS_DIR / "sofiya.log"
    file_handler = TimedRotatingFileHandler(
        log_file,
        when='midnight',
        interval=1,
        backupCount=LOG_RETENTION_DAYS,
        encoding='utf-8'
    )
    file_handler.setLevel(getattr(logging, LOG_LEVEL.upper()))
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Error file handler with UTF-8 encoding
    error_file = LOGS_DIR / "error.log"
    error_handler = RotatingFileHandler(
        error_file,
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    return logger

def log_command(user_command, action_taken, success=True, details=None):
    """Log a command execution"""
    logger = logging.getLogger("sofiya.commands")
    status = "SUCCESS" if success else "FAILED"
    logger.info(f"COMMAND: {user_command} | ACTION: {action_taken} | STATUS: {status} | DETAILS: {details}")

def log_system_event(event_type, details):
    """Log system events"""
    logger = logging.getLogger("sofiya.system")
    logger.info(f"EVENT: {event_type} | DETAILS: {details}")

def log_error(error_type, error_message, traceback=None):
    """Log errors"""
    logger = logging.getLogger("sofiya.errors")
    logger.error(f"ERROR: {error_type} | MESSAGE: {error_message}")
    if traceback:
        logger.error(f"TRACEBACK: {traceback}")

# Create logger instance
logger = setup_logger()
