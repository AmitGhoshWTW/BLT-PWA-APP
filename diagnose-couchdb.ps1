Write-Host "=== CouchDB Diagnostics ===" -ForegroundColor Cyan

# Check Docker
Write-Host "`n1. Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker not found" -ForegroundColor Red
    exit 1
}

# Check container status
Write-Host "`n2. Checking CouchDB container..." -ForegroundColor Yellow
$container = docker ps -a --filter "name=blt-couchdb" --format "{{.Status}}"
if ($container -match "Up") {
    Write-Host "   ✅ Container running: $container" -ForegroundColor Green
} else {
    Write-Host "   ❌ Container not running: $container" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Yellow
}

# Check port
Write-Host "`n3. Checking port 5984..." -ForegroundColor Yellow
$port = netstat -an | Select-String ":5984" | Select-Object -First 1
if ($port) {
    Write-Host "   ✅ Port 5984 is listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 5984 not listening" -ForegroundColor Red
}

# Test connection
Write-Host "`n4. Testing HTTP connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5984" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ HTTP connection works" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ HTTP connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with auth
Write-Host "`n5. Testing authentication..." -ForegroundColor Yellow
try {
    $cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:adminpassword"))
    $headers = @{ Authorization = "Basic $cred" }
    $response = Invoke-RestMethod -Uri "http://localhost:5984/_all_dbs" -Headers $headers -TimeoutSec 5
    Write-Host "   ✅ Authentication works" -ForegroundColor Green
    Write-Host "   Databases: $($response -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check logs
Write-Host "`n6. Recent CouchDB logs:" -ForegroundColor Yellow
docker logs blt-couchdb --tail 10 2>&1 | ForEach-Object {
    Write-Host "   $_" -ForegroundColor Gray
}

Write-Host "`n=== Diagnosis Complete ===" -ForegroundColor Cyan