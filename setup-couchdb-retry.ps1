# setup-couchdb-retry.ps1
$COUCH_URL = "http://admin:adminpassword@localhost:5984"
$maxRetries = 5
$retryDelay = 3

function Invoke-CouchRequest {
    param($Uri, $Method = "Get", $Body = $null)
    
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $params = @{
                Uri = $Uri
                Method = $Method
                ContentType = "application/json"
                ErrorAction = "Stop"
            }
            
            if ($Body) {
                $params.Body = $Body
            }
            
            $result = Invoke-RestMethod @params
            return $result
        }
        catch {
            if ($i -eq $maxRetries) {
                Write-Host "Failed after $maxRetries attempts: $Uri" -ForegroundColor Red
                Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
                return $null
            }
            Write-Host "Attempt $i failed, retrying in $retryDelay seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
        }
    }
}

Write-Host "Setting up CouchDB..." -ForegroundColor Green
Write-Host "Waiting for CouchDB to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test connection first
Write-Host "`nTesting connection..." -ForegroundColor Yellow
$test = Invoke-CouchRequest -Uri "http://localhost:5984"
if ($test) {
    Write-Host "✅ CouchDB is accessible!" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot connect to CouchDB. Is it running?" -ForegroundColor Red
    Write-Host "Run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Create system databases
Write-Host "`nCreating system databases..." -ForegroundColor Yellow
Invoke-CouchRequest -Uri "$COUCH_URL/_users" -Method Put
Invoke-CouchRequest -Uri "$COUCH_URL/_replicator" -Method Put
Invoke-CouchRequest -Uri "$COUCH_URL/_global_changes" -Method Put

# Create application database
Write-Host "`nCreating application database..." -ForegroundColor Yellow
Invoke-CouchRequest -Uri "$COUCH_URL/blt_remote_db" -Method Put

# Enable CORS
Write-Host "`nEnabling CORS..." -ForegroundColor Yellow
Invoke-CouchRequest -Uri "$COUCH_URL/_node/_local/_config/httpd/enable_cors" -Method Put -Body '"true"'
Invoke-CouchRequest -Uri "$COUCH_URL/_node/_local/_config/cors/origins" -Method Put -Body '"*"'
Invoke-CouchRequest -Uri "$COUCH_URL/_node/_local/_config/cors/credentials" -Method Put -Body '"true"'
Invoke-CouchRequest -Uri "$COUCH_URL/_node/_local/_config/cors/methods" -Method Put -Body '"GET, PUT, POST, HEAD, DELETE"'
Invoke-CouchRequest -Uri "$COUCH_URL/_node/_local/_config/cors/headers" -Method Put -Body '"accept, authorization, content-type, origin, referer"'

# Verify
Write-Host "`nVerifying setup..." -ForegroundColor Yellow
$dbs = Invoke-CouchRequest -Uri "$COUCH_URL/_all_dbs"
if ($dbs) {
    Write-Host "Databases created: $($dbs -join ', ')" -ForegroundColor Green
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Setup may be incomplete. Check manually at http://localhost:5984/_utils" -ForegroundColor Yellow
}