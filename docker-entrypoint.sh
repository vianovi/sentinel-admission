#!/bin/sh
set -e

# Export node_modules/.bin to PATH
export PATH="./node_modules/.bin:$PATH"

# 1. Ensure composer dependencies are installed
if [ ! -d "vendor" ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

# 2. Ensure .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# 3. Ensure SQLite database file exists
if [ ! -f "database/database.sqlite" ]; then
    echo "Creating SQLite database..."
    touch database/database.sqlite
fi

# 4. Generate APP_KEY if empty or missing
if ! grep -q "^APP_KEY=base64:" .env || [ -z "$(grep "^APP_KEY=" .env | cut -d'=' -f2)" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# 5. Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# 6. Ensure NPM dependencies are installed and built
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/tsc" ]; then
    echo "Installing NPM dependencies..."
    npm install
fi

if [ ! -d "public/build" ]; then
    echo "Building frontend assets..."
    npm run build
fi

# 7. Start Apache (default CMD of php:apache)
echo "Starting Apache web server..."
exec apache2-foreground
