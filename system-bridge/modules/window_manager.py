
import os
import shutil
import subprocess
import time
import platform
import re
import webbrowser
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

try:
    import psutil
except ImportError:
    psutil = None

try:
    from fuzzywuzzy import fuzz, process
except ImportError:
    fuzz = None
    process = None

# Mock parser if needed
try:
    from modules.bilingual_parser import parser
except ImportError:
    parser = None

from utils.platform_utils import is_windows, is_macos, is_linux, run_command
from utils.logger import logger, log_command


@dataclass
class WindowInfo:
    title: str
    pid: int
    hwnd: Optional[int]  # Windows handle
    is_minimized: bool
    is_maximized: bool
    position: Tuple[int, int]
    size: Tuple[int, int]


class WindowManager:
    """Cross-platform window and application manager"""

    def __init__(self):
        self.platform = platform.system().lower()
        self.win32gui = None
        self.win32con = None
        self.win32process = None
        self._init_platform()

    def _init_platform(self):
        """Initialize platform-specific components"""
        if is_windows():
            try:
                import win32gui
                import win32con
                import win32process
                self.win32gui = win32gui
                self.win32con = win32con
                self.win32process = win32process
            except ImportError:
                logger.warning(
                    "pywin32 not installed. Some Windows features may not work.")
                self.win32gui = None
                self.win32con = None
                self.win32process = None

    def _get_running_processes(self) -> List[Dict]:
        """Get list of running processes"""
        processes = []
        if not psutil:
            return processes
            
        for proc in psutil.process_iter(['pid', 'name', 'exe', 'status']):
            try:
                pinfo = proc.info
                if pinfo['status'] == (psutil.STATUS_RUNNING if psutil else 'running'):
                    processes.append(pinfo)
            except Exception:
                pass
        return processes

    def open_application(self, app_name: str) -> Dict:
        """Open an application by name or path"""
        try:
            if is_windows():
                # Try to find the app in common locations if not a full path
                if not os.path.isabs(app_name):
                    # Simulating search for now
                    subprocess.Popen(['start', '', app_name], shell=True)
                else:
                    subprocess.Popen([app_name])
            elif is_macos():
                subprocess.Popen(['open', '-a', app_name])
            else:
                subprocess.Popen([app_name])

            return {
                'success': True,
                'action_type': 'OPEN_APP',
                'app': app_name
            }
        except Exception as e:
            logger.error(f"Error opening application {app_name}: {e}")
            return {
                'success': False,
                'action_type': 'OPEN_APP',
                'error': str(e)
            }

    def close_application(self, app_name: str) -> Dict:
        """Close an application by name"""
        try:
            if not psutil:
                return {'success': False, 'error': 'psutil not available'}
                
            found = False
            for proc in psutil.process_iter(['pid', 'name']):
                if app_name.lower() in proc.info['name'].lower():
                    proc.kill()
                    found = True

            return {
                'success': found,
                'action_type': 'CLOSE_APP',
                'app': app_name
            }
        except Exception as e:
            logger.error(f"Error closing application {app_name}: {e}")
            return {
                'success': False,
                'action_type': 'CLOSE_APP',
                'error': str(e)
            }

    def list_applications(self) -> Dict:
        """List running applications"""
        try:
            processes = self._get_running_processes()
            apps = []
            seen = set()
            for p in processes:
                if p['name'] not in seen:
                    apps.append(p['name'])
                    seen.add(p['name'])

            return {
                'success': True,
                'action_type': 'LIST_APPS',
                'apps': apps,
                'count': len(processes)
            }
        except Exception as e:
            logger.error(f"Error listing apps: {e}")
            return {
                'success': False,
                'action_type': 'LIST_APPS',
                'error': str(e)
            }

    def _get_window_list_windows(self) -> List[WindowInfo]:
        """Get list of windows on Windows"""
        windows = []

        if not self.win32gui:
            return windows

        def callback(hwnd, extra):
            if not self.win32gui:
                return
            if self.win32gui.IsWindowVisible(hwnd):
                title = self.win32gui.GetWindowText(hwnd)
                if title:
                    try:
                        placement = self.win32gui.GetWindowPlacement(hwnd)
                        is_minimized = placement[1] == self.win32con.SW_SHOWMINIMIZED if self.win32con else False
                        is_maximized = placement[1] == self.win32con.SW_SHOWMAXIMIZED if self.win32con else False
                        
                        rect = self.win32gui.GetWindowRect(hwnd)
                        x, y, r, b = rect
                        w, h = r - x, b - y
                        
                        _, pid = self.win32process.GetWindowThreadProcessId(hwnd) if self.win32process else (0, 0)
                        
                        windows.append(WindowInfo(
                            title=title,
                            pid=pid,
                            hwnd=hwnd,
                            is_minimized=is_minimized,
                            is_maximized=is_maximized,
                            position=(x, y),
                            size=(w, h)
                        ))
                    except Exception:
                        pass

        try:
            self.win32gui.EnumWindows(callback, None)
        except Exception as e:
            logger.error(f"Error enumerating windows: {e}")
            
        return windows

    def minimize_window(self, window_title: str = "") -> Dict:
        """Minimize a window by title or foreground window"""
        try:
            if is_windows() and self.win32gui and self.win32con:
                if window_title:
                    windows = self._get_window_list_windows()
                    best_match = self._find_best_window_match(window_title, windows)
                    if best_match and best_match.hwnd:
                        self.win32gui.ShowWindow(best_match.hwnd, self.win32con.SW_MINIMIZE)
                        return {'success': True, 'action_type': 'WINDOW_MINIMIZE', 'window': best_match.title}
                else:
                    hwnd = self.win32gui.GetForegroundWindow()
                    if hwnd:
                        self.win32gui.ShowWindow(hwnd, self.win32con.SW_MINIMIZE)
                        return {'success': True, 'action_type': 'WINDOW_MINIMIZE', 'window': 'foreground'}
            
            return {'success': False, 'error': 'Platform not supported or window not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def maximize_window(self, window_title: str = "") -> Dict:
        """Maximize a window by title or foreground window"""
        try:
            if is_windows() and self.win32gui and self.win32con:
                if window_title:
                    windows = self._get_window_list_windows()
                    best_match = self._find_best_window_match(window_title, windows)
                    if best_match and best_match.hwnd:
                        self.win32gui.ShowWindow(best_match.hwnd, self.win32con.SW_MAXIMIZE)
                        return {'success': True, 'action_type': 'WINDOW_MAXIMIZE', 'window': best_match.title}
                else:
                    hwnd = self.win32gui.GetForegroundWindow()
                    if hwnd:
                        self.win32gui.ShowWindow(hwnd, self.win32con.SW_MAXIMIZE)
                        return {'success': True, 'action_type': 'WINDOW_MAXIMIZE', 'window': 'foreground'}
            
            return {'success': False, 'error': 'Platform not supported or window not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def close_window(self, window_title: str = "") -> Dict:
        """Close a window by title or foreground window"""
        try:
            if is_windows() and self.win32gui and self.win32con:
                if window_title:
                    windows = self._get_window_list_windows()
                    best_match = self._find_best_window_match(window_title, windows)
                    if best_match and best_match.hwnd:
                        self.win32gui.PostMessage(best_match.hwnd, self.win32con.WM_CLOSE, 0, 0)
                        return {'success': True, 'action_type': 'WINDOW_CLOSE', 'window': best_match.title}
                else:
                    hwnd = self.win32gui.GetForegroundWindow()
                    if hwnd:
                        self.win32gui.PostMessage(hwnd, self.win32con.WM_CLOSE, 0, 0)
                        return {'success': True, 'action_type': 'WINDOW_CLOSE', 'window': 'foreground'}
            
            return {'success': False, 'error': 'Platform not supported or window not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def snap_window(self, side: str, window_title: str = "") -> Dict:
        """Snap window to left or right side of screen"""
        try:
            if is_windows() and self.win32gui:
                hwnd = None
                if window_title:
                    windows = self._get_window_list_windows()
                    best_match = self._find_best_window_match(window_title, windows)
                    if best_match: hwnd = best_match.hwnd
                else:
                    hwnd = self.win32gui.GetForegroundWindow()
                
                if hwnd:
                    # Generic implementation: half screen width
                    # In a real app, we'd use GetSystemMetrics
                    from ctypes import windll
                    user32 = windll.user32
                    sw = user32.GetSystemMetrics(0)
                    sh = user32.GetSystemMetrics(1)
                    
                    if side.lower() == 'left':
                        self.win32gui.MoveWindow(hwnd, 0, 0, sw // 2, sh, True)
                    else:
                        self.win32gui.MoveWindow(hwnd, sw // 2, 0, sw // 2, sh, True)
                    
                    return {'success': True, 'action_type': f'SNAP_{side.upper()}'}
            
            return {'success': False, 'error': 'Platform not supported'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def center_window(self, window_title: str = "") -> Dict:
        """Center a window on the screen"""
        try:
            if is_windows() and self.win32gui:
                hwnd = None
                if window_title:
                    windows = self._get_window_list_windows()
                    best_match = self._find_best_window_match(window_title, windows)
                    if best_match: hwnd = best_match.hwnd
                else:
                    hwnd = self.win32gui.GetForegroundWindow()

                if hwnd:
                    from ctypes import windll
                    user32 = windll.user32
                    sw = user32.GetSystemMetrics(0)
                    sh = user32.GetSystemMetrics(1)
                    
                    rect = self.win32gui.GetWindowRect(hwnd)
                    w = rect[2] - rect[0]
                    h = rect[3] - rect[1]
                    
                    x = (sw - w) // 2
                    y = (sh - h) // 2
                    
                    self.win32gui.MoveWindow(hwnd, x, y, w, h, True)
                    return {'success': True, 'action_type': 'CENTER_WINDOW'}

            return {'success': False, 'error': 'Platform not supported'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def show_desktop(self) -> Dict:
        """Minimize all windows to show desktop"""
        try:
            if is_windows() and self.win32gui and self.win32con:
                windows = self._get_window_list_windows()
                for win in windows:
                    if win.hwnd and not win.is_minimized:
                        self.win32gui.ShowWindow(win.hwnd, self.win32con.SW_MINIMIZE)
                return {'success': True, 'action_type': 'SHOW_DESKTOP'}
            return {'success': False, 'error': 'Platform not supported'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _find_best_window_match(self, query: str, windows: List[WindowInfo]) -> Optional[WindowInfo]:
        """Find the best matching window title using fuzzy logic"""
        if not windows or not query:
            return None
            
        if not process or not fuzz:
            # Fallback to simple matching
            for win in windows:
                if query.lower() in win.title.lower():
                    return win
            return None

        titles = [w.title for w in windows]
        best_title, score = process.extractOne(query, titles, scorer=fuzz.partial_ratio)
        
        if score > 70:
            for win in windows:
                if win.title == best_title:
                    return win
        return None

    def activate_window(self, window_title: str) -> Dict:
        """Bring a window to the formal and activate it"""
        try:
            if is_windows() and self.win32gui and self.win32con:
                windows = self._get_window_list_windows()
                best_match = self._find_best_window_match(window_title, windows)
                if best_match and best_match.hwnd:
                    if best_match.is_minimized:
                        self.win32gui.ShowWindow(best_match.hwnd, self.win32con.SW_RESTORE)
                    self.win32gui.SetForegroundWindow(best_match.hwnd)
                    return {'success': True, 'action_type': 'ACTIVATE_WINDOW', 'window': best_match.title}
            return {'success': False, 'error': 'Window not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
