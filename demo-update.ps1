# demo-update.ps1 - Complete Update Demo Script
param(
    [string]$NewVersion = "2.0.8"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BLT UPDATE DEMO SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current setup:" -ForegroundColor Yellow
Write-Host "  Step 1: Deploy old version (2.0.1)" -ForegroundColor White
Write-Host "  Step 2: Update version.json to trigger notification" -ForegroundColor White
Write-Host "  Step 3: Deploy new version (2.0.8)" -ForegroundColor White
Write-Host ""

# Step 1: Deploy version 2.0.1 (current)
Write-Host "STEP 1: Building current version (2.0.1)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Version 2.0.1 built successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Open http://localhost:3000 and you'll see:" -ForegroundColor Cyan
    Write-Host "  - Header shows 'v2.0.1'" -ForegroundColor White
    Write-Host "  - Update notification appears (2.0.1 → 2.0.8)" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Enter to start server..." -ForegroundColor Yellow
    Read-Host
    
    # Start server in background
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "serve -s dist -l 3000"
    
    Write-Host "✅ Server running at http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now open the app and click 'Update Now'" -ForegroundColor Cyan
    Write-Host "The page will reload but still show v2.0.1" -ForegroundColor Yellow
    Write-Host "because the actual code hasn't changed yet." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Enter when ready to deploy REAL update (2.0.8)..." -ForegroundColor Yellow
    Read-Host
    
    # Step 2: Update code to new version
    Write-Host "STEP 2: Updating code to version 2.0.8..." -ForegroundColor Yellow
    
    # Update App.jsx
    $appFile = "src/App.jsx"
    $appContent = Get-Content $appFile -Raw
    $appContent = $appContent -replace 'const APP_VERSION = "2\.0\.1"', 'const APP_VERSION = "2.0.8"'
    Set-Content $appFile -Value $appContent
    Write-Host "  ✅ Updated App.jsx" -ForegroundColor Green
    
    # Update versionManager.js
    $vmFile = "src/services/versionManager.js"
    $vmContent = Get-Content $vmFile -Raw
    $vmContent = $vmContent -replace 'const CURRENT_VERSION = "2\.0\.1"', 'const CURRENT_VERSION = "2.0.8"'
    Set-Content $vmFile -Value $vmContent
    Write-Host "  ✅ Updated versionManager.js" -ForegroundColor Green
    
    # Rebuild
    Write-Host ""
    Write-Host "Building new version..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Version 2.0.8 built successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "   DEMO COMPLETE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The server will auto-serve the new version." -ForegroundColor White
        Write-Host "Refresh the browser (Ctrl+F5) and you'll see:" -ForegroundColor Cyan
        Write-Host "  ✅ Header now shows 'v2.0.8'" -ForegroundColor Green
        Write-Host "  ✅ No update notification (already on latest)" -ForegroundColor Green
        Write-Host ""
    }
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
}