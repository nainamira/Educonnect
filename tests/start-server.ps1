# Helper script to start the server, automatically killing any process on port 5000 first

Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow

# Find process using port 5000
$portInfo = netstat -ano | findstr :5000 | Select-String "LISTENING"

if ($portInfo) {
    # Extract PID from the output
    $pid = ($portInfo -split '\s+')[-1]
    Write-Host "Found process $pid using port 5000. Stopping it..." -ForegroundColor Yellow
    taskkill /PID $pid /F 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Process stopped successfully" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "⚠ Could not stop process (may not exist anymore)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Port 5000 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start




