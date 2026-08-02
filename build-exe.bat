@echo off
title Lyre-Wight EXE Builder
echo ===================================================
echo     Curse of the Lyre-Wight Windows EXE Builder    
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 2. Clean up build artifacts (including the cache folder "build")
echo [STEP 1/3] Cleaning up build and dist directories...
if exist dist rd /s /q dist
if exist build rd /s /q build

:: 3. Install required packaging tools
echo [STEP 2/3] Installing/Updating packaging tools...
call npm install

:: 4. Package the game into an EXE
echo.
echo [STEP 3/3] Compiling your game into an EXE...
call npm run build

:: 5. Done
echo.
echo ===================================================
echo SUCCESS! Your EXE has been created.
echo Look inside the new "dist" folder.
echo ===================================================
pause