#!/usr/bin/env python3
"""
JARVIS Entry Point for PyInstaller
This is the main entry point for the packaged executable
"""

import sys
import os
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except:
            pass  # Fallback if reconfigure fails

# Add the backend directory to Python path
if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle
    bundle_dir = Path(sys._MEIPASS)
else:
    # Running in normal Python environment
    bundle_dir = Path(__file__).parent

# Set up paths
os.chdir(bundle_dir)
sys.path.insert(0, str(bundle_dir))

# Ensure data directories exist
data_dir = bundle_dir / 'data'
logs_dir = bundle_dir / 'logs'
data_dir.mkdir(exist_ok=True)
logs_dir.mkdir(exist_ok=True)

# Import and run main
from main import app
import uvicorn

if __name__ == "__main__":
    # Safe print with UTF-8 handling
    def safe_print(text):
        try:
            print(text)
        except UnicodeEncodeError:
            # Fallback to ASCII with replacements
            print(text.encode('ascii', 'replace').decode('ascii'))
    
    safe_print("=" * 60)
    safe_print("JARVIS AI Assistant v2.0")
    safe_print("Made by VIPHACKER100")
    safe_print("=" * 60)
    safe_print("\nStarting JARVIS Backend Server...")
    safe_print("Server will be available at: http://localhost:8000")
    safe_print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
