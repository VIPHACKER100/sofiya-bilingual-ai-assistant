#!/usr/bin/env python3
"""
Module Functionality Test Script
Tests specific functionality of each module
"""

import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_input_control():
    """Test input control module"""
    from modules.input_control import input_controller
    result = await input_controller.get_cursor_position()
    return result.get('success', False)

async def test_llm():
    """Test LLM module"""
    from modules.llm import llm_module
    # Just check if module loads
    return llm_module is not None

async def test_media():
    """Test media module"""
    from modules.media import media_processor
    return media_processor is not None

async def test_desktop():
    """Test desktop module"""
    from modules.desktop import desktop_manager
    result = await desktop_manager.get_screen_resolution()
    return result.get('success', False)

async def test_automation():
    """Test automation module"""
    from modules.automation import automation_manager
    status = automation_manager.get_scheduler_status()
    return 'running' in status

async def test_file_manager():
    """Test file manager module"""
    from modules.file_manager import file_manager
    return file_manager is not None

async def main():
    """Run all tests"""
    print("=" * 60)
    print("SOFIYA Module Functionality Test")
    print("=" * 60)
    
    tests = [
        ('Input Control', test_input_control),
        ('LLM', test_llm),
        ('Media Processor', test_media),
        ('Desktop Manager', test_desktop),
        ('Automation', test_automation),
        ('File Manager', test_file_manager),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            result = await test_func()
            results[name] = result
            status = "✓ OK" if result else "⚠ Failed"
            print(f"{status:10s} - {name}")
        except Exception as e:
            results[name] = False
            print(f"✗ ERROR   - {name}: {e}")
    
    print("\n" + "=" * 60)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n✓ All functionality tests passed!")
        return 0
    # From SOFIYA reference
    else:
        print(f"\n⚠ {total - passed} test(s) failed")
        return 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
