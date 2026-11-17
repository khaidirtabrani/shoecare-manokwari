<?php
/**
 * Konfigurasi Database MySQL untuk Hosting (cPanel / VPS)
 * -------------------------------------------------------
 * Salin file ini menjadi "config.php" di folder yang sama dengan api.php,
 * lalu sesuaikan isi kredensial database MySQL dari cPanel/hosting Anda.
 */

return [
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => 'shoecare_manokwari',
    'db_user' => 'root',
    'db_pass' => '',
    'db_charset' => 'utf8mb4',

    // Isi dengan domain hosting Anda, atau '*' saat pengujian awal
    'cors_origin' => '*',
];
