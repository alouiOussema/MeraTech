@echo off
echo [INFO] Killing Docker Desktop processes...
taskkill /F /IM "Docker Desktop.exe" >nul 2>&1
taskkill /F /IM "com.docker.backend.exe" >nul 2>&1
taskkill /F /IM "com.docker.service.exe" >nul 2>&1
taskkill /F /IM "dockerd.exe" >nul 2>&1

echo [INFO] Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo [INFO] Waiting for Docker Engine to start (this may take a minute)...
:WAIT_LOOP
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo    ...still waiting for Docker...
    goto WAIT_LOOP
)

echo [INFO] Docker is ready!
echo [INFO] Cleaning up old containers/networks...
docker-compose down --remove-orphans >nul 2>&1

echo [INFO] Building and starting application...
docker-compose up --build
pause
