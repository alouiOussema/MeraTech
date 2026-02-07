@echo off
echo [INFO] Stopping running containers...
docker-compose down

echo [INFO] Pruning Docker builder cache (fixes 500 errors)...
docker builder prune -f

echo [INFO] Building and starting containers...
docker-compose up --build
pause
