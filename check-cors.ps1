Write-Host "=== CORS Diagnostic ===" -ForegroundColor Cyan

# 1. Check config in CouchDB
Write-Host "`n1. CouchDB CORS Config:" -ForegroundColor Yellow
try {
    $cors = Invoke-RestMethod -Uri "http://admin:adminpassword@localhost:5984/_node/_local/_config/cors" -ErrorAction Stop
    $cors | Format-List
} catch {
    Write-Host "   ❌ Cannot read CORS config: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Test OPTIONS request
Write-Host "`n2. Testing OPTIONS Request:" -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://localhost:5173'
        'Access-Control-Request-Method' = 'GET'
        'Access-Control-Request-Headers' = 'authorization, content-type'
    }
    $response = Invoke-WebRequest -Uri "http://admin:adminpassword@localhost:5984/blt_remote_db/" -Method Options -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   CORS Headers:" -ForegroundColor Cyan
    
    $corsHeaders = $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "Access-Control-*" }
    if ($corsHeaders) {
        $corsHeaders | ForEach-Object {
            Write-Host "     $($_.Key): $($_.Value)" -ForegroundColor White
        }
    } else {
        Write-Host "     ❌ No CORS headers found!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ OPTIONS request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check config file
Write-Host "`n3. Checking Config File:" -ForegroundColor Yellow
docker exec blt-couchdb cat /opt/couchdb/etc/local.ini | Select-String -Pattern "cors|httpd|chttpd" -Context 0,3

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan