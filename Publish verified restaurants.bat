@echo off
REM ============================================================
REM  Publish your verified restaurants to the Table Drop website.
REM  Shows exactly what will change and asks before saving.
REM  Afterwards, click "Push origin" in GitHub Desktop.
REM ============================================================
cd /d "%~dp0"
chcp 65001 >nul
set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"
call npx tsx scripts\publish-starter.ts
echo.
pause
