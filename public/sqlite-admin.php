<?php
/**
 * SQLite Web Admin Interface (Adminer Wrapper)
 * Allows zero-config visual management of database/database.sqlite via browser.
 * Accessible at http://localhost:8080/sqlite-admin.php or http://localhost:8000/sqlite-admin.php
 */

function adminer_object() {
    class AdminerCustom extends Adminer {
        function name() {
            return 'Sentinel Admission - SQLite Web Manager';
        }
        function credentials() {
            return array('localhost', '', '');
        }
        function database() {
            return __DIR__ . '/../database/database.sqlite';
        }
        function login($login, $password) {
            return true;
        }
    }
    return new AdminerCustom;
}

require_once __DIR__ . '/db-admin.php';
