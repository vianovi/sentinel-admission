@echo off
title Sentinel Admission Starter

:: Check for docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

:: Check for docker compose
docker compose version >nul 2>nul
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE_CMD=docker compose
    goto run
)

docker-compose version >nul 2>nul
if %errorlevel% equ 0 (
    set DOCKER_COMPOSE_CMD=docker-compose
    goto run
)

echo Error: Docker Compose is not installed on this system.
echo Please ensure Docker Desktop is running and Compose is installed.
echo.
pause
exit /b 1

:run
echo Starting Sentinel Admission...
%DOCKER_COMPOSE_CMD% up --build
pause
