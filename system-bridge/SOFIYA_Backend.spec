# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

# Get the project root directory using SPECPATH which is provided by PyInstaller
project_root = Path(SPECPATH).parent
backend_dir = Path(SPECPATH)

block_cipher = None

# Define all hidden imports that PyInstaller might miss
hidden_imports = [
    # Core web framework
    'fastapi',
    'uvicorn',
    'websockets',
    'starlette',
    'anyio',
    'h11',
    'click',
    'colorama',
    
    # System utilities
    'psutil',
    'pyautogui',
    'pyperclip',
    'pycaw',
    'screen_brightness_control',
    
    # Image processing
    'PIL',
    'PIL.Image',
    'PIL.ImageOps',
    'PIL.ImageFilter',
    'PIL.ImageDraw',
    
    # OCR and PDF
    'pytesseract',
    'PyPDF2',
    'pdf2image',
    
    # Text processing
    'fuzzywuzzy',
    'fuzzywuzzy.fuzz',
    'fuzzywuzzy.process',
    'Levenshtein',
    'rapidfuzz',
    
    # Scheduling
    'schedule',
    
    # Data validation
    'pydantic',
    'pydantic_core',
    'annotated_types',
    'typing_extensions',
    'typing_inspection',
    
    # HTTP and networking
    'requests',
    'urllib3',
    'certifi',
    'charset_normalizer',
    'idna',
    'packaging',
    
    # Configuration
    'dotenv',
    
    # Windows COM
    'win32com',
    'win32gui',
    'win32con',
    'win32api',
    'pythoncom',
    'comtypes',
    'ctypes',
    'winshell',
    'win10toast',
    
    # Project modules
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
    'modules.context',
    'modules.automation',
    'modules.llm',
    
    # Utilities
    'utils.platform_utils',
    'utils.logger',
    'config',
]

# Collect all data files
data_files = [
    # Config files
    (str(backend_dir / 'config.py'), '.'),
    (str(backend_dir / '.env.example'), '.'),
    # Frontend build
    (str(project_root / 'dist'), 'frontend'),
]

# Add data directory structure
data_dir = backend_dir / 'data'
logs_dir = backend_dir / 'logs'
data_dir.mkdir(exist_ok=True)
logs_dir.mkdir(exist_ok=True)

a = Analysis(
    [str(backend_dir / 'entry_point.py')],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=data_files,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'sklearn',
        'tensorflow',
        'torch',
        'pytest',
        'black',
        'flake8',
        'mypy',
        'pylint',
        'sphinx',
        'notebook',
        'jupyter',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SOFIYA_Backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Keep console for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(project_root / 'public' / 'favicon.ico') if (project_root / 'public' / 'favicon.ico').exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SOFIYA_Backend'
)