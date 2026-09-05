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

export interface AdminSettings {
  adminPhone: string; // e.g. 6281234567890
  storeName: string;
  storeAddress: string;
  autoSoundEnabled: boolean;
  pickupFee: number;
  maximMotorBaseRate?: number;
  maximMotorPerKmRate?: number;
  maximCarBaseRate?: number;
  maximCarPerKmRate?: number;
}

export interface AdminUser {
  username: string;
  name: string;
  role: string;
  lastLogin?: string;
}
