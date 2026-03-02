#!/usr/bin/env python3
"""
Module Import Test Script
Tests all backend modules for import errors and missing dependencies
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def test_module(module_name):
    """Test importing a single module"""
    try:
        __import__(f'modules.{module_name}')
        print(f"✓ {module_name:20s} - OK")
        return True
    except ImportError as e:
        print(f"✗ {module_name:20s} - Import Error: {e}")
        return False
    except Exception as e:
        print(f"⚠ {module_name:20s} - Runtime Error: {e}")
        return False

def main():
    """Test all modules"""
    print("=" * 60)
    print("JARVIS Backend Module Test")
    print("=" * 60)
    
    modules = [
        'input_control',
        'llm',
        'media',
        'desktop',
        'automation',
        'file_manager',
        'bilingual_parser',
        'context',
        'memory',
        'security',
        'system',
        'whatsapp',
        'window_manager'
    ]
    
    results = {}
    for module in modules:
        results[module] = test_module(module)
    
    print("\n" + "=" * 60)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} modules passed")
    print("=" * 60)
    
    if passed == total:
        print("\n✓ All modules imported successfully!")
        return 0
    else:
        print(f"\n⚠ {total - passed} module(s) failed to import")
        return 1

if __name__ == '__main__':
    sys.exit(main())
