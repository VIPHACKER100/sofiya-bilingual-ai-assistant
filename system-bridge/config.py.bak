import os
import json
import platform
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Server config
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Security
CONFIRMATION_TIMEOUT = int(os.getenv("CONFIRMATION_TIMEOUT", 30))
ENABLE_DANGEROUS_COMMANDS = os.getenv("ENABLE_DANGEROUS_COMMANDS", "true").lower() == "true"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_RETENTION_DAYS = int(os.getenv("LOG_RETENTION_DAYS", 30))

# Platform
PLATFORM = platform.system().lower()  # 'windows', 'darwin', 'linux'

# Dangerous commands requiring confirmation
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
    'volume_up': [
        'volume up', 'aawaz badhao', 'awaz badhao', 'tez karo', 'sound badhao', 'volume badao',
        # English synonyms
        'increase volume', 'increase sound', 'increase audio',
        'raise volume', 'raise sound', 'raise audio',
        'louder', 'sound up', 'audio up', 'turn up volume', 'turn up sound',
    ],
    'volume_down': [
        'volume down', 'aawaz kam karo', 'awaz kam karo', 'dheere karo', 'sound kam', 'volume ghatao',
        # English synonyms
        'decrease volume', 'decrease sound', 'decrease audio',
        'lower volume', 'lower sound', 'lower audio', 'reduce volume', 'reduce sound',
        'quieter', 'sound down', 'audio down', 'turn down volume', 'turn down sound',
    ],
    'mute': [
        'mute', 'silent', 'khamosh', 'unmute',
        # English synonyms
        'silence', 'no sound', 'toggle mute', 'mute audio', 'mute sound', 'mute volume',
    ],
    
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
    
    # Phase 3: File Manager
    'open_folder': ['open folder', 'folder kholo', 'directory kholo', 'explore', 'folder open karo'],
    'open_downloads': ['open downloads', 'open download', 'downloads kholo', 'download folder', 'downloads', 'download'],
    'open_documents': ['open documents', 'open document', 'documents kholo', 'docs kholo', 'documents', 'document', 'docs'],
    'open_desktop': ['open desktop', 'desktop kholo', 'desktop'],
    'open_pictures': ['open pictures', 'open picture', 'pictures kholo', 'photos kholo', 'pictures', 'picture', 'photos', 'photo'],
    'open_videos': ['open videos', 'open video', 'videos kholo', 'movies kholo', 'videos', 'video', 'movies', 'movie'],
    'open_music': ['open music', 'music kholo', 'gaane kholo', 'music', 'songs', 'gaane'],
    'open_home': ['open home', 'home kholo', 'home directory', 'home folder', 'home', 'main folder'],
    'search_files': ['search file', 'file dhoondo', 'find file', 'dhundho', 'search karo'],
    'create_folder': ['create folder', 'naya folder', 'new folder', 'folder banao'],
    'delete_file': ['delete file', 'file hatao', 'remove file', 'delete karo', 'hatao'],
    'copy_file': ['copy file', 'file copy karo', 'duplicate'],
    'move_file': ['move file', 'file move karo', 'shift karo'],
    'rename_file': ['rename file', 'file ka naam badlo', 'naam badlo'],
    
    # Phase 3: Media Processing
    'ocr_image': ['extract text from image', 'image se text nikalo', 'ocr image', 'text nikalo'],
    'ocr_pdf': ['extract text from pdf', 'pdf se text nikalo', 'read pdf', 'pdf padho'],
    'extract_text': ['extract text', 'text nikalo', 'copy text', 'text copy karo'],
    'convert_image': ['convert image', 'image convert karo', 'format change karo'],
    'resize_image': ['resize image', 'image resize karo', 'size badlo', 'chhota karo'],
    'compress_image': ['compress image', 'image compress karo', 'size kam karo'],
    'merge_pdfs': ['merge pdfs', 'pdfs jodo', 'combine pdfs'],
    'pdf_to_images': ['pdf to images', 'pdf ko images mein convert karo'],
    'images_to_pdf': ['images to pdf', 'images ko pdf mein convert karo'],
    
    # Phase 3: Desktop
    'take_screenshot': ['take screenshot', 'screenshot lo', 'screen capture karo', 'photo lo'],
    'get_clipboard': ['get clipboard', 'clipboard dekhoo', 'copy kiya hua dekhoo'],
    'set_clipboard': ['set clipboard', 'clipboard mein daalo', 'copy karo'],
    'media_play': [
        'play media', 'play pause', 'music chalao', 'video chalao',
        # English natural phrases
        'play music', 'play song', 'play audio', 'play video',
        'start music', 'start playing', 'start song',
        'resume music', 'resume media', 'resume playing',
        'pause music', 'pause song', 'pause media',
        'toggle music', 'toggle media',
    ],
    'media_next': ['next track', 'agla gaana', 'next song', 'next music', 'skip song', 'skip track'],
    'media_previous': ['previous track', 'pichla gaana', 'previous song', 'prev track', 'previous music'],
    
    # Advanced Desktop
    'change_wallpaper': ['change wallpaper', 'wallpaper badlo', 'background badlo', 'desktop picture'],
    'empty_recycle_bin': ['empty recycle bin', 'recycle bin khali karo', 'trash saaf karo', 'kachra saaf karo'],
    'toggle_taskbar': ['toggle taskbar', 'taskbar chhupao', 'taskbar dikhao', 'taskbar hide', 'taskbar show'],
    'zoom_in': ['zoom in', 'screen zoom karo', 'bada dikhao', 'zoom badhao'],
    'zoom_out': ['zoom out', 'screen zoom kam karo', 'chhota dikhao', 'zoom ghatao'],
    
    # Advanced Media
    'batch_pdf': ['images to pdf', 'sare photo pdf banao', 'folder pdf banao', 'batch pdf'],
    'scan_folder': ['scan folder', 'folder scan karo', 'file dhoondo folder mein'],
    'make_drawing': ['make drawing', 'drawing banao', 'paint kholo', 'sketch banao'],
    'get_selected_text': ['get selected text', 'select kiya hua text', 'selected text padho', 'text copy karo selection se'],
    
    # Search & Browser
    'google_search': ['search', 'google search', 'dhoondo', 'dhundo', 'pata karo', 'khojo', 'search karo'],
    'open_browser': ['open browser', 'browser kholo', 'new tab', 'naya tab', 'internet kholo'],
}

# Response templates
RESPONSES = {
    'en': {
        'confirm_shutdown': 'Are you sure you want to shutdown the computer?',
        'confirm_restart': 'Are you sure you want to restart the computer?',
        'confirm_delete': 'Are you sure you want to delete this?',
        'confirm_app_close': 'Are you sure you want to close {0}?',
        'confirm_whatsapp': 'Send message to {0}?',
        'shutdown_initiated': 'Shutting down the system.',
        'restart_initiated': 'Restarting the system.',
        'volume_increased': 'Volume increased.',
        'volume_decreased': 'Volume decreased.',
        'time_is': 'The current time is {0}.',
        'date_is': 'Today is {0}.',
        'battery_status': 'Battery is at {0}%.',
        'app_opened': 'Opening {0}.',
        'app_closed': 'Closed {0}.',
        'window_minimized': 'Minimized window.',
        'window_maximized': 'Maximized window.',
        'desktop_shown': 'Showing desktop.',
        'cursor_moved': 'Cursor moved.',
        'text_typed': 'Text entered.',
        'message_sent': 'Message sent.',
        'folder_opened': 'Opened folder: {0}.',
        'file_deleted': 'File moved to trash: {0}.',
        'file_copied': 'File copied successfully.',
        'file_moved': 'File moved successfully.',
        'file_renamed': 'File renamed to {0}.',
        'text_extracted': 'Extracted {0} characters.',
        'image_converted': 'Image converted to {0}.',
        'image_resized': 'Image resized to {0}x{1}.',
        'image_compressed': 'Image compressed by {0}%.',
        'screenshot_saved': 'Screenshot saved.',
        'clipboard_set': 'Copied to clipboard.',
        'muted': 'System muted.',
        'unmuted': 'System unmuted.',
        'command_not_understood': "I'm sorry, I didn't understand that command.",
        'confirmation_timeout': 'Confirmation timed out. Action cancelled.',
    },
    'hi': {
        'confirm_shutdown': 'क्या आप वाकई कंप्यूटर बंद करना चाहते हैं?',
        'confirm_restart': 'क्या आप वाकई कंप्यूटर दोबारा शुरू करना चाहते हैं?',
        'confirm_delete': 'क्या आप वाकई इसे हटाना चाहते हैं?',
        'confirm_app_close': 'क्या आप वाकई {0} बंद करना चाहते हैं?',
        'confirm_whatsapp': '{0} को संदेश भेजें?',
        'shutdown_initiated': 'सिस्टम बंद हो रहा है।',
        'restart_initiated': 'सिस्टम दोबारा शुरू हो रहा है।',
        'volume_increased': 'आवाज़ बढ़ा दी गई है।',
        'volume_decreased': 'आवाज़ कम कर दी गई है।',
        'time_is': 'अभी का समय {0} है।',
        'date_is': 'आज {0} है।',
        'battery_status': 'बैटरी {0}% है।',
        'app_opened': '{0} खोल रहा हूँ।',
        'app_closed': '{0} बंद कर दिया गया है।',
        'window_minimized': 'विंडो छोटी कर दी गई है।',
        'window_maximized': 'विंडो बड़ी कर दी गई है।',
        'desktop_shown': 'डेस्कटॉप दिखा रहा हूँ।',
        'cursor_moved': 'कर्सर मूव कर दिया गया है।',
        'text_typed': 'टेक्स्ट एंटर कर दिया गया है।',
        'message_sent': 'संदेश भेज दिया गया है।',
        'folder_opened': 'फोल्डर खोला गया: {0}।',
        'file_deleted': 'फाइल ट्रैश में डाल दी गई: {0}।',
        'file_copied': 'फाइल कॉपी हो गई।',
        'file_moved': 'फाइल मूव हो गई।',
        'file_renamed': 'फाइल का नाम बदल दिया गया: {0}।',
        'text_extracted': '{0} अक्षर निकाले गए।',
        'image_converted': 'इमेज {0} में बदल दी गई।',
        'image_resized': 'इमेज {0}x{1} में बदल दी गई।',
        'image_compressed': 'इमेज {0}% कम हो गई।',
        'screenshot_saved': 'स्क्रीनशॉट सेव हो गया।',
        'clipboard_set': 'क्लिपबोर्ड में कॉपी हो गया।',
        'muted': 'सिस्टम म्यूट कर दिया गया है।',
        'unmuted': 'सिस्टम अनम्यूट कर दिया गया है।',
        'command_not_understood': 'क्षमा करें, मुझे यह समझ नहीं आया।',
        'confirmation_timeout': 'पुष्टि का समय समाप्त हो गया। कार्य रद्द कर दिया गया है।',
    }
}

def get_config():
    """Load user config from JSON"""
    config_path = DATA_DIR / "config.json"
    if config_path.exists():
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "language": "en",
        "confirmation_timeout": 30,
        "whatsapp_desktop_path": None,
        "auto_start_backend": False
    }

def save_config(config):
    """Save user config to JSON"""
    config_path = DATA_DIR / "config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

CONFIG = get_config()
