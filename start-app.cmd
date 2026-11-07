@echo off
cd /d "%~dp0"

rem Builds the app, then serves it from one port for this computer and the office network.
rem To work on the code with live reload, use "npm run dev" instead.
echo Preparing the app...
call npm run build --prefix client
if errorlevel 1 (
    echo.
    echo The app could not be built, so it was not started. See the message above.
    pause
    exit /b 1
)

set NODE_ENV=production
echo.
echo On this computer:  http://localhost:5100
echo On other devices:  http://THIS-COMPUTER-ADDRESS:5100, using the address below
ipconfig | findstr /c:"IPv4"
echo.
echo Keep this window open. Closing it stops the app.
echo.
call npm start
pause
