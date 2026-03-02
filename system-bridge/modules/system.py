import psutil
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, cast
from modules.bilingual_parser import parser
from utils.platform_utils import (
    shutdown_system, restart_system, sleep_system,
    set_volume, get_volume, set_mute, is_muted,
    is_windows, is_macos, is_linux
)
from utils.logger import log_command, logger


class SystemModule:
    """Handle system-related commands"""

    def __init__(self):
        pass

    async def get_system_status(self, language: str = 'en') -> Dict[str, Any]:
        """Get complete system status"""
        try:
            # Battery
            battery = psutil.sensors_battery()
            battery_info = {
                'percent': int(battery.percent) if battery else None,
                'power_plugged': battery.power_plugged if battery else None,
                'secs_left': battery.secsleft if battery else None
            }

            # CPU
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count()

            # Memory
            memory = psutil.virtual_memory()
            memory_info = {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent,
                'available': memory.available
            }

            # Disk
            disk = psutil.disk_usage('/')
            disk_info = {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': (disk.used / disk.total) * 100
            }

            # Network
            net_io = psutil.net_io_counters()
            network_info = {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv
            }

            # Uptime
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time

            # Current volume
            current_volume = get_volume()

            return {
                'success': True,
                'battery': battery_info,
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count},
                'memory': memory_info,
                'disk': disk_info,
                'network': network_info,
                'uptime': uptime_seconds,
                'volume': current_volume,
                'platform': 'Windows' if is_windows() else 'macOS' if is_macos() else 'Linux',
                'timestamp': datetime.now().isoformat()}

        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def get_battery_status(self, language: str = 'en') -> Dict[str, Any]:
        """Get battery information"""
        try:
            battery = psutil.sensors_battery()
            if battery:
                response_text = parser.get_response(
                    'battery_status',
                    language,
                    int(battery.percent)
                )
                return {
                    'success': True,
                    'percent': int(battery.percent),
                    'is_charging': battery.power_plugged,
                    'response': response_text
                }
            else:
                return {
                    'success': False,
                    'error': 'No battery found',
                    'response': parser.get_response(
                        'battery_status',
                        language,
                        'unknown')}
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    async def get_time(self, language: str = 'en') -> Dict[str, Any]:
        """Get current time"""
        now = datetime.now()
        time_str = now.strftime('%I:%M %p')  # 12-hour format
        response_text = parser.get_response('time_is', language, time_str)

        return {
            'success': True,
            'time': now.isoformat(),
            'formatted': time_str,
            'response': response_text
        }

    async def get_date(self, language: str = 'en') -> Dict[str, Any]:
        """Get current date"""
        now = datetime.now()
        date_str = now.strftime('%A, %B %d, %Y')  # Full format
        response_text = parser.get_response('date_is', language, date_str)

        return {
            'success': True,
            'date': now.isoformat(),
            'formatted': date_str,
            'response': response_text
        }

    async def shutdown(self, language: str = 'en',
                       confirmed: bool = False) -> Dict[str, Any]:
        """Shutdown computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_shutdown', language)
            }

        log_command('shutdown', 'shutdown', True)
        success, stdout, stderr = shutdown_system()

        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }

    async def restart(self, language: str = 'en',
                      confirmed: bool = False) -> Dict[str, Any]:
        """Restart computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                'response': parser.get_response('confirm_restart', language)
            }

        log_command('restart', 'restart', True)
        success, stdout, stderr = restart_system()

        return {
            'success': success,
            'response': parser.get_response('restart_initiated', language),
            'error': stderr if not success else None
        }

    async def sleep(self, language: str = 'en',
                    confirmed: bool = False) -> Dict[str, Any]:
        """Sleep/suspend computer"""
        if not confirmed:
            return {
                'success': False,
                'requires_confirmation': True,
                'confirmation_id': None,
                # Reuse
                'response': parser.get_response('confirm_shutdown', language)
            }

        log_command('sleep', 'sleep', True)
        success, stdout, stderr = sleep_system()

        return {
            'success': success,
            'response': parser.get_response('shutdown_initiated', language),
            'error': stderr if not success else None
        }

    async def volume_up(self, amount: Optional[int] = None, language: str = 'en') -> Dict[str, Any]:
        """Increase volume"""
        try:
            current = get_volume()
            increment = amount if amount is not None else 10
            new_volume = min(current + increment, 100)
            success = set_volume(new_volume)

            log_command(
                'volume_up', 'volume_up', success, {
                    'from': current, 'to': new_volume, 'amount': increment})

            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_increased', language, new_volume)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response(
                    'command_not_understood',
                    language)}

    async def volume_down(self, amount: Optional[int] = None, language: str = 'en') -> Dict[str, Any]:
        """Decrease volume"""
        try:
            current = get_volume()
            decrement = amount if amount is not None else 10
            new_volume = max(current - decrement, 0)
            success = set_volume(new_volume)

            log_command(
                'volume_down', 'volume_down', success, {
                    'from': current, 'to': new_volume, 'amount': decrement})

            return {
                'success': success,
                'volume': new_volume,
                'response': parser.get_response('volume_decreased', language, new_volume)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response(
                    'command_not_understood',
                    language)}

    async def toggle_mute(self, language: str = 'en') -> Dict[str, Any]:
        """Toggle system mute state"""
        try:
            muted = is_muted()
            new_state = not muted
            success = set_mute(new_state)

            log_command('mute', 'mute', success, {'state': 'muted' if new_state else 'unmuted'})

            if new_state:
                response = parser.get_response('muted', language)
            else:
                response = parser.get_response('unmuted', language)

            return {
                'success': success,
                'is_muted': new_state,
                'response': response
            }
        except Exception as e:
            logger.error(f"Error toggling mute: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': parser.get_response('command_not_understood', language)
            }

    async def get_brightness(self) -> int:
        """Get current screen brightness"""
        try:
            import screen_brightness_control as sbc
            return sbc.get_brightness()[0]
        except BaseException:
            return 50

    async def set_brightness(self, level: int) -> bool:
        """Set screen brightness (0-100)"""
        try:
            import screen_brightness_control as sbc
            sbc.set_brightness(level)
            return True
        except BaseException:
            return False

    async def brightness_up(self, language: str = 'en') -> Dict[str, Any]:
        """Increase brightness"""
        try:
            current = await self.get_brightness()
            new_level = min(current + 10, 100)
            success = await self.set_brightness(new_level)

            log_command(
                'brightness_up', 'brightness_up', success, {
                    'from': current, 'to': new_level})

            return {
                'success': success,
                'brightness': new_level,
                'response': parser.get_response('brightness_increased', language, new_level)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to change brightness"}

    async def brightness_down(self, language: str = 'en') -> Dict[str, Any]:
        """Decrease brightness"""
        try:
            current = await self.get_brightness()
            new_level = max(current - 10, 0)
            success = await self.set_brightness(new_level)

            log_command(
                'brightness_down', 'brightness_down', success, {
                    'from': current, 'to': new_level})

            return {
                'success': success,
                'brightness': new_level,
                'response': parser.get_response('brightness_decreased', language, new_level)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to change brightness"}

    async def get_network_info(self, language: str = 'en') -> Dict[str, Any]:
        """Get network connection information"""
        try:
            import socket
            hostname = socket.gethostname()
            ip_address = socket.gethostbyname(hostname)

            # Use psutil for interface details
            addrs = psutil.net_if_addrs()
            stats = psutil.net_if_stats()

            interfaces = []
            for name, addr_list in addrs.items():
                is_up = stats.get(name).isup if name in stats else False
                if is_up:
                    for addr in addr_list:
                        if addr.family == socket.AF_INET:  # IPv4
                            interfaces.append(
                                {'name': name, 'ip': addr.address})

            response = f"Network Info: Connected as {hostname} (IP: {ip_address})" if language == 'en' else f"नेटवर्क जानकारी: {hostname} के रूप में जुड़ा हुआ है (IP: {ip_address})"

            return {
                'success': True,
                'hostname': hostname,
                'ip': ip_address,
                'interfaces': interfaces,
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get network info"}

    async def google_search(
            self, query: str, language: str = 'en') -> Dict[str, Any]:
        """Open web browser for Google search"""
        try:
            import webbrowser
            url = f"https://www.google.com/search?q={query}"
            webbrowser.open(url)

            log_command(f"search {query}", "google_search", True)

            return {
                'success': True,
                'query': query,
                'response': f"Searching for '{query}' on Google" if language == 'en' else f"गूगल पर '{query}' के लिए खोज रहा हूँ"
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to open search"}

    async def wikipedia_search(self, query: str, language: str = 'en') -> Dict[str, Any]:
        """Fetch summary from Wikipedia or open in browser"""
        try:
            import wikipedia
            # Set language if possible
            if language == 'hi':
                wikipedia.set_lang("hi")
            else:
                wikipedia.set_lang("en")

            # Try to get summary first
            try:
                summary = wikipedia.summary(query, sentences=2)
                log_command(f"wiki {query}", "wikipedia_fetch", True)
                return {
                    'success': True,
                    'query': query,
                    'summary': summary,
                    'response': summary
                }
            except:
                # Fallback to browser if disambiguation or no match
                import webbrowser
                url = f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}"
                if language == 'hi':
                    url = f"https://hi.wikipedia.org/wiki/{query.replace(' ', '_')}"
                webbrowser.open(url)
                
                log_command(f"wiki browser {query}", "wikipedia_fetch", True)
                return {
                    'success': True,
                    'query': query,
                    'response': f"Looking up '{query}' on Wikipedia" if language == 'en' else f"विकिपीडिया पर '{query}' के बारे में खोज रही हूँ"
                }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to access Wikipedia"}

    async def get_weather(self,
                          city: Optional[str] = None,
                          language: str = 'en') -> Dict[str,
                                                        Any]:
        """Get weather info (simplified browser-based or API if key available)"""
        # For a production app, we'd use an API. For this, we can open a browser or use a simple scraper.
        # Let's open the browser for now as a more reliable "feature" for the
        # user.
        try:
            import webbrowser
            query = f"weather in {city}" if city else "weather today"
            url = f"https://www.google.com/search?q={query}"
            webbrowser.open(url)

            weather_target = city or ('current location' if language == 'en' else 'वर्तमान स्थान')
            response_text = f"Checking weather for {weather_target}" if language == 'en' else f"{weather_target} के लिए मौसम की जानकारी देख रहा हूँ"
            
            return {
                'success': True, 
                'city': city, 
                'response': response_text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get weather"}

    async def get_uptime(self, language: str = 'en') -> Dict[str, Any]:
        """Get system uptime"""
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time

            # Format uptime
            days = int(uptime_seconds // (24 * 3600))
            hours = int((uptime_seconds % (24 * 3600)) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)

            uptime_str = f"{days}d {hours}h {minutes}m"
            response = f"System Uptime: {uptime_str}" if language == 'en' else f"सिस्टम अपटाइम: {uptime_str}"

            return {
                'success': True,
                'uptime_seconds': uptime_seconds,
                'formatted': uptime_str,
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "Failed to get uptime"}


    async def get_health_summary(self, language: str = 'en') -> Dict[str, Any]:
        """Get a spoken summary of system health"""
        status = await self.get_system_status(language)
        if not status['success']:
            return status

        cpu = status['cpu']['percent']
        mem = status['memory']['percent']
        bat = status['battery']['percent']
        plugged = status['battery']['power_plugged']
        disk = status['disk']['percent']

        if language == 'hi':
            summary = f"सिस्टम की स्थिति: CPU उपयोग {cpu:.0f}% है, मेमोरी {mem:.0f}% भरी हुई है। "
            if bat is not None:
                summary += f"बैटरी {bat}% है और {'चार्ज हो रही है' if plugged else 'डिस्कनेक्ट है'}। "
            summary += f"डिस्क {disk:.0f}% भरी हुई है। सब कुछ ठीक लग रहा है।"
        else:
            summary = f"System Report: CPU usage is at {cpu:.0f}%, and memory is {mem:.1f}% utilized. "
            if bat is not None:
                power_status = "plugged in" if plugged else "on battery"
                summary += f"Battery is at {bat}% and {power_status}. "
            summary += f"Disk usage is at {disk:.0f}%. All subsystems are nominal."

        return {
            'success': True,
            'response': summary,
            'data': {
                'cpu': cpu,
                'memory': mem,
                'battery': bat,
                'disk': disk
            }
        }


# Singleton instance
system_module = SystemModule()
