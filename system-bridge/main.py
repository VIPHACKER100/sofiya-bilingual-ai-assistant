import sys
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, cast
from pathlib import Path
from dataclasses import asdict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import BACKEND_PORT, FRONTEND_URL, CONFIG, PLATFORM
from modules.system import system_module
from modules.security import security
from modules.bilingual_parser import parser
from modules.window_manager import window_manager
from modules.input_control import input_controller
from modules.whatsapp import whatsapp_manager
from modules.file_manager import file_manager
from modules.media import media_processor
from modules.desktop import desktop_manager
from modules.llm import llm_module
from modules.automation import automation_manager
from modules.memory import memory_manager
from utils.logger import logger, log_command, log_system_event

# Track connected clients
connected_clients: Dict[str, WebSocket] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("SOFIYA Backend starting up...")
    log_system_event("STARTUP", {
        "port": BACKEND_PORT, 
        "platform": PLATFORM,
        "version": "2.1.1"
    })
    
    # Start background tasks
    status_broadcast_task = asyncio.create_task(broadcast_system_status())
    
    # Start automation scheduler
    automation_manager.start_scheduler()
    automation_manager.create_preset_tasks()
    automation_manager.create_preset_macros()
    
    yield
    
    # Cleanup
    status_broadcast_task.cancel()
    automation_manager.stop_scheduler()
    logger.info("SOFIYA Backend shutting down...")
    log_system_event("SHUTDOWN", {})

app = FastAPI(
    title="SOFIYA Backend",
    description="Cross-platform AI assistant backend with window management and automation",
    version="2.1.1",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def broadcast_system_status():
    """Broadcast system status to all connected clients every 5 seconds"""
    while True:
        try:
            await asyncio.sleep(5)
            if connected_clients:
                status = await system_module.get_system_status()
                message = {
                    "type": "system_status",
                    "data": status,
                    "timestamp": datetime.now().isoformat()
                }
                # Send to all connected clients
                disconnected = []
                for client_id, websocket in connected_clients.items():
                    try:
                        await websocket.send_json(message)
                    except:
                        disconnected.append(client_id)
                
                # Remove disconnected clients
                for client_id in disconnected:
                    connected_clients.pop(client_id, None)
                        
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in status broadcast: {e}")

async def handle_command(websocket: Optional[WebSocket], command: str, 
                         language: Optional[str] = None, 
                         override_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Process a command and return result"""
    # Use English as default language
    current_lang = language or 'en'
    
    # Detect language if not provided
    if not current_lang:
        current_lang = parser.detect_language(command)
    
    # Parse command
    command_key, detected_lang, params = parser.parse_command(command)
    if detected_lang:
        current_lang = detected_lang
        
    # Apply parameters override (from macros)
    if override_params:
        if params:
            params.update(override_params)
        else:
            params = override_params
    
    # Check if command matches a macro trigger phrase (voice trigger)
    macro = automation_manager.find_macro_by_trigger(command)
    if macro:
        logger.info(f"Voice trigger matched macro: {macro.name}")
        
        # Define callback for macro commands
        async def macro_cmd_callback(cmd, p):
            res = await handle_command(websocket, cmd, language, p)
            if websocket:
                try:
                    await websocket.send_json({
                        'type': 'macro_update',
                        'command': cmd,
                        'result': res
                    })
                except:
                    pass
        
        # Start macro in background
        asyncio.create_task(automation_manager.run_macro(macro.id, macro_cmd_callback))
        
        return {
            'success': True,
            'action_type': 'MACRO_STARTED',
            'response': f"Executing macro: {macro.name}" if language == 'en' else f"मैक्रो शुरू कर रहा हूँ: {macro.name}",
            'macro_name': macro.name
        }
    
    logger.info(f"Command received: '{command}' -> '{command_key}' (lang: {language})")
    
    # Route to appropriate module
    result: Dict[str, Any] = {}
    
    # System commands
    if command_key == 'system_status':
        result = await system_module.get_system_status(current_lang)
    
    elif command_key == 'time':
        result = await system_module.get_time(current_lang)
    
    elif command_key == 'date':
        result = await system_module.get_date(current_lang)
    
    elif command_key == 'battery':
        result = await system_module.get_battery_status(current_lang)
    
    elif command_key == 'shutdown':
        result = await system_module.shutdown(current_lang)
    
    elif command_key == 'restart':
        result = await system_module.restart(current_lang)
    
    elif command_key == 'sleep':
        result = await system_module.sleep(current_lang)
    
    elif command_key == 'volume_up' or command_key == 'volume_down':
        # Extract amount from params if present
        amount = None
        if params:
            import re
            nums = re.findall(r'\d+', str(params))
            if nums:
                amount = int(nums[0])
        
        if command_key == 'volume_up':
            result = await system_module.volume_up(amount, current_lang)
        else:
            result = await system_module.volume_down(amount, current_lang)
    
    elif command_key == 'mute':
        result = await system_module.toggle_mute(current_lang)
    
    # Window commands
    elif command_key == 'open_app':
        if params:
            app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
            result = await window_manager.open_app(app_name, language)
        else:
            result = {'success': False, 'error': 'No app name specified'}
            
    elif command_key == 'open_browser':
        if params:
            result = await system_module.google_search(str(params), language)
        else:
            import webbrowser
            webbrowser.open("https://www.google.com")
            result = {'success': True, 'action_type': 'OPEN_BROWSER', 'response': 'Opening a new browser tab.'}
    
    elif command_key == 'close_app':
        if params:
            app_name = params.get('app', str(params)) if isinstance(params, dict) else str(params)
            result = await window_manager.close_app(app_name, language)
        else:
            result = {'success': False, 'error': 'No app name specified'}
    
    elif command_key == 'minimize':
        result = await window_manager.minimize_window(params, language)
    
    elif command_key == 'maximize':
        result = await window_manager.maximize_window(params, language)
        
    elif command_key == 'activate_window' or command_key == 'focus_window':
        if params:
            result = await window_manager.activate_window(params, language)
        else:
            result = {'success': False, 'error': 'No window title specified'}
            
    elif command_key == 'close_window':
        if params:
            result = await window_manager.close_window_by_title(params, language)
        else:
            result = await window_manager.close_app(params, language)
            
    elif command_key == 'center_window':
        result = await window_manager.center_window(language)
    
    elif command_key == 'show_desktop':
        result = await window_manager.show_desktop(language)
    
    elif command_key == 'snap_left' or command_key == 'snap_right':
        direction = 'left' if command_key == 'snap_left' else 'right'
        result = await window_manager.snap_window(direction, language)
    
    # Input commands
    elif command_key == 'move_cursor':
        # Parse coordinates from params
        if params:
            try:
                if isinstance(params, dict):
                    x, y = int(params.get('x', 0)), int(params.get('y', 0))
                else:
                    coords = str(params).replace(',', ' ').split()
                    x, y = int(coords[0]), int(coords[1])
                result = await input_controller.move_cursor(x, y)
            except:
                result = {'success': False, 'error': 'Invalid coordinates. Format: X Y'}
        else:
            result = await input_controller.get_cursor_position()
    
    elif command_key == 'click':
        result = await input_controller.click('left')
    
    elif command_key == 'double_click':
        result = await input_controller.double_click()
    
    elif command_key == 'right_click':
        result = await input_controller.right_click()
    
    elif command_key == 'type_text':
        if params:
            result = await input_controller.type_text(params)
        else:
            result = {'success': False, 'error': 'No text specified'}
    
    elif command_key == 'scroll_up' or command_key == 'scroll_down':
        # Default scroll amount (300 is roughly one notch on many systems)
        base_amount = 300
        
        # Adjust based on intensity keywords in params
        multiplier = 1.0
        if params:
            p_lower = str(params).lower()
            if any(w in p_lower for w in ['a lot', 'very', 'much', 'bahut', 'jyada']):
                multiplier = 3.0
            elif any(w in p_lower for w in ['little', 'slightly', 'thoda', 'slowly']):
                multiplier = 0.5
        
        scroll_amount = int(base_amount * multiplier)
        if command_key == 'scroll_down':
            scroll_amount = -scroll_amount
            
        result = await input_controller.scroll(scroll_amount)
    
    # WhatsApp commands
    elif command_key == 'whatsapp_message':
        # Parse contact and message if they are in params (e.g., "Aryan, Hello there")
        if params:
            if isinstance(params, dict):
                contact = params.get('contact', params.get('to', ''))
                message = params.get('message', params.get('text', ''))
                result = await whatsapp_manager.send_message_web(contact, message, language)
            else:
                parts = [p.strip() for p in str(params).split(',')]
                if len(parts) >= 2:
                    contact = parts[0]
                    message = ' '.join(cast(Any, parts)[1:])
                    result = await whatsapp_manager.send_message_web(contact, message, language)
                else:
                    # If only one part, assume it's the contact
                    result = await whatsapp_manager.send_message_web(str(params), "", language)
        else:
            result = await whatsapp_manager.open_whatsapp_web(language)
    
    elif command_key == 'whatsapp_call':
        if params:
            result = await whatsapp_manager.make_call(params, 'voice', language)
        else:
            result = {'success': False, 'error': 'No contact specified'}
    
    # ==================== PHASE 3: FILE MANAGER COMMANDS ====================
    elif command_key in ['open_folder', 'open_downloads', 'open_documents', 'open_desktop', 'open_pictures', 'open_videos', 'open_music', 'open_home']:
        folder_map = {
            'open_downloads': 'downloads',
            'open_documents': 'documents',
            'open_desktop': 'desktop',
            'open_pictures': 'pictures',
            'open_videos': 'videos',
            'open_music': 'music',
            'open_home': 'home'
        }
        folder_name = folder_map.get(command_key, params if params else 'home')
        result = await file_manager.open_folder(folder_name, language)
    
    elif command_key == 'search_files':
        if params:
            result = await file_manager.search_files(params, None, language)
        else:
            result = {'success': False, 'error': 'No search term specified'}
    
    elif command_key == 'create_folder':
        if params:
            result = await file_manager.create_folder(params, None, language)
        else:
            result = {'success': False, 'error': 'No folder name specified'}
    
    elif command_key == 'delete_file':
        if params:
            result = await file_manager.delete_file(params, language)
        else:
            result = {'success': False, 'error': 'No file path specified'}
    
    # ==================== PHASE 3: MEDIA COMMANDS ====================
    elif command_key == 'ocr_image' or command_key == 'extract_text':
        if params:
            result = await media_processor.extract_text_from_image(params, language)
        else:
            result = await media_processor.extract_text_from_screenshot(language)
    
    elif command_key == 'ocr_pdf':
        if params:
            result = await media_processor.extract_text_from_pdf(params, None, language)
        else:
            result = {'success': False, 'error': 'No PDF path specified'}
    
    elif command_key == 'convert_image':
        if params:
            if isinstance(params, dict):
                src, dest = params.get('input', ''), params.get('output', '')
            else:
                parts = str(params).split()
                src, dest = (parts[0], parts[1]) if len(parts) >= 2 else ('', '')
            
            if src and dest:
                result = await media_processor.convert_image(src, dest)
            else:
                result = {'success': False, 'error': 'Input and output paths required'}
        else:
            result = {'success': False, 'error': 'No image path specified'}
    
    elif command_key == 'resize_image':
        if params:
            if isinstance(params, dict):
                src, dest = params.get('input', ''), params.get('output', '')
                w, h = params.get('width', 0), params.get('height', 0)
            else:
                parts = str(params).split()
                src, dest = (parts[0], parts[1]) if len(parts) >= 2 else ('', '')
                w, h = (int(parts[2]), int(parts[3])) if len(parts) >= 4 else (0, 0)
                
            if src and dest and w and h:
                result = await media_processor.resize_image(src, dest, int(w), int(h))
            else:
                result = {'success': False, 'error': 'Input, output, width, height required'}
        else:
            result = {'success': False, 'error': 'No parameters specified'}
    
    # ==================== PHASE 3: DESKTOP COMMANDS ====================
    elif command_key == 'take_screenshot':
        result = await desktop_manager.take_screenshot(True, language)
    
    elif command_key == 'get_clipboard':
        result = await desktop_manager.get_clipboard_text(language)
    
    elif command_key == 'set_clipboard':
        if params:
            result = await desktop_manager.set_clipboard_text(params, language)
        else:
            result = {'success': False, 'error': 'No text specified'}
    
    elif command_key == 'media_play':
        result = await desktop_manager.play_pause_media(language)
    
    elif command_key == 'media_next':
        result = await desktop_manager.next_track(language)
    
    elif command_key == 'media_previous':
        result = await desktop_manager.previous_track(language)
        
    elif command_key == 'media_stop':
        result = await desktop_manager.stop_media(language)
        
    # Advanced Desktop commands
    elif command_key == 'change_wallpaper':
        if params:
            result = await desktop_manager.change_wallpaper(params, language)
        else:
            result = {'success': False, 'error': 'No image path specified'}
            
    elif command_key == 'empty_recycle_bin':
        result = await desktop_manager.empty_recycle_bin(language)
        
    elif command_key == 'toggle_taskbar':
        result = await desktop_manager.toggle_taskbar(language=language)
        
    elif command_key == 'zoom_out':
        result = await desktop_manager.zoom_screen('out', language)
        
    elif command_key == 'toggle_icons':
        result = await desktop_manager.toggle_desktop_icons(language=language)
        
    elif command_key == 'set_theme':
        if params:
            result = await desktop_manager.set_theme(params, language)
        else:
            result = {'success': False, 'error': 'No theme specified (light/dark)'}
        
    elif command_key == 'brightness_up':
        result = await system_module.brightness_up(language)
        
    elif command_key == 'brightness_down':
        result = await system_module.brightness_down(language)
        
    elif command_key == 'network_info':
        result = await system_module.get_network_info(language)
        
    elif command_key == 'uptime':
        result = await system_module.get_uptime(language)
        
    elif command_key == 'system_health':
        result = await system_module.get_health_summary(language)
        
    elif command_key == 'google_search':
        if params:
            result = await system_module.google_search(params, language)
        else:
            result = {'success': False, 'error': 'No search query specified'}
            
    elif command_key == 'wikipedia_fetch':
        if params:
            import re
            # Extract query from params if it's a string like "about Artificial Intelligence"
            query = str(params)
            for skip in ['about', 'on', 'search', 'for', 'about the']:
                if query.lower().startswith(skip):
                    query = query[len(skip):].strip()
            
            result = await system_module.wikipedia_search(query, language)
        else:
            result = {'success': False, 'error': 'No topic specified'}
            
    elif command_key == 'weather':
        result = await system_module.get_weather(params, language)
        
    # Extra Media/Utility commands
    elif command_key == 'batch_pdf':
        if params:
            result = await media_processor.batch_images_to_pdf(params, language=language)
        else:
            result = {'success': False, 'error': 'No folder specified'}
            
    elif command_key == 'scan_folder':
        if params:
            result = await media_processor.scan_folder(params, language=language)
        else:
            result = {'success': False, 'error': 'No folder specified'}
            
    elif command_key == 'make_drawing':
        result = await media_processor.make_drawing(language)
        
    elif command_key == 'get_selected_text':
        result = await media_processor.get_selected_text(language)
        
    elif command_key == 'read_pdf':
        if params:
            result = await media_processor.read_pdf(params, language=language)
        else:
            result = {'success': False, 'error': 'No PDF path specified'}
            
    elif command_key == 'run_macro':
        if params:
            # Define callback for macro commands
            async def macro_cmd_callback(cmd, p):
                res = await handle_command(websocket, cmd, language, p)
                if websocket:
                    try:
                        await websocket.send_json({
                            'type': 'macro_update',
                            'command': cmd,
                            'result': res
                        })
                    except:
                        pass
                return res

            success = await automation_manager.run_macro(str(params), macro_cmd_callback)
            result = {
                'success': success,
                'action_type': 'MACRO_EXECUTE',
                'response': f"Macro '{params}' execution {'completed' if success else 'failed'}",
                'macro_id': params
            }
        else:
            result = {'success': False, 'error': 'No macro ID specified'}
            
    elif command_key == 'automation_status':
        result = automation_manager.get_scheduler_status()
        result['success'] = True
        
    elif command_key == 'narrate_screen':
        result = await media_processor.narrate_screen(language)
        
    elif command_key == 'screen_summary':
        result = await media_processor.get_screen_summary(language)
    
    else:
        # Unknown command - Try LLM fallback
        logger.info(f"Unknown command '{command_key}', trying LLM fallback...")
        llm_response = await llm_module.get_response(command, language)
        
        if llm_response:
            result = {
                'success': True,
                'action_type': 'CONVERSATION',
                'response': llm_response,
                'error': None
            }
            log_command(command, 'conversation', True)
        else:
            # Full fallback if LLM fails
            result = {
                'success': False,
                'action_type': 'UNKNOWN',
                'response': parser.get_response('command_not_understood', language),
                'error': 'Command not recognized'
            }
            log_command(command, 'unknown', False)
    
    # Post-process result: Handle confirmation request if needed
    res = cast(Dict[str, Any], result)
    if res and res.get('requires_confirmation') and not res.get('confirmation_id'):
        det = cast(Dict[str, Any], res.get('details', {}))
        details = {
            'command_key': command_key,
            'params': params,
            'language': current_lang
        }
        details.update(det)
            
        confirmation_id = security.request_confirmation(
            command_key=command_key,
            command_text=command,
            language=current_lang,
            details=details
        )
        res['confirmation_id'] = confirmation_id
    
    # Add metadata
    if res:
        res['command_key'] = command_key
        res['language'] = current_lang
        res['timestamp'] = datetime.now().isoformat()
    
    return res


@app.get("/api/system/status")
async def get_system_status():
    """REST endpoint for system status"""
    return await system_module.get_system_status()

@app.post("/api/command")
async def execute_command(command_data: Dict[str, Any]):
    """REST endpoint for executing commands"""
    command = command_data.get("command", "")
    language = command_data.get("language", "en")
    
    if not command:
        raise HTTPException(status_code=400, detail="Command is required")
    
    result = await handle_command(None, command, language)
    return result

@app.post("/api/confirm/{confirmation_id}")
async def confirm_command(confirmation_id: str, confirmation_data: Dict[str, Any]):
    """Confirm or reject a pending command"""
    approved = confirmation_data.get("approved", False)
    
    # Get confirmation details
    details = security.get_confirmation_details(confirmation_id)
    if not details:
        raise HTTPException(status_code=404, detail="Confirmation not found or expired")
    
    # Process confirmation
    success = security.confirm_command(confirmation_id, approved)
    
    if not success:
        raise HTTPException(status_code=400, detail="Confirmation already processed")
    
    # If approved, execute the command
    if approved:
        command_key = details['command_key']
        language = details['language']
        
        # Re-execute with confirmed flag
        if command_key == 'shutdown':
            result = await system_module.shutdown(language, confirmed=True)
        elif command_key == 'restart':
            result = await system_module.restart(language, confirmed=True)
        elif command_key == 'sleep':
            result = await system_module.sleep(language, confirmed=True)
        elif command_key == 'close_app':
            app_name = details['details'].get('app_name', '')
            result = await window_manager.close_app(app_name, language, confirmed=True)
        elif command_key == 'empty_recycle_bin':
            result = await desktop_manager.empty_recycle_bin(language, confirmed=True)
        elif command_key == 'delete_file':
            file_path = details['details'].get('file_path', '')
            result = await file_manager.delete_file(file_path, language, confirmed=True)
        elif command_key == 'whatsapp_send_desktop':
            contact = details['details'].get('contact', '')
            message = details['details'].get('message', '')
            result = await whatsapp_manager.send_message_desktop(contact, message, language, confirmed=True)
        else:
            result = {"success": False, "error": "Unknown command type"}
        
        return {
            "success": True,
            "approved": True,
            "result": result
        }
    
    return {
        "success": True,
        "approved": False,
        "message": "Command cancelled by user"
    }

# Window management endpoints
@app.get("/api/windows/list")
async def list_windows():
    """List all open windows"""
    return await window_manager.get_window_list()

@app.get("/api/apps/list")
async def list_apps():
    """List running applications"""
    return await window_manager.list_running_apps()

@app.post("/api/apps/open")
async def open_application(app_data: Dict[str, Any]):
    """Open an application"""
    app_name = app_data.get("app_name", "")
    language = app_data.get("language", "en")
    
    if not app_name:
        raise HTTPException(status_code=400, detail="App name is required")
    
    return await window_manager.open_app(app_name, language)

@app.post("/api/apps/close")
async def close_application(app_data: Dict[str, Any]):
    """Close an application"""
    app_name = app_data.get("app_name", "")
    language = app_data.get("language", "en")
    confirmed = app_data.get("confirmed", False)
    
    if not app_name:
        raise HTTPException(status_code=400, detail="App name is required")
    
    return await window_manager.close_app(app_name, language, confirmed)

# Input control endpoints
@app.get("/api/input/cursor")
async def get_cursor_position():
    """Get current cursor position"""
    return await input_controller.get_cursor_position()

@app.post("/api/input/move")
async def move_cursor(move_data: Dict[str, Any]):
    """Move cursor to position"""
    x = move_data.get("x")
    y = move_data.get("y")
    
    if x is None or y is None:
        raise HTTPException(status_code=400, detail="X and Y coordinates are required")
    
    return await input_controller.move_cursor(x, y)

@app.post("/api/input/click")
async def click_mouse(click_data: Optional[Dict[str, Any]] = None):
    """Click mouse"""
    button = click_data.get("button", "left") if click_data else "left"
    return await input_controller.click(button)

@app.post("/api/input/type")
async def type_text(type_data: Dict[str, Any]):
    """Type text"""
    text = type_data.get("text", "")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    return await input_controller.type_text(text)

# WhatsApp endpoints
@app.post("/api/whatsapp/send")
async def send_whatsapp_message(message_data: Dict[str, Any]):
    """Send WhatsApp message"""
    contact = message_data.get("contact", "")
    message = message_data.get("message", "")
    language = message_data.get("language", "en")
    method = message_data.get("method", "web")  # 'web' or 'desktop'
    confirmed = message_data.get("confirmed", False)
    
    if not contact:
        raise HTTPException(status_code=400, detail="Contact is required")
    
    if method == 'desktop':
        return await whatsapp_manager.send_message_desktop(contact, message, language, confirmed)
    else:
        return await whatsapp_manager.send_message_web(contact, message, language)

# ==================== PHASE 3: FILE MANAGER ENDPOINTS ====================

@app.post("/api/files/open")
async def api_open_folder(folder_data: Dict[str, Any]):
    """Open folder in file explorer"""
    folder_name = folder_data.get("folder", "")
    language = folder_data.get("language", "en")
    
    if not folder_name:
        raise HTTPException(status_code=400, detail="Folder name is required")
    
    return await file_manager.open_folder(folder_name, language)

@app.get("/api/files/list")
async def api_list_files(folder: Optional[str] = None, pattern: str = "*"):
    """List files in folder"""
    return await file_manager.list_files(folder, pattern)

@app.post("/api/files/search")
async def api_search_files(search_data: Dict[str, Any]):
    """Search for files"""
    search_name = search_data.get("search", "")
    folder = search_data.get("folder", None)
    language = search_data.get("language", "en")
    
    if not search_name:
        raise HTTPException(status_code=400, detail="Search term is required")
    
    return await file_manager.search_files(search_name, folder, language)

@app.post("/api/files/create")
async def api_create_folder(folder_data: Dict[str, Any]):
    """Create new folder"""
    folder_name = folder_data.get("name", "")
    parent = folder_data.get("parent", None)
    language = folder_data.get("language", "en")
    
    if not folder_name:
        raise HTTPException(status_code=400, detail="Folder name is required")
    
    return await file_manager.create_folder(folder_name, parent, language)

@app.post("/api/files/delete")
async def api_delete_file(file_data: Dict[str, Any]):
    """Delete file or folder"""
    file_path = file_data.get("path", "")
    language = file_data.get("language", "en")
    confirmed = file_data.get("confirmed", False)
    
    if not file_path:
        raise HTTPException(status_code=400, detail="File path is required")
    
    return await file_manager.delete_file(file_path, language, confirmed)

@app.post("/api/files/copy")
async def api_copy_file(copy_data: Dict[str, Any]):
    """Copy file or folder"""
    source = copy_data.get("source", "")
    destination = copy_data.get("destination", "")
    language = copy_data.get("language", "en")
    
    if not source or not destination:
        raise HTTPException(status_code=400, detail="Source and destination are required")
    
    return await file_manager.copy_file(source, destination, language)

@app.post("/api/files/move")
async def api_move_file(move_data: Dict[str, Any]):
    """Move file or folder"""
    source = move_data.get("source", "")
    destination = move_data.get("destination", "")
    language = move_data.get("language", "en")
    
    if not source or not destination:
        raise HTTPException(status_code=400, detail="Source and destination are required")
    
    return await file_manager.move_file(source, destination, language)

@app.post("/api/files/rename")
async def api_rename_file(rename_data: Dict[str, Any]):
    """Rename file or folder"""
    old_path = rename_data.get("old_path", "")
    new_name = rename_data.get("new_name", "")
    language = rename_data.get("language", "en")
    
    if not old_path or not new_name:
        raise HTTPException(status_code=400, detail="Old path and new name are required")
    
    return await file_manager.rename_file(old_path, new_name, language)

@app.get("/api/files/info")
async def api_get_file_info(path: str, language: str = "en"):
    """Get file information"""
    if not path:
        raise HTTPException(status_code=400, detail="File path is required")
    
    return await file_manager.get_file_info(path, language)

# ==================== PHASE 3: MEDIA PROCESSING ENDPOINTS ====================

@app.post("/api/media/ocr/image")
async def api_ocr_image(ocr_data: Dict[str, Any]):
    """Extract text from image"""
    image_path = ocr_data.get("image_path", "")
    language = ocr_data.get("language", "en")
    
    if not image_path:
        raise HTTPException(status_code=400, detail="Image path is required")
    
    return await media_processor.extract_text_from_image(image_path, language)

@app.post("/api/media/ocr/pdf")
async def api_ocr_pdf(ocr_data: Dict[str, Any]):
    """Extract text from PDF"""
    pdf_path = ocr_data.get("pdf_path", "")
    page_number = ocr_data.get("page_number", None)
    language = ocr_data.get("language", "en")
    
    if not pdf_path:
        raise HTTPException(status_code=400, detail="PDF path is required")
    
    return await media_processor.extract_text_from_pdf(pdf_path, page_number, language)

@app.post("/api/media/ocr/screen")
async def api_ocr_screen(language: str = "en"):
    """Extract text from screenshot"""
    return await media_processor.extract_text_from_screenshot(language)

@app.post("/api/pdf/merge")
async def api_merge_pdfs(pdf_data: Dict[str, Any]):
    """Merge multiple PDFs"""
    files = pdf_data.get("files", [])
    output = pdf_data.get("output", "")
    language = pdf_data.get("language", "en")
    
    if not files or not output:
        raise HTTPException(status_code=400, detail="Files and output path are required")
    
    return await media_processor.merge_pdfs(files, output, language)

@app.post("/api/pdf/split")
async def api_split_pdf(pdf_data: Dict[str, Any]):
    """Split PDF into pages"""
    pdf_path = pdf_data.get("pdf_path", "")
    pages = pdf_data.get("pages", [])
    output = pdf_data.get("output", "")
    language = pdf_data.get("language", "en")
    
    if not pdf_path or not pages or not output:
        raise HTTPException(status_code=400, detail="PDF path, pages, and output are required")
    
    return await media_processor.split_pdf(pdf_path, pages, output, language)

@app.post("/api/pdf/to-images")
async def api_pdf_to_images(pdf_data: Dict[str, Any]):
    """Convert PDF to images"""
    pdf_path = pdf_data.get("pdf_path", "")
    output_folder = pdf_data.get("output_folder", None)
    dpi = pdf_data.get("dpi", 200)
    language = pdf_data.get("language", "en")
    
    if not pdf_path:
        raise HTTPException(status_code=400, detail="PDF path is required")
    
    return await media_processor.pdf_to_images(pdf_path, output_folder, dpi, language)

@app.post("/api/pdf/from-images")
async def api_images_to_pdf(pdf_data: Dict[str, Any]):
    """Convert images to PDF"""
    images = pdf_data.get("images", [])
    output = pdf_data.get("output", "")
    language = pdf_data.get("language", "en")
    
    if not images or not output:
        raise HTTPException(status_code=400, detail="Images and output path are required")
    
    return await media_processor.images_to_pdf(images, output, language)

@app.post("/api/image/convert")
async def api_convert_image(image_data: Dict[str, Any]):
    """Convert image format"""
    input_path = image_data.get("input", "")
    output_path = image_data.get("output", "")
    format = image_data.get("format", None)
    language = image_data.get("language", "en")
    
    if not input_path or not output_path:
        raise HTTPException(status_code=400, detail="Input and output paths are required")
    
    return await media_processor.convert_image(input_path, output_path, format, language)

@app.post("/api/image/resize")
async def api_resize_image(image_data: Dict[str, Any]):
    """Resize image"""
    input_path = image_data.get("input", "")
    output_path = image_data.get("output", "")
    width = image_data.get("width", None)
    height = image_data.get("height", None)
    maintain_aspect = image_data.get("maintain_aspect", True)
    language = image_data.get("language", "en")
    
    if not input_path or not output_path:
        raise HTTPException(status_code=400, detail="Input and output paths are required")
    
    return await media_processor.resize_image(input_path, output_path, width, height, maintain_aspect, language)

@app.post("/api/image/compress")
async def api_compress_image(image_data: Dict[str, Any]):
    """Compress image"""
    input_path = image_data.get("input", "")
    output_path = image_data.get("output", "")
    quality = image_data.get("quality", 85)
    language = image_data.get("language", "en")
    
    if not input_path or not output_path:
        raise HTTPException(status_code=400, detail="Input and output paths are required")
    
    return await media_processor.compress_image(input_path, output_path, quality, language)

# ==================== PHASE 3: DESKTOP ENDPOINTS ====================

@app.get("/api/desktop/screenshot")
async def api_take_screenshot(save: bool = True, language: str = "en"):
    """Take full screenshot"""
    return await desktop_manager.take_screenshot(save, language)

@app.post("/api/desktop/screenshot/region")
async def api_screenshot_region(region_data: Dict[str, Any]):
    """Take region screenshot"""
    x = region_data.get("x", 0)
    y = region_data.get("y", 0)
    width = region_data.get("width", 100)
    height = region_data.get("height", 100)
    save = region_data.get("save", True)
    language = region_data.get("language", "en")
    
    return await desktop_manager.take_screenshot_region(x, y, width, height, save, language)

@app.get("/api/desktop/clipboard/text")
async def api_get_clipboard_text(language: str = "en"):
    """Get clipboard text"""
    return await desktop_manager.get_clipboard_text(language)

@app.post("/api/desktop/clipboard/text")
async def api_set_clipboard_text(clipboard_data: Dict[str, Any]):
    """Set clipboard text"""
    text = clipboard_data.get("text", "")
    language = clipboard_data.get("language", "en")
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    return await desktop_manager.set_clipboard_text(text, language)

@app.delete("/api/desktop/clipboard")
async def api_clear_clipboard(language: str = "en"):
    """Clear clipboard"""
    return await desktop_manager.clear_clipboard(language)

@app.post("/api/desktop/media/play")
async def api_media_play(language: str = "en"):
    """Play/pause media"""
    return await desktop_manager.play_pause_media(language)

@app.post("/api/desktop/media/next")
async def api_media_next(language: str = "en"):
    """Next track"""
    return await desktop_manager.next_track(language)

@app.post("/api/desktop/media/previous")
async def api_media_previous(language: str = "en"):
    """Previous track"""
    return await desktop_manager.previous_track(language)

@app.post("/api/desktop/media/stop")
async def api_media_stop(language: str = "en"):
    """Stop media"""
    return await desktop_manager.stop_media(language)

@app.get("/api/desktop/screen/resolution")
async def api_screen_resolution(language: str = "en"):
    """Get screen resolution"""
    return await desktop_manager.get_screen_resolution(language)

@app.post("/api/desktop/notification")
async def api_show_notification(notification_data: Dict[str, Any]):
    """Show system notification"""
    title = notification_data.get("title", "JARVIS")
    message = notification_data.get("message", "")
    language = notification_data.get("language", "en")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    return await desktop_manager.show_notification(title, message, language)

@app.post("/api/desktop/wallpaper")
async def api_change_wallpaper(wallpaper_data: Dict[str, Any]):
    """Change desktop wallpaper"""
    image_path = wallpaper_data.get("image_path", "")
    language = wallpaper_data.get("language", "en")
    
    if not image_path:
        raise HTTPException(status_code=400, detail="Image path is required")
    
    return await desktop_manager.change_wallpaper(image_path, language)

@app.post("/api/desktop/recycle-bin/empty")
async def api_empty_recycle_bin(recycle_data: Dict[str, Any]):
    """Empty recycle bin"""
    language = recycle_data.get("language", "en")
    confirmed = recycle_data.get("confirmed", False)
    
    return await desktop_manager.empty_recycle_bin(language, confirmed)

@app.post("/api/desktop/taskbar/toggle")
async def api_toggle_taskbar(taskbar_data: Dict[str, Any]):
    """Toggle taskbar visibility"""
    show = taskbar_data.get("show", None)
    language = taskbar_data.get("language", "en")
    
    return await desktop_manager.toggle_taskbar(show, language)

@app.post("/api/desktop/zoom")
async def api_zoom_screen(zoom_data: Dict[str, Any]):
    """Zoom screen"""
    level = zoom_data.get("level", "in")
    language = zoom_data.get("language", "en")
    
    return await desktop_manager.zoom_screen(level, language)

@app.post("/api/media/batch-pdf")
async def api_batch_pdf(batch_data: Dict[str, Any]):
    """Batch convert images to PDF"""
    folder = batch_data.get("folder", "")
    output = batch_data.get("output", "batch_images.pdf")
    language = batch_data.get("language", "en")
    
    if not folder:
        raise HTTPException(status_code=400, detail="Source folder is required")
    
    return await media_processor.batch_images_to_pdf(folder, output, language)

@app.post("/api/media/scan")
async def api_scan_folder(scan_data: Dict[str, Any]):
    """Scan folder for files"""
    folder = scan_data.get("folder", "")
    file_type = scan_data.get("file_type", "all")
    language = scan_data.get("language", "en")
    
    if not folder:
        raise HTTPException(status_code=400, detail="Folder path is required")
    
    return await media_processor.scan_folder(folder, file_type, language)

@app.post("/api/media/drawing")
async def api_make_drawing(language: str = "en"):
    """Open drawing application"""
    return await media_processor.make_drawing(language)

@app.get("/api/media/selection")
async def api_get_selection(language: str = "en"):
    """Get selected text"""
    return await media_processor.get_selected_text(language)

# ==================== PHASE 4: MEMORY & AUTOMATION ENDPOINTS ====================

@app.post("/api/memory/conversation")
async def api_save_conversation(conv_data: Dict[str, Any]):
    """Save a conversation entry"""
    from modules.memory import ConversationEntry, memory_manager
    
    entry = ConversationEntry(
        user_input=conv_data.get("user_input", ""),
        jarvis_response=conv_data.get("jarvis_response", ""),
        command_type=conv_data.get("command_type", ""),
        success=conv_data.get("success", True),
        context=json.dumps(conv_data.get("context", {})),
        language=conv_data.get("language", "en"),
        session_id=conv_data.get("session_id", "")
    )
    
    success = memory_manager.save_conversation(entry)
    return {"success": success, "id": entry.id}

@app.get("/api/memory/conversations")
async def api_get_conversations(limit: int = 10, session_id: Optional[str] = None):
    """Get recent conversations"""
    from modules.memory import memory_manager
    
    entries = memory_manager.get_recent_conversations(limit, session_id)
    return {
        "success": True,
        "conversations": [
            {
                "id": e.id,
                "timestamp": e.timestamp,
                "user_input": e.user_input,
                "jarvis_response": e.jarvis_response,
                "command_type": e.command_type,
                "success": e.success,
                "language": e.language
            }
            for e in entries
        ]
    }

@app.get("/api/memory/stats")
async def api_get_memory_stats(days: int = 7):
    """Get conversation statistics"""
    from modules.memory import memory_manager
    
    stats = memory_manager.get_conversation_stats(days)
    return {"success": True, "stats": stats}

@app.post("/api/memory/fact")
async def api_save_memory_fact(fact_data: Dict[str, Any]):
    """Save a user fact/memory"""
    from modules.memory import MemoryEntry, memory_manager
    
    entry = MemoryEntry(
        key=fact_data.get("key", ""),
        value=fact_data.get("value", ""),
        category=fact_data.get("category", "general"),
        confidence=fact_data.get("confidence", 1.0),
        source=fact_data.get("source", "user")
    )
    
    success = memory_manager.save_memory(entry)
    return {"success": success}

@app.get("/api/memory/facts")
async def api_get_memory_facts(category: Optional[str] = None):
    """Get user facts/memories"""
    from modules.memory import memory_manager
    
    if category:
        entries = memory_manager.get_memories_by_category(category)
    else:
        # Get all memories
        entries = []
        for cat in ["preferences", "contacts", "facts", "general"]:
            entries.extend(memory_manager.get_memories_by_category(cat))
    
    return {
        "success": True,
        "facts": [
            {
                "key": e.key,
                "value": e.value,
                "category": e.category,
                "confidence": e.confidence,
                "updated_at": e.updated_at
            }
            for e in entries
        ]
    }

@app.post("/api/automation/task")
async def api_create_task(task_data: Dict[str, Any]):
    """Create a scheduled task"""
    from modules.automation import automation_manager
    
    task = automation_manager.create_task(
        name=task_data.get("name", ""),
        description=task_data.get("description", ""),
        command=task_data.get("command", ""),
        schedule_type=task_data.get("schedule_type", "daily"),
        schedule_time=task_data.get("schedule_time", "08:00"),
        days=task_data.get("days", []),
        parameters=task_data.get("parameters", {})
    )
    
    if task:
        return {"success": True, "task": asdict(task)}
    return {"success": False, "error": "Failed to create task"}

@app.get("/api/automation/tasks")
async def api_get_tasks():
    """Get all scheduled tasks"""
    from modules.automation import automation_manager
    
    tasks = automation_manager.get_all_tasks()
    return {
        "success": True,
        "tasks": [asdict(t) for t in tasks]
    }

@app.post("/api/automation/macro")
async def api_create_macro(macro_data: Dict[str, Any]):
    """Create a macro"""
    from modules.automation import automation_manager
    
    macro = automation_manager.create_macro(
        name=macro_data.get("name", ""),
        description=macro_data.get("description", ""),
        commands=macro_data.get("commands", []),
        trigger=macro_data.get("trigger", "manual"),
        trigger_phrase=macro_data.get("trigger_phrase", ""),
        hotkey=macro_data.get("hotkey", "")
    )
    
    if macro:
        return {"success": True, "macro": asdict(macro)}
    return {"success": False, "error": "Failed to create macro"}

@app.get("/api/automation/macros")
async def api_get_macros():
    """Get all macros"""
    from modules.automation import automation_manager
    
    macros = automation_manager.get_all_macros()
    return {
        "success": True,
        "macros": [asdict(m) for m in macros]
    }

@app.get("/api/automation/status")
async def api_get_automation_status():
    """Get automation scheduler status"""
    from modules.automation import automation_manager
    
    status = automation_manager.get_scheduler_status()
    return {"success": True, "status": status}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    client_id = str(id(websocket))
    connected_clients[client_id] = websocket
    
    logger.info(f"Client {client_id} connected. Total clients: {len(connected_clients)}")
    log_system_event("CLIENT_CONNECTED", {"client_id": client_id, "total": len(connected_clients)})
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type", "unknown")
            
            if msg_type == "command":
                # Process command
                command = message.get("command", "")
                language = message.get("language", "en")
                
                result = await handle_command(websocket, command, language)
                
                # Send response
                await websocket.send_json({
                    "type": "command_response",
                    "data": result
                })
            
            elif msg_type == "ping":
                # Keep-alive ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            
            elif msg_type == "get_status":
                # Request system status
                status = await system_module.get_system_status()
                await websocket.send_json({
                    "type": "system_status",
                    "data": status
                })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}"
                })
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        if client_id in connected_clients:
            del cast(Any, connected_clients)[client_id]
        log_system_event("CLIENT_DISCONNECTED", {"client_id": client_id})
        
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        if client_id in connected_clients:
            del cast(Any, connected_clients)[client_id]

# Serve frontend if it exists - MOVED TO END to prevent intercepting API/WS routes
# Resolve frontend dist directory - works for both dev and PyInstaller frozen builds
def _find_frontend_dir() -> tuple[Optional[Path], list[str]]:
    """Find the frontend dist directory in multiple candidate locations."""
    import sys
    import os
    candidates = []
    
    # 0. Manual override via environment variable
    env_path = os.environ.get("JARVIS_FRONTEND_DIR")
    if env_path:
        candidates.append(Path(env_path))
    
    # 1. PyInstaller frozen: check _MEIPASS and relative to executable
    if getattr(sys, 'frozen', False):
        # sys._MEIPASS is the internal bundle directory
        if hasattr(sys, '_MEIPASS'):
            bundle_dir = Path(cast(str, sys._MEIPASS))
            candidates.append(bundle_dir / "frontend")
            candidates.append(bundle_dir / "dist")
            
        exe_dir = Path(sys.executable).parent
        candidates.append(exe_dir / "frontend")
        candidates.append(exe_dir / "dist")
        candidates.append(exe_dir / "_internal" / "frontend")
        candidates.append(exe_dir / "_internal" / "dist")
    
    # 2. Normal Python: relative to this file
    try:
        base_path = Path(__file__).resolve().parent.parent
        candidates.append(base_path / "dist")
        candidates.append(base_path / "frontend")
        candidates.append(base_path / "backend" / "dist")
    except:
        pass
    
    # 3. Fallback: relative to current working directory
    cwd = Path.cwd()
    candidates.append(cwd / "dist")
    candidates.append(cwd / "frontend")
    candidates.append(cwd.parent / "dist")
    candidates.append(cwd / "backend" / "dist")
    
    checked_paths = []
    for candidate in candidates:
        candidate_path = str(candidate)
        if candidate_path not in checked_paths:
            checked_paths.append(candidate_path)
            if candidate.exists() and (candidate / "index.html").exists():
                return candidate, checked_paths
    
    return None, checked_paths

frontend_dir, checked_locations = _find_frontend_dir()
if frontend_dir is not None:
    logger.info(f"Serving frontend from {frontend_dir}")
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
else:
    logger.warning(f"Frontend dist not found. Checked locations: {checked_locations}")
    @app.get("/")
    async def root():
        return {
            "status": "online", 
            "message": "Backend server is running (frontend directory not found)",
            "checked_paths": checked_locations,
            "cwd": str(Path.cwd()),
            "frozen": getattr(sys, 'frozen', False)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)
