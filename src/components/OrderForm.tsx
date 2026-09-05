import React, { useState, useEffect } from 'react';
import { SERVICES, ADD_ONS, SHOE_TYPES } from '../data/services';
import { 
  MAXIM_MANOKWARI_ZONES, 
  MAXIM_MANOKWARI_CONFIG, 
  calculateMaximFee,
  MaximManokwariZone 
} from '../data/maximZones';
import { ServiceTier, CustomerOrder, DeliveryMethod, ShoeItemDetail } from '../types';
import { formatRupiah, generateOrderId } from '../utils/storage';
import { 
  Sparkles, 
  MapPin, 
  Truck, 
  Store, 
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
  Bike,
  Car,
  Navigation,
  Compass,
  ArrowRightLeft,
  Info
} from 'lucide-react';

interface OrderFormProps {
  initialServiceId?: ServiceTier;
  pickupFee: number;
  onOrderCreated: (order: CustomerOrder) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialServiceId = 'reguler',
  pickupFee,
  onOrderCreated
}) => {
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceTier>(initialServiceId);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('dropoff');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  // Maxim Transportasi Kota Manokwari states
  const [selectedMaximZone, setSelectedMaximZone] = useState<string>('sanggeng_padarni');
  const [maximVehicle, setMaximVehicle] = useState<'motor' | 'mobil'>('motor');
  const [maximTripType, setMaximTripType] = useState<'pp' | 'sekali_jalan'>('pp');
  const [customKm, setCustomKm] = useState<number>(5);
  
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
        updateShoeDetail(index, 'photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Price calculations
  const currentServiceObj = SERVICES.find(s => s.id === selectedService) || SERVICES[0];
  const serviceBasePrice = currentServiceObj.price;
  const serviceSubtotal = serviceBasePrice * pairCount;
  
  const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
    const item = ADD_ONS.find(a => a.id === addonId);
    return sum + (item ? item.price * pairCount : 0);
  }, 0);

  // Calculate Maxim Delivery Fee based on authentic Manokwari transportation data
  const maximFareCalc = calculateMaximFee({
    zoneId: selectedMaximZone,
    vehicle: maximVehicle,
    tripType: maximTripType,
    customKm
  });

  const finalDeliveryFee = deliveryMethod === 'pickup' ? maximFareCalc.totalDeliveryFee : 0;
  const grandTotal = serviceSubtotal + addOnsTotal + finalDeliveryFee;

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
      setErrorMessage('Untuk metode Antar-Jemput Kurir Maxim, silakan masukkan Alamat Lengkap Penjemputan di Manokwari.');
      return;
    }

    setIsSubmitting(true);

    const orderId = generateOrderId();
    const newOrder: CustomerOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod,
      pickupAddress: deliveryMethod === 'pickup' ? pickupAddress.trim() : undefined,
      pickupNotes: deliveryMethod === 'pickup' ? pickupNotes.trim() : undefined,
      pickupZone: deliveryMethod === 'pickup' ? maximFareCalc.zoneName : undefined,
      maximVehicle: deliveryMethod === 'pickup' ? maximVehicle : undefined,
      maximTripType: deliveryMethod === 'pickup' ? maximTripType : undefined,
      pickupDistanceKm: deliveryMethod === 'pickup' ? maximFareCalc.distanceKm : undefined,
      serviceId: selectedService,
      serviceName: currentServiceObj.name,
      servicePrice: currentServiceObj.price,
      pairCount,
      shoeDetails,
      selectedAddOns,
      addOnsTotal,
      deliveryFee: finalDeliveryFee,
      totalPrice: grandTotal,
      status: 'menunggu_konfirmasi',
      paymentStatus: 'belum_bayar',
      statusHistory: [
        {
          status: 'menunggu_konfirmasi',
          timestamp: new Date().toISOString(),
          note: 'Pendaftaran pesanan diterima. Menunggu verifikasi admin.'
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
              src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
              alt="Logo" 
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
            <span>4. Pengantaran</span>
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
                      <div className="w-full h-20 mb-2 rounded-xl overflow-hidden border border-slate-100 bg-white">
                        <img 
                          src={srv.imageUrl} 
                          alt={srv.name} 
                          className="w-full h-full object-cover"
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
              return (
                <div
                  key={addon.id}
                  id={`addon-${addon.id}`}
                  onClick={() => toggleAddOn(addon.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 hover:scale-[1.005] ${
                    isChecked
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{addon.name}</span>
                      <span className="text-xs font-black text-emerald-700">+{formatRupiah(addon.price)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{addon.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 4: METODE PENYERAHAN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              4
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Metode Penyerahan Sepatu</h3>
              <p className="text-xs text-slate-500">Pilih antar sendiri ke outlet atau dijemput kurir kami</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              id="delivery-dropoff"
              onClick={() => setDeliveryMethod('dropoff')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 hover:scale-[1.005] ${
                deliveryMethod === 'dropoff'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="p-3 rounded-xl bg-slate-100 text-slate-800 mt-0.5">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-sm">Antar Sendiri ke Outlet</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Gratis</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Anda menyerahkan dan mengambil kembali sepatu langsung di outlet Shoecare Manokwari.
                </p>
              </div>
            </div>

            <div
              id="delivery-pickup"
              onClick={() => setDeliveryMethod('pickup')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 hover:scale-[1.005] ${
                deliveryMethod === 'pickup'
                  ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="p-3 rounded-xl bg-[#FEE300] text-slate-900 mt-0.5 shadow-xs">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-extrabold text-slate-900 text-sm">Antar-Jemput Kurir Maxim</span>
                  <span className="text-[10px] bg-[#FEE300] text-slate-950 px-2 py-0.5 rounded-full font-black border border-amber-300">
                    Tarif Maxim Manokwari
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Kurir Maxim menjemput dan mengantar kembali sepatu Anda di seluruh wilayah Kota Manokwari.
                </p>
                {deliveryMethod === 'pickup' && (
                  <p className="text-xs font-black text-amber-700 mt-1.5">
                    Biaya Kurir: {formatRupiah(maximFareCalc.totalDeliveryFee)} ({maximTripType === 'pp' ? 'PP Bolak-Balik' : '1x Jalan'})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Conditional Pickup Address & Maxim Manokwari Calculator */}
          {deliveryMethod === 'pickup' && (
            <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-amber-50/40 border-2 border-amber-200 space-y-5">
              {/* Maxim Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-amber-200/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FEE300] flex items-center justify-center font-black text-slate-900 text-xs shadow-xs border border-amber-400">
                    M
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                        Kalkulator Ongkir Maxim Manokwari
                      </h4>
                      <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded">
                        Papua Barat
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Perhitungan otomatis mengikuti tarif resmi Maxim Bike & Car Delivery di Kota Manokwari
                    </p>
                  </div>
                </div>
              </div>

              {/* Step A: Pilihan Armada Maxim */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  1. Pilih Jenis Armada Maxim
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMaximVehicle('motor')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      maximVehicle === 'motor'
                        ? 'border-amber-500 bg-white ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900 mt-0.5">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">Maxim Bike (Motor)</span>
                        <span className="text-[11px] font-black text-emerald-700">Mulai Rp 8.000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Dasar 0-2 km Rp 8.000 (+Rp 2.500/km berikutnya). Ideal untuk 1-4 pasang sepatu.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaximVehicle('mobil')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      maximVehicle === 'mobil'
                        ? 'border-amber-500 bg-white ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-900 mt-0.5">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">Maxim Car (Mobil)</span>
                        <span className="text-[11px] font-black text-emerald-700">Mulai Rp 12.000</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Dasar 0-3 km Rp 12.000 (+Rp 4.000/km berikutnya). Muat banyak pasang & aman saat cuaca hujan.
                      </p>
                    </div>
                  </button>
                </div>

                {pairCount > 4 && maximVehicle === 'motor' && (
                  <div className="mt-2 flex items-center space-x-2 text-[11px] text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Untuk {pairCount} pasang sepatu, disarankan menggunakan Maxim Car (Mobil) agar lebih leluasa.</span>
                  </div>
                )}
              </div>

              {/* Step B: Skema Perjalanan Trip */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  2. Skema Antar-Jemput
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMaximTripType('pp')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-2.5 ${
                      maximTripType === 'pp'
                        ? 'border-amber-500 bg-white ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800 mt-0.5">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900">Bolak-Balik PP (2x Perjalanan)</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Rekomendasi</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Sepatu dijemput kurir saat kotor, lalu diantar kembali setelah selesai dicuci.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaximTripType('sekali_jalan')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-2.5 ${
                      maximTripType === 'sekali_jalan'
                        ? 'border-amber-500 bg-white ring-2 ring-amber-400 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-slate-200 text-slate-700 mt-0.5">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Sekali Jalan (1x Perjalanan)</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Hanya jemput saja (nanti ambil sendiri), atau antar saja saat selesai.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step C: Pilihan Wilayah / Zona di Manokwari */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>3. Wilayah / Lokasi Penjemputan di Kota Manokwari</span>
                  <span className="text-[10px] text-slate-500 font-normal">Pilih kelurahan/kawasan terdekat</span>
                </label>

                <div className="space-y-2">
                  <select
                    id="select-maxim-zone"
                    value={selectedMaximZone}
                    onChange={(e) => setSelectedMaximZone(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium shadow-xs"
                  >
                    {MAXIM_MANOKWARI_ZONES.map((zone) => {
                      const fare = maximVehicle === 'motor' ? zone.motorFeeSingle : zone.carFeeSingle;
                      const calculatedTotal = fare * (maximTripType === 'pp' ? 2 : 1);
                      return (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} • {zone.district} ({formatRupiah(calculatedTotal)})
                        </option>
                      );
                    })}
                  </select>

                  {/* Zone description / landmarks */}
                  {selectedMaximZone !== 'custom_km' && (
                    <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">Cakupan Patokan: </span>
                        <span>
                          {MAXIM_MANOKWARI_ZONES.find(z => z.id === selectedMaximZone)?.landmarks}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Custom KM Slider if selected */}
                  {selectedMaximZone === 'custom_km' && (
                    <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Estimasi Jarak dari Outlet:</span>
                        <span className="text-amber-700 font-black text-sm">{customKm} KM</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="0.5"
                        value={customKm}
                        onChange={(e) => setCustomKm(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>1 KM (Dalam Kota)</span>
                        <span>15 KM (Pinggiran)</span>
                        <span>30 KM (Luar Kota)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Maxim Calculation Summary Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between flex-wrap gap-3 shadow-sm border border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                      Biaya Ongkir Maxim:
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {maximFareCalc.zoneName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Armada: <span className="font-semibold text-white">{maximVehicle === 'motor' ? 'Maxim Motor' : 'Maxim Mobil'}</span> • 
                    Trip: <span className="font-semibold text-white">{maximTripType === 'pp' ? 'PP Bolak-Balik' : '1x Jalan'}</span> • 
                    Jarak: <span className="font-semibold text-white">{maximFareCalc.distanceKm} km</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Total Ongkir Maxim</p>
                  <p className="text-lg font-black text-amber-400">
                    {formatRupiah(maximFareCalc.totalDeliveryFee)}
                  </p>
                </div>
              </div>

              {/* Alamat Lengkap & Catatan */}
              <div className="space-y-3 pt-1 border-t border-amber-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Penjemputan di Manokwari <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="input-pickup-address"
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan (cth: Jl. Trikora Wosi Dalam, RT 02/03 dekat kios Berkah)"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Khusus Penjemputan / Patokan Lokasi
                  </label>
                  <input
                    type="text"
                    id="input-pickup-notes"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="Misal: Siang jam 13.00 WIT, rumah cat biru pagar hitam samping gereja"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 5: INFORMASI KONTAK PELANGGAN */}
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Nama Lengkap Anda</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Nomor WhatsApp (Aktif)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="input-customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs"
                required
              />
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

            <div className="flex justify-between items-center text-slate-300">
              <div>
                <span className="font-semibold text-white">Metode Pengantaran</span>
                <span className="text-xs text-slate-400 block">
                  {deliveryMethod === 'pickup' ? 'Kurir Antar-Jemput Shoecare Manokwari' : 'Antar Mandiri ke Outlet'}
                </span>
              </div>
              <span className="font-bold text-white text-base">
                {finalDeliveryFee > 0 ? `+${formatRupiah(finalDeliveryFee)}` : 'Gratis'}
              </span>
            </div>

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
              Begitu Anda klik tombol di bawah, sistem Shoecare Manokwari langsung mengirim notifikasi instan ke dashboard admin toko agar kurir atau staf kami segera memproses sepatu Anda.
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
