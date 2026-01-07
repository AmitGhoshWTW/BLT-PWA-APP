# clean-couchdb-logs.ps1
$COUCHDB_URL = "http://localhost:5984"
$DB_NAME = "blt_remote_db"
$USER = "admin"
$PASS = "adminpassword"

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${USER}:${PASS}"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/json"
}

Write-Host "Fetching all documents..." -ForegroundColor Yellow

# Get ALL documents
$url = "$COUCHDB_URL/$DB_NAME/_all_docs?include_docs=true"
$response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get

Write-Host "Total documents: $($response.rows.Count)" -ForegroundColor Cyan

# Filter logs and system logs
$logsToDelete = @()
foreach ($row in $response.rows) {
    if ($row.doc.type -eq "systemLog" -or $row.id -like "log:*") {
        $logsToDelete += @{
            "_id" = $row.doc._id
            "_rev" = $row.doc._rev
            "_deleted" = $true
        }
    }
}

Write-Host "Found $($logsToDelete.Count) log documents to delete" -ForegroundColor Yellow

if ($logsToDelete.Count -eq 0) {
    Write-Host "No logs to delete!" -ForegroundColor Green
    exit
}

# Bulk delete
$bulkPayload = @{
    "docs" = $logsToDelete
} | ConvertTo-Json -Depth 10

$deleteUrl = "$COUCHDB_URL/$DB_NAME/_bulk_docs"
Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Post -Body $bulkPayload | Out-Null

Write-Host "✅ Successfully deleted $($logsToDelete.Count) log documents!" -ForegroundColor Green

# Show remaining documents
$verifyResponse = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
Write-Host "Remaining documents: $($verifyResponse.rows.Count)" -ForegroundColor Cyan