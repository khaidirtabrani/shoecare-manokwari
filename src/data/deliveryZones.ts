// Data Zona Wilayah & Tarif Antar-Jemput Shoecare Manokwari, Papua Barat

export interface DeliveryZone {
  id: string;
  name: string;
  district: string;
  coverage: string[];
  distanceEstimateKm: number;
  priceOneWay: number; // Biaya jemput saja atau antar saja
  priceRoundTrip: number; // Biaya antar-jemput bolak-balik (PP)
  description: string;
  popularPlaces: string[];
}

// Titik Koordinat Workshop Shoecare Manokwari (Sanggeng / Pusat Kota)
export const SHOECARE_WORKSHOP_COORDS = {
  lat: -0.8614,
  lng: 134.0620,
  address: 'Jl. Merdeka - Sanggeng, Manokwari Barat, Papua Barat'
};

export const MANOKWARI_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zona_1_kota',
    name: 'Zona 1: Pusat Kota & Manokwari Barat',
    district: 'Manokwari Barat',
    coverage: ['Sanggeng', 'Wosi', 'Padarni', 'Swapen', 'Brawijaya', 'Borobudur', 'Manokwari Kota'],
    distanceEstimateKm: 2,
    priceOneWay: 10000,
    priceRoundTrip: 15000,
    description: 'Pusat kota dekat workshop. Penjemputan tercepat dalam 30-60 menit.',
    popularPlaces: ['Pasar Sanggeng', 'Hadi Mall', 'Pelabuhan Lama', 'Terminal Wosi', 'Kanal Wosi']
  },
  {
    id: 'zona_2_timur',
    name: 'Zona 2: Manokwari Timur & Pesisir',
    district: 'Manokwari Timur',
    coverage: ['Pasir Putih', 'Pasir Pante', 'Biryosi', 'Arfai', 'Arowi', 'Kwawi'],
    distanceEstimateKm: 4.5,
    priceOneWay: 15000,
    priceRoundTrip: 25000,
    description: 'Area pesisir dan Manokwari Timur, akses aspal mulus.',
    popularPlaces: ['Pantai Pasir Putih', 'Dermaga Biryosi', 'Gereja Pasir Pante']
  },
  {
    id: 'zona_3_amban',
    name: 'Zona 3: Amban, Reremi & Area Kampus',
    district: 'Manokwari Barat / Utara',
    coverage: ['Amban', 'Kampus UNIPA', 'Reremi Puncak', 'Gunung Meja', 'Marina', 'Maripi'],
    distanceEstimateKm: 6.5,
    priceOneWay: 20000,
    priceRoundTrip: 30000,
    description: 'Kawasan perbukitan Amban, asrama mahasiswa, dan UNIPA.',
    popularPlaces: ['Rektorat UNIPA', 'Polres Manokwari Baru', 'RSUD Manokwari', 'Asrama Mahasiswa']
  },
  {
    id: 'zona_4_selatan',
    name: 'Zona 4: Rendani, Sowi & Manokwari Selatan',
    district: 'Manokwari Selatan',
    coverage: ['Rendani', 'Bandara Rendani', 'Sowi 1 - 4', 'Anday', 'Acemo', 'Prafi'],
    distanceEstimateKm: 10,
    priceOneWay: 25000,
    priceRoundTrip: 40000,
    description: 'Area sekitar Bandara Rendani hingga perbatasan Manokwari Selatan.',
    popularPlaces: ['Bandara Rendani', 'Sowi Gunung', 'Polda Papua Barat', 'Kantor Gubernur Arfai']
  }
];

export type DeliveryTripType = 'pp' | 'jemput_saja' | 'antar_saja';

export const TIME_SLOTS = [
  { id: 'pagi', label: 'Pagi (09:00 - 12:00 WIT)', icon: '🌅' },
  { id: 'siang', label: 'Siang (13:00 - 15:30 WIT)', icon: '☀️' },
  { id: 'sore', label: 'Sore (16:00 - 18:30 WIT)', icon: '🌆' }
];

// Menghitung jarak presisi (KM) antara dua koordinat dengan rumus Haversine
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = SHOECARE_WORKSHOP_COORDS.lat,
  lon2: number = SHOECARE_WORKSHOP_COORDS.lng
): number {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 desimal
}

// Menghitung estimasi tarif berdasarkan jarak KM otomatis
export function calculateDeliveryFeeByDistance(
  distanceKm: number,
  tripType: DeliveryTripType = 'pp'
): number {
  const isRoundTrip = tripType === 'pp';
  let oneWayFee = 10000;

  if (distanceKm <= 3) {
    oneWayFee = 10000;
  } else if (distanceKm <= 6) {
    oneWayFee = 15000;
  } else if (distanceKm <= 9) {
    oneWayFee = 20000;
  } else if (distanceKm <= 14) {
    oneWayFee = 25000;
  } else {
    // Di atas 14 km
    oneWayFee = 30000 + Math.ceil(distanceKm - 14) * 2000;
  }

  // Jika PP (Antar-Jemput Bolak Balik), diskon bundle hemat daripada 2x jalan terpisah
  if (isRoundTrip) {
    return Math.round(oneWayFee * 1.6 / 1000) * 1000;
  }

  return oneWayFee;
}

// Mencari zona yang paling cocok berdasarkan jarak KM
export function getRecommendedZoneByDistance(distanceKm: number): DeliveryZone {
  if (distanceKm <= 3.5) return MANOKWARI_DELIVERY_ZONES[0];
  if (distanceKm <= 6) return MANOKWARI_DELIVERY_ZONES[1];
  if (distanceKm <= 8.5) return MANOKWARI_DELIVERY_ZONES[2];
  return MANOKWARI_DELIVERY_ZONES[3];
}

// Menghasilkan link Google Maps navigasi kurir
export function buildGoogleMapsNavigationUrl(addressOrCoords: string | { lat: number; lng: number }): string {
  if (typeof addressOrCoords === 'string') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrCoords + ', Manokwari, Papua Barat')}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${addressOrCoords.lat},${addressOrCoords.lng}`;
}
