# reset-couchdb.ps1
$COUCHDB_URL = "http://localhost:5984"
$DB_NAME = "blt_remote_db"
$USER = "admin"
$PASS = "adminpassword"

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${USER}:${PASS}"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/json"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   COUCHDB COMPLETE RESET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Delete database
Write-Host "Deleting database: $DB_NAME..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$COUCHDB_URL/$DB_NAME" -Headers $headers -Method Delete | Out-Null
    Write-Host "✅ Database deleted" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database might not exist (this is ok)" -ForegroundColor Yellow
}

# Recreate database
Write-Host "Creating fresh database: $DB_NAME..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$COUCHDB_URL/$DB_NAME" -Headers $headers -Method Put | Out-Null
Write-Host "✅ Database created" -ForegroundColor Green

# Create system databases
Write-Host "Creating system databases..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$COUCHDB_URL/_users" -Headers $headers -Method Put | Out-Null
    Write-Host "✅ _users created" -ForegroundColor Green
} catch {
    Write-Host "⚠️ _users already exists" -ForegroundColor Yellow
}

try {
    Invoke-RestMethod -Uri "$COUCHDB_URL/_replicator" -Headers $headers -Method Put | Out-Null
    Write-Host "✅ _replicator created" -ForegroundColor Green
} catch {
    Write-Host "⚠️ _replicator already exists" -ForegroundColor Yellow
}

try {
    Invoke-RestMethod -Uri "$COUCHDB_URL/_global_changes" -Headers $headers -Method Put | Out-Null
    Write-Host "✅ _global_changes created" -ForegroundColor Green
} catch {
    Write-Host "⚠️ _global_changes already exists" -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "Verifying database..." -ForegroundColor Yellow
$info = Invoke-RestMethod -Uri "$COUCHDB_URL/$DB_NAME" -Headers $headers -Method Get
Write-Host "✅ Database verified:" -ForegroundColor Green
Write-Host "   Name: $($info.db_name)" -ForegroundColor White
Write-Host "   Docs: $($info.doc_count)" -ForegroundColor White
Write-Host "   Size: $($info.sizes.active) bytes" -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RESET COMPLETE! ✨" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan