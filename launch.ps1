# SOFIYA Multiverse Launcher
# Version 2.1.0
# Optimized for reliability, speed, and platform detection

$ErrorActionPreference = "Continue"

Write-Host "
   _____  ____  ______ _____驰   
  / ____|/ __ \|  ____|_   _| \  / |   / \ 
 | (___ | |  | | |__    | |  \  \/  |  / ^ \ 
  \___ \| |  | |  __|   | |   \    /  / /_\ \
  ____) | |__| | |     _| |_   |  |  /  ___  \
 |_____/ \____/|_|    |_____|  |_| /_/   \_\
" -ForegroundColor Cyan

Write-Host "[SOFIYA] Initializing System Uplink...`n" -ForegroundColor Cyan

# Detection functions
function Test-Port($port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Pre-flight checks
Write-Host "[STATUS] Checking Dependency Services..." -ForegroundColor White
if (!(Test-Port 5432)) {
    Write-Host "[WARNING] PostgreSQL not detected on port 5432. Persistence layer will be unavailable." -ForegroundColor Red
}
else {
    Write-Host "[OK] Database service detected." -ForegroundColor Green
}

if (!(Test-Port 6379)) {
    Write-Host "[WARNING] Redis not detected on port 6379. Intelligent caching disabled." -ForegroundColor Yellow
}
else {
    Write-Host "[OK] Cache service detected." -ForegroundColor Green
}

Write-Host ""

# 1. Start Python System Bridge
if (Test-Path "system-bridge") {
    Write-Host "[BRIDGE] Starting System Bridge (Port 8000)..." -ForegroundColor Yellow
    # Note: Using cmd /c to handle venv activation and script running more reliably across different PS execution policies
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd system-bridge; if (!(Test-Path venv)) { Write-Host '[VENV] Creating virtual environment...'; python -m venv venv }; cmd /c '.\venv\Scripts\activate && python main.py'" -WindowStyle Normal
}
else {
    Write-Warning "system-bridge directory not found. Skipping."
}

# 2. Start Node.js Backend
if (Test-Path "backend") {
    Write-Host "[BACKEND] Starting Core API (Port 3001)..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (!(Test-Path node_modules)) { Write-Host '[NPM] Installing dependencies...'; npm install }; npm run dev" -WindowStyle Normal
}
else {
    Write-Warning "backend directory not found. Skipping."
}

# 3. Start Vite Frontend
if (Test-Path "frontend") {
    Write-Host "[FRONTEND] Starting Neural Interface (Port 3000)..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; if (!(Test-Path node_modules)) { Write-Host '[NPM] Installing dependencies...'; npm install }; npm run dev" -WindowStyle Normal
}
else {
    Write-Warning "frontend directory not found. Skipping."
}

Write-Host "`n[SOFIYA] Uplink sequence initiated." -ForegroundColor Green
Write-Host "Telemetry consoles opened in separate windows." -ForegroundColor White
Write-Host "Neural Interface: http://localhost:3000`n" -ForegroundColor Green
