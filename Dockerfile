FROM php:8.4-apache

# Install extension untuk database MariaDB/MySQL dan pemrosesan XLSX.
# XLSX adalah arsip ZIP; OpenSpout dan template generator membutuhkan ext-zip.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev \
    && docker-php-ext-install pdo_mysql zip \
    && php -m | grep -i '^zip$' \
    && php -r 'exit(class_exists(ZipArchive::class) ? 0 : 1);' \
    && rm -rf /var/lib/apt/lists/*

# Setting Apache biar langsung baca folder /public milik Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Aktifkan mod_rewrite (biar route Laravel gak 404)
RUN a2enmod rewrite
