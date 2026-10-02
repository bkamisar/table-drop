@echo off
REM ============================================================
REM  Table Drop - double-click launcher
REM  Starts the local app and opens it in your browser.
REM  Everything runs only on this computer (127.0.0.1).
REM ============================================================

cd /d "%~dp0"

REM Make sure Node.js is findable even if PATH is odd.
set "PATH=C:\Program Files\nodejs;%PATH%"

REM First run only: install libraries and build the page.
if not exist "dist\index.html" (
  echo First-time setup. This happens only once and may take a minute...
  call npm install
  call npx vite build
)

echo.
echo  Starting "Table Drop"...
echo  A browser tab will open in a few seconds.
echo.

REM Run the little local server in its own window (kept open while you use the app).
start "Table Drop server" /min cmd /k "set PATH=C:\Program Files\nodejs;%PATH%&& npx tsx src/server/index.ts"

REM Give the server a moment, then open the browser.
timeout /t 4 /nobreak >nul
start "" http://127.0.0.1:4173

echo  Done. The app is open in your browser.
echo.
echo  To STOP the app: close the small minimized window titled
echo  "Table Drop server" (find it on your taskbar).
echo.
timeout /t 6 /nobreak >nul
