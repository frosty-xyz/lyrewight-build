@echo off
title Lyre-Wight EXE Builder
echo ===================================================
echo     Curse of the Lyre-Wight Windows EXE Builder    
echo ===================================================
echo.

:: FORCE CONTEXT TO THE SCRIPT'S DIRECTORY
cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from https://nodejs.org
    echo.
    pause
    exit /b
)

:: 2. Clean up build artifacts safely
echo [STEP 1/3] Cleaning up build and dist directories...
if exist dist rd /s /q dist
if exist build rd /s /q build

:: 3. Install required packaging tools
echo [STEP 2/3] Installing/Updating packaging tools...
:: --no-audit speeds up local builds safely
call npm install --no-audit

:: 4. Package the game into an EXE
echo.
echo [STEP 3/3] Compiling your game into an EXE...
:: npx forces Windows to look inside your fresh node_modules folder
call npx electron-builder --win --x64 -c.electronVersion=43.4.0

ren dist\win-unpacked "Curse of the Lyre-Wight"
copy "CREDITS.txt" "dist\Curse of the Lyre-Wight"
copy "LICENSE.txt" "dist\Curse of the Lyre-Wight"
cd dist
tar -caf "..\Curse of the Lyre-Wight-Win.zip" "Curse of the Lyre-Wight"
move /Y "..\Curse of the Lyre-Wight-Win.zip" P:\lyrewight1
cd ..
rd /S /Q dist
tar -caf lyrewight_latest.zip "assets" "css" "data" "js" "index.html" "sw.js" "CREDITS.txt" "LICENSE.txt" "main.js" "manifest.json"
move /Y lyrewight_latest.zip P:\lyrewight1
cd ..
robocopy src C:\Lyre-Wight-Build\src /E /XO /COPY:DT /XD node_modules

:: 5. Done
echo.
echo ===================================================
echo SUCCESS! Your EXE has been created.
echo zip files created and dist folder deleted.
echo ===================================================
pause