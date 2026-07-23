<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Transactional email brand configuration
    |--------------------------------------------------------------------------
    |
    | Keep the email identity in one place so future notifications can reuse
    | the same school identity without copying presentation details.
    |
    */

    'brand' => [
        'name' => env('APP_NAME', 'Al-Muntaha School'),
        'logo' => env('APP_LOGO', '/assets/icons/brand/logo.webp'),
        'website' => env('EMAIL_WEBSITE_URL', 'https://spmb.playground-ku.my.id'),
        'whatsapp' => env('EMAIL_WHATSAPP', '[WhatsApp Placeholder]'),
        'support_email' => env('EMAIL_SUPPORT_ADDRESS', '[Support Email Placeholder]'),
    ],

];
