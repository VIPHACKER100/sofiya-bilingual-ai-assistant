# SOFIYA Multiverse Launcher
# Launch all components of the SOFIYA assistant system

$ErrorActionPreference = "Stop"

Write-Host "`n[SOFIYA] Initializing System Uplink..." -ForegroundColor Cyan

# 1. Start Python System Bridge
Write-Host "[BRIDGE] Starting System Bridge (Python)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd system-bridge; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; python main.py" -WindowStyle Normal

# 2. Start Node.js Backend
Write-Host "[BACKEND] Starting Core API (Node.js)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm install; npm run dev" -WindowStyle Normal

# 3. Start Vite Frontend
Write-Host "[FRONTEND] Starting Neural Interface (Vite)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev" -WindowStyle Normal

Write-Host "`n[SOFIYA] All systems active. Check secondary terminals for logs." -ForegroundColor Green
Write-Host "Uplink established at http://localhost:5173" -ForegroundColor Cyan
