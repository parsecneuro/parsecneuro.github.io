@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 start_local.py
  pause
  exit /b
)
where python >nul 2>nul
if not errorlevel 1 (
  python start_local.py
  pause
  exit /b
)
echo Python 3 is required to preview the app locally.
echo Install Python 3, then run this file again.
pause
