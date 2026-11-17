-- ============================================================================
-- SHOECARE MANOKWARI - MYSQL DATABASE SCHEMA
-- Kompatibel dengan MySQL 5.7+, MySQL 8.0+, dan MariaDB 10.3+ (cPanel / phpMyAdmin)
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- 1. Tabel Pesanan Pelanggan (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(40) NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(40) NOT NULL,
  `delivery_method` ENUM('dropoff', 'pickup') NOT NULL DEFAULT 'dropoff',
  `pickup_address` TEXT NULL,
  `pickup_notes` TEXT NULL,
  `pickup_zone` VARCHAR(150) NULL,
  `pickup_time_slot` VARCHAR(50) NULL,
  `pickup_trip_type` VARCHAR(30) NULL,
  `pickup_coords_json` LONGTEXT NULL,
  `pickup_benchmark` TEXT NULL,
  `maxim_vehicle` VARCHAR(20) NULL,
  `maxim_trip_type` VARCHAR(30) NULL,
  `pickup_distance_km` DECIMAL(8,2) NULL,
  `preferred_date` VARCHAR(30) NULL,

  `service_id` VARCHAR(40) NOT NULL,
  `service_name` VARCHAR(120) NOT NULL,
  `service_price` INT NOT NULL DEFAULT 0,

  `pair_count` INT NOT NULL DEFAULT 1,
  `shoe_details_json` LONGTEXT NOT NULL,
  `selected_addons_json` LONGTEXT NOT NULL,
  `addons_total` INT NOT NULL DEFAULT 0,
  `delivery_fee` INT NOT NULL DEFAULT 0,
  `discount` INT NOT NULL DEFAULT 0,
  `is_priority_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `total_price` INT NOT NULL DEFAULT 0,

  `status` ENUM(
    'menunggu_konfirmasi',
    'dijemput',
    'dalam_proses',
    'siap_ambil',
    'selesai',
    'dibatalkan'
  ) NOT NULL DEFAULT 'menunggu_konfirmasi',
  `payment_status` ENUM('belum_bayar', 'sudah_bayar') NOT NULL DEFAULT 'belum_bayar',
  `status_history_json` LONGTEXT NOT NULL,
  `admin_notes` TEXT NULL,
  `is_read_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `is_completed_from_manifest` TINYINT(1) NOT NULL DEFAULT 0,

  `updated_at_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_created_at` (`created_at`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_phone` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Detail Item Sepatu per Pesanan (order_shoes) - Relasional untuk Laporan/Query SQL
CREATE TABLE IF NOT EXISTS `order_shoes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(40) NOT NULL,
  `shoe_index` INT NOT NULL DEFAULT 0,
  `brand_model` VARCHAR(150) NOT NULL DEFAULT '',
  `shoe_type` VARCHAR(100) NOT NULL DEFAULT '',
  `color` VARCHAR(80) NOT NULL DEFAULT '',
  `condition_notes` TEXT NULL,
  `photo_url` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_order_shoes_order_id` (`order_id`),
  CONSTRAINT `fk_order_shoes_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Notifikasi Admin (notifications)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(40) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `service_name` VARCHAR(150) NOT NULL,
  `total_price` INT NOT NULL DEFAULT 0,
  `created_at` VARCHAR(40) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `message` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_is_read` (`is_read`),
  INDEX `idx_notifications_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Pengaturan Toko & Tarif (store_settings)
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` VARCHAR(40) NOT NULL DEFAULT 'store_config',
  `admin_phone` VARCHAR(40) NOT NULL DEFAULT '6282239096626',
  `store_name` VARCHAR(150) NOT NULL DEFAULT 'Shoecare Manokwari',
  `store_address` TEXT NOT NULL,
  `auto_sound_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `alarm_sound` VARCHAR(40) NOT NULL DEFAULT 'melodi',
  `service_prices_json` LONGTEXT NULL,
  `addon_prices_json` LONGTEXT NULL,
  `updated_at_ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Kredensial Admin (admin_credentials)
CREATE TABLE IF NOT EXISTS `admin_credentials` (
  `id` VARCHAR(40) NOT NULL DEFAULT 'admin_credentials',
  `username` VARCHAR(80) NOT NULL DEFAULT 'admin',
  `password_value` VARCHAR(255) NOT NULL DEFAULT 'admin123',
  `updated_at` VARCHAR(40) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Pengeluaran & Belanja Modal (expenses)
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(40) NOT NULL,
  `date` VARCHAR(20) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `category` ENUM('belanja_modal', 'bahan_baku', 'operasional', 'gaji', 'sewa', 'lainnya') NOT NULL DEFAULT 'operasional',
  `amount` INT NOT NULL DEFAULT 0,
  `payment_method` ENUM('tunai', 'transfer', 'qris') NOT NULL DEFAULT 'tunai',
  `notes` TEXT NULL,
  `created_by` VARCHAR(100) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_expenses_date` (`date`),
  INDEX `idx_expenses_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Modal Awal / Ekuitas (initial_capital)
CREATE TABLE IF NOT EXISTS `initial_capital` (
  `id` VARCHAR(40) NOT NULL,
  `date` VARCHAR(20) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `source` ENUM('modal_pribadi', 'investor_partner', 'saldo_awal_kas', 'pinjaman_usaha', 'lainnya') NOT NULL DEFAULT 'modal_pribadi',
  `amount` INT NOT NULL DEFAULT 0,
  `payment_method` ENUM('tunai', 'transfer', 'rekening_bisnis') NOT NULL DEFAULT 'tunai',
  `recipient_or_bank` VARCHAR(120) NULL,
  `notes` TEXT NULL,
  `created_by` VARCHAR(100) NULL,
  `created_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_capital_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATA AWAL DEFAULT (Aman dijalankan berulang kali)
-- ============================================================================
INSERT IGNORE INTO `store_settings` (
  `id`, `admin_phone`, `store_name`, `store_address`,
  `auto_sound_enabled`, `alarm_sound`, `service_prices_json`, `addon_prices_json`
) VALUES (
  'store_config',
  '6282239096626',
  'Shoecare Manokwari',
  'Manokwari, Papua Barat',
  1,
  'melodi',
  '{"reguler":35000,"premium":45000,"express":60000,"repaint":100000}',
  '{"unyellowing":20000,"suede_care":30000,"nano_waterproof":15000,"leather_balm":15000,"deodorizer_plus":10000}'
);

INSERT IGNORE INTO `admin_credentials` (`id`, `username`, `password_value`, `updated_at`)
VALUES ('admin_credentials', 'admin', 'admin123', NOW());
