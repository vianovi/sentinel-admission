#!/bin/sh
set -e

# Export node_modules/.bin to PATH
export PATH="./node_modules/.bin:$PATH"

# 1. Ensure storage and bootstrap/cache directory structures exist and are writable
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache \
         database
chmod -R 777 storage bootstrap/cache database

# 2. Ensure Composer dependencies and vendor/autoload.php exist FIRST
if [ ! -f "vendor/autoload.php" ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

# 3. Ensure .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# 4. Ensure SQLite database file exists
if [ ! -f "database/database.sqlite" ]; then
    echo "Creating SQLite database..."
    touch database/database.sqlite
    chmod 777 database/database.sqlite
fi

# 5. Ensure NPM dependencies and tsc exist
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/tsc" ]; then
    echo "Installing NPM dependencies..."
    npm install --no-audit --no-fund
fi

# 6. Build frontend assets if missing
if [ ! -d "public/build" ]; then
    echo "Building frontend assets..."
    npx tsc && npx vite build
fi

# 7. Generate APP_KEY if empty or missing
if ! grep -q "^APP_KEY=base64:" .env || [ -z "$(grep "^APP_KEY=" .env | cut -d'=' -f2)" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# 8. Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# 9. Start Apache web server
echo "Starting Apache web server..."
exec apache2-foreground
