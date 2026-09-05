import { CustomerOrder, AdminNotification, AdminSettings, AdminUser } from '../types';
import { DEFAULT_ADMIN_SETTINGS } from '../data/services';

const ORDERS_KEY = 'sipsepatu_orders_v1';
const NOTIFICATIONS_KEY = 'sipsepatu_notifications_v1';
const SETTINGS_KEY = 'sipsepatu_settings_v1';
const ADMIN_AUTH_KEY = 'sipsepatu_admin_auth_v1';

export function getInitialOrders(): CustomerOrder[] {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      // Ensure all orders have a paymentStatus field (migration)
      return orders.map((o: any) => ({
        ...o,
        paymentStatus: o.paymentStatus || 'belum_bayar'
      }));
    } catch {
      // fallback
    }
  }

  // Pre-populate with realistic orders
  const sampleOrders: CustomerOrder[] = [
    {
      id: 'SP-9821',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      customerName: 'Dimas Prasetyo',
      customerPhone: '081298765432',
      deliveryMethod: 'pickup',
      pickupAddress: 'Jl. Dago Asri No. 18, Coblong, Bandung',
      pickupNotes: 'Pagar warna hitam, jemput setelah jam 2 siang',
      serviceId: 'premium',
      serviceName: 'Cuci Premium',
      servicePrice: 45000,
      pairCount: 1,
      shoeDetails: [
        {
          brandModel: 'Nike Dunk Low Panda',
          shoeType: 'Sneakers / Casual',
          color: 'Hitam Putih',
          conditionNotes: 'Noda aspal di pinggir midsole dan debu tebal di toebox'
        }
      ],
      selectedAddOns: ['unyellowing'],
      addOnsTotal: 20000,
      deliveryFee: 15000,
      totalPrice: 80000,
      status: 'dalam_proses',
      paymentStatus: 'sudah_bayar',
      statusHistory: [
        {
          status: 'menunggu_konfirmasi',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          note: 'Pesanan baru diterima via website'
        },
        {
          status: 'dijemput',
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          note: 'Sepatu telah dijemput kurir'
        },
        {
          status: 'dalam_proses',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          note: 'Sedang proses deep clean & treatment unyellowing'
        }
      ],
      adminNotes: 'Sepatu orisinil, hati-hati pada bagian logo lidah',
      isReadByAdmin: true
    },
    {
      id: 'SP-9820',
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
      customerName: 'Siti Rahmawati',
      customerPhone: '085712348899',
      deliveryMethod: 'dropoff',
      serviceId: 'reguler',
      serviceName: 'Cuci Reguler',
      servicePrice: 35000,
      pairCount: 2,
      shoeDetails: [
        {
          brandModel: 'Converse Chuck 70 High',
          shoeType: 'Canvas (Converse/Vans)',
          color: 'Black / White',
          conditionNotes: 'Kotor lumpur bekas hujan kemarin'
        },
        {
          brandModel: 'Vans Old Skool',
          shoeType: 'Canvas (Converse/Vans)',
          color: 'Navy Blue',
          conditionNotes: 'Tali agak dekil'
        }
      ],
      selectedAddOns: [],
      addOnsTotal: 0,
      deliveryFee: 0,
      totalPrice: 70000,
      status: 'siap_ambil',
      paymentStatus: 'belum_bayar',
      statusHistory: [
        {
          status: 'menunggu_konfirmasi',
          timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
          note: 'Pesanan didaftarkan pelanggan'
        },
        {
          status: 'dalam_proses',
          timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
          note: 'Pencucian reguler selesai, proses pengeringan'
        },
        {
          status: 'siap_ambil',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          note: 'Sepatu sudah wangi, bersih, dan siap diambil di outlet'
        }
      ],
      isReadByAdmin: true
    }
  ];

  localStorage.setItem(ORDERS_KEY, JSON.stringify(sampleOrders));
  return sampleOrders;
}

export function saveOrders(orders: CustomerOrder[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getInitialNotifications(): AdminNotification[] {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const sampleNotifications: AdminNotification[] = [
    {
      id: 'NOTIF-1',
      orderId: 'SP-9821',
      customerName: 'Dimas Prasetyo',
      serviceName: 'Cuci Premium (1 Pasang)',
      totalPrice: 80000,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      isRead: true,
      message: 'Pesanan baru dengan metode Antar-Jemput (Pickup) di Jl. Dago Asri'
    }
  ];

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(sampleNotifications));
  return sampleNotifications;
}

export function saveNotifications(notifs: AdminNotification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

export function getAdminSettings(): AdminSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Auto-migrate if previously stored old default values
      if (parsed.storeName?.includes('SipSepatu') || parsed.adminPhone === '6281234567890') {
        parsed.storeName = 'Shoecare Manokwari';
        parsed.adminPhone = '6282239096626';
        if (parsed.storeAddress?.includes('Bandung')) {
          parsed.storeAddress = 'Manokwari, Papua Barat';
        }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateOrderId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SCM-${randomNum}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function buildWhatsAppAdminUrl(order: CustomerOrder, adminPhone: string): string {
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  
  const shoeListText = order.shoeDetails
    .map((s, idx) => `  ${idx + 1}. ${s.brandModel || 'Sepatu'} (${s.shoeType}, Warna: ${s.color || '-'})${s.conditionNotes ? ` - Catatan: ${s.conditionNotes}` : ''}`)
    .join('\n');

  const deliveryDetailText = order.deliveryMethod === 'pickup' 
    ? `*Metode*: 🛵 Antar-Jemput Kurir Maxim Manokwari
*Armada Maxim*: ${order.maximVehicle === 'mobil' ? '🚗 Maxim Car (Mobil)' : '🛵 Maxim Bike (Motor)'}
*Tipe Perjalanan*: ${order.maximTripType === 'pp' ? '🔄 Bolak-Balik PP (Jemput & Antar Selesai)' : '🛵 Sekali Jalan'}
*Zona Lokasi*: ${order.pickupZone || 'Manokwari'}${order.pickupDistanceKm ? ` (±${order.pickupDistanceKm} km)` : ''}
*Alamat Jemput*: ${order.pickupAddress || '-'}
*Patokan / Waktu*: ${order.pickupNotes || '-'}
`
    : `*Metode*: 🏬 Antar Sendiri (Drop-off ke Outlet)
`;

  const text = `*HALO ADMIN SHOECARE MANOKWARI! ADA PESANAN CUCI SEPATU BARU* 👟✨
===============================
*No. Pesanan*: ${order.id}
*Nama Pelanggan*: ${order.customerName}
*No. WhatsApp*: ${order.customerPhone}
*Layanan*: ${order.serviceName} (${formatRupiah(order.servicePrice)})
*Jumlah*: ${order.pairCount} Pasang
*Detail Sepatu*:
${shoeListText}
${deliveryDetailText}*Biaya Layanan*: ${formatRupiah(order.servicePrice * order.pairCount)}
${order.addOnsTotal > 0 ? `*Layanan Tambahan*: ${formatRupiah(order.addOnsTotal)}\n` : ''}${order.deliveryFee > 0 ? `*Ongkir Kurir Maxim Manokwari*: ${formatRupiah(order.deliveryFee)}\n` : ''}*TOTAL BIAYA*: ${formatRupiah(order.totalPrice)}
===============================
Mohon segera dikonfirmasi dan diproses ya Admin. Terima kasih! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppCustomerConfirmUrl(order: CustomerOrder): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62');
  
  const deliveryInfo = order.deliveryMethod === 'pickup'
    ? `\n- Metode: Kurir Maxim ${order.maximVehicle === 'mobil' ? 'Car' : 'Bike'} (${order.pickupZone || 'Manokwari'})\n- Ongkir Maxim: ${formatRupiah(order.deliveryFee)}`
    : `\n- Metode: Serah Terima Langsung di Outlet`;

  const text = `Halo Kak *${order.customerName}*! Terima kasih telah memesan cuci sepatu di *Shoecare Manokwari*. 👟✨

Pesanan Anda dengan nomor *${order.id}* telah kami terima dengan detail:
- Layanan: ${order.serviceName} (${order.pairCount} Pasang)${deliveryInfo}
- Status: Menunggu Pengambilan / Konfirmasi
- Total Estimasi: ${formatRupiah(order.totalPrice)}

Tim kami akan segera memproses sepatu kesayangan Kakak agar kembali bersih, wangi, dan segar!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
}

export function getAdminAuthState(): AdminAuthState {
  const stored = localStorage.getItem(ADMIN_AUTH_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return {
    isAuthenticated: false,
    user: null
  };
}

export function saveAdminAuthState(state: AdminAuthState) {
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(state));
}

export function clearAdminAuthState() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}
