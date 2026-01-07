# setup-couchdb.ps1
$COUCH_URL = "http://admin:adminpassword@localhost:5984"

Write-Host "Setting up CouchDB..." -ForegroundColor Green

# Create system databases
Write-Host "`nCreating system databases..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$COUCH_URL/_users" -Method Put
Invoke-RestMethod -Uri "$COUCH_URL/_replicator" -Method Put  
Invoke-RestMethod -Uri "$COUCH_URL/_global_changes" -Method Put

# Create application database
Write-Host "`nCreating application database..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$COUCH_URL/blt_remote_db" -Method Put

# Enable CORS
Write-Host "`nEnabling CORS..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/httpd/enable_cors" -Method Put -Body '"true"' -ContentType "application/json"
Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/cors/origins" -Method Put -Body '"*"' -ContentType "application/json"
Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/cors/credentials" -Method Put -Body '"true"' -ContentType "application/json"
Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/cors/methods" -Method Put -Body '"GET, PUT, POST, HEAD, DELETE"' -ContentType "application/json"
Invoke-RestMethod -Uri "$COUCH_URL/_node/_local/_config/cors/headers" -Method Put -Body '"accept, authorization, content-type, origin, referer"' -ContentType "application/json"

# Verify
Write-Host "`nVerifying setup..." -ForegroundColor Yellow
$dbs = Invoke-RestMethod -Uri "$COUCH_URL/_all_dbs"
Write-Host "Databases created: $($dbs -join ', ')" -ForegroundColor Green

Write-Host "`n✅ Setup complete!" -ForegroundColor Green