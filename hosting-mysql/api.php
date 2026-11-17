<?php
/**
 * SHOECARE MANOKWARI - MYSQL REST API BACKEND (PHP PDO)
 * Siap pakai di Shared Hosting (cPanel/DirectAdmin/Hostinger/Niagahoster) atau VPS.
 */

declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath)
    ? require $configPath
    : require __DIR__ . '/config.example.php';

$origin = $config['cors_origin'] ?? '*';
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $config['db_host'],
        $config['db_port'] ?? '3306',
        $config['db_name'],
        $config['db_charset'] ?? 'utf8mb4'
    );
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $e) {
    jsonResponse(500, ['ok' => false, 'error' => 'Koneksi database MySQL gagal: ' . $e->getMessage()]);
}

$action = $_GET['action'] ?? '';
$rawInput = file_get_contents('php://input');
$body = $rawInput ? json_decode($rawInput, true) : [];
if (!is_array($body)) {
    $body = [];
}

function mapOrderRow(array $row): array {
    $shoeDetails = json_decode($row['shoe_details_json'] ?? '[]', true) ?: [];
    $selectedAddOns = json_decode($row['selected_addons_json'] ?? '[]', true) ?: [];
    $statusHistory = json_decode($row['status_history_json'] ?? '[]', true) ?: [];
    $pickupCoords = !empty($row['pickup_coords_json']) ? json_decode($row['pickup_coords_json'], true) : null;

    $order = [
        'id' => $row['id'],
        'createdAt' => $row['created_at'],
        'customerName' => $row['customer_name'],
        'customerPhone' => $row['customer_phone'],
        'deliveryMethod' => $row['delivery_method'],
        'serviceId' => $row['service_id'],
        'serviceName' => $row['service_name'],
        'servicePrice' => (int) $row['service_price'],
        'pairCount' => (int) $row['pair_count'],
        'shoeDetails' => $shoeDetails,
        'selectedAddOns' => $selectedAddOns,
        'addOnsTotal' => (int) $row['addons_total'],
        'deliveryFee' => (int) $row['delivery_fee'],
        'discount' => (int) $row['discount'],
        'isPriorityCustomer' => (bool) $row['is_priority_customer'],
        'totalPrice' => (int) $row['total_price'],
        'status' => $row['status'],
        'paymentStatus' => $row['payment_status'] ?: 'belum_bayar',
        'statusHistory' => $statusHistory,
        'isReadByAdmin' => (bool) $row['is_read_by_admin'],
        'isCompletedFromManifest' => (bool) $row['is_completed_from_manifest'],
    ];

    if ($row['pickup_address'] !== null) $order['pickupAddress'] = $row['pickup_address'];
    if ($row['pickup_notes'] !== null) $order['pickupNotes'] = $row['pickup_notes'];
    if ($row['pickup_zone'] !== null) $order['pickupZone'] = $row['pickup_zone'];
    if ($row['pickup_time_slot'] !== null) $order['pickupTimeSlot'] = $row['pickup_time_slot'];
    if ($row['pickup_trip_type'] !== null) $order['pickupTripType'] = $row['pickup_trip_type'];
    if ($pickupCoords !== null) $order['pickupCoords'] = $pickupCoords;
    if ($row['pickup_benchmark'] !== null) $order['pickupBenchmark'] = $row['pickup_benchmark'];
    if ($row['maxim_vehicle'] !== null) $order['maximVehicle'] = $row['maxim_vehicle'];
    if ($row['maxim_trip_type'] !== null) $order['maximTripType'] = $row['maxim_trip_type'];
    if ($row['pickup_distance_km'] !== null) $order['pickupDistanceKm'] = (float) $row['pickup_distance_km'];
    if ($row['preferred_date'] !== null) $order['preferredDate'] = $row['preferred_date'];
    if ($row['admin_notes'] !== null) $order['adminNotes'] = $row['admin_notes'];

    return $order;
}

function upsertOrder(PDO $pdo, array $o): void {
    $sql = "INSERT INTO orders (
        id, created_at, customer_name, customer_phone, delivery_method,
        pickup_address, pickup_notes, pickup_zone, pickup_time_slot, pickup_trip_type,
        pickup_coords_json, pickup_benchmark, maxim_vehicle, maxim_trip_type,
        pickup_distance_km, preferred_date, service_id, service_name, service_price,
        pair_count, shoe_details_json, selected_addons_json, addons_total,
        delivery_fee, discount, is_priority_customer, total_price,
        status, payment_status, status_history_json, admin_notes,
        is_read_by_admin, is_completed_from_manifest
    ) VALUES (
        :id, :created_at, :customer_name, :customer_phone, :delivery_method,
        :pickup_address, :pickup_notes, :pickup_zone, :pickup_time_slot, :pickup_trip_type,
        :pickup_coords_json, :pickup_benchmark, :maxim_vehicle, :maxim_trip_type,
        :pickup_distance_km, :preferred_date, :service_id, :service_name, :service_price,
        :pair_count, :shoe_details_json, :selected_addons_json, :addons_total,
        :delivery_fee, :discount, :is_priority_customer, :total_price,
        :status, :payment_status, :status_history_json, :admin_notes,
        :is_read_by_admin, :is_completed_from_manifest
    ) ON DUPLICATE KEY UPDATE
        customer_name = VALUES(customer_name),
        customer_phone = VALUES(customer_phone),
        delivery_method = VALUES(delivery_method),
        pickup_address = VALUES(pickup_address),
        pickup_notes = VALUES(pickup_notes),
        pickup_zone = VALUES(pickup_zone),
        pickup_time_slot = VALUES(pickup_time_slot),
        pickup_trip_type = VALUES(pickup_trip_type),
        pickup_coords_json = VALUES(pickup_coords_json),
        pickup_benchmark = VALUES(pickup_benchmark),
        maxim_vehicle = VALUES(maxim_vehicle),
        maxim_trip_type = VALUES(maxim_trip_type),
        pickup_distance_km = VALUES(pickup_distance_km),
        preferred_date = VALUES(preferred_date),
        service_id = VALUES(service_id),
        service_name = VALUES(service_name),
        service_price = VALUES(service_price),
        pair_count = VALUES(pair_count),
        shoe_details_json = VALUES(shoe_details_json),
        selected_addons_json = VALUES(selected_addons_json),
        addons_total = VALUES(addons_total),
        delivery_fee = VALUES(delivery_fee),
        discount = VALUES(discount),
        is_priority_customer = VALUES(is_priority_customer),
        total_price = VALUES(total_price),
        status = VALUES(status),
        payment_status = VALUES(payment_status),
        status_history_json = VALUES(status_history_json),
        admin_notes = VALUES(admin_notes),
        is_read_by_admin = VALUES(is_read_by_admin),
        is_completed_from_manifest = VALUES(is_completed_from_manifest)";

    $stmt = $pdo->prepare($sql);
    $shoeDetails = $o['shoeDetails'] ?? [];
    $stmt->execute([
        ':id' => $o['id'],
        ':created_at' => $o['createdAt'] ?? date('c'),
        ':customer_name' => $o['customerName'] ?? '',
        ':customer_phone' => $o['customerPhone'] ?? '',
        ':delivery_method' => $o['deliveryMethod'] ?? 'dropoff',
        ':pickup_address' => $o['pickupAddress'] ?? null,
        ':pickup_notes' => $o['pickupNotes'] ?? null,
        ':pickup_zone' => $o['pickupZone'] ?? null,
        ':pickup_time_slot' => $o['pickupTimeSlot'] ?? null,
        ':pickup_trip_type' => $o['pickupTripType'] ?? null,
        ':pickup_coords_json' => isset($o['pickupCoords']) ? json_encode($o['pickupCoords']) : null,
        ':pickup_benchmark' => $o['pickupBenchmark'] ?? null,
        ':maxim_vehicle' => $o['maximVehicle'] ?? null,
        ':maxim_trip_type' => $o['maximTripType'] ?? null,
        ':pickup_distance_km' => $o['pickupDistanceKm'] ?? null,
        ':preferred_date' => $o['preferredDate'] ?? null,
        ':service_id' => $o['serviceId'] ?? 'reguler',
        ':service_name' => $o['serviceName'] ?? '',
        ':service_price' => (int) ($o['servicePrice'] ?? 0),
        ':pair_count' => (int) ($o['pairCount'] ?? 1),
        ':shoe_details_json' => json_encode($shoeDetails, JSON_UNESCAPED_UNICODE),
        ':selected_addons_json' => json_encode($o['selectedAddOns'] ?? [], JSON_UNESCAPED_UNICODE),
        ':addons_total' => (int) ($o['addOnsTotal'] ?? 0),
        ':delivery_fee' => (int) ($o['deliveryFee'] ?? 0),
        ':discount' => (int) ($o['discount'] ?? 0),
        ':is_priority_customer' => !empty($o['isPriorityCustomer']) ? 1 : 0,
        ':total_price' => (int) ($o['totalPrice'] ?? 0),
        ':status' => $o['status'] ?? 'menunggu_konfirmasi',
        ':payment_status' => $o['paymentStatus'] ?? 'belum_bayar',
        ':status_history_json' => json_encode($o['statusHistory'] ?? [], JSON_UNESCAPED_UNICODE),
        ':admin_notes' => $o['adminNotes'] ?? null,
        ':is_read_by_admin' => !empty($o['isReadByAdmin']) ? 1 : 0,
        ':is_completed_from_manifest' => !empty($o['isCompletedFromManifest']) ? 1 : 0,
    ]);

    // Sinkronkan tabel relasional order_shoes
    $delShoes = $pdo->prepare('DELETE FROM order_shoes WHERE order_id = ?');
    $delShoes->execute([$o['id']]);

    if (is_array($shoeDetails) && count($shoeDetails) > 0) {
        $insShoe = $pdo->prepare(
            'INSERT INTO order_shoes (order_id, shoe_index, brand_model, shoe_type, color, condition_notes, photo_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($shoeDetails as $idx => $s) {
            $insShoe->execute([
                $o['id'],
                (int) $idx,
                $s['brandModel'] ?? '',
                $s['shoeType'] ?? '',
                $s['color'] ?? '',
                $s['conditionNotes'] ?? null,
                $s['photoUrl'] ?? null,
            ]);
        }
    }
}

try {
    switch ($action) {
        // ==================== ORDERS ====================
        case 'get_orders': {
            $rows = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
            $data = array_map('mapOrderRow', $rows);
            jsonResponse(200, ['ok' => true, 'data' => $data]);
        }

        case 'save_order': {
            $order = $body['order'] ?? null;
            if (!$order || empty($order['id'])) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload order tidak valid']);
            }
            $pdo->beginTransaction();
            upsertOrder($pdo, $order);
            $pdo->commit();
            jsonResponse(200, ['ok' => true]);
        }

        case 'update_order': {
            $orderId = $body['orderId'] ?? '';
            $updates = $body['updates'] ?? [];
            if (!$orderId || !is_array($updates)) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload update_order tidak valid']);
            }
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? LIMIT 1');
            $stmt->execute([$orderId]);
            $existingRow = $stmt->fetch();
            if (!$existingRow) {
                jsonResponse(404, ['ok' => false, 'error' => 'Order tidak ditemukan']);
            }
            $merged = array_merge(mapOrderRow($existingRow), $updates);
            $merged['id'] = $orderId;
            $pdo->beginTransaction();
            upsertOrder($pdo, $merged);
            $pdo->commit();
            jsonResponse(200, ['ok' => true]);
        }

        case 'delete_order': {
            $orderId = $body['orderId'] ?? '';
            if (!$orderId) {
                jsonResponse(400, ['ok' => false, 'error' => 'orderId wajib diisi']);
            }
            $stmt = $pdo->prepare('DELETE FROM orders WHERE id = ?');
            $stmt->execute([$orderId]);
            jsonResponse(200, ['ok' => true]);
        }

        case 'seed_orders': {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn();
            if ($count === 0) {
                $orders = $body['orders'] ?? [];
                $settings = $body['settings'] ?? null;
                $pdo->beginTransaction();
                foreach ($orders as $o) {
                    if (!empty($o['id'])) {
                        upsertOrder($pdo, $o);
                    }
                }
                if (is_array($settings)) {
                    $stmtSet = $pdo->prepare(
                        'INSERT INTO store_settings (id, admin_phone, store_name, store_address, auto_sound_enabled, alarm_sound, service_prices_json, addon_prices_json)
                         VALUES ("store_config", ?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                           admin_phone = VALUES(admin_phone),
                           store_name = VALUES(store_name),
                           store_address = VALUES(store_address),
                           auto_sound_enabled = VALUES(auto_sound_enabled),
                           alarm_sound = VALUES(alarm_sound),
                           service_prices_json = VALUES(service_prices_json),
                           addon_prices_json = VALUES(addon_prices_json)'
                    );
                    $stmtSet->execute([
                        $settings['adminPhone'] ?? '6282239096626',
                        $settings['storeName'] ?? 'Shoecare Manokwari',
                        $settings['storeAddress'] ?? 'Manokwari, Papua Barat',
                        !empty($settings['autoSoundEnabled']) ? 1 : 0,
                        $settings['alarmSound'] ?? 'melodi',
                        json_encode($settings['servicePrices'] ?? []),
                        json_encode($settings['addOnPrices'] ?? []),
                    ]);
                }
                $pdo->commit();
            }
            jsonResponse(200, ['ok' => true]);
        }

        // ==================== NOTIFICATIONS ====================
        case 'get_notifications': {
            $rows = $pdo->query('SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC')->fetchAll();
            $data = array_map(static function ($r) {
                return [
                    'id' => $r['id'],
                    'orderId' => $r['order_id'],
                    'customerName' => $r['customer_name'],
                    'serviceName' => $r['service_name'],
                    'totalPrice' => (int) $r['total_price'],
                    'createdAt' => $r['created_at'],
                    'isRead' => (bool) $r['is_read'],
                    'message' => $r['message'],
                ];
            }, $rows);
            jsonResponse(200, ['ok' => true, 'data' => $data]);
        }

        case 'save_notification': {
            $n = $body['notification'] ?? null;
            if (!$n || empty($n['id'])) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload notification tidak valid']);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO notifications (id, order_id, customer_name, service_name, total_price, created_at, is_read, message)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   is_read = VALUES(is_read),
                   message = VALUES(message)'
            );
            $stmt->execute([
                $n['id'],
                $n['orderId'] ?? '',
                $n['customerName'] ?? '',
                $n['serviceName'] ?? '',
                (int) ($n['totalPrice'] ?? 0),
                $n['createdAt'] ?? date('c'),
                !empty($n['isRead']) ? 1 : 0,
                $n['message'] ?? '',
            ]);
            jsonResponse(200, ['ok' => true]);
        }

        case 'delete_notification': {
            $notifId = $body['notifId'] ?? '';
            if ($notifId) {
                $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = ?');
                $stmt->execute([$notifId]);
            }
            jsonResponse(200, ['ok' => true]);
        }

        case 'delete_notifications': {
            $ids = $body['notifIds'] ?? [];
            if (is_array($ids) && count($ids) > 0) {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $pdo->prepare("DELETE FROM notifications WHERE id IN ($placeholders)");
                $stmt->execute(array_values($ids));
            }
            jsonResponse(200, ['ok' => true]);
        }

        // ==================== SETTINGS ====================
        case 'get_settings': {
            $row = $pdo->query('SELECT * FROM store_settings WHERE id = "store_config" LIMIT 1')->fetch();
            if (!$row) {
                jsonResponse(200, ['ok' => true, 'data' => null]);
            }
            jsonResponse(200, [
                'ok' => true,
                'data' => [
                    'adminPhone' => $row['admin_phone'],
                    'storeName' => $row['store_name'],
                    'storeAddress' => $row['store_address'],
                    'autoSoundEnabled' => (bool) $row['auto_sound_enabled'],
                    'alarmSound' => $row['alarm_sound'] ?: 'melodi',
                    'servicePrices' => json_decode($row['service_prices_json'] ?? '{}', true) ?: [],
                    'addOnPrices' => json_decode($row['addon_prices_json'] ?? '{}', true) ?: [],
                ],
            ]);
        }

        case 'save_settings': {
            $s = $body['settings'] ?? null;
            if (!is_array($s)) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload settings tidak valid']);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO store_settings (id, admin_phone, store_name, store_address, auto_sound_enabled, alarm_sound, service_prices_json, addon_prices_json)
                 VALUES ("store_config", ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   admin_phone = VALUES(admin_phone),
                   store_name = VALUES(store_name),
                   store_address = VALUES(store_address),
                   auto_sound_enabled = VALUES(auto_sound_enabled),
                   alarm_sound = VALUES(alarm_sound),
                   service_prices_json = VALUES(service_prices_json),
                   addon_prices_json = VALUES(addon_prices_json)'
            );
            $stmt->execute([
                $s['adminPhone'] ?? '6282239096626',
                $s['storeName'] ?? 'Shoecare Manokwari',
                $s['storeAddress'] ?? 'Manokwari, Papua Barat',
                !empty($s['autoSoundEnabled']) ? 1 : 0,
                $s['alarmSound'] ?? 'melodi',
                json_encode($s['servicePrices'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($s['addOnPrices'] ?? [], JSON_UNESCAPED_UNICODE),
            ]);
            jsonResponse(200, ['ok' => true]);
        }

        // ==================== ADMIN CREDENTIALS ====================
        case 'get_credentials': {
            $row = $pdo->query('SELECT * FROM admin_credentials WHERE id = "admin_credentials" LIMIT 1')->fetch();
            if (!$row) {
                jsonResponse(200, ['ok' => true, 'data' => null]);
            }
            jsonResponse(200, [
                'ok' => true,
                'data' => [
                    'username' => $row['username'],
                    'password' => $row['password_value'],
                    'updatedAt' => $row['updated_at'],
                ],
            ]);
        }

        case 'save_credentials': {
            $c = $body['credentials'] ?? null;
            if (!is_array($c) || empty($c['username']) || empty($c['password'])) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload credentials tidak valid']);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO admin_credentials (id, username, password_value, updated_at)
                 VALUES ("admin_credentials", ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   username = VALUES(username),
                   password_value = VALUES(password_value),
                   updated_at = VALUES(updated_at)'
            );
            $stmt->execute([
                $c['username'],
                $c['password'],
                $c['updatedAt'] ?? date('c'),
            ]);
            jsonResponse(200, ['ok' => true]);
        }

        // ==================== EXPENSES ====================
        case 'get_expenses': {
            $rows = $pdo->query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC')->fetchAll();
            $data = array_map(static function ($r) {
                $item = [
                    'id' => $r['id'],
                    'date' => $r['date'],
                    'title' => $r['title'],
                    'category' => $r['category'],
                    'amount' => (int) $r['amount'],
                    'paymentMethod' => $r['payment_method'],
                    'createdAt' => $r['created_at'],
                ];
                if ($r['notes'] !== null) $item['notes'] = $r['notes'];
                if ($r['created_by'] !== null) $item['createdBy'] = $r['created_by'];
                return $item;
            }, $rows);
            jsonResponse(200, ['ok' => true, 'data' => $data]);
        }

        case 'save_expense': {
            $e = $body['expense'] ?? null;
            if (!$e || empty($e['id'])) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload expense tidak valid']);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO expenses (id, date, title, category, amount, payment_method, notes, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   date = VALUES(date),
                   title = VALUES(title),
                   category = VALUES(category),
                   amount = VALUES(amount),
                   payment_method = VALUES(payment_method),
                   notes = VALUES(notes),
                   created_by = VALUES(created_by)'
            );
            $stmt->execute([
                $e['id'],
                $e['date'] ?? date('Y-m-d'),
                $e['title'] ?? '',
                $e['category'] ?? 'operasional',
                (int) ($e['amount'] ?? 0),
                $e['paymentMethod'] ?? 'tunai',
                $e['notes'] ?? null,
                $e['createdBy'] ?? null,
                $e['createdAt'] ?? date('c'),
            ]);
            jsonResponse(200, ['ok' => true]);
        }

        case 'delete_expense': {
            $expenseId = $body['expenseId'] ?? '';
            if ($expenseId) {
                $stmt = $pdo->prepare('DELETE FROM expenses WHERE id = ?');
                $stmt->execute([$expenseId]);
            }
            jsonResponse(200, ['ok' => true]);
        }

        case 'seed_expenses': {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM expenses')->fetchColumn();
            if ($count === 0) {
                $expenses = $body['expenses'] ?? [];
                $stmt = $pdo->prepare(
                    'INSERT IGNORE INTO expenses (id, date, title, category, amount, payment_method, notes, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                foreach ($expenses as $e) {
                    if (!empty($e['id'])) {
                        $stmt->execute([
                            $e['id'],
                            $e['date'] ?? date('Y-m-d'),
                            $e['title'] ?? '',
                            $e['category'] ?? 'operasional',
                            (int) ($e['amount'] ?? 0),
                            $e['paymentMethod'] ?? 'tunai',
                            $e['notes'] ?? null,
                            $e['createdBy'] ?? null,
                            $e['createdAt'] ?? date('c'),
                        ]);
                    }
                }
            }
            jsonResponse(200, ['ok' => true]);
        }

        // ==================== INITIAL CAPITAL ====================
        case 'get_capital': {
            $rows = $pdo->query('SELECT * FROM initial_capital ORDER BY date DESC, created_at DESC')->fetchAll();
            $data = array_map(static function ($r) {
                $item = [
                    'id' => $r['id'],
                    'date' => $r['date'],
                    'title' => $r['title'],
                    'source' => $r['source'],
                    'amount' => (int) $r['amount'],
                    'paymentMethod' => $r['payment_method'],
                    'createdAt' => $r['created_at'],
                ];
                if ($r['recipient_or_bank'] !== null) $item['recipientOrBank'] = $r['recipient_or_bank'];
                if ($r['notes'] !== null) $item['notes'] = $r['notes'];
                if ($r['created_by'] !== null) $item['createdBy'] = $r['created_by'];
                return $item;
            }, $rows);
            jsonResponse(200, ['ok' => true, 'data' => $data]);
        }

        case 'save_capital': {
            $c = $body['capital'] ?? null;
            if (!$c || empty($c['id'])) {
                jsonResponse(400, ['ok' => false, 'error' => 'Payload capital tidak valid']);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO initial_capital (id, date, title, source, amount, payment_method, recipient_or_bank, notes, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   date = VALUES(date),
                   title = VALUES(title),
                   source = VALUES(source),
                   amount = VALUES(amount),
                   payment_method = VALUES(payment_method),
                   recipient_or_bank = VALUES(recipient_or_bank),
                   notes = VALUES(notes),
                   created_by = VALUES(created_by)'
            );
            $stmt->execute([
                $c['id'],
                $c['date'] ?? date('Y-m-d'),
                $c['title'] ?? '',
                $c['source'] ?? 'modal_pribadi',
                (int) ($c['amount'] ?? 0),
                $c['paymentMethod'] ?? 'tunai',
                $c['recipientOrBank'] ?? null,
                $c['notes'] ?? null,
                $c['createdBy'] ?? null,
                $c['createdAt'] ?? date('c'),
            ]);
            jsonResponse(200, ['ok' => true]);
        }

        case 'delete_capital': {
            $capitalId = $body['capitalId'] ?? '';
            if ($capitalId) {
                $stmt = $pdo->prepare('DELETE FROM initial_capital WHERE id = ?');
                $stmt->execute([$capitalId]);
            }
            jsonResponse(200, ['ok' => true]);
        }

        case 'seed_capital': {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM initial_capital')->fetchColumn();
            if ($count === 0) {
                $capitals = $body['capitals'] ?? [];
                $stmt = $pdo->prepare(
                    'INSERT IGNORE INTO initial_capital (id, date, title, source, amount, payment_method, recipient_or_bank, notes, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                foreach ($capitals as $c) {
                    if (!empty($c['id'])) {
                        $stmt->execute([
                            $c['id'],
                            $c['date'] ?? date('Y-m-d'),
                            $c['title'] ?? '',
                            $c['source'] ?? 'modal_pribadi',
                            (int) ($c['amount'] ?? 0),
                            $c['paymentMethod'] ?? 'tunai',
                            $c['recipientOrBank'] ?? null,
                            $c['notes'] ?? null,
                            $c['createdBy'] ?? null,
                            $c['createdAt'] ?? date('c'),
                        ]);
                    }
                }
            }
            jsonResponse(200, ['ok' => true]);
        }

        default:
            jsonResponse(404, ['ok' => false, 'error' => 'Endpoint action tidak dikenali']);
    }
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(500, ['ok' => false, 'error' => $e->getMessage()]);
}
