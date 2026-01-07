$COUCH_URL = "http://admin:adminpassword@localhost:5984"

Write-Host "Verifying CouchDB Setup..." -ForegroundColor Green

# Check databases
Write-Host "`nDatabases:" -ForegroundColor Yellow
try {
    $dbs = Invoke-RestMethod -Uri "$COUCH_URL/_all_dbs"
    $dbs | ForEach-Object { Write-Host "  ✅ $_" -ForegroundColor Green }
    
    $required = @("_users", "_replicator", "_global_changes", "blt_remote_db")
    $missing = $required | Where-Object { $_ -notin $dbs }
    
    if ($missing) {
        Write-Host "`nMissing databases:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  ❌ $_" -ForegroundColor Red }
    } else {
        Write-Host "`n✅ All required databases exist!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Cannot connect to CouchDB" -ForegroundColor Red
    exit 1
}

# Check CORS
Write-Host "`nCORS Configuration:" -ForegroundColor Yellow
try {
    $cors = Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/cors"
    $cors.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Cyan
    }
    
    if ($cors.origins -eq "*") {
        Write-Host "`n✅ CORS is properly configured!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ CORS might need adjustment" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Cannot check CORS settings" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host "Open Fauxton: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5984/_utils" -ForegroundColor Cyan