@echo off
cd /d "%~dp0"
echo Starting Student Marks Analyzer...
echo.
echo Open this URL in Chrome:
echo http://127.0.0.1:5000/
echo.
start "" "http://127.0.0.1:5000/"
python app.py
pause
