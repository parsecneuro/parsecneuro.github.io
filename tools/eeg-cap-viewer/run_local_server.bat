@echo off
setlocal
cd /d "%~dp0"
python run_local_server.py
if errorlevel 1 (
  echo.
  echo Python could not start the local server.
  echo You may still open index.html directly in a modern browser.
  pause
)
endlocal
