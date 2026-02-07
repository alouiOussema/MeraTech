@echo off
echo Starting Esprit Hack Assistant Environment...

:: Check if Docker Desktop is running
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Docker Desktop is running.
) else (
    echo Docker Desktop is NOT running.
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (this may take a minute)...
    timeout /t 30
)

:: Run Docker Compose
echo Starting services with Docker Compose...
docker-compose up --build

pause
