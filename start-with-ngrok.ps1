# ============================================================
# start-with-ngrok.ps1
# Starts the backend server and ngrok tunnel in two windows.
# Run from the project root:  .\start-with-ngrok.ps1
# ============================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Expense Tracker - ngrok iPhone Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start backend in a new PowerShell window
Write-Host "[1/2] Starting backend server (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; node index.js"

Start-Sleep -Seconds 3

# 2. Start ngrok tunnel on port 5000 in another window
Write-Host "[2/2] Starting ngrok tunnel on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 5000"

Write-Host ""
Write-Host "Done! Look at the ngrok window for your public URL." -ForegroundColor Green
Write-Host "Open that URL on your iPhone browser." -ForegroundColor Green
Write-Host ""
