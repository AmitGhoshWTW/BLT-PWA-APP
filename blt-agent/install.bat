@echo off
echo ========================================
echo  BLT Agent Installer
echo ========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This installer requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Installing BLT Agent...
echo.

REM Install Node.js dependencies
echo [1/3] Installing dependencies...
call npm install

REM Install as Windows service
echo [2/3] Installing Windows service...
node install-service.js

echo.
echo [3/3] Configuring firewall...
netsh advfirewall firewall add rule name="BLT Agent" dir=in action=allow protocol=TCP localport=42080

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo BLT Agent is now running as a Windows service.
echo It will start automatically when Windows boots.
echo.
echo Agent URL: http://localhost:42080
echo.
echo To uninstall: Run uninstall.bat
echo.
pause