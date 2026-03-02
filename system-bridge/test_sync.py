#!/usr/bin/env python3
"""
Backend-Frontend Sync Test for SOFIYA
Tests WebSocket connection and command processing
"""

import asyncio
import json
from datetime import datetime
from fastapi.testclient import TestClient

# Import the app
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from main import app

def test_rest_endpoints():
    """Test REST API endpoints"""
    print("=" * 60)
    print("Testing REST API Endpoints")
    print("=" * 60)
    
    client = TestClient(app)
    
    tests = [
        ("GET", "/api/system/status", None, "System Status"),
        ("GET", "/api/windows/list", None, "Window List"),
        ("GET", "/api/apps/list", None, "App List"),
        ("GET", "/api/input/cursor", None, "Cursor Position"),
    ]
    
    results = []
    for method, endpoint, data, name in tests:
        try:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json=data)
            
            success = response.status_code == 200
            results.append((name, success))
            status = "✓" if success else "✗"
            print(f"{status} {name:30s} - Status: {response.status_code}")
        except Exception as e:
            results.append((name, False))
            print(f"✗ {name:30s} - Error: {e}")
    
    print("\n" + "=" * 60)
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"Results: {passed}/{total} endpoints passed")
    print("=" * 60)
    
    return passed == total

def test_websocket():
    """Test WebSocket endpoint"""
    print("\n" + "=" * 60)
    print("Testing WebSocket Endpoint")
    print("=" * 60)
    
    client = TestClient(app)
    
    try:
        with client.websocket_connect("/ws") as websocket:
            print("✓ WebSocket connection established")
            
            # Test ping/pong
            websocket.send_json({
                "type": "ping",
                "timestamp": datetime.now().timestamp()
            })
            
            response = websocket.receive_json()
            if response.get("type") == "pong":
                print("✓ Ping/Pong working")
            else:
                print("✗ Ping/Pong failed")
                return False
            
            # Test get_status
            websocket.send_json({
                "type": "get_status",
                "timestamp": datetime.now().timestamp()
            })
            
            response = websocket.receive_json()
            if response.get("type") == "system_status":
                print("✓ System status request working")
                data = response.get("data", {})
                if data.get("success"):
                    print(f"  - CPU: {data.get('cpu', {}).get('percent', 0):.1f}%")
                    print(f"  - Platform: {data.get('platform', 'Unknown')}")
            else:
                print("✗ System status request failed")
                return False
            
            # Test command
            websocket.send_json({
                "type": "command",
                "command": "time",
                "language": "en",
                "timestamp": datetime.now().timestamp()
            })
            
            response = websocket.receive_json()
            if response.get("type") == "command_response":
                print("✓ Command processing working")
                data = response.get("data", {})
                print(f"  - Response: {data.get('response', 'N/A')}")
            else:
                print("✗ Command processing failed")
                return False
            
            print("\n" + "=" * 60)
            print("WebSocket Test: PASSED")
            print("=" * 60)
            return True
            
    except Exception as e:
        print(f"✗ WebSocket test failed: {e}")
        print("\n" + "=" * 60)
        print("WebSocket Test: FAILED")
        print("=" * 60)
        return False

def test_command_routing():
    """Test command routing to modules"""
    print("\n" + "=" * 60)
    print("Testing Command Routing")
    print("=" * 60)
    
    client = TestClient(app)
    
    commands = [
        ("time", "en", "System Time"),
        ("date", "en", "System Date"),
        ("battery", "en", "Battery Status"),
        ("system status", "en", "System Status"),
    ]
    
    results = []
    for command, language, name in commands:
        try:
            response = client.post("/api/command", json={
                "command": command,
                "language": language
            })
            
            success = response.status_code == 200
            data = response.json()
            results.append((name, success))
            
            status = "✓" if success else "✗"
            print(f"{status} {name:30s} - Success: {data.get('success', False)}")
            if success and data.get('response'):
                print(f"  Response: {data['response'][:60]}...")
        except Exception as e:
            results.append((name, False))
            print(f"✗ {name:30s} - Error: {e}")
    
    print("\n" + "=" * 60)
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"Results: {passed}/{total} commands passed")
    print("=" * 60)
    
    return passed == total

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("SOFIYA Backend-Frontend Sync Test")
    print("=" * 60)
    print()
    
    results = {
        "REST Endpoints": test_rest_endpoints(),
        "WebSocket": test_websocket(),
        "Command Routing": test_command_routing(),
    }
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status:10s} - {test_name}")
    
    print("\n" + "=" * 60)
    all_passed = all(results.values())
    if all_passed:
        print("✓ ALL TESTS PASSED - Backend-Frontend sync is working!")
    else:
        print("⚠ SOME TESTS FAILED - Check errors above")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
