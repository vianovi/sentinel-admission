#!/bin/sh
# Shell starter script for Linux/macOS to check for Docker and run the app

if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "Error: Docker / Docker Compose is not installed on this system."
    echo "Please install Docker from https://docs.docker.com/get-docker/ first."
    echo ""
    read -p "Press Enter to exit..." temp
    exit 1
fi

echo "Starting Sentinel Admission..."
$DOCKER_COMPOSE_CMD up --build
