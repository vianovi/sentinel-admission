<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Midtrans Configuration
    |--------------------------------------------------------------------------
    |
    | server_key  → dari dashboard Midtrans, Settings > Access Keys
    | client_key  → untuk frontend Snap.js
    | is_production → false = sandbox, true = production
    |
    | Di .env tambahkan:
    | MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
    | MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
    | MIDTRANS_IS_PRODUCTION=false
    |
    */

    'server_key'    => env('MIDTRANS_SERVER_KEY', ''),
    'client_key'    => env('MIDTRANS_CLIENT_KEY', ''),
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
];
