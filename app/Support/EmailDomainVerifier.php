<?php

namespace App\Support;

final class EmailDomainVerifier
{
    public static function canReceive(string $email): bool
    {
        if (! config('email.validation.check_mx', true)) {
            return true;
        }

        $domain = strtolower(trim((string) substr(strrchr($email, '@') ?: '', 1)));

        if ($domain === '' || ! function_exists('checkdnsrr')) {
            return true;
        }

        // RFC mail delivery may fall back to the domain A/AAAA record when no
        // MX record exists, so accept either an MX or an address record.
        return checkdnsrr($domain, 'MX')
            || checkdnsrr($domain, 'A')
            || checkdnsrr($domain, 'AAAA');
    }
}
