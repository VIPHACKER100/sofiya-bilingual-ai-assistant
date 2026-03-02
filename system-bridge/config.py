import os
import json
import platform
from pathlib import Path
from dotenv import load_dotenv  # type: ignore

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
    'shutdown': ['shutdown', 'band karo', 'band', 'pc band', 'computer band', 'system band', 'शटडाउन', 'बंद करो', 'कंप्यूटर बंद करो', 'सिस्टम बंद करो', 'पीसी बंद करो'],
    'restart': ['restart', 'dobara shuru', 'fir se chalu', 'reboot', 'रीस्टार्ट', 'दोबारा शुरू', 'दोबारा चालू', 'फिर से चालू', 'रिबूट'],
    'sleep': ['sleep', 'sone do', 'suspend', 'स्लीप', 'सोने दो'],
    
    # Volume
    'volume_up': [
        'volume up', 'aawaz badhao', 'awaz badhao', 'tez karo', 'sound badhao', 'volume badao',
        'आवाज़ बढ़ाओ', 'आवाज बढ़ाओ', 'वॉल्यूम बढ़ाओ', 'तेज़ करो', 'तेज करो', 'साउंड बढ़ाओ', 
        # English synonyms
        'increase volume', 'increase sound', 'increase audio',
        'raise volume', 'raise sound', 'raise audio',
        'louder', 'sound up', 'audio up', 'turn up volume', 'turn up sound',
    ],
    'volume_down': [
        'volume down', 'aawaz kam karo', 'awaz kam karo', 'dheere karo', 'sound kam', 'volume ghatao',
        'आवाज़ कम करो', 'आवाज कम करो', 'वॉल्यूम कम करो', 'धीरे करो', 'साउंड कम करो', 'साउंड घटाओ',
        # English synonyms
        'decrease volume', 'decrease sound', 'decrease audio',
        'lower volume', 'lower sound', 'lower audio', 'reduce volume', 'reduce sound',
        'quieter', 'sound down', 'audio down', 'turn down volume', 'turn down sound',
    ],
    'mute': [
        'mute', 'silent', 'khamosh', 'unmute',
        'म्यूट', 'खामोश', 'चुप रहो', 'साइलेंट', 'आवाज़ बंद करो', 'आवाज बंद करो',
        # English synonyms
        'silence', 'no sound', 'toggle mute', 'mute audio', 'mute sound', 'mute volume',
    ],
    
    # System
    'time': ['time', 'samay', 'samay kya hai', 'time kya hai', 'baje kya hue', 'kitne baje hai', 'समय', 'समय क्या है', 'क्या समय हुआ है', 'कितने बजे हैं', 'कितने बजे है'],
    'date': ['date', 'tareekh', 'din', 'aaj ka din', 'date kya hai', 'तारीख', 'क्या तारीख है', 'आज कौन सा दिन है', 'दिन क्या है'],
    'battery': ['battery', 'charge', 'power', 'kitni charge hai', 'बैटरी', 'कितनी चार्ज है', 'बैटरी प्रतिशत', 'बैटरी कितनी है'],
    'system_status': ['system status', 'pc status', 'computer status', 'system check', 'सिस्टम स्टेटस', 'कंप्यूटर स्टेटस', 'सिस्टम चेक', 'पीसी स्टेटस'],
    
    # Apps
    'open_app': ['open', 'kholo', 'start karo', 'chalu karo', 'run karo', 'खोलें', 'खोलो', 'चालू करो', 'स्टार्ट करो', 'चलाओ'],
    'close_app': ['close', 'band karo', 'exit', 'quit', 'band', 'बंद करो', 'एग्जिट', 'क्विट', 'निकलो'],
    
    # Window
    'minimize': ['minimize', 'chhota karo', 'niche karo', 'मिनिमाइज', 'छोटा करो', 'नीचे करो'],
    'maximize': ['maximize', 'bada karo', 'pura screen', 'मैक्सिमाइज', 'बड़ा करो', 'पूरी स्क्रीन'],
    'close_window': ['close window', 'window band', 'band karo', 'विंडो बंद करो', 'खिड़की बंद करो'],
    
    # WhatsApp
    'whatsapp_message': ['whatsapp', 'message bhejo', 'msg bhejo', 'send message', 'sandesh bhejo', 'व्हाट्सएप', 'मैसेज भेजो', 'संदेश भेजो', 'व्हाट्सएप मैसेज'],
    'whatsapp_call': ['call', 'phone karo', 'baat karo', 'whatsapp call', 'कॉल करो', 'फ़ोन करो', 'फोन करो', 'बात करो', 'व्हाट्सएप कॉल'],
    
    # Input
    'move_cursor': ['move cursor', 'cursor move', 'mouse move', 'pointer move', 'कर्सर मूव', 'माउस मूव', 'कर्सर घुमाओ'],
    'click': ['click', 'press', 'select', 'choose', 'क्लिक', 'दबाओ', 'चुनो'],
    'double_click': ['double click', 'do bar click', 'double press', 'डबल क्लिक', 'दो बार क्लिक', 'दो बार दबाएं', 'दो बार दबाओ'],
    'right_click': ['right click', 'context menu', 'options', 'राइट क्लिक', 'ऑप्शंस दिखाओ'],
    'scroll_up': ['scroll up', 'upar scroll', 'up scroll', 'ऊपर स्क्रॉल', 'ऊपर जाओ'],
    'scroll_down': ['scroll down', 'neeche scroll', 'down scroll', 'नीचे स्क्रॉल', 'नीचे जाओ'],
    'type_text': ['type', 'likho', 'enter', 'input', 'टाइप करो', 'लिखो', 'टाइप'],
    'press_key': ['press', 'daba', 'click key', 'दबाओ'],
    'hotkey': ['hotkey', 'shortcut', 'combination', 'saath dabao', 'शॉर्टकट', 'हॉटकी', 'साथ दबाओ'],
    
    # Desktop
    'show_desktop': ['show desktop', 'desktop dikhavo', 'sab band karo', 'डेस्कटॉप दिखाओ', 'सब बंद करो', 'सब कुछ बंद करो'],
    'snap_left': ['snap left', 'left side', 'bayan taraf', 'स्नैप लेफ्ट', 'बाईं तरफ', 'बायें तरफ', 'बाएं तरफ'],
    'snap_right': ['snap right', 'right side', 'dayan taraf', 'स्नैप राइट', 'दायीं तरफ', 'दायें तरफ', 'दाएं तरफ'],
    
    # Phase 3: File Manager
    'open_folder': ['open folder', 'folder kholo', 'directory kholo', 'explore', 'folder open karo', 'फोल्डर खोलो', 'फ़ोल्डर खोलो', 'डायरेक्टरी खोलो', 'फोल्डर ओपन करो'],
    'open_downloads': ['open downloads', 'open download', 'downloads kholo', 'download folder', 'downloads', 'download', 'डाउनलोड ओपन करो', 'डाउनलोड्स खोलो', 'डाउनलोड'] ,
    'open_documents': ['open documents', 'open document', 'documents kholo', 'docs kholo', 'documents', 'document', 'docs', 'डॉक्युमेंट्स खोलो', 'डॉक्यूमेंट ओपन करो'],
    'open_desktop': ['open desktop', 'desktop kholo', 'desktop', 'डेस्कटॉप खोलो', 'डेस्कटॉप'],
    'open_pictures': ['open pictures', 'open picture', 'pictures kholo', 'photos kholo', 'pictures', 'picture', 'photos', 'photo', 'पिक्चर्स खोलो', 'फोटो खोलो'],
    'open_videos': ['open videos', 'open video', 'videos kholo', 'movies kholo', 'videos', 'video', 'movies', 'movie', 'वीडियो खोलो', 'मूवी खोलो'],
    'open_music': ['open music', 'music kholo', 'gaane kholo', 'music', 'songs', 'gaane', 'म्यूजिक खोलो', 'गाने खोलो'],
    'open_home': ['open home', 'home kholo', 'home directory', 'home folder', 'home', 'main folder', 'होम खोलो'],
    'search_files': ['search file', 'file dhoondo', 'find file', 'dhundho', 'search karo', 'फ़ाइल ढूंढो', 'फाइल ढूंढो', 'खोजो', 'सर्च करो', 'फाइल सर्च करो'],
    'create_folder': ['create folder', 'naya folder', 'new folder', 'folder banao', 'नया फोल्डर', 'नया फोल्डर बनाओ', 'फोल्डर क्रिएट करो'],
    'delete_file': ['delete file', 'file hatao', 'remove file', 'delete karo', 'hatao', 'फ़ाइल हटाओ', 'फाइल डिलीट करो', 'हटाओ', 'डिलीट करो'],
    'copy_file': ['copy file', 'file copy karo', 'duplicate', 'कॉपी फ़ाइल', 'फ़ाइल कॉपी करो', 'फाइल कॉपी करो'],
    'move_file': ['move file', 'file move karo', 'shift karo', 'move करो', 'फाइल स्थानांतरित करो', 'फाइल मूव करो'],
    'rename_file': ['rename file', 'file ka naam badlo', 'naam badlo', 'नाम बदलो', 'फाइल का नाम बदलो', 'rename करो'],
    
    # Phase 3: Media Processing
    'ocr_image': ['extract text from image', 'image se text nikalo', 'ocr image', 'text nikalo', 'इमेज से टेक्स्ट निकालो', 'फोटो से टेक्स्ट निकालो', 'टेक्स्ट निकालो'],
    'ocr_pdf': ['extract text from pdf', 'pdf se text nikalo', 'read pdf', 'pdf padho', 'पीडीएफ से टेक्स्ट निकालो', 'पीडीएफ पढ़ो'],
    'extract_text': ['extract text', 'text nikalo', 'copy text', 'text copy karo', 'टेक्स्ट निकालो', 'टेक्स्ट कॉपी करो'],
    'convert_image': ['convert image', 'image convert karo', 'format change karo', 'इमेज कन्वर्ट करो', 'इमेज का फॉर्मेट बदलो'],
    'resize_image': ['resize image', 'image resize karo', 'size badlo', 'chhota karo', 'इमेज रिसाइज करो', 'इमेज का साइज बदलो', 'साइज बदलो'],
    'compress_image': ['compress image', 'image compress karo', 'size kam karo', 'इमेज कम्प्रेस करो', 'साइज कम करो'],
    'merge_pdfs': ['merge pdfs', 'pdfs jodo', 'combine pdfs', 'पीडीएफ मिलाओ', 'पीडीएफ जोड़ो'],
    'pdf_to_images': ['pdf to images', 'pdf ko images mein convert karo', 'पीडीएफ को इमेज में बदलो'],
    'images_to_pdf': ['images to pdf', 'images ko pdf mein convert karo', 'इमेज को पीडीएफ में बदलो'],
    
    # Phase 3: Desktop
    'take_screenshot': [
        'take screenshot', 'screenshot lo', 'screen capture karo', 'photo lo', 
        'स्क्रीनशॉट लो', 'स्क्रीन कैप्चर करो', 'फोटो लो', 'स्क्रीनशॉट खींचो', 'स्क्रीनशॉट खींचिए',
        'कैप्चर करो', 'कैप्चर'
    ],
    'get_clipboard': ['get clipboard', 'clipboard dekhoo', 'copy kiya hua dekhoo', 'क्लिपबोर्ड देखो', 'क्या कॉपी किया है'],
    'set_clipboard': ['set clipboard', 'clipboard mein daalo', 'copy karo', 'क्लिपबोर्ड में डालो', 'कॉपी करो'],
    'media_play': [
        'play media', 'play pause', 'music chalao', 'video chalao',
        'मीडिया चलाओ', 'म्यूजिक चलाओ', 'गाना चलाओ', 'वीडियो चलाओ', 'प्ले', 'पॉज', 'रोको', 'चलाओ', 'वीडियो रोको', 'गाना रोको',
        # English natural phrases
        'play music', 'play song', 'play audio', 'play video',
        'start music', 'start playing', 'start song',
        'resume music', 'resume media', 'resume playing',
        'pause music', 'pause song', 'pause media',
        'toggle music', 'toggle media', 'play pause',
    ],
    'media_next': ['next track', 'agla gaana', 'next song', 'next music', 'skip song', 'skip track', 'अगला गाना', 'नेक्स्ट ट्रैक', 'अगला', 'आगे वाला गाना', 'आगे बढ़ाओ'],
    'media_previous': ['previous track', 'pichla gaana', 'previous song', 'prev track', 'previous music', 'पिछला गाना', 'पीछे का गाना', 'पिछला', 'पीछे वाला गाना', 'पीछे करो'],
    'media_stop': ['stop media', 'stop music', 'band karo gaana', 'roko', 'मीडिया रोको', 'म्यूजिक बंद करो', 'गाना बंद करो', 'रोको'],
    
    # Advanced Desktop
    'change_wallpaper': ['change wallpaper', 'wallpaper badlo', 'background badlo', 'desktop picture', 'वॉलपेपर बदलो', 'बैकग्राउंड बदलो', 'वॉलपेपर चेंज करो'],
    'empty_recycle_bin': ['empty recycle bin', 'recycle bin khali karo', 'trash saaf karo', 'kachra saaf karo', 'रीसायकल बिन खाली करो', 'रिसाइकिल बिन खाली करो', 'कूड़ा साफ करो', 'कचरा साफ करो'],
    'toggle_taskbar': ['toggle taskbar', 'taskbar chhupao', 'taskbar dikhao', 'taskbar hide', 'taskbar show', 'टास्कबार छुपाओ', 'टास्कबार दिखाओ', 'टास्कबार हाइड करो'],
    'zoom_in': ['zoom in', 'screen zoom karo', 'bada dikhao', 'zoom badhao', 'ज़ूम इन', 'ज़ूम करो', 'स्क्रीन बड़ी करो', 'बड़ा दिखाओ'],
    'zoom_out': ['zoom out', 'screen zoom kam karo', 'chhota dikhao', 'zoom ghatao', 'ज़ूम आउट', 'ज़ूम कम करो', 'छोटा दिखाओ'],
    
    # Advanced Media
    'batch_pdf': ['images to pdf', 'sare photo pdf banao', 'folder pdf banao', 'batch pdf', 'सारी फोटो पीडीएफ बनाओ', 'फोल्डर पीडीएफ बनाओ', 'सभी इमेज की पीडीएफ बनाओ'],
    'scan_folder': ['scan folder', 'folder scan karo', 'file dhoondo folder mein', 'फोल्डर स्कैन करो', 'फोल्डर में ढूंढो'],
    'make_drawing': ['make drawing', 'drawing banao', 'paint kholo', 'sketch banao', 'ड्राइंग बनाओ', 'पेंट खोलो', 'स्केच बनाओ'],
    'get_selected_text': ['get selected text', 'select kiya hua text', 'selected text padho', 'text copy karo selection se', 'सेलेक्ट किया हुआ टेक्स्ट', 'चुना हुआ टेक्स्ट पढ़ो', 'सेलेक्टेड टेक्स्ट'],
    'read_pdf': ['read pdf', 'pdf padho', 'pdf sunao', 'पीडीएफ पढ़ो', 'पीडीएफ सुनाओ'],
    'narrate_screen': ['narrate screen', 'screen padho', 'tell me what is on screen', 'स्क्रीन पढ़ो', 'स्क्रीन पर क्या है बताओ', 'देख के बताओ'],
    'screen_summary': ['screen summary', 'summarize screen', 'saaransh', 'स्क्रीन सारांश', 'स्क्रीन समरी'],
    'run_macro': ['run macro', 'macro chalao', 'automation', 'मैक्रो चलाओ', 'ऑटोमेशन शुरू करो'],
    'automation_status': ['automation status', 'task list', 'scheduled tasks', 'ऑटोमेशन स्टेटस', 'टास्क लिस्ट'],
    
    # Search & Browser
    'google_search': ['search', 'google search', 'dhoondo', 'dhundo', 'pata karo', 'khojo', 'search karo', 'सर्च', 'गूगल सर्च', 'ढूंढो', 'पता करो', 'खोजो', 'सर्च करो'],
    'wikipedia_fetch': ['wikipedia', 'wiki', 'about', 'vicpedia', 'wikipidia', 'विकिपीडिया', 'विकिपीडिया पर खोजें', 'के बारे में बताओ'],
    'open_browser': ['open browser', 'browser kholo', 'new tab', 'naya tab', 'internet kholo', 'ब्राउज़र खोलो', 'ब्राउज़र खोलो', 'नया टैब', 'नया टैब खोलो', 'इंटरनेट खोलो'],
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
        'volume_increased': 'Volume increased to {0}%.',
        'volume_decreased': 'Volume decreased to {0}%.',
        'brightness_increased': 'Brightness increased to {0}%.',
        'brightness_decreased': 'Brightness decreased to {0}%.',
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
        'media_play_pause': 'Media play/pause toggled.',
        'media_next': 'Skipped to next track.',
        'media_prev': 'Went back to previous track.',
        'media_stop': 'Media playback stopped.',
        'screenshot_captured': 'Screenshot captured successfully.',
    },
    'hi': {
        'confirm_shutdown': 'क्या आप वाकई कंप्यूटर बंद करना चाहते हैं?',
        'confirm_restart': 'क्या आप वाकई कंप्यूटर दोबारा शुरू करना चाहते हैं?',
        'confirm_delete': 'क्या आप वाकई इसे हटाना चाहते हैं?',
        'confirm_app_close': 'क्या आप वाकई {0} बंद करना चाहते हैं?',
        'confirm_whatsapp': '{0} को संदेश भेजें?',
        'shutdown_initiated': 'सिस्टम बंद हो रहा है।',
        'restart_initiated': 'सिस्टम दोबारा शुरू हो रहा है।',
        'volume_increased': 'आवाज़ {0}% तक बढ़ा दी गई है।',
        'volume_decreased': 'आवाज़ {0}% तक कम कर दी गई है।',
        'brightness_increased': 'ब्राइटनेस {0}% तक बढ़ा दी गई है।',
        'brightness_decreased': 'ब्राइटनेस {0}% तक कम कर दी गई है।',
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
        'media_play_pause': 'मीडिया प्ले/पॉज टॉगल किया गया।',
        'media_next': 'अगले गाने पर स्विच किया गया।',
        'media_prev': 'पिछले गाने पर वापस गए।',
        'media_stop': 'मीडिया प्लेबैक रोक दिया गया।',
        'screenshot_captured': 'स्क्रीनशॉट सफलतापूर्वक कैप्चर किया गया।',
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
