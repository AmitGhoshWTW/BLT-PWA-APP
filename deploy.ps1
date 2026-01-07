# deploy.ps1
Write-Host "🚀 Deploying BLT Update" -ForegroundColor Cyan
Write-Host ""

# Get new version from user
$newVersion = Read-Host "Enter new version (e.g., 2.0.2)"

# Update version.json
$versionFile = "public/version.json"
$versionData = Get-Content $versionFile | ConvertFrom-Json
$oldVersion = $versionData.version
$versionData.version = $newVersion
$versionData.releaseDate = Get-Date -Format "yyyy-MM-dd"

Write-Host "Updating version: $oldVersion → $newVersion" -ForegroundColor Yellow

# Save version.json
$versionData | ConvertTo-Json -Depth 10 | Set-Content $versionFile

Write-Host "✅ Updated version.json" -ForegroundColor Green

# Build
Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Ready to deploy!" -ForegroundColor Green
    Write-Host "   dist/ folder contains the updated application" -ForegroundColor White
    Write-Host "   Users will be notified automatically" -ForegroundColor White
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
}