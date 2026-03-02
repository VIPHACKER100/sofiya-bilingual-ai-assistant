import platform
import os
import subprocess
from pathlib import Path
from config import PLATFORM

def get_platform():
    """Get current platform"""
    return PLATFORM

def is_windows():
    return PLATFORM == 'windows'

def is_macos():
    return PLATFORM == 'darwin'

def is_linux():
    return PLATFORM == 'linux'

def run_command(command, shell=True):
    """Run system command safely"""
    try:
        if is_windows():
            result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        else:
            result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def get_whatsapp_desktop_path():
    """Auto-detect WhatsApp Desktop installation"""
    possible_paths = []
    
    if is_windows():
        possible_paths = [
            os.path.expandvars(r"%LOCALAPPDATA%\WhatsApp\WhatsApp.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\WhatsApp\WhatsApp.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\WhatsApp\WhatsApp.exe"),
        ]
    elif is_macos():
        possible_paths = [
            "/Applications/WhatsApp.app",
            os.path.expanduser("~/Applications/WhatsApp.app"),
        ]
    elif is_linux():
        possible_paths = [
            "/usr/bin/whatsapp",
            "/usr/share/whatsapp/whatsapp",
            "/snap/bin/whatsapp",
            "/var/lib/flatpak/app/com.whatsapp.WhatsApp",
        ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

def shutdown_system():
    """Shutdown computer"""
    if is_windows():
        return run_command("shutdown /s /t 0")
    elif is_macos():
        return run_command("osascript -e 'tell app \"System Events\" to shut down'")
    elif is_linux():
        return run_command("systemctl poweroff")
    return False, "", "Unsupported platform"

def restart_system():
    """Restart computer"""
    if is_windows():
        return run_command("shutdown /r /t 0")
    elif is_macos():
        return run_command("osascript -e 'tell app \"System Events\" to restart'")
    elif is_linux():
        return run_command("systemctl reboot")
    return False, "", "Unsupported platform"

def sleep_system():
    """Sleep computer"""
    if is_windows():
        return run_command("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    elif is_macos():
        return run_command("osascript -e 'tell app \"System Events\" to sleep'")
    elif is_linux():
        return run_command("systemctl suspend")
    return False, "", "Unsupported platform"

def set_volume(percent):
    """Set system volume (0-100)"""
    if is_windows():
        try:
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            volume.SetMasterVolumeLevelScalar(percent / 100.0, None)
            return True
        except ImportError:
            # Fallback to nircmd or similar
            return False
    elif is_macos():
        return run_command(f"osascript -e 'set volume output volume {percent}'")
    elif is_linux():
        return run_command(f"amixer set Master {percent}%")
    return False

def get_volume():
    """Get current system volume"""
    if is_windows():
        try:
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            return int(volume.GetMasterVolumeLevelScalar() * 100)
        except:
            return 50
    elif is_macos():
        success, output, _ = run_command("osascript -e 'output volume of (get volume settings)'")
        return int(output.strip()) if success else 50
    elif is_linux():
        success, output, _ = run_command("amixer get Master | grep -oP '\\[\\K[0-9]+(?=%\\])'")
        return int(output.strip()) if success else 50
    return 50

def set_mute(mute_state):
    """Set system mute state (True/False)"""
    if is_windows():
        try:
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            volume.SetMute(1 if mute_state else 0, None)
            return True
        except:
            return False
    elif is_macos():
        state = 'true' if mute_state else 'false'
        return run_command(f"osascript -e 'set volume output muted {state}'")
    elif is_linux():
        action = 'mute' if mute_state else 'unmute'
        return run_command(f"amixer set Master {action}")
    return False

def is_muted():
    """Check if system is muted"""
    if is_windows():
        try:
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            volume = cast(interface, POINTER(IAudioEndpointVolume))
            return volume.GetMute() == 1
        except:
            return False
    elif is_macos():
        success, output, _ = run_command("osascript -e 'output muted of (get volume settings)'")
        return output.strip().lower() == 'true' if success else False
    elif is_linux():
        success, output, _ = run_command("amixer get Master")
        return '[off]' in output if success else False
    return False
