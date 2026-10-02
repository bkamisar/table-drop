@echo off
REM ============================================================
REM  Wake-up TEST: schedules a wake ~5 minutes from now through
REM  the app's real scheduling code, then you put the laptop to
REM  sleep to confirm it actually wakes.
REM ============================================================
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
call npx tsx scripts\test-wake.ts
echo.
echo  Press any key to close this window.
pause >nul
