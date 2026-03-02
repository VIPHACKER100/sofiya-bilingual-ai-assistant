# -*- mode: python ; coding: utf-8 -*-
import os
import platform
from pathlib import Path

"""
SOFIYA Entry Point for PyInstaller
This is the main entry point for the packaged executable
"""

# SOFIYA Backend Spec File

# Hidden imports required for proper loading of modules
hidden_imports = [
    # Core dependencies
    'fastapi',
    'uvicorn',
    'websockets',
    'python-dotenv',
    'python-multipart',
    
    # System utilities
    'psutil',
    
    # Display & audio
    'screen-brightness-control',
    'pycaw',
    
    # Automation
    'pyautogui',
    'pyperclip',
    
    # Image & OCR
    'Pillow',
    'pytesseract',
    
    # PDF tools
    'PyPDF2',
    'pdf2image',
    
    # Fuzzy matching
    'fuzzywuzzy',
    'python-Levenshtein',
    
    # Windows-specific
    'pywin32',
    'win32api',
    'win32api',
    'win32api',
    'win32con',
    'win32gui',
    
    # PDF & PDF tools
    'reportlab',  # for reportlab usage (if any)
    'reportlab.pdfgen',
    
    # Tesseract dependencies
    'PIL._tkinter_imageset',
    'PIL._tkinter_tools',
    
    # Platform-specific
    'comtypes',
    'pycaw.pycaw',
    'pycaw.pycaw',
    'win32api',
    'win32gui',
    'win32process',
    'win32evtCfg',
    
    # System utilities
    'os',
    'subprocess',
    'shutil',
    
    # Windows-Win32 API specific
    'win32api',
    'win32con',
    'win32event',
    'win32process',
    'win32clipboard',
    
    # Library_PATH imports to make hiddenimports work
    'importlib',
    'importlib.util',
    
    # SOFIYA modules (to ensure they are not excluded)
    'modules.system',
    'modules.window_manager',
    'modules.input_control',
    'modules.whatsapp',
    'modules.file_manager',
    'modules.media',
    'modules.desktop',
    'modules.security',
    'modules.bilingual_parser',
    'modules.memory',
    'utils.platform_utils',
    'utils.logger'
]

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = Path(__file__).parent / "data"
LOGS_DIR = BASE_DIR / "logs"

DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Server configuration
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Security settings
CONFIRMATION_TIMEOUT = int(os.getenv("CONFIRMATION_TIMEOUT", 30))
ENABLE_DANGEROUS_COMMANDS = os.getenv("ENABLE_DANGEROUS_COMMANDS", "true").lower() == "true"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_RETENTION_DAYS = int(os.getenv("LOG_RETENTION_DAYS", 30))

# Platform detection
PLATFORM = platform.system().lower()  # 'windows', 'darwin', 'linux'

# Dangerous commands (require confirmation)
DANGEROUS_COMMANDS = {
    'shutdown', 'restart', 'sleep', 'hibernate',
    'delete', 'remove', 'format', 'uninstall',
    'band karo', 'shutdown karo', 'pc band', 'computer band',
    'delete karo', 'remove karo', 'format karo'
}

# Bilingual command mappings (Hindi -> English)
HINDI_COMMANDS = {
    # Power
    'shutdown': ['shutdown', 'band karo', 'band', 'pc band', 'computer band', 'system band'],
    'restart': ['restart', 'dobara shuru', 'fir se chalu', 'reboot'],
    'sleep': ['sleep', 'sone do', 'suspend'],
    
    # Volume
    'volume_up': ['volume up', 'aawaz badhao', 'awaz badhao', 'tez karo', 'sound badhao', 'volume badao'],
    'volume_down': ['volume down', 'aawaz kam karo', 'awaz kam karo', 'dheere karo', 'sound kam', 'volume ghatao'],
    'mute': ['mute', 'silent', 'khamosh', 'band karo'],
    
    # System
    'time': ['time', 'samay', 'samay kya hai', 'time kya hai', 'baje kya hue', 'kitne baje hai'],
    'date': ['date', 'tareekh', 'din', 'aaj ka din', 'date kya hai'],
    'battery': ['battery', 'charge', 'power', 'kitni charge hai'],
    'system_status': ['system status', 'pc status', 'computer status', 'system check'],
    
    # Apps
    'open_app': ['open', 'kholo', 'start karo', 'chalu karo', 'run karo'],
    'close_app': ['close', 'band karo', 'exit', 'quit', 'band'],
    
    # Window
    'minimize': ['minimize', 'chhota karo', 'niche karo'],
    'maximize': ['maximize', 'bada karo', 'pura screen'],
    'close_window': ['close window', 'window band', 'band karo'],
    
    # WhatsApp
    'whatsapp_message': ['whatsapp', 'message bhejo', 'msg bhejo', 'send message', 'sandesh bhejo'],
    'whatsapp_call': ['call', 'phone karo', 'baat karo', 'whatsapp call'],
    
    # Input
    'move_cursor': ['move cursor', 'cursor move', 'mouse move', 'pointer move'],
    'click': ['click', 'press', 'select', 'choose'],
    'double_click': ['double click', 'do bar click', 'double press'],
    'right_click': ['right click', 'context menu', 'options'],
    'scroll_up': ['scroll up', 'upar scroll', 'up scroll'],
    'scroll_down': ['scroll down', 'neeche scroll', 'down scroll'],
    'type_text': ['type', 'likho', 'enter', 'input'],
    'press_key': ['press', 'daba', 'click key'],
    'hotkey': ['hotkey', 'shortcut', 'combination', 'saath dabao'],
    
    # Desktop
    'show_desktop': ['show desktop', 'desktop dikhavo', 'sab band karo'],
    'snap_left': ['snap left', 'left side', 'bayan taraf'],
    'snap_right': ['snap right', 'right side', 'dayan taraf'],
}
    
# Response templates (bilingual)
RESPONSES = {
    'en': {
        'confirm_shutdown': 'Are you sure you want to shutdown the computer?',
        'confirm_restart': 'Are you sure you want to restart the computer?',
        'confirm_delete': 'Are you sure you want to delete this?',
        'confirm_app_close': 'Are you sure you want to close {0}?',
        'confirm_whatsapp': '{0} ko message bhejo?',
        'shutdown_initiated': 'Shutting down the system.',
        'restart_initiated': 'Restarting the system.',
        'volume_increased': 'Volume increased.',
        'volume_decreased': 'Volume decreased.',
        'time_is': 'The current time is {0}.',
        'date_is': 'Today is {0}.',
        'battery_status': 'Battery is at {0}%.',
        'app_opened': 'Opening {0}.',
        'app_closed': '{0} closed.',
        'window_minimized': 'Window minimized.',
        'window_maximized': 'Window maximized.',
        'desktop_shown': 'Showing desktop.',
        'cursor_moved': 'Cursor moved.',
        'text_typed': 'Text typed.',
        'message_sent': 'Message sent.',
        'command_not_understood': "I'm sorry, I didn't understand that command.",
        'confirmation_timeout': 'Confirmation timed out. Action cancelled.',
    },
    'hi': {
        'confirm_shutdown': 'क्या आप वास्तव में कंप्यूटर बंद करना चाहते हैं?',
        'confirm_restart': 'क्या आप वास्तव में कंप्यूटर फिर से शुरू करना चाहते हैं?',
        'confirm_delete': 'क्या आप इसे हटाना चाहते हैं?',
        'confirm_app_close': 'क्या आप वास्तव में {0} बंद करना चाहते हैं?',
        'confirm_whatsapp': '{0} को संदेश भेजें?',
        'shutdown_initiated': 'सिस्टम बंद हो रहा है।',
        'restart_initiated': 'सिस्टम फिर से शुरू हो रहा है।',
        'volume_increased': 'आवाज़ बढ़ा दी गई है।',
        'volume_decreased': 'आवाज़ कम कर दी गई है।',
        'time_is': 'अभी का समय {0} है।',
        'date_is': 'आज {0} है।',
        'battery_status': 'बैटरी {0}% है।',
        'app_opened': '{0} खोल रहा हूँ।',
        'app_closed': '{0} बंद कर दिया गया है।',
        'window_minimized': 'खिड़की छोटी कर दी गई है।',
        'window_maximized': 'खिड़की बड़ी कर दी गई है।',
        'desktop_shown': 'दिखा रहा हूँ।',
        'cursor_moved': 'कर्सर मूव कर दिया गया है।',
        'text_typed': 'पाठ दर्ज किया गया है।',
        'message_sent': 'संदेश भेज दिया गया है।',
        'command_not_understood': 'क्षमा करें, मुझे यह समझ नहीं आया।',
        'confirmation_timeout': 'पुष्टि का समय समाप्त हो गया। कार्य रद्द कर दिया गया है।',
    }