import React, { useState, useEffect, useMemo } from 'react';
import { getServices, getAddOns, SHOE_TYPES } from '../data/services';
import { ServiceTier, CustomerOrder, ShoeItemDetail, AdminSettings } from '../types';
import { formatRupiah, generateOrderId } from '../utils/storage';
import { 
  Sparkles, 
  Camera, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Layers,
  ChevronRight,
  ReceiptText,
  Info,
  Crown,
  Tag,
  MapPin,
  Truck,
  Navigation,
  Store,
  Calendar,
  LocateFixed,
  Compass,
  ArrowRight
} from 'lucide-react';
import { 
  MANOKWARI_DELIVERY_ZONES, 
  DeliveryZone, 
  DeliveryTripType, 
  TIME_SLOTS, 
  calculateDistanceKm, 
  calculateDeliveryFeeByDistance, 
  getRecommendedZoneByDistance,
  SHOECARE_WORKSHOP_COORDS
} from '../data/deliveryZones';

interface OrderFormProps {
  initialServiceId?: ServiceTier;
  onOrderCreated: (order: CustomerOrder) => void;
  existingCustomers?: {name: string, phone: string}[];
  allOrders?: CustomerOrder[];
  settings?: AdminSettings;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialServiceId = 'reguler',
  onOrderCreated,
  existingCustomers = [],
  allOrders = [],
  settings
}) => {
  const SERVICES = getServices(settings);
  const ADD_ONS = getAddOns(settings);
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceTier>(initialServiceId);
  
  const [pairCount, setPairCount] = useState(1);
  const [shoeDetails, setShoeDetails] = useState<ShoeItemDetail[]>([
    {
      brandModel: '',
      shoeType: 'Sneakers / Casual',
      color: '',
      conditionNotes: '',
      photoUrl: ''
    }
  ]);

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery / Pickup location states
  const [deliveryMethod, setDeliveryMethod] = useState<'dropoff' | 'pickup'>('dropoff');
  const [pickupTripType, setPickupTripType] = useState<DeliveryTripType>('pp');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zona_1_kota');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupBenchmark, setPickupBenchmark] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState<string>('pagi');
  const [preferredPickupDate, setPreferredPickupDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupDistanceKm, setPickupDistanceKm] = useState<number | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);

  // Sync if initialServiceId changes
  useEffect(() => {
    if (initialServiceId) {
      setSelectedService(initialServiceId);
    }
  }, [initialServiceId]);

  // Adjust shoeDetails array when pairCount changes
  const handlePairCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(10, newCount));
    setPairCount(validCount);
    
    setShoeDetails(prev => {
      const updated = [...prev];
      if (validCount > prev.length) {
        for (let i = prev.length; i < validCount; i++) {
          updated.push({
            brandModel: '',
            shoeType: 'Sneakers / Casual',
            color: '',
            conditionNotes: '',
            photoUrl: ''
          });
        }
      } else {
        return updated.slice(0, validCount);
      }
      return updated;
    });
  };

  const updateShoeDetail = (index: number, field: keyof ShoeItemDetail, value: string) => {
    setShoeDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            updateShoeDetail(index, 'photoUrl', dataUrl);
          } else {
            updateShoeDetail(index, 'photoUrl', reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Price & Priority Customer calculations
  const currentServiceObj = SERVICES.find(s => s.id === selectedService) || SERVICES[0];
  const serviceBasePrice = currentServiceObj.price;
  const serviceSubtotal = serviceBasePrice * pairCount;
  
  const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
    const item = ADD_ONS.find(a => a.id === addonId);
    return sum + (item ? item.price * pairCount : 0);
  }, 0);

  // Check historical total spent for this customer
  const historicalTotalSpent = useMemo(() => {
    if (!allOrders || !allOrders.length) return 0;
    const cleanPhone = customerPhone.trim();
    const cleanName = customerName.trim().toLowerCase();

    if (!cleanPhone && !cleanName) return 0;

    return allOrders.reduce((sum, o) => {
      const matchPhone = cleanPhone && o.customerPhone.trim() === cleanPhone;
      const matchName = cleanName && o.customerName.trim().toLowerCase() === cleanName;
      if (matchPhone || matchName) {
        return sum + (o.totalPrice || 0);
      }
      return sum;
    }, 0);
  }, [allOrders, customerPhone, customerName]);

  // Delivery fee calculation
  const selectedZone = useMemo(() => {
    return MANOKWARI_DELIVERY_ZONES.find(z => z.id === selectedZoneId) || MANOKWARI_DELIVERY_ZONES[0];
  }, [selectedZoneId]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'dropoff') return 0;
    if (pickupDistanceKm !== null && pickupDistanceKm > 0) {
      return calculateDeliveryFeeByDistance(pickupDistanceKm, pickupTripType);
    }
    return pickupTripType === 'pp' ? selectedZone.priceRoundTrip : selectedZone.priceOneWay;
  }, [deliveryMethod, pickupTripType, selectedZone, pickupDistanceKm]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsSuccessMsg('Browser Anda tidak mendukung GPS. Silakan pilih zona wilayah di bawah.');
      return;
    }
    setIsLocatingGps(true);
    setGpsSuccessMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const dist = calculateDistanceKm(lat, lng);
        setPickupCoords({ lat, lng });
        setPickupDistanceKm(dist);
        const recZone = getRecommendedZoneByDistance(dist);
        setSelectedZoneId(recZone.id);
        setIsLocatingGps(false);
        setGpsSuccessMsg(`📍 Lokasi terdeteksi! Estimasi jarak ke workshop Shoecare: ${dist} km (${recZone.name}).`);
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsSuccessMsg('Izin lokasi tidak diberikan. Silakan pilih zona wilayah secara manual di bawah.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const rawSubtotal = serviceSubtotal + addOnsTotal;

  const isPriorityCustomer = historicalTotalSpent >= 1000000;
  const priorityDiscount = isPriorityCustomer ? 100000 : 0;
  const totalDiscount = priorityDiscount;
  const grandTotal = Math.max(0, rawSubtotal + deliveryFee - totalDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!customerName.trim()) {
      setErrorMessage('Silakan isi Nama Lengkap Anda.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, '').length < 9) {
      setErrorMessage('Silakan isi Nomor WhatsApp yang aktif (minimal 9-10 digit).');
      return;
    }

    if (deliveryMethod === 'pickup' && !pickupAddress.trim()) {
      setErrorMessage('Silakan isi alamat lengkap penjemputan sepatu Anda di Manokwari.');
      return;
    }

    setIsSubmitting(true);

    const orderId = generateOrderId();
    const newOrder: CustomerOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod: deliveryMethod,
      pickupAddress: deliveryMethod === 'pickup' ? pickupAddress.trim() : undefined,
      pickupBenchmark: deliveryMethod === 'pickup' && pickupBenchmark.trim() ? pickupBenchmark.trim() : undefined,
      pickupNotes: deliveryMethod === 'pickup' && pickupNotes.trim() ? pickupNotes.trim() : undefined,
      pickupZone: deliveryMethod === 'pickup' ? selectedZone.name : undefined,
      pickupTimeSlot: deliveryMethod === 'pickup' ? pickupTimeSlot : undefined,
      pickupTripType: deliveryMethod === 'pickup' ? pickupTripType : undefined,
      pickupCoords: deliveryMethod === 'pickup' && pickupCoords ? pickupCoords : undefined,
      pickupDistanceKm: deliveryMethod === 'pickup' && pickupDistanceKm ? pickupDistanceKm : undefined,
      preferredDate: deliveryMethod === 'pickup' ? preferredPickupDate : undefined,
      serviceId: selectedService,
      serviceName: currentServiceObj.name,
      servicePrice: currentServiceObj.price,
      pairCount,
      shoeDetails,
      selectedAddOns,
      addOnsTotal,
      deliveryFee: deliveryFee,
      discount: totalDiscount,
      isPriorityCustomer,
      totalPrice: grandTotal,
      status: 'menunggu_konfirmasi',
      paymentStatus: 'belum_bayar',
      statusHistory: [
        {
          status: 'menunggu_konfirmasi',
          timestamp: new Date().toISOString(),
          note: deliveryMethod === 'pickup'
            ? `Pendaftaran pesanan diterima dengan permintaan antar-jemput kurir (${selectedZone.name}). Menunggu konfirmasi admin.`
            : 'Pendaftaran pesanan diterima. Menunggu verifikasi admin.'
        }
      ],
      isReadByAdmin: false
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onOrderCreated(newOrder);
    }, 400);
  };

  return (
    <div id="form-cuci-sepatu" className="max-w-4xl mx-auto space-y-10 scroll-mt-24">
      {/* Header Form */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-white text-slate-800 border border-slate-200 text-xs font-bold shadow-sm">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-100">
            <img 
              src="/logo.jpg" 
              alt="Logo Shoecare Manokwari" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="uppercase tracking-wider">Formulir Pendaftaran Cuci Sepatu</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Formulir Pemesanan & Pendaftaran
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          Silakan isi detail sepatu dan data kontak Anda di bawah ini. Begitu dikirim, pesanan langsung masuk ke sistem admin toko untuk segera diproses.
        </p>

        {/* Step Progression Pills */}
        <div className="pt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-semibold text-slate-500 overflow-x-auto pb-1">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white flex items-center space-x-1 shrink-0">
            <span>1. Paket</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1 shrink-0">
            <span>2. Data Sepatu</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1 shrink-0">
            <span>3. Add-Ons</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1 shrink-0">
            <span>4. Kontak Pemesan</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1 shrink-0">
            <span>5. Selesai</span>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* STEP 1: PILIH PAKET LAYANAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              1
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Pilih Jenis Layanan Cuci</h3>
              <p className="text-xs text-slate-500">Pilih salah satu paket perawatan untuk sepatu Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SERVICES.map((srv) => {
              const isSelected = selectedService === srv.id;
              return (
                <div
                  key={srv.id}
                  id={`radio-service-${srv.id}`}
                  onClick={() => setSelectedService(srv.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.01] ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Package Illustration (Mini) */}
                    {srv.imageUrl && (
                      <div className="w-full h-20 mb-2 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/70 flex items-center justify-center p-1">
                        <img 
                          src={srv.imageUrl} 
                          alt={srv.name} 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{srv.duration}</span>
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm">{srv.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{srv.description}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-base font-black text-slate-900">
                    {formatRupiah(srv.price)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 2: DETAIL SEPATU & JUMLAH */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Data & Jumlah Sepatu</h3>
                <p className="text-xs text-slate-500">Tentukan jumlah pasang dan informasi model sepatu</p>
              </div>
            </div>

            {/* Tactile Pair Counter */}
            <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 w-fit">
              <span className="text-xs font-bold text-slate-700">Jumlah Pasang:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-decrement-pair"
                  onClick={() => handlePairCountChange(pairCount - 1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 font-black text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                  disabled={pairCount <= 1}
                >
                  -
                </button>
                <span className="text-sm font-black text-slate-900 w-6 text-center">{pairCount}</span>
                <button
                  type="button"
                  id="btn-increment-pair"
                  onClick={() => handlePairCountChange(pairCount + 1)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-100 font-black text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                  disabled={pairCount >= 10}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Shoe inputs list */}
          <div className="space-y-4">
            {shoeDetails.map((shoe, index) => (
              <div 
                key={index}
                className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-xs">
                      Sepatu #{index + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {shoe.brandModel || 'Belum diisi'}
                    </span>
                  </div>
                  {pairCount > 1 && (
                    <button
                      type="button"
                      onClick={() => handlePairCountChange(pairCount - 1)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Pasang Ini</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Merk & Model Sepatu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`input-shoe-brand-${index}`}
                      placeholder="Misal: Nike Air Force 1 / Vans Old Skool"
                      value={shoe.brandModel}
                      onChange={(e) => updateShoeDetail(index, 'brandModel', e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipe / Bahan Sepatu
                    </label>
                    <select
                      id={`select-shoe-type-${index}`}
                      value={shoe.shoeType}
                      onChange={(e) => updateShoeDetail(index, 'shoeType', e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                    >
                      {SHOE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Warna Sepatu
                    </label>
                    <input
                      type="text"
                      id={`input-shoe-color-${index}`}
                      placeholder="Misal: Triple White / Hitam Putih"
                      value={shoe.color}
                      onChange={(e) => updateShoeDetail(index, 'color', e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Catatan Kondisi / Noda Khusus (Opsional)
                    </label>
                    <input
                      type="text"
                      id={`input-shoe-notes-${index}`}
                      placeholder="Contoh: noda kecap di kain samping, sol agak kuning"
                      value={shoe.conditionNotes}
                      onChange={(e) => updateShoeDetail(index, 'conditionNotes', e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Foto Kondisi Sepatu (Opsional)
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Unggah Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                      {shoe.photoUrl ? (
                        <div className="relative group">
                          <img 
                            src={shoe.photoUrl} 
                            alt="Preview sepatu" 
                            className="w-11 h-11 object-cover rounded-xl border border-slate-300 shadow-xs" 
                          />
                          <button
                            type="button"
                            onClick={() => updateShoeDetail(index, 'photoUrl', '')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 text-xs shadow-md hover:bg-rose-700 cursor-pointer"
                            title="Hapus foto"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Belum ada foto</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 3: PERAWATAN TAMBAHAN (ADD-ONS) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Perawatan Tambahan (Add-Ons)</h3>
                <p className="text-xs text-slate-500">Opsional — centang jika sepatu membutuhkan perlindungan ekstra</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">Per pasang sepatu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ADD_ONS.map((addon) => {
              const isChecked = selectedAddOns.includes(addon.id);
              const isSuedeAddon = addon.id === 'suede_care';
              const isRelevantSuede = isSuedeAddon && shoeDetails.some(s => s.shoeType.toLowerCase().includes('suede'));
              const isRelevantLeather = addon.id === 'leather_balm' && shoeDetails.some(s => s.shoeType.toLowerCase().includes('leather'));

              return (
                <div
                  key={addon.id}
                  id={`addon-${addon.id}`}
                  onClick={() => toggleAddOn(addon.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 hover:scale-[1.005] ${
                    isChecked
                      ? isSuedeAddon
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-400/40'
                        : 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : isRelevantSuede
                        ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className={`mt-1 h-4 w-4 rounded cursor-pointer ${
                      isSuedeAddon
                        ? 'text-amber-600 focus:ring-amber-500 border-amber-300'
                        : 'text-emerald-600 focus:ring-emerald-500 border-slate-300'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{addon.name}</span>
                        {isRelevantSuede && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                            ⭐ Cocok Bahan Suede
                          </span>
                        )}
                        {isRelevantLeather && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                            ⭐ Cocok Bahan Kulit
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-black ${isSuedeAddon ? 'text-amber-700' : 'text-emerald-700'}`}>
                        +{formatRupiah(addon.price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{addon.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 4: METODE PENGIRIMAN & LOKASI ANTAR-JEMPUT */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                4
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Metode Pengiriman & Antar-Jemput</h3>
                <p className="text-xs text-slate-500">Pilih antar sendiri ke toko atau kurir kami yang jemput ke rumah Anda</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hidden sm:inline">
              Wilayah Manokwari
            </span>
          </div>

          {/* Toggle: Drop-off vs Antar-Jemput Kurir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Opsi 1: Drop-off Outlet */}
            <div
              onClick={() => setDeliveryMethod('dropoff')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                deliveryMethod === 'dropoff'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${deliveryMethod === 'dropoff' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Store className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Antar Sendiri ke Toko</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">GRATIS</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Bawa sepatu langsung ke workshop Shoecare Manokwari di Sanggeng / Pusat Kota.
                </p>
              </div>
            </div>

            {/* Opsi 2: Layanan Antar-Jemput Kurir */}
            <div
              onClick={() => setDeliveryMethod('pickup')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                deliveryMethod === 'pickup'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${deliveryMethod === 'pickup' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Layanan Antar-Jemput</span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Praktis</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kurir kami menjemput dan mengantar sepatu langsung ke alamat Anda di Manokwari.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-form Antar-Jemput Lokasi */}
          {deliveryMethod === 'pickup' && (
            <div className="space-y-5 pt-3 border-t border-slate-100 animate-fade-in">
              {/* 1. Pilihan Tipe Perjalanan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Skema Layanan Kurir:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { id: 'pp', label: 'Antar-Jemput (Bolak-Balik)', badge: 'Paling Diminati', desc: 'Jemput kotor + Antar bersih' },
                    { id: 'jemput_saja', label: 'Jemput Saja', badge: '1x Jalan', desc: 'Jemput di rumah, ambil di toko' },
                    { id: 'antar_saja', label: 'Antar Saja', badge: '1x Jalan', desc: 'Taruh di toko, kami antar pulang' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPickupTripType(t.id as DeliveryTripType)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        pickupTripType === t.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{t.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-normal">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Tombol Deteksi Lokasi GPS Cepat */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <LocateFixed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Deteksi Lokasi GPS Otomatis</span>
                    <span className="text-[11px] text-slate-500">Hitung jarak presisi (KM) dari workshop kami di Sanggeng</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocatingGps}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>{isLocatingGps ? 'Mendeteksi GPS...' : 'Gunakan Lokasi Saya (GPS)'}</span>
                </button>
              </div>

              {gpsSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{gpsSuccessMsg}</span>
                </div>
              )}

              {/* 3. Pilihan Zona Wilayah di Manokwari */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Wilayah / Zona Penjemputan di Manokwari:</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Tarif {pickupTripType === 'pp' ? 'Bolak-Balik (PP)' : '1x Jalan'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MANOKWARI_DELIVERY_ZONES.map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const zonePrice = pickupTripType === 'pp' ? zone.priceRoundTrip : zone.priceOneWay;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setPickupDistanceKm(zone.distanceEstimateKm);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{zone.name}</span>
                            <span className="text-xs font-black text-emerald-700 font-mono">
                              {formatRupiah(zonePrice)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {zone.coverage.join(', ')}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Radius ~{zone.distanceEstimateKm} km</span>
                          <span className={isSelected ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            {isSelected ? '✓ Terpilih' : 'Pilih Zona'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Detail Alamat Lengkap & Patokan Rumah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alamat Lengkap Penjemputan di Manokwari</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Contoh: Jl. Merdeka No. 12, Sanggeng, dekat Pasar Tingkat, RT 02 / RW 01"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                    required={deliveryMethod === 'pickup'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Patokan / Ciri Rumah (Memudahkan Kurir)
                  </label>
                  <input
                    type="text"
                    value={pickupBenchmark}
                    onChange={(e) => setPickupBenchmark(e.target.value)}
                    placeholder="Contoh: Rumah cat hijau, samping Kios Mama Maria"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Waktu Penjemputan yang Diinginkan</span>
                  </label>
                  <select
                    value={pickupTimeSlot}
                    onChange={(e) => setPickupTimeSlot(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.icon} {slot.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Catatan Khusus untuk Kurir (Opsional)
                  </label>
                  <input
                    type="text"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="Contoh: Mohon hubungi WhatsApp sebelum tiba, ada anjing di halaman"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 5: INFORMASI KONTAK PEMESAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              5
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Informasi Kontak Pemesan</h3>
              <p className="text-xs text-slate-500">Digunakan oleh admin untuk konfirmasi pengerjaan sepatu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Lengkap Anda</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-customer-name"
                value={customerName}
                onChange={(e) => {
                  const name = e.target.value;
                  setCustomerName(name);
                }}
                placeholder="Contoh: Budi Santoso"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                required
                autoComplete="off"
              />
              {/* Custom Suggestions Dropdown */}
              {customerName.length >= 2 && !existingCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase()) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {Array.from(new Map(existingCustomers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).map(item => [item.name, item])).values()).map((customer, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomerName(customer.name);
                        setCustomerPhone(customer.phone);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                    >
                      <span className="font-bold text-slate-800">{customer.name}</span>
                      <span className="text-xs text-slate-500">{customer.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Nomor WhatsApp (Aktif)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="input-customer-phone"
                value={customerPhone}
                onChange={(e) => {
                  const phone = e.target.value;
                  setCustomerPhone(phone);
                }}
                placeholder="Contoh: 081234567890"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                required
                autoComplete="off"
              />
              {/* Custom Suggestions Dropdown for Phone */}
              {customerPhone.length >= 4 && !existingCustomers.find(c => c.phone === customerPhone) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {Array.from(new Map(existingCustomers.filter(c => c.phone.includes(customerPhone)).map(item => [item.phone, item])).values()).map((customer, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomerName(customer.name);
                        setCustomerPhone(customer.phone);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                    >
                      <span className="font-bold text-slate-800">{customer.name}</span>
                      <span className="text-xs text-slate-500">{customer.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[11px] text-slate-500 mt-1 block">
                Pemberitahuan progres cuci akan dikirimkan langsung ke nomor ini.
              </span>
            </div>
          </div>
        </div>

        {/* RINGKASAN BIAYA & SUBMIT - LIVE RECEIPT CARD */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-9 space-y-6 shadow-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <ReceiptText className="w-4 h-4" />
                <span>Rincian Tagihan Cuci Sepatu</span>
              </div>
              <h3 className="text-xl font-black text-white">Ringkasan Biaya Pemesanan</h3>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">Transparan & Tanpa Biaya Tersembunyi</span>
          </div>

          {/* Priority Customer VIP Badge Banner */}
          {isPriorityCustomer && (
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 rounded-2xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-amber-300 flex items-center space-x-1.5">
                    <span>Pelanggan Prioritas (VIP)</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">Aktif</span>
                  </div>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Total riwayat cuci Anda telah mencapai <strong>{formatRupiah(historicalTotalSpent)}</strong> (≥ Rp 1.000.000).
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl whitespace-nowrap shadow-sm">
                Hemat Rp 100.000
              </span>
            </div>
          )}

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <div>
                <span className="font-semibold text-white">{currentServiceObj.name}</span>
                <span className="text-xs text-slate-400 block">{pairCount} Pasang @ {formatRupiah(serviceBasePrice)}</span>
              </div>
              <span className="font-bold text-white text-base">{formatRupiah(serviceSubtotal)}</span>
            </div>

            {selectedAddOns.length > 0 && (
              <div className="flex justify-between items-center text-slate-300">
                <div>
                  <span className="font-semibold text-white">Perawatan Tambahan</span>
                  <span className="text-xs text-slate-400 block">{selectedAddOns.length} jenis x {pairCount} pasang</span>
                </div>
                <span className="font-bold text-white text-base">+{formatRupiah(addOnsTotal)}</span>
              </div>
            )}

            {deliveryMethod === 'pickup' && (
              <div className="flex justify-between items-center text-slate-300">
                <div>
                  <span className="font-semibold text-white flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Ongkos Antar-Jemput ({pickupTripType === 'pp' ? 'Bolak-Balik / PP' : pickupTripType === 'jemput_saja' ? 'Jemput Saja' : 'Antar Saja'})</span>
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {selectedZone.name} {pickupDistanceKm ? `(Radius ~${pickupDistanceKm} km)` : ''}
                  </span>
                </div>
                <span className="font-bold text-emerald-400 text-base">+{formatRupiah(deliveryFee)}</span>
              </div>
            )}

            {isPriorityCustomer && (
              <div className="flex justify-between items-center text-amber-400 font-bold pt-2 border-t border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Potongan Pelanggan Prioritas (VIP)</span>
                </div>
                <span className="text-base text-amber-300">- {formatRupiah(priorityDiscount)}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Yang Perlu Dibayar</span>
                <p className="text-xs text-emerald-400 font-medium">Pembayaran dapat dilakukan tunai atau transfer QRIS saat serah terima</p>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>

          {/* Automatic Admin Notification Notice */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center space-x-3.5 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-relaxed">
              Begitu Anda klik tombol di bawah, sistem Shoecare Manokwari langsung mengirim notifikasi instan ke dashboard admin toko agar tim staf kami segera memproses sepatu Anda.
            </span>
          </div>

          <button
            type="submit"
            id="btn-submit-order"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Memproses Pendaftaran...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>Kirim & Daftarkan Cuci Sepatu Sekarang</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
