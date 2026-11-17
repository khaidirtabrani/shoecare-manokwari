export type ServiceTier = 'reguler' | 'premium' | 'express' | 'repaint';

export interface ServiceItem {
  id: ServiceTier;
  name: string;
  price: number;
  badge?: string;
  duration: string;
  description: string;
  features: string[];
  recommendedFor: string;
  colorTheme: {
    badgeBg: string;
    badgeText: string;
    border: string;
    accent: string;
  };
  imageUrl?: string;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export type DeliveryMethod = 'dropoff' | 'pickup';

export type OrderStatus = 
  | 'menunggu_konfirmasi'
  | 'dijemput'
  | 'dalam_proses'
  | 'siap_ambil'
  | 'selesai'
  | 'dibatalkan';

export type PaymentStatus = 'belum_bayar' | 'sudah_bayar';

export interface ShoeItemDetail {
  brandModel: string;
  shoeType: string;
  color: string;
  conditionNotes?: string;
  photoUrl?: string;
}

export interface CustomerOrder {
  id: string; // e.g. SP-2026-091
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  pickupAddress?: string;
  pickupNotes?: string;
  pickupZone?: string;
  pickupTimeSlot?: string;
  pickupTripType?: 'pp' | 'jemput_saja' | 'antar_saja';
  pickupCoords?: { lat: number; lng: number };
  pickupBenchmark?: string;
  maximVehicle?: 'motor' | 'mobil';
  maximTripType?: 'pp' | 'sekali_jalan';
  pickupDistanceKm?: number;
  preferredDate?: string;
  
  serviceId: ServiceTier;
  serviceName: string;
  servicePrice: number;
  
  pairCount: number;
  shoeDetails: ShoeItemDetail[];
  
  selectedAddOns: string[];
  addOnsTotal: number;
  deliveryFee: number;
  discount?: number;
  isPriorityCustomer?: boolean;
  totalPrice: number;
  
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
  adminNotes?: string;
  isReadByAdmin: boolean;
  isCompletedFromManifest?: boolean;
}

export interface AdminNotification {
  id: string;
  orderId: string;
  customerName: string;
  serviceName: string;
  totalPrice: number;
  createdAt: string;
  isRead: boolean;
  message: string;
}

export type AlarmSoundType = 
  | 'melodi' 
  | 'dingdong' 
  | 'digital' 
  | 'radar' 
  | 'fanfare' 
  | 'marimba' 
  | 'double_ring';

export interface AdminSettings {
  adminPhone: string; // e.g. 6281234567890
  storeName: string;
  storeAddress: string;
  autoSoundEnabled: boolean;
  alarmSound?: AlarmSoundType;
  servicePrices?: Record<string, number>;
  addOnPrices?: Record<string, number>;
}

export interface AdminUser {
  username: string;
  name: string;
  role: string;
  lastLogin?: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
  updatedAt?: string;
}

export type ExpenseCategory = 
  | 'belanja_modal' // Mesin cuci sepatu, dryer box, rak display, peralatan workshop (Capex)
  | 'bahan_baku'    // Sabun cleaner khusus, deterjen, sikat bulu kuda, unyellowing chemical, parfum (Opex)
  | 'operasional'   // Listrik, air, packaging kantong ziplock, label stiker resi, internet (Opex)
  | 'gaji'          // Gaji/upah teknisi & karyawan cuci (Opex)
  | 'sewa'          // Sewa tempat/kios/ruko workshop (Opex)
  | 'lainnya';      // Pengeluaran tak terduga lainnya (Opex)

export interface ExpenseItem {
  id: string; // e.g. EXP-2026-001
  date: string; // YYYY-MM-DD
  title: string; // Deskripsi singkat pengeluaran
  category: ExpenseCategory;
  amount: number; // Nominal Rupiah
  paymentMethod: 'tunai' | 'transfer' | 'qris';
  notes?: string; // Catatan tambahan / No. struk / Supplier
  createdBy?: string; // Nama admin/staf
  createdAt: string; // ISO string
}

export type CapitalSourceType = 
  | 'modal_pribadi'     // Setoran Modal Pribadi Pemilik
  | 'investor_partner'  // Mitra / Investor Usaha
  | 'saldo_awal_kas'    // Saldo Awal Kas Operasional
  | 'pinjaman_usaha'    // Pinjaman Modal Usaha
  | 'lainnya';

export interface InitialCapitalItem {
  id: string; // e.g. CAP-2026-001
  date: string; // YYYY-MM-DD
  title: string; // Deskripsi modal (e.g. Setoran Modal Kas Awal Outlet Manokwari)
  source: CapitalSourceType;
  amount: number; // Nominal Rupiah
  paymentMethod: 'tunai' | 'transfer' | 'rekening_bisnis';
  recipientOrBank?: string; // e.g. Kas Tunai Toko, Rekening BCA, Rekening BRI
  notes?: string; // Keterangan tambahan / No. Bukti Setor
  createdBy?: string; // Admin yang mencatat
  createdAt: string; // ISO string
}

