import { CustomerOrder, AdminNotification, AdminSettings, AdminUser, AdminCredentials, OrderStatus, ExpenseItem, InitialCapitalItem } from '../types';
import { DEFAULT_ADMIN_SETTINGS } from '../data/services';

const ORDERS_KEY = 'sipsepatu_orders_v1';
const NOTIFICATIONS_KEY = 'sipsepatu_notifications_v1';
const SETTINGS_KEY = 'sipsepatu_settings_v1';
const ADMIN_AUTH_KEY = 'sipsepatu_admin_auth_v1';
const ADMIN_CREDENTIALS_KEY = 'shoecare_admin_credentials_v1';
const EXPENSES_KEY = 'shoecare_expenses_v1';
const CAPITAL_KEY = 'shoecare_capital_v1';

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  password: 'admin123'
};

export const SAMPLE_SHOE_PHOTOS = {
  nike: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80',
  converse: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=700&auto=format&fit=crop&q=80',
  vans: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=700&auto=format&fit=crop&q=80'
};

export function getInitialOrders(): CustomerOrder[] {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    try {
      const orders = JSON.parse(stored);
      // Ensure all orders have a paymentStatus field & sample orders have photos
      return orders.map((o: any) => {
        let shoeDetails = o.shoeDetails;
        if (o.id === 'SP-9821') {
          if (Array.isArray(shoeDetails) && shoeDetails[0] && !shoeDetails[0].photoUrl) {
            shoeDetails = [{ ...shoeDetails[0], photoUrl: SAMPLE_SHOE_PHOTOS.nike }];
          }
          if (!o.pickupZone || o.pickupAddress?.includes('Bandung')) {
            o.pickupAddress = 'Jl. Merdeka No. 24, Sanggeng, Manokwari Barat';
            o.pickupZone = 'Zona 1: Pusat Kota & Manokwari Barat';
            o.pickupBenchmark = 'Depan Kios Bintang, pagar warna hitam';
            o.pickupTimeSlot = 'pagi';
            o.pickupTripType = 'pp';
            o.pickupDistanceKm = 1.8;
          }
        } else if (o.id === 'SP-9820' && Array.isArray(shoeDetails)) {
          shoeDetails = shoeDetails.map((s: any, idx: number) => {
            if (!s.photoUrl) {
              return { ...s, photoUrl: idx === 0 ? SAMPLE_SHOE_PHOTOS.converse : SAMPLE_SHOE_PHOTOS.vans };
            }
            return s;
          });
        }
        return {
          ...o,
          shoeDetails,
          paymentStatus: o.paymentStatus || 'belum_bayar'
        };
      });
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
      pickupAddress: 'Jl. Merdeka No. 24, Sanggeng, Manokwari Barat',
      pickupZone: 'Zona 1: Pusat Kota & Manokwari Barat',
      pickupBenchmark: 'Depan Kios Bintang, pagar warna hitam',
      pickupTimeSlot: 'pagi',
      pickupTripType: 'pp',
      pickupDistanceKm: 1.8,
      pickupNotes: 'Pagar warna hitam, jemput setelah jam 10 pagi',
      serviceId: 'premium',
      serviceName: 'Cuci Premium',
      servicePrice: 45000,
      pairCount: 1,
      shoeDetails: [
        {
          brandModel: 'Nike Dunk Low Panda',
          shoeType: 'Sneakers / Casual',
          color: 'Hitam Putih',
          conditionNotes: 'Noda aspal di pinggir midsole dan debu tebal di toebox',
          photoUrl: SAMPLE_SHOE_PHOTOS.nike
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
          conditionNotes: 'Kotor lumpur bekas hujan kemarin',
          photoUrl: SAMPLE_SHOE_PHOTOS.converse
        },
        {
          brandModel: 'Vans Old Skool',
          shoeType: 'Canvas (Converse/Vans)',
          color: 'Navy Blue',
          conditionNotes: 'Tali agak dekil',
          photoUrl: SAMPLE_SHOE_PHOTOS.vans
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
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((n: AdminNotification) => !n.isRead);
      }
    } catch {
      // fallback
    }
  }
  return [];
}

export function saveNotifications(notifs: AdminNotification[]) {
  // Only persist active unread notifications
  const unreadOnly = notifs.filter((n) => !n.isRead);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(unreadOnly));
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
      if (!parsed.alarmSound) {
        parsed.alarmSound = 'melodi';
      }
      parsed.servicePrices = {
        ...DEFAULT_ADMIN_SETTINGS.servicePrices,
        ...(parsed.servicePrices || {})
      };
      parsed.addOnPrices = {
        ...DEFAULT_ADMIN_SETTINGS.addOnPrices,
        ...(parsed.addOnPrices || {})
      };
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

export function getAddOnLabel(id: string): string {
  switch (id) {
    case 'suede_care':
      return 'Suede Restoration & Color Reviving';
    case 'unyellowing':
      return 'Unyellowing Booster Sol';
    case 'nano_waterproof':
      return 'Nano Shield Waterproofing';
    case 'leather_balm':
      return 'Leather Care & Balsam Polish';
    case 'deodorizer_plus':
      return 'Deodorizer & Anti-Fungal Max';
    default:
      return id;
  }
}

export function buildWhatsAppAdminUrl(order: CustomerOrder, adminPhone: string): string {
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  
  const shoeListText = order.shoeDetails
    .map((s, idx) => `  ${idx + 1}. ${s.brandModel || 'Sepatu'} (${s.shoeType}, Warna: ${s.color || '-'})${s.conditionNotes ? ` - Catatan: ${s.conditionNotes}` : ''}`)
    .join('\n');

  let deliveryDetailText = '';
  if (order.deliveryMethod === 'pickup' && order.pickupAddress) {
    const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(order.pickupAddress + ', Manokwari, Papua Barat')}`;
    deliveryDetailText = `*Metode*: Layanan Antar-Jemput Kurir 🛵
*Wilayah/Zona*: ${order.pickupZone || 'Manokwari'}
*Alamat Jemput*: ${order.pickupAddress}
${order.pickupBenchmark ? `*Patokan Rumah*: ${order.pickupBenchmark}\n` : ''}${order.pickupTimeSlot ? `*Jadwal Jemput*: ${order.pickupTimeSlot.toUpperCase()}\n` : ''}${order.deliveryFee ? `*Ongkir Antar-Jemput*: ${formatRupiah(order.deliveryFee)}\n` : ''}*Peta Navigasi*: ${mapsLink}\n`;
  } else {
    deliveryDetailText = `*Metode*: Antar Sendiri ke Toko (Drop-off) 🏬\n`;
  }

  const addOnSummary = order.selectedAddOns?.length
    ? order.selectedAddOns.map(id => {
        if (id === 'suede_care') return 'Suede Restoration & Color Reviving';
        if (id === 'unyellowing') return 'Unyellowing Booster Sol';
        if (id === 'nano_waterproof') return 'Nano Shield Waterproofing';
        if (id === 'leather_balm') return 'Leather Care & Balsam Polish';
        if (id === 'deodorizer_plus') return 'Deodorizer & Anti-Fungal Max';
        return id;
      }).join(', ')
    : '';

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
${order.addOnsTotal > 0 ? `*Layanan Tambahan*: ${addOnSummary} (${formatRupiah(order.addOnsTotal)})\n` : ''}${order.deliveryFee && order.deliveryFee > 0 ? `*Biaya Antar-Jemput*: ${formatRupiah(order.deliveryFee)}\n` : ''}*TOTAL BIAYA*: ${formatRupiah(order.totalPrice)}
===============================
Mohon segera dikonfirmasi dan diproses ya Admin. Terima kasih! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppCourierDispatchUrl(order: CustomerOrder, driverPhone?: string): string {
  const phone = driverPhone ? driverPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';
  const mapsLink = `https://maps.google.com/?q=${encodeURIComponent((order.pickupAddress || 'Manokwari') + ', Manokwari, Papua Barat')}`;
  
  const text = `*ORDER PENJEMPUTAN SEPATU - SHOECARE MANOKWARI* 🛵📦
===============================
*No. Resi*: ${order.id}
*Pelanggan*: ${order.customerName}
*No. WhatsApp*: ${order.customerPhone}
*Layanan*: ${order.serviceName} (${order.pairCount} Pasang)
*Wilayah/Zona*: ${order.pickupZone || 'Manokwari'}
*Alamat Lengkap*: ${order.pickupAddress || '-'}
${order.pickupBenchmark ? `*Patokan Rumah*: ${order.pickupBenchmark}\n` : ''}${order.pickupTimeSlot ? `*Jadwal Jemput*: ${order.pickupTimeSlot.toUpperCase()}\n` : ''}${order.pickupNotes ? `*Catatan Khusus*: ${order.pickupNotes}\n` : ''}*Ongkir*: ${formatRupiah(order.deliveryFee || 0)}
*Tautan Peta GPS*: ${mapsLink}
===============================
Mohon segera dijemput sesuai jadwal ya Driver. Terima kasih! 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppCustomerConfirmUrl(order: CustomerOrder, overrideStatus?: OrderStatus): string {
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const currentStatus: OrderStatus = overrideStatus || order.status || 'menunggu_konfirmasi';
  const paymentText = order.paymentStatus === 'sudah_bayar' ? 'LUNAS' : 'BELUM LUNAS';

  let statusHeader = '';
  let statusBadgeText = '';
  let statusActionText = '';

  switch (currentStatus) {
    case 'siap_ambil':
      statusHeader = `Halo Kak *${order.customerName}*! Kabar gembira dari *Shoecare Manokwari*! 👟✨\n\nSepatu kesayangan Kakak sudah *SELESAI DICUCI & SIAP DIAMBIL*! 🎉`;
      statusBadgeText = `✅ *SIAP DIAMBIL / SIAP DIANTAR*`;
      statusActionText = order.deliveryMethod === 'pickup' && order.pickupAddress
        ? `Sepatu akan segera kami koordinasikan pengantaran ke alamat Kakak (${order.pickupAddress}).\n• Status Pembayaran: *${paymentText}*\n• Total Biaya: *${formatRupiah(order.totalPrice)}*\n\nTerima kasih atas kepercayaannya pada Shoecare Manokwari! 🙏✨`
        : `Silakan diambil di workshop Shoecare Manokwari ya Kak.\n• Status Pembayaran: *${paymentText}*\n• Total Biaya: *${formatRupiah(order.totalPrice)}*\n\nTerima kasih atas kepercayaannya pada Shoecare Manokwari! 🙏✨`;
      break;

    case 'dalam_proses':
      statusHeader = `Halo Kak *${order.customerName}*! Update pengerjaan sepatu dari *Shoecare Manokwari*. 👟✨\n\nSepatu Kakak saat ini sedang dalam proses pencucian & deep clean:`;
      statusBadgeText = `🔄 *SEDANG DALAM PROSES PENGERJAAN*`;
      statusActionText = `Tim teknisi kami sedang memberikan perawatan terbaik agar sepatu kembali bersih, wangi, dan segar maksimal. Mohon ditunggu ya Kak! 🙏`;
      break;

    case 'dijemput':
      statusHeader = `Halo Kak *${order.customerName}*! Update dari *Shoecare Manokwari*. 👟✨\n\nPesanan sepatu Anda saat ini berstatus:`;
      statusBadgeText = `🛵 *PENJEMPUTAN / DITERIMA DI OUTLET*`;
      statusActionText = `Sepatu Kakak telah kami terima / dalam penjemputan dan siap masuk ke antrean pencucian. Terima kasih! 🙏`;
      break;

    case 'selesai':
      statusHeader = `Halo Kak *${order.customerName}*! Terima kasih banyak telah mempercayakan perawatan sepatu di *Shoecare Manokwari*! 👟✨\n\nPesanan sepatu Anda telah selesai serah terima:`;
      statusBadgeText = `🏁 *SELESAI & DISERAHKAN*`;
      statusActionText = `• Status Pembayaran: *${paymentText}*\n\nSemoga Kakak puas dengan hasil cuci dan treatment kami. Sampai jumpa di perawatan berikutnya! Sehat dan sukses selalu! 🙏✨`;
      break;

    case 'dibatalkan':
      statusHeader = `Halo Kak *${order.customerName}*, pemberitahuan dari *Shoecare Manokwari*.`;
      statusBadgeText = `❌ *DIBATALKAN*`;
      statusActionText = `Pesanan ini telah dibatalkan. Jika ada pertanyaan atau ingin memesan kembali, silakan hubungi admin kami ya Kak. Terima kasih. 🙏`;
      break;

    case 'menunggu_konfirmasi':
    default:
      statusHeader = `Halo Kak *${order.customerName}*! Terima kasih telah memesan cuci sepatu di *Shoecare Manokwari*. 👟✨\n\nPesanan Anda dengan nomor *#${order.id}* telah kami terima dengan detail:`;
      statusBadgeText = `⏳ *Menunggu Konfirmasi & Pengerjaan*`;
      statusActionText = `• Total Estimasi: *${formatRupiah(order.totalPrice)}* (${paymentText})\n\nTim kami akan segera memproses sepatu kesayangan Kakak agar kembali bersih, wangi, dan segar! 🙏`;
      break;
  }

  const text = `${statusHeader}

📋 *Detail Pesanan:*
• No. Resi: *#${order.id}*
• Layanan: ${order.serviceName} (${order.pairCount} Pasang)
• Status Terkini: ${statusBadgeText}
• Total Biaya: *${formatRupiah(order.totalPrice)}*

${statusActionText}`;

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

export function getAdminCredentials(): AdminCredentials {
  const stored = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_ADMIN_CREDENTIALS;
}

export function saveAdminCredentials(credentials: AdminCredentials) {
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function getInitialExpenses(): ExpenseItem[] {
  const stored = localStorage.getItem(EXPENSES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  // Pre-populate with realistic shoe care expenses (capital expenditure & operational)
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const sampleExpenses: ExpenseItem[] = [
    {
      id: 'EXP-101',
      date: `${yearMonth}-01`,
      title: 'Mesin Pengering Sepatu UV 4 Slot (Dryer Cabinet Box)',
      category: 'belanja_modal',
      amount: 2450000,
      paymentMethod: 'transfer',
      notes: 'Investasi alat workshop pengering kilat anti-bakteri',
      createdBy: 'Admin',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1, 10, 0, 0).toISOString()
    },
    {
      id: 'EXP-102',
      date: `${yearMonth}-03`,
      title: 'Rak Display Alumunium 5 Susun & Tray Sepatu',
      category: 'belanja_modal',
      amount: 650000,
      paymentMethod: 'transfer',
      notes: 'Tempat penyimpanan antrean sepatu siap ambil',
      createdBy: 'Admin',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 3, 14, 30, 0).toISOString()
    },
    {
      id: 'EXP-103',
      date: `${yearMonth}-05`,
      title: 'Starter Pack Sabun Cleaner Premium 5L & Sikat Bulu Kuda',
      category: 'bahan_baku',
      amount: 375000,
      paymentMethod: 'qris',
      notes: 'Sabun cuci konsentrat dan sikat halus premium',
      createdBy: 'Admin',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 5, 11, 15, 0).toISOString()
    },
    {
      id: 'EXP-104',
      date: `${yearMonth}-08`,
      title: 'Cairan Unyellowing Sole 1L & Parfum Sepatu Bubblegum 500ml',
      category: 'bahan_baku',
      amount: 185000,
      paymentMethod: 'tunai',
      notes: 'Chemical khusus unyellowing & pengharum sepatu',
      createdBy: 'Admin',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 8, 16, 0, 0).toISOString()
    },
    {
      id: 'EXP-105',
      date: `${yearMonth}-10`,
      title: 'Kantong Plastik Ziplock Tebal & Silica Gel Sachet (500 pcs)',
      category: 'operasional',
      amount: 140000,
      paymentMethod: 'transfer',
      notes: 'Perlengkapan kemasan dan penyerahan sepatu ke pelanggan',
      createdBy: 'Admin',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 10, 9, 30, 0).toISOString()
    }
  ];

  return sampleExpenses;
}

export function saveExpenses(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.warn('Failed to save expenses to localStorage:', err);
  }
}

export function getInitialCapital(): InitialCapitalItem[] {
  const stored = localStorage.getItem(CAPITAL_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sampleCapitals: InitialCapitalItem[] = [
    {
      id: 'CAP-001',
      date: `${yearMonth}-01`,
      title: 'Setoran Modal Kas Awal Pendirian Shoecare Manokwari',
      source: 'modal_pribadi',
      amount: 5000000,
      paymentMethod: 'rekening_bisnis',
      recipientOrBank: 'Rekening Operasional Toko',
      notes: 'Modal disetor pemilik untuk kas operasional pembukaan outlet',
      createdBy: 'Owner',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 1, 8, 0, 0).toISOString()
    },
    {
      id: 'CAP-002',
      date: `${yearMonth}-02`,
      title: 'Suntikan Modal Tambahan Pengadaan Mesin & Peralatan',
      source: 'investor_partner',
      amount: 2500000,
      paymentMethod: 'transfer',
      recipientOrBank: 'Kas Rekening BRI Bisnis',
      notes: 'Dana kemitraan untuk pembelian dryer box dan rak display',
      createdBy: 'Owner',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 2, 10, 0, 0).toISOString()
    }
  ];

  return sampleCapitals;
}

export function saveCapital(capitals: InitialCapitalItem[]): void {
  try {
    localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitals));
  } catch (err) {
    console.warn('Failed to save capital to localStorage:', err);
  }
}


