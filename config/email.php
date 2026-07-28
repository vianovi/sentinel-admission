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
        'logo' => env('EMAIL_LOGO', '/assets/icons/brand/logo-email.png'),
        'program_title' => env('EMAIL_PROGRAM_TITLE', 'Sistem Penerimaan Santri Baru'),
        'academic_year' => env('EMAIL_ACADEMIC_YEAR', '2027/2028'),
        'copyright_year' => env('EMAIL_COPYRIGHT_YEAR', '2027'),
        'website' => env('EMAIL_WEBSITE_URL', 'https://spmb.playground-ku.my.id'),
        'whatsapp' => env('EMAIL_WHATSAPP', '085185001661 -> Admin SPMB'),
        'support_email' => env('EMAIL_SUPPORT_ADDRESS', '[Support Email Placeholder]'),
    ],

    'validation' => [
        'check_mx' => filter_var(env('EMAIL_VALIDATE_MX', true), FILTER_VALIDATE_BOOL),
    ],

];
