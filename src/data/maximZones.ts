// Data Resmi Tarif Transportasi Maxim - Kota Manokwari, Provinsi Papua Barat
// Berdasarkan ketentuan tarif Maxim Bike (Motor) dan Maxim Car (Mobil) di area Manokwari

export interface MaximManokwariZone {
  id: string;
  name: string;
  district: string;
  distanceKm: number;
  motorFeeSingle: number;
  carFeeSingle: number;
  landmarks: string;
}

export const MAXIM_MANOKWARI_CONFIG = {
  city: 'Kota Manokwari',
  province: 'Papua Barat',
  appPromoCode: 'MAXIM',
  // Standar tarif Maxim Bike Delivery (Motor) di Manokwari:
  // Mulai Rp 8.000 untuk jarak 0 - 2 km, kemudian ~Rp 2.500 per km berikutnya
  motor: {
    baseFare: 8000,
    baseKm: 2.0,
    perKmRate: 2500,
    maxShoePairs: 4,
    label: 'Maxim Bike Delivery (Motor)'
  },
  // Standar tarif Maxim Car Delivery (Mobil) di Manokwari:
  // Mulai Rp 12.000 untuk jarak 0 - 3 km, kemudian ~Rp 4.000 per km berikutnya
  car: {
    baseFare: 12000,
    baseKm: 3.0,
    perKmRate: 4000,
    maxShoePairs: 20,
    label: 'Maxim Car Delivery (Mobil)'
  }
};

export const MAXIM_MANOKWARI_ZONES: MaximManokwariZone[] = [
  {
    id: 'sanggeng_padarni',
    name: 'Sanggeng / Padarni (Pusat Kota)',
    district: 'Manokwari Barat',
    distanceKm: 1.5,
    motorFeeSingle: 8000,
    carFeeSingle: 12000,
    landmarks: 'Pasar Sanggeng, Jl. Yos Sudarso, Pelabuhan Manokwari, Padarni'
  },
  {
    id: 'wosi_transito',
    name: 'Wosi (Pasar Wosi, Transito, Lembah Hijau)',
    district: 'Manokwari Barat',
    distanceKm: 2.5,
    motorFeeSingle: 8000,
    carFeeSingle: 12000,
    landmarks: 'Pasar Sentral Wosi, Terminal Wosi, Jl. Trikora, Lembah Hijau'
  },
  {
    id: 'reremi_marina',
    name: 'Reremi & Marina / Borobudur',
    district: 'Manokwari Barat',
    distanceKm: 3.2,
    motorFeeSingle: 9000,
    carFeeSingle: 13000,
    landmarks: 'Reremi Puncak, Reremi Palapa, Pantai Marina, Kampung Ambon'
  },
  {
    id: 'rendani_swapen',
    name: 'Rendani & Swapen (Sekitar Bandara Rendani)',
    district: 'Manokwari Selatan',
    distanceKm: 4.5,
    motorFeeSingle: 11000,
    carFeeSingle: 16000,
    landmarks: 'Bandara Rendani, Swapen Perkebunan, Jl. Sujarwo Condronegoro'
  },
  {
    id: 'amban_unipa',
    name: 'Amban (Kampus UNIPA & Sekitarnya)',
    district: 'Manokwari Barat',
    distanceKm: 5.5,
    motorFeeSingle: 13000,
    carFeeSingle: 18000,
    landmarks: 'Universitas Papua (UNIPA), Amban Bawah, SPMA, Perumahan Dosen'
  },
  {
    id: 'arfai_gubernur',
    name: 'Arfai (Kompleks Kantor Gubernur & Polda PB)',
    district: 'Manokwari Selatan',
    distanceKm: 6.5,
    motorFeeSingle: 15000,
    carFeeSingle: 20000,
    landmarks: 'Kantor Gubernur Papua Barat, Markas Polda PB, Kodam XVIII/Kasuari'
  },
  {
    id: 'sowi_marampa',
    name: 'Sowi (Sowi 1 - Sowi 4 & Marampa)',
    district: 'Manokwari Selatan',
    distanceKm: 7.5,
    motorFeeSingle: 17000,
    carFeeSingle: 23000,
    landmarks: 'RSUD Provinsi Papua Barat Sowi, Perumahan Sowi Gunung, Marampa'
  },
  {
    id: 'pasir_putih_bakaro',
    name: 'Pasir Putih & Bakaro',
    district: 'Manokwari Timur',
    distanceKm: 8.5,
    motorFeeSingle: 19000,
    carFeeSingle: 26000,
    landmarks: 'Objek Wisata Pantai Pasir Putih, Bakaro, Arowi'
  },
  {
    id: 'anday_selatan',
    name: 'Anday & Sekitarnya',
    district: 'Manokwari Selatan',
    distanceKm: 10.0,
    motorFeeSingle: 22000,
    carFeeSingle: 30000,
    landmarks: 'Jembatan Sahara, Anday, Balai Latihan Kerja (BLK), Anggori'
  },
  {
    id: 'maruni_semen',
    name: 'Maruni & Kawasan Pabrik Semen Conch',
    district: 'Manokwari Selatan',
    distanceKm: 13.0,
    motorFeeSingle: 28000,
    carFeeSingle: 38000,
    landmarks: 'Kawasan Industri Maruni, Pabrik Semen Conch, Perbatasan Luar Kota'
  },
  {
    id: 'custom_km',
    name: 'Kalkulator Jarak Khusus (Estimasi KM)',
    district: 'Kota Manokwari & Sekitarnya',
    distanceKm: 5.0,
    motorFeeSingle: 13000,
    carFeeSingle: 18000,
    landmarks: 'Masukkan estimasi jarak perjalanan kurir dari outlet'
  }
];

export function calculateMaximFee({
  zoneId,
  vehicle = 'motor',
  tripType = 'pp',
  customKm
}: {
  zoneId: string;
  vehicle: 'motor' | 'mobil';
  tripType: 'pp' | 'sekali_jalan';
  customKm?: number;
}): { singleFare: number; totalDeliveryFee: number; distanceKm: number; zoneName: string } {
  const zone = MAXIM_MANOKWARI_ZONES.find(z => z.id === zoneId) || MAXIM_MANOKWARI_ZONES[0];
  
  let singleFare = 0;
  let distance = zone.distanceKm;

  if (zone.id === 'custom_km' && customKm && customKm > 0) {
    distance = customKm;
    if (vehicle === 'motor') {
      singleFare = distance <= MAXIM_MANOKWARI_CONFIG.motor.baseKm
        ? MAXIM_MANOKWARI_CONFIG.motor.baseFare
        : MAXIM_MANOKWARI_CONFIG.motor.baseFare + Math.ceil(distance - MAXIM_MANOKWARI_CONFIG.motor.baseKm) * MAXIM_MANOKWARI_CONFIG.motor.perKmRate;
    } else {
      singleFare = distance <= MAXIM_MANOKWARI_CONFIG.car.baseKm
        ? MAXIM_MANOKWARI_CONFIG.car.baseFare
        : MAXIM_MANOKWARI_CONFIG.car.baseFare + Math.ceil(distance - MAXIM_MANOKWARI_CONFIG.car.baseKm) * MAXIM_MANOKWARI_CONFIG.car.perKmRate;
    }
  } else {
    singleFare = vehicle === 'motor' ? zone.motorFeeSingle : zone.carFeeSingle;
  }

  // Round trip (PP: jemput sepatu kotor & antar sepatu bersih setelah selesai cuci) = 2x ongkir
  // Sekali jalan (Jemput saja / Antar saja) = 1x ongkir
  const multiplier = tripType === 'pp' ? 2 : 1;
  const totalDeliveryFee = singleFare * multiplier;

  return {
    singleFare,
    totalDeliveryFee,
    distanceKm: distance,
    zoneName: zone.id === 'custom_km' ? `Jarak Kustom (${distance} km)` : zone.name
  };
}
