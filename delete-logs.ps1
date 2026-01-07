# delete-logs.ps1
$COUCHDB_URL = "http://localhost:5984"
$DB_NAME = "blt_remote_db"
$USER = "admin"
$PASS = "adminpassword"

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${USER}:${PASS}"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/json"
}

Write-Host "Fetching all log documents..." -ForegroundColor Yellow

# Get all log documents
$url = "$COUCHDB_URL/$DB_NAME/_all_docs?startkey=`"log:`"&endkey=`"log:\uffff`"&include_docs=true"
$response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get

$logCount = $response.rows.Count
Write-Host "Found $logCount log documents" -ForegroundColor Cyan

if ($logCount -eq 0) {
    Write-Host "No logs to delete!" -ForegroundColor Green
    exit
}

# Create bulk delete payload
$docsToDelete = @()
foreach ($row in $response.rows) {
    $docsToDelete += @{
        "_id" = $row.doc._id
        "_rev" = $row.doc._rev
        "_deleted" = $true
    }
}

$bulkPayload = @{
    "docs" = $docsToDelete
} | ConvertTo-Json -Depth 10

Write-Host "Deleting $logCount log documents..." -ForegroundColor Yellow

# Bulk delete
$deleteUrl = "$COUCHDB_URL/$DB_NAME/_bulk_docs"
$deleteResponse = Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Post -Body $bulkPayload

Write-Host "✅ Successfully deleted $logCount log documents!" -ForegroundColor Green

# Verify
$verifyUrl = "$COUCHDB_URL/$DB_NAME/_all_docs?startkey=`"log:`"&endkey=`"log:\uffff`""
$verifyResponse = Invoke-RestMethod -Uri $verifyUrl -Headers $headers -Method Get

Write-Host "Remaining logs: $($verifyResponse.rows.Count)" -ForegroundColor Cyan