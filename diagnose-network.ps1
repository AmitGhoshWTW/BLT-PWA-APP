Write-Host "=== Enhanced Network Diagnostics ===" -ForegroundColor Cyan

# Get container IP
Write-Host "`n1. Container IP:" -ForegroundColor Yellow
$containerIP = docker inspect blt-couchdb -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
Write-Host "   $containerIP" -ForegroundColor Cyan

# Test localhost
Write-Host "`n2. Testing localhost:5984..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5984" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ localhost works" -ForegroundColor Green
} catch {
    Write-Host "   ❌ localhost fails: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 127.0.0.1
Write-Host "`n3. Testing 127.0.0.1:5984..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5984" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ 127.0.0.1 works" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 127.0.0.1 fails: $($_.Exception.Message)" -ForegroundColor Red
}

# Test container IP
Write-Host "`n4. Testing container IP ${containerIP}:5984..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${containerIP}:5984" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Container IP works!" -ForegroundColor Green
    Write-Host "   Use this in .env.local: VITE_COUCHDB_URL=http://${containerIP}:5984/blt_remote_db" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Container IP fails: $($_.Exception.Message)" -ForegroundColor Red
}

# Check firewall
Write-Host "`n5. Firewall rules for port 5984:" -ForegroundColor Yellow
$rules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*CouchDB*" -or $_.DisplayName -like "*5984*"}
if ($rules) {
    $rules | ForEach-Object { Write-Host "   ✅ $($_.DisplayName)" -ForegroundColor Green }
} else {
    Write-Host "   ⚠️ No firewall rules found" -ForegroundColor Yellow
}

# Check Docker network
Write-Host "`n6. Docker network info:" -ForegroundColor Yellow
$network = docker network inspect bridge -f "{{(index .IPAM.Config 0).Gateway}}"
Write-Host "   Gateway: $network" -ForegroundColor Cyan

Write-Host "`n=== Diagnostics Complete ===" -ForegroundColor Cyan