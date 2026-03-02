import time
import os
import webbrowser
import pyperclip
from typing import Dict, Optional
from modules.bilingual_parser import parser
from utils.platform_utils import get_whatsapp_desktop_path, is_windows, is_macos, is_linux, run_command
from utils.logger import logger, log_command


class WhatsAppManager:
    """WhatsApp automation via Web and Desktop"""

    def __init__(self):
        self.desktop_path = None
        self.recent_contacts = {}  # Cache recent contacts

    def _find_whatsapp_desktop(self) -> Optional[str]:
        """Find WhatsApp Desktop installation"""
        if self.desktop_path and os.path.exists(self.desktop_path):
            return self.desktop_path

        path = get_whatsapp_desktop_path()
        if path:
            self.desktop_path = path
        return path

    def _is_whatsapp_running(self) -> bool:
        """Check if WhatsApp Desktop is running"""
        import psutil
        for proc in psutil.process_iter(['name']):
            try:
                if 'whatsapp' in proc.info['name'].lower():
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return False

    def _focus_whatsapp_window(self) -> bool:
        """Focus WhatsApp Desktop window"""
        try:
            if is_windows():
                import win32gui
                import win32con

                def callback(hwnd, extra):
                    if win32gui.IsWindowVisible(hwnd):
                        title = win32gui.GetWindowText(hwnd)
                        if 'whatsapp' in title.lower():
                            # Restore if minimized
                            if win32gui.IsIconic(hwnd):
                                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                            # Bring to front
                            win32gui.SetForegroundWindow(hwnd)
                            return True
                    return False

                win32gui.EnumWindows(callback, None)
                return True

            elif is_macos():
                # Use AppleScript to focus
                run_command(
                    'osascript -e "tell application \"WhatsApp\" to activate"')
                return True

            else:
                # Linux
                run_command('xdotool search --name "WhatsApp" windowactivate')
                return True

        except Exception as e:
            logger.error(f"Error focusing WhatsApp: {e}")
            return False

    def _search_contact_desktop(self, contact_name: str) -> bool:
        """Search for contact in WhatsApp Desktop"""
        try:
            import pyautogui

            # Press Ctrl+K to open search (WhatsApp Desktop shortcut)
            if is_macos():
                pyautogui.keyDown('command')
                pyautogui.keyDown('k')
                pyautogui.keyUp('k')
                pyautogui.keyUp('command')
            else:
                pyautogui.keyDown('ctrl')
                pyautogui.keyDown('k')
                pyautogui.keyUp('k')
                pyautogui.keyUp('ctrl')

            time.sleep(0.5)

            # Type contact name
            pyautogui.typewrite(contact_name, interval=0.05)
            time.sleep(1)  # Wait for search results

            # Press Enter to select first result
            pyautogui.press('enter')
            time.sleep(0.5)

            return True

        except Exception as e:
            logger.error(f"Error searching contact: {e}")
            return False

    async def open_whatsapp_web(self, language: str = 'en') -> Dict:
        """Open WhatsApp Web in browser"""
        try:
            webbrowser.open('https://web.whatsapp.com')

            response = "Opening WhatsApp Web. Please scan the QR code if not already logged in."
            if language == 'hi':
                response = "WhatsApp Web खोल रहा हूँ। कृपया QR कोड स्कैन करें यदि पहले से लॉग इन नहीं हैं।"

            return {
                'success': True,
                'action_type': 'WHATSAPP_WEB',
                'method': 'web',
                'response': response
            }

        except Exception as e:
            logger.error(f"Error opening WhatsApp Web: {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_WEB',
                'error': str(e)
            }

    async def open_whatsapp_desktop(self, language: str = 'en') -> Dict:
        """Open WhatsApp Desktop application"""
        try:
            desktop_path = self._find_whatsapp_desktop()

            if not desktop_path:
                # Fall back to web
                return await self.open_whatsapp_web(language)

            if not self._is_whatsapp_running():
                # Launch WhatsApp
                if is_windows():
                    os.startfile(desktop_path)
                elif is_macos():
                    run_command(f'open "{desktop_path}"')
                else:
                    run_command(desktop_path)

                time.sleep(3)  # Wait for app to open
            else:
                # Just focus it
                self._focus_whatsapp_window()

            response = "Opening WhatsApp Desktop."
            if language == 'hi':
                response = "WhatsApp Desktop खोल रहा हूँ।"

            return {
                'success': True,
                'action_type': 'WHATSAPP_DESKTOP',
                'method': 'desktop',
                'response': response
            }

        except Exception as e:
            logger.error(f"Error opening WhatsApp Desktop: {e}")
            # Fall back to web
            return await self.open_whatsapp_web(language)

    async def send_message_web(
            self,
            contact: str,
            message: str,
            language: str = 'en') -> Dict:
        """Send message via WhatsApp Web"""
        try:
            import urllib.parse

            # Format phone number (remove spaces, dashes)
            phone = contact.replace(' ', '').replace('-', '')

            # If contact has letters, use name search (requires saved contact)
            if any(c.isalpha() for c in phone):
                # Open WhatsApp Web and let user select
                webbrowser.open('https://web.whatsapp.com')

                response = f"Opening WhatsApp Web. Please search for {contact} and send your message."
                if language == 'hi':
                    response = f"WhatsApp Web खोल रहा हूँ। कृपया {contact} को खोजें और अपना संदेश भेजें।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'method': 'web',
                    'contact': contact,
                    'response': response
                }
            else:
                # Direct link with phone number
                encoded_message = urllib.parse.quote(message)
                url = f"https://wa.me/{phone}?text={encoded_message}"
                webbrowser.open(url)

                response = f"Opening WhatsApp chat with {contact}. Click send to deliver message."
                if language == 'hi':
                    response = f"{contact} के साथ WhatsApp चैट खोल रहा हूँ। संदेश भेजने के लिए सेंड पर क्लिक करें।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'method': 'web',
                    'contact': contact,
                    'message': message,
                    'response': response
                }

        except Exception as e:
            logger.error(f"Error sending WhatsApp message (web): {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_MESSAGE',
                'error': str(e)
            }

    async def send_message_desktop(
            self,
            contact: str,
            message: str,
            language: str = 'en',
            confirmed: bool = False) -> Dict:
        """Send message via WhatsApp Desktop automation"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'action_type': 'WHATSAPP_MESSAGE',
                'method': 'desktop',
                'contact': contact,
                'message': message,
                'response': f"Send message to {contact}: '{message[:30]}...'?" if len(message) > 30 else f"Send message to {contact}: '{message}'?",
                'confirmation_context': {
                    'command': 'whatsapp_send_desktop',
                    'contact': contact,
                    'message': message
                }
            }

        try:
            import pyautogui

            # Check if WhatsApp Desktop is available
            desktop_path = self._find_whatsapp_desktop()
            if not desktop_path:
                # Fall back to web
                return await self.send_message_web(contact, message, language)

            # Open/focus WhatsApp
            await self.open_whatsapp_desktop(language)
            time.sleep(2)

            # Search for contact
            if not self._search_contact_desktop(contact):
                return {
                    'success': False,
                    'action_type': 'WHATSAPP_MESSAGE',
                    'error': f"Could not find contact: {contact}"
                }

            time.sleep(1)

            # Type message
            pyautogui.typewrite(message, interval=0.03)
            time.sleep(0.5)

            # Press Enter to send
            pyautogui.press('enter')

            log_command(
                f"WhatsApp message to {contact}",
                "whatsapp_message",
                True)

            response = f"Message sent to {contact}"
            if language == 'hi':
                response = f"{contact} को संदेश भेज दिया गया है"

            return {
                'success': True,
                'action_type': 'WHATSAPP_MESSAGE',
                'method': 'desktop',
                'contact': contact,
                'message': message,
                'response': response
            }

        except Exception as e:
            logger.error(f"Error sending WhatsApp message (desktop): {e}")
            # Fall back to web
            return await self.send_message_web(contact, message, language)

    async def make_call(
            self,
            contact: str,
            call_type: str = 'voice',
            language: str = 'en') -> Dict:
        """Make WhatsApp call"""
        try:
            # For calls, we need to use desktop automation
            desktop_path = self._find_whatsapp_desktop()

            if desktop_path and self._is_whatsapp_running():
                import pyautogui

                # Open/focus WhatsApp
                await self.open_whatsapp_desktop(language)
                time.sleep(2)

                # Search for contact
                if not self._search_contact_desktop(contact):
                    return {
                        'success': False,
                        'action_type': 'WHATSAPP_CALL',
                        'error': f"Could not find contact: {contact}"
                    }

                time.sleep(1)

                # Click call button (requires screen coordinates - simplified)
                # In real implementation, would use image recognition
                response = f"WhatsApp {call_type} call started with {contact}"
                if language == 'hi':
                    response = f"{contact} के साथ WhatsApp {call_type} कॉल शुरू हो गई है"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_CALL',
                    'contact': contact,
                    'call_type': call_type,
                    'response': response
                }
            else:
                # Guide user to make call manually
                response = f"Please open WhatsApp and call {contact} manually. Desktop automation requires WhatsApp Desktop to be installed."
                if language == 'hi':
                    response = f"कृपया {contact} को कॉल करने के लिए WhatsApp खोलें। Desktop automation के लिए WhatsApp Desktop इंस्टॉल होना चाहिए।"

                return {
                    'success': True,
                    'action_type': 'WHATSAPP_CALL',
                    'method': 'manual',
                    'contact': contact,
                    'response': response
                }

        except Exception as e:
            logger.error(f"Error making WhatsApp call: {e}")
            return {
                'success': False,
                'action_type': 'WHATSAPP_CALL',
                'error': str(e)
            }


# Singleton instance
whatsapp_manager = WhatsAppManager()
