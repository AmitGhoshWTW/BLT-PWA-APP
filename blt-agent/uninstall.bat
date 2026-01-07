@echo off
echo ========================================
echo  BLT Agent Uninstaller
echo ========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This uninstaller requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Uninstalling BLT Agent...
echo.

echo [1/2] Removing Windows service...
node uninstall-service.js

echo [2/2] Removing firewall rule...
netsh advfirewall firewall delete rule name="BLT Agent"

echo.
echo ========================================
echo  Uninstallation Complete!
echo ========================================
echo.
pause