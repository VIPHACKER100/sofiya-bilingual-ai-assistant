import os
import io
import base64
import pyautogui
import pyperclip
import ctypes
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
from PIL import Image

from modules.bilingual_parser import parser
from utils.platform_utils import is_windows, is_macos, is_linux
from utils.logger import logger, log_command


class DesktopManager:
    """Screenshots, clipboard, and media controls"""

    def __init__(self):
        self.screenshots_dir = Path.home() / 'Pictures' / 'SOFIYA_Screenshots'
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)

    # ==================== SCREENSHOT FUNCTIONS ====================

    async def take_screenshot(
            self,
            save_to_file: bool = True,
            language: str = 'en') -> Dict:
        """Take full screenshot"""
        try:
            screenshot = pyautogui.screenshot()

            # Convert to base64 for sending to frontend
            buffered = io.BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            file_path = None
            if save_to_file:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                file_path = self.screenshots_dir / \
                    f"screenshot_{timestamp}.png"
                screenshot.save(str(file_path))

            log_command('take screenshot', 'screenshot', True)

            return {
                'success': True,
                'action_type': 'SCREENSHOT',
                'image': f'data:image/png;base64,{img_str}',
                'file_path': str(file_path) if file_path else None,
                'size': screenshot.size,
                'response': parser.get_response('screenshot_captured', language)
            }

        except Exception as e:
            logger.error(f'Error taking screenshot: {e}')
            return {
                'success': False,
                'action_type': 'SCREENSHOT',
                'error': str(e),
                'response': 'Failed to take screenshot'
            }

    async def take_screenshot_region(
            self,
            x: int,
            y: int,
            width: int,
            height: int,
            save_to_file: bool = True,
            language: str = 'en') -> Dict:
        """Take screenshot of specific region"""
        try:
            screenshot = pyautogui.screenshot(region=(x, y, width, height))

            # Convert to base64
            buffered = io.BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            file_path = None
            if save_to_file:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                file_path = self.screenshots_dir / \
                    f"screenshot_region_{timestamp}.png"
                screenshot.save(str(file_path))

            log_command(
                f'take region screenshot {x},{y},{width},{height}', 'screenshot_region', True)

            return {
                'success': True,
                'action_type': 'SCREENSHOT_REGION',
                'region': {'x': x, 'y': y, 'width': width, 'height': height},
                'image': f'data:image/png;base64,{img_str}',
                'file_path': str(file_path) if file_path else None,
                'response': f'Region screenshot captured ({width}x{height})'
            }

        except Exception as e:
            logger.error(f'Error taking region screenshot: {e}')
            return {
                'success': False,
                'action_type': 'SCREENSHOT_REGION',
                'error': str(e),
                'response': 'Failed to take screenshot'
            }

    async def save_screenshot(
            self,
            image_data: str,
            filename: Optional[str] = None,
            language: str = 'en') -> Dict:
        """Save base64 screenshot to file"""
        try:
            # Decode base64
            image_bytes = base64.b64decode(image_data.split(
                ',')[1] if ',' in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))

            # Generate filename
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.png"

            file_path = self.screenshots_dir / filename
            image.save(str(file_path))

            return {
                'success': True,
                'action_type': 'SAVE_SCREENSHOT',
                'file_path': str(file_path),
                'response': f'Screenshot saved to {file_path.name}'
            }

        except Exception as e:
            logger.error(f'Error saving screenshot: {e}')
            return {
                'success': False,
                'action_type': 'SAVE_SCREENSHOT',
                'error': str(e),
                'response': 'Failed to save screenshot'
            }

    # ==================== CLIPBOARD FUNCTIONS ====================

    async def get_clipboard_text(self, language: str = 'en') -> Dict:
        """Get text from clipboard"""
        try:
            text = pyperclip.paste()

            return {
                'success': True,
                'action_type': 'CLIPBOARD_GET_TEXT',
                'text': text,
                'text_preview': text[:200] + '...' if len(text) > 200 else text,
                'length': len(text),
                'response': f'Clipboard text retrieved ({len(text)} characters)'
            }

        except Exception as e:
            logger.error(f'Error getting clipboard text: {e}')
            return {
                'success': False,
                'action_type': 'CLIPBOARD_GET_TEXT',
                'error': str(e),
                'response': 'Failed to get clipboard text'
            }

    async def set_clipboard_text(
            self,
            text: str,
            language: str = 'en') -> Dict:
        """Set text to clipboard"""
        try:
            pyperclip.copy(text)

            log_command(f'copy text to clipboard ({len(text)} chars)', 'clipboard_set_text', True)

            return {
                'success': True,
                'action_type': 'CLIPBOARD_SET_TEXT',
                'text': text,
                'length': len(text),
                'response': f'Copied {len(text)} characters to clipboard'
            }

        except Exception as e:
            logger.error(f'Error setting clipboard text: {e}')
            return {
                'success': False,
                'action_type': 'CLIPBOARD_SET_TEXT',
                'error': str(e),
                'response': 'Failed to copy to clipboard'
            }

    async def clear_clipboard(self, language: str = 'en') -> Dict:
        """Clear clipboard"""
        try:
            pyperclip.copy('')

            return {
                'success': True,
                'action_type': 'CLIPBOARD_CLEAR',
                'response': 'Clipboard cleared'
            }

        except Exception as e:
            logger.error(f'Error clearing clipboard: {e}')
            return {
                'success': False,
                'action_type': 'CLIPBOARD_CLEAR',
                'error': str(e),
                'response': 'Failed to clear clipboard'
            }

    # ==================== MEDIA CONTROLS ====================

    async def play_pause_media(self, language: str = 'en') -> Dict:
        """Play/pause media playback"""
        try:
            pyautogui.press('playpause')

            log_command('play/pause media', 'media_play_pause', True)

            return {
                'success': True,
                'action_type': 'MEDIA_PLAY_PAUSE',
                'response': parser.get_response('media_play_pause', language)
            }

        except Exception as e:
            logger.error(f'Error controlling media: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_PLAY_PAUSE',
                'error': str(e),
                'response': 'Failed to control media'
            }

    async def next_track(self, language: str = 'en') -> Dict:
        """Next track/song"""
        try:
            pyautogui.press('nexttrack')

            log_command('next track', 'media_next', True)

            return {
                'success': True,
                'action_type': 'MEDIA_NEXT',
                'response': parser.get_response('media_next', language)
            }

        except Exception as e:
            logger.error(f'Error next track: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_NEXT',
                'error': str(e),
                'response': 'Failed to skip track'
            }

    async def previous_track(self, language: str = 'en') -> Dict:
        """Previous track/song"""
        try:
            pyautogui.press('prevtrack')

            log_command('previous track', 'media_previous', True)

            return {
                'success': True,
                'action_type': 'MEDIA_PREVIOUS',
                'response': parser.get_response('media_previous', language)
            }

        except Exception as e:
            logger.error(f'Error previous track: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_PREVIOUS',
                'error': str(e),
                'response': 'Failed to go back track'
            }

    async def stop_media(self, language: str = 'en') -> Dict:
        """Stop media playback"""
        try:
            pyautogui.press('stop')

            log_command('stop media', 'media_stop', True)

            return {
                'success': True,
                'action_type': 'MEDIA_STOP',
                'response': parser.get_response('media_stop', language)
            }

        except Exception as e:
            logger.error(f'Error stopping media: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_STOP',
                'error': str(e),
                'response': 'Failed to stop media'
            }

    async def volume_mute(self, language: str = 'en') -> Dict:
        """Mute/unmute system volume"""
        try:
            pyautogui.press('volumemute')

            log_command('mute volume', 'volume_mute', True)

            return {
                'success': True,
                'action_type': 'VOLUME_MUTE',
                'response': 'Mute toggled'
            }

        except Exception as e:
            logger.error(f'Error muting volume: {e}')
            return {
                'success': False,
                'action_type': 'VOLUME_MUTE',
                'error': str(e),
                'response': 'Failed to mute'
            }

    async def volume_up(self, language: str = 'en') -> Dict:
        """Increase system volume"""
        try:
            pyautogui.press('volumeup')

            log_command('volume up', 'media_volume_up', True)

            return {
                'success': True,
                'action_type': 'MEDIA_VOLUME_UP',
                'response': 'Volume up'
            }

        except Exception as e:
            logger.error(f'Error increasing volume: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_VOLUME_UP',
                'error': str(e),
                'response': 'Failed to increase volume'
            }

    async def volume_down(self, language: str = 'en') -> Dict:
        """Decrease system volume"""
        try:
            pyautogui.press('volumedown')

            log_command('volume down', 'media_volume_down', True)

            return {
                'success': True,
                'action_type': 'MEDIA_VOLUME_DOWN',
                'response': 'Volume down'
            }

        except Exception as e:
            logger.error(f'Error decreasing volume: {e}')
            return {
                'success': False,
                'action_type': 'MEDIA_VOLUME_DOWN',
                'error': str(e),
                'response': 'Failed to decrease volume'
            }

    # ==================== UTILITY FUNCTIONS ====================

    async def get_screen_resolution(self, language: str = 'en') -> Dict:
        """Get screen resolution"""
        try:
            width, height = pyautogui.size()

            return {
                'success': True,
                'action_type': 'SCREEN_RESOLUTION',
                'width': width,
                'height': height,
                'resolution': f'{width}x{height}',
                'response': f'Screen resolution: {width}x{height}'
            }

        except Exception as e:
            logger.error(f'Error getting screen resolution: {e}')
            return {
                'success': False,
                'action_type': 'SCREEN_RESOLUTION',
                'error': str(e),
                'response': 'Failed to get screen resolution'
            }

    async def show_notification(
            self,
            title: str,
            message: str,
            language: str = 'en') -> Dict:
        """Show system notification"""
        try:
            if is_windows():
                from win10toast import ToastNotifier
                toaster = ToastNotifier()
                toaster.show_toast(title, message, duration=5)
            elif is_macos():
                script = f'display notification "{message}" with title "{title}"'
                os.system(f'osascript -e \'{script}\'')
            else:
                # Linux
                os.system(f'notify-send "{title}" "{message}"')

            return {
                'success': True,
                'action_type': 'NOTIFICATION',
                'title': title,
                'message': message,
                'response': 'Notification shown'
            }

        except Exception as e:
            logger.error(f'Error showing notification: {e}')
            return {
                'success': False,
                'action_type': 'NOTIFICATION',
                'error': str(e),
                'response': 'Failed to show notification'
            }

    # ==================== ADVANCED WINDOWS FEATURES ====================

    async def change_wallpaper(
            self,
            image_path: str,
            language: str = 'en') -> Dict:
        """Change desktop wallpaper"""
        try:
            path = Path(image_path).expanduser().resolve()
            if not path.exists():
                return {
                    'success': False,
                    'error': 'Image not found',
                    'response': 'Wallpaper image not found'}

            if is_windows():
                SPI_SETDESKWALLPAPER = 20
                ctypes.windll.user32.SystemParametersInfoW(
                    SPI_SETDESKWALLPAPER, 0, str(path), 3)  # type: ignore
            elif is_macos():
                script = f'tell application "System Events" to set picture of every desktop to POSIX file "{path}"'
                subprocess.run(['osascript', '-e', script])
            else:
                # GNOME example
                subprocess.run(['gsettings',
                                'set',
                                'org.gnome.desktop.background',
                                'picture-uri',
                                f'file://{path}'])

            log_command(f'change wallpaper to {path.name}', 'change_wallpaper', True)
            return {
                'success': True,
                'action_type': 'CHANGE_WALLPAPER',
                'path': str(path),
                'response': 'Wallpaper changed successfully'}
        except Exception as e:
            logger.error(f'Error changing wallpaper: {e}')
            return {
                'success': False,
                'error': str(e),
                'response': 'Failed to change wallpaper'}

    async def empty_recycle_bin(
            self,
            language: str = 'en',
            confirmed: bool = False) -> Dict:
        """Empty system recycle bin"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'action_type': 'EMPTY_RECYCLE_BIN',
                'response': 'Are you sure you want to empty the recycle bin?',
                'confirmation_context': {'command': 'empty_recycle_bin'}
            }

        try:
            if is_windows():
                import winshell
                winshell.recycle_bin().empty(confirm=False, show_progress=False, sound=True)
            elif is_macos():
                subprocess.run(
                    ['osascript', '-e', 'tell application "Finder" to empty trash'])
            else:
                os.system('rm -rf ~/.local/share/Trash/*')

            log_command('empty recycle bin', 'empty_recycle_bin', True)
            return {
                'success': True,
                'action_type': 'EMPTY_RECYCLE_BIN',
                'response': 'Recycle bin emptied'}
        except Exception as e:
            logger.error(f'Error emptying recycle bin: {e}')
            return {
                'success': False,
                'error': str(e),
                'response': 'Failed to empty recycle bin'}

    async def toggle_taskbar(
            self,
            show: Optional[bool] = None,
            language: str = 'en') -> Dict:
        """Hide or show the Windows taskbar"""
        if not is_windows():
            return {
                'success': False,
                'error': 'Not supported on this platform'}

        try:
            # Find the taskbar window
            hwnd = ctypes.windll.user32.FindWindowW(
                "Shell_TrayWnd", None)  # type: ignore

            SW_HIDE = 0
            SW_SHOW = 5

            current_state = ctypes.windll.user32.IsWindowVisible(
                hwnd)  # type: ignore

            if show is None:
                # Toggle based on current state
                should_show = not current_state
            else:
                should_show = show

            if should_show:
                ctypes.windll.user32.ShowWindow(hwnd, SW_SHOW)  # type: ignore
                status = 'shown'
            else:
                ctypes.windll.user32.ShowWindow(hwnd, SW_HIDE)  # type: ignore
                status = 'hidden'

            return {
                'success': True,
                'action_type': 'TOGGLE_TASKBAR',
                'status': status,
                'response': f'Taskbar {status}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def toggle_desktop_icons(
            self,
            show: Optional[bool] = None,
            language: str = 'en') -> Dict:
        """Hide or show desktop icons (Windows)"""
        if not is_windows():
            return {
                'success': False,
                'error': 'Not supported on this platform'}

        try:
            import winreg
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                key_path,
                0,
                winreg.KEY_ALL_ACCESS)

            if show is None:
                # Get current value
                current_value, _ = winreg.QueryValueEx(key, "HideIcons")
                should_hide = 0 if current_value == 1 else 1
            else:
                should_hide = 0 if show else 1

            winreg.SetValueEx(
                key,
                "HideIcons",
                0,
                winreg.REG_DWORD,
                should_hide)
            winreg.CloseKey(key)

            # Refresh desktop to apply changes
            # This is tricky without restart/logout, but sending a message
            # usually works
            ctypes.windll.user32.SendMessageW(
                0xffff, 0x0111, 0x1a221, 0)  # type: ignore (WM_COMMAND, refresh)

            status = 'hidden' if should_hide else 'shown'
            return {
                'success': True,
                'action_type': 'TOGGLE_ICONS',
                'status': status,
                'response': f'Desktop icons {status}'}
        except Exception as e:
            logger.error(f'Error toggling icons: {e}')
            return {'success': False, 'error': str(e)}

    async def set_theme(
            self,
            theme: str = 'dark',
            language: str = 'en') -> Dict:
        """Set Windows system theme (light/dark)"""
        if not is_windows():
            return {
                'success': False,
                'error': 'Not supported on this platform'}

        try:
            import winreg
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                key_path,
                0,
                winreg.KEY_ALL_ACCESS)

            value = 0 if theme.lower() == 'dark' else 1

            # Apps use light/dark mode
            winreg.SetValueEx(
                key,
                "AppsUseLightTheme",
                0,
                winreg.REG_DWORD,
                value)
            # System uses light/dark mode
            winreg.SetValueEx(key, "SystemUsesLightTheme",
                              0, winreg.REG_DWORD, value)

            winreg.CloseKey(key)

            return {
                'success': True,
                'action_type': 'SET_THEME',
                'theme': theme,
                'response': f'System theme set to {theme}'}
        except Exception as e:
            logger.error(f'Error setting theme: {e}')
            return {'success': False, 'error': str(e)}

    async def zoom_screen(
            self,
            level: str = 'in',
            language: str = 'en') -> Dict:
        """Zoom screen using Windows Magnifier or built-in hotkeys"""
        try:
            if is_windows():
                if level == 'in':
                    pyautogui.hotkey('win', '+')
                else:
                    pyautogui.hotkey('win', '-')
            elif is_macos():
                if level == 'in':
                    pyautogui.hotkey('command', 'option', '=')
                else:
                    pyautogui.hotkey('command', 'option', '-')

            return {
                'success': True,
                'action_type': 'ZOOM',
                'level': level,
                'response': f'Zoomed {level}'}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# Singleton instance
desktop_manager = DesktopManager()
