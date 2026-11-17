import { ServiceItem, AddOnItem, AdminSettings } from '../types';

import regulerImg from '../assets/images/service_reguler.png';
import premiumImg from '../assets/images/service_premium.png';
import expressImg from '../assets/images/service_express.png';
import repaintImg from '../assets/images/service_repaint.png';

export const SERVICES: ServiceItem[] = [
  {
    id: 'reguler',
    name: 'Cuci Reguler',
    price: 35000,
    duration: '2 - 3 Hari',
    description: 'Pembersihan standar menyeluruh untuk sepatu pemakaian santai dan harian.',
    features: [
      'Pembersihan Upper (bagian atas)',
      'Pembersihan Midsole & Outsole',
      'Pencucian tali sepatu & insole',
      'Pembersihan debu & noda ringan',
      'Parfum sepatu anti-bakteri standar'
    ],
    recommendedFor: 'Sneakers harian, kanvas, sepatu sekolah/kuliah, kotoran ringan',
    colorTheme: {
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      border: 'border-blue-200 hover:border-blue-400',
      accent: 'text-blue-600'
    },
    imageUrl: regulerImg
  },
  {
    id: 'premium',
    name: 'Cuci Premium',
    price: 45000,
    badge: 'Terfavorit',
    duration: '1 - 2 Hari',
    description: 'Deep cleaning intensif dengan formula khusus untuk semua material sensitif.',
    features: [
      'Semua layanan Cuci Reguler',
      'Deep cleaning mendalam ke serat bahan',
      'Aman untuk Suede, Leather, Nubuck & Knit',
      'Treatment spot unyellowing ringan midsole',
      'Formula anti-bakterial & anti-jamur ekstra',
      'Dry cleaning khusus tanpa merusak lem'
    ],
    recommendedFor: 'Sepatu bahan suede, kulit asli/sintetis, sneakers branded, noda membandel',
    colorTheme: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      border: 'border-emerald-300 ring-1 ring-emerald-400/40',
      accent: 'text-emerald-600'
    },
    imageUrl: premiumImg
  },
  {
    id: 'express',
    name: 'Cuci Express (Fast Clean)',
    price: 60000,
    badge: 'Kilat 24 Jam',
    duration: '6 - 24 Jam',
    description: 'Prioritas pembersihan kilat untuk kebutuhan mendesak, acara, atau bepergian.',
    features: [
      'Prioritas antrean pengerjaan no. 1',
      'Deep clean menyeluruh & cepat',
      'Mesin pengering sirkulasi suhu aman (rapid dry)',
      'Finishing wangi premium segar siap pakai',
      'Pemeriksaan kualitas ganda sebelum serah terima'
    ],
    recommendedFor: 'Kebutuhan mendesak, besok mau dipakai pesta/kantor/olahraga',
    colorTheme: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      border: 'border-amber-300 hover:border-amber-400',
      accent: 'text-amber-600'
    },
    imageUrl: expressImg
  },
  {
    id: 'repaint',
    name: 'Repaint & Restorasi',
    price: 100000,
    badge: 'Restorasi Total',
    duration: '4 - 7 Hari',
    description: 'Pengecatan ulang profesional untuk mengembalikan warna asli sepatu yang pudar.',
    features: [
      'Cuci deep clean sebelum treatment repaint',
      'Cat khusus leather/canvas/midsole tahan lama',
      'Pilihan: Warna asli (restore) atau custom dasar',
      'Finishing coat pelindung anti-luntur & anti-pecah',
      'Garansi pengerjaan 1 bulan'
    ],
    recommendedFor: 'Sepatu pudar, midsole menguning pekat, kulit terkelupas atau kusam',
    colorTheme: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      border: 'border-purple-300 hover:border-purple-400',
      accent: 'text-purple-600'
    },
    imageUrl: repaintImg
  }
];

export const ADD_ONS: AddOnItem[] = [
  {
    id: 'unyellowing',
    name: 'Unyellowing Booster Sol',
    price: 20000,
    description: 'Menghilangkan warna kuning pada midsole & outsole karet yang teroksidasi'
  },
  {
    id: 'suede_care',
    name: 'Suede Restoration & Color Reviving',
    price: 30000,
    description: 'Pemulihan serat bulu suede/nubuck yang kaku/rusak agar lembut alami & formula color reviver untuk mengembalikan warna pudar'
  },
  {
    id: 'nano_waterproof',
    name: 'Nano Shield Waterproofing',
    price: 15000,
    description: 'Lapisan pelindung hidrofobik penolak air, minyak, dan debu hingga 1 bulan'
  },
  {
    id: 'leather_balm',
    name: 'Leather Care & Balsam Polish',
    price: 15000,
    description: 'Nutrisi pelembab khusus kulit asli/sintetis agar tidak pecah-pecah'
  },
  {
    id: 'deodorizer_plus',
    name: 'Deodorizer & Anti-Fungal Max',
    price: 10000,
    description: 'Treatment kapsul anti-bau apek kaki dan sterilisasi spora jamur'
  }
];

export const getServices = (settings?: AdminSettings): ServiceItem[] => {
  if (!settings?.servicePrices) return SERVICES;
  return SERVICES.map(s => ({
    ...s,
    price: settings.servicePrices![s.id] ?? s.price
  }));
};

export const getAddOns = (settings?: AdminSettings): AddOnItem[] => {
  if (!settings?.addOnPrices) return ADD_ONS;
  return ADD_ONS.map(a => ({
    ...a,
    price: settings.addOnPrices![a.id] ?? a.price
  }));
};

export const SHOE_TYPES = [
  'Sneakers / Casual',
  'Running / Sport',
  'Canvas (Converse/Vans)',
  'Leather Formal / Pantofel',
  'Suede / Nubuck',
  'Boots / Outdoor',
  'Slip On / Flat Shoes',
  'Lainnya'
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminPhone: '6282239096626',
  storeName: 'Shoecare Manokwari',
  storeAddress: 'Manokwari, Papua Barat',
  autoSoundEnabled: true,
  alarmSound: 'melodi',
  servicePrices: {
    'reguler': 35000,
    'premium': 45000,
    'express': 60000,
    'repaint': 100000
  },
  addOnPrices: {
    'unyellowing': 20000,
    'suede_care': 30000,
    'nano_waterproof': 15000,
    'leather_balm': 15000,
    'deodorizer_plus': 10000
  }
};
