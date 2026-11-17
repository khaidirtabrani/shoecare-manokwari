# Panduan Hosting dengan Database MySQL (Shoecare Manokwari)

Paket di folder `hosting-mysql/` ini disiapkan agar aplikasi **Shoecare Manokwari** dapat di-hosting di **cPanel / DirectAdmin / Hostinger / Niagahoster / Rumahweb / VPS** menggunakan database **MySQL** (phpMyAdmin) + **PHP PDO** tanpa perlu setup server Node.js di hosting.

---

## Langkah 1: Buat Database & Import `schema.sql` di cPanel / phpMyAdmin

1. Masuk ke **cPanel** hosting Anda $\rightarrow$ buka **MySQL® Databases**.
2. Buat database baru (misalnya: `u12345_shoecare`).
3. Buat user MySQL + password, lalu berikan hak akses **ALL PRIVILEGES** ke database tersebut.
4. Buka **phpMyAdmin**, pilih database yang baru dibuat, klik tab **Import**, lalu pilih file:
   ```
   hosting-mysql/schema.sql
   ```
5. Klik **Go / Kirim**. Seluruh tabel (`orders`, `order_shoes`, `notifications`, `store_settings`, `admin_credentials`, `expenses`, `initial_capital`) akan otomatis dibuat beserta tarif default terbaru (termasuk Add-On **Suede Restoration & Color Reviving Rp 30.000**).

---

## Langkah 2: Konfigurasi Koneksi Database (`config.php`)

1. Salin file `hosting-mysql/config.example.php` menjadi `config.php`.
2. Ubah isinya sesuai kredensial database MySQL hosting Anda:
   ```php
   return [
       'db_host' => 'localhost',
       'db_port' => '3306',
       'db_name' => 'u12345_shoecare',
       'db_user' => 'u12345_admin',
       'db_pass' => 'PASSWORD_MYSQL_ANDA',
       'db_charset' => 'utf8mb4',
       'cors_origin' => 'https://domainanda.com',
   ];
   ```

---

## Langkah 3: Build Aplikasi Frontend Mode MySQL

Di komputer lokal Anda (sebelum upload ke hosting):

1. Buat atau edit file `.env` di root proyek:
   ```env
   VITE_DB_DRIVER=mysql
   VITE_API_BASE_URL=/api.php
   ```
2. Jalankan build produksi:
   ```bash
   npm install
   npm run build
   ```
3. Hasil build akan muncul di folder `dist/`.

---

## Langkah 4: Upload ke `public_html` Hosting

Upload file berikut ke dalam folder `public_html/` (atau subdomain folder Anda):
1. Seluruh isi folder `dist/` (`index.html`, `assets/`, dll).
2. File `hosting-mysql/api.php` $\rightarrow$ taruh sebagai `public_html/api.php`.
3. File `config.php` yang sudah Anda isi $\rightarrow$ taruh sebagai `public_html/config.php`.

*(Opsional)* Tambahkan `.htaccess` di `public_html/.htaccess` jika memakai routing SPA:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api\.php$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Selesai! Aplikasi akan langsung membaca dan menyimpan seluruh data pesanan, pengeluaran, modal awal, pengaturan toko, dan login admin langsung ke database **MySQL** di hosting Anda.
