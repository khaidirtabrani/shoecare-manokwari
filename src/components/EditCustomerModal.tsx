import React, { useState } from 'react';
import { CustomerOrder, ShoeItemDetail, PaymentStatus } from '../types';
import { formatRupiah } from '../utils/storage';
import { 
  X, 
  Save, 
  User, 
  Phone, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  Camera,
  Eye,
  Truck,
  MapPin,
  Store
} from 'lucide-react';
import { MANOKWARI_DELIVERY_ZONES } from '../data/deliveryZones';

interface EditCustomerModalProps {
  order: CustomerOrder;
  onClose: () => void;
  onSave: (orderId: string, updatedFields: Partial<CustomerOrder>) => Promise<void> | void;
}

const SHOE_TYPES = [
  'Sneakers / Casual',
  'Canvas / Converse / Vans',
  'Kulit Asli / Formal',
  'Suede / Nubuck',
  'Olahraga / Running',
  'Boots / Gunung',
  'Flat Shoes / Heels',
  'Sandal / Slides'
];

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  order,
  onClose,
  onSave
}) => {
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [totalPrice, setTotalPrice] = useState<number>(order.totalPrice || 0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus || 'belum_bayar');

  // Delivery states
  const [deliveryMethod, setDeliveryMethod] = useState<'dropoff' | 'pickup'>(order.deliveryMethod || 'dropoff');
  const [pickupAddress, setPickupAddress] = useState(order.pickupAddress || '');
  const [pickupZone, setPickupZone] = useState(order.pickupZone || '');
  const [pickupBenchmark, setPickupBenchmark] = useState(order.pickupBenchmark || '');
  const [deliveryFee, setDeliveryFee] = useState<number>(order.deliveryFee || 0);

  // Shoes detail list
  const [shoeDetails, setShoeDetails] = useState<ShoeItemDetail[]>(
    order.shoeDetails && order.shoeDetails.length > 0 
      ? JSON.parse(JSON.stringify(order.shoeDetails)) 
      : [{ brandModel: '', shoeType: 'Sneakers / Casual', color: '', conditionNotes: '' }]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddShoe = () => {
    setShoeDetails([
      ...shoeDetails,
      { brandModel: '', shoeType: 'Sneakers / Casual', color: '', conditionNotes: '' }
    ]);
  };

  const handleRemoveShoe = (index: number) => {
    if (shoeDetails.length <= 1) {
      setErrorMsg('Minimal harus ada 1 detail sepatu.');
      return;
    }
    const updated = shoeDetails.filter((_, idx) => idx !== index);
    setShoeDetails(updated);
  };

  const handleShoeChange = (index: number, field: keyof ShoeItemDetail, val: string) => {
    const updated = [...shoeDetails];
    updated[index] = { ...updated[index], [field]: val };
    setShoeDetails(updated);
  };

  const handleUploadPhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            handleShoeChange(index, 'photoUrl', dataUrl);
          } else {
            handleShoeChange(index, 'photoUrl', reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Nama pelanggan wajib diisi.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMsg('Nomor WhatsApp pelanggan wajib diisi.');
      return;
    }

    setIsSaving(true);

    try {
      const updatedFields: Partial<CustomerOrder> = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shoeDetails,
        pairCount: shoeDetails.length,
        adminNotes: adminNotes.trim(),
        totalPrice: Number(totalPrice) || 0,
        paymentStatus,
        deliveryMethod,
        pickupAddress: deliveryMethod === 'pickup' ? pickupAddress.trim() : undefined,
        pickupZone: deliveryMethod === 'pickup' ? pickupZone.trim() : undefined,
        pickupBenchmark: deliveryMethod === 'pickup' ? pickupBenchmark.trim() : undefined,
        deliveryFee: deliveryMethod === 'pickup' ? Number(deliveryFee) || 0 : 0
      };

      await onSave(order.id, updatedFields);
      onClose();
    } catch (err) {
      console.error('Failed to save customer data edit:', err);
      setErrorMsg('Gagal menyimpan perubahan ke database cloud. Coba periksa koneksi internet Anda.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="modal-edit-customer"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-white text-base sm:text-lg">Edit Data Pelanggan & Pesanan</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  #{order.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbarui identitas pelanggan, alamat antar-jemput, spesifikasi sepatu, dan tarif.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer Contact Info */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Identitas Pelanggan</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 082239096626"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Metode Pengiriman & Lokasi Antar-Jemput */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Metode Pengiriman & Antar-Jemput</h4>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('dropoff')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    deliveryMethod === 'dropoff'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Drop-off Toko
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Antar-Jemput Kurir
                </button>
              </div>
            </div>

            {deliveryMethod === 'pickup' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Zona Wilayah Manokwari
                    </label>
                    <select
                      value={pickupZone}
                      onChange={(e) => setPickupZone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs cursor-pointer"
                    >
                      <option value="">Pilih / Ketik Zona</option>
                      {MANOKWARI_DELIVERY_ZONES.map((z) => (
                        <option key={z.id} value={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Biaya Ongkir Antar-Jemput (Rp)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                      placeholder="15000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap Penjemputan di Manokwari
                  </label>
                  <textarea
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Contoh: Jl. Merdeka No. 12, Sanggeng, dekat Pasar Tingkat"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patokan / Ciri Rumah
                  </label>
                  <input
                    type="text"
                    value={pickupBenchmark}
                    onChange={(e) => setPickupBenchmark(e.target.value)}
                    placeholder="Contoh: Rumah cat hijau, samping kios Mama Maria"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Shoe Details List */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Detail Sepatu ({shoeDetails.length} Pasang)
                </h4>
              </div>

              <button
                type="button"
                onClick={handleAddShoe}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sepatu</span>
              </button>
            </div>

            <div className="space-y-3">
              {shoeDetails.map((shoe, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                      Sepatu #{idx + 1}
                    </span>

                    {shoeDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShoe(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus baris sepatu ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Merk / Model</label>
                      <input
                        type="text"
                        value={shoe.brandModel}
                        onChange={(e) => handleShoeChange(idx, 'brandModel', e.target.value)}
                        placeholder="Contoh: Nike Air Jordan 1"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tipe Bahan</label>
                      <select
                        value={shoe.shoeType}
                        onChange={(e) => handleShoeChange(idx, 'shoeType', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
                      >
                        {SHOE_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Warna Sepatu</label>
                      <input
                        type="text"
                        value={shoe.color}
                        onChange={(e) => handleShoeChange(idx, 'color', e.target.value)}
                        placeholder="Contoh: Putih / Navy"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Catatan Noda / Kerusakan Awal</label>
                    <input
                      type="text"
                      value={shoe.conditionNotes || ''}
                      onChange={(e) => handleShoeChange(idx, 'conditionNotes', e.target.value)}
                      placeholder="Contoh: Ada noda lumpur tebal di toebox samping kiri"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  {/* Foto Sepatu Preview & Upload */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {shoe.photoUrl ? (
                        <div className="relative group/p">
                          <img 
                            src={shoe.photoUrl} 
                            alt={shoe.brandModel || 'Foto Sepatu'} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs" 
                          />
                          <button
                            type="button"
                            onClick={() => handleShoeChange(idx, 'photoUrl', '')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow cursor-pointer hover:bg-rose-700"
                            title="Hapus foto"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                          <Camera className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-slate-600 block">
                          {shoe.photoUrl ? 'Foto Terpasang' : 'Belum Ada Foto'}
                        </span>
                        <label className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer transition-colors mt-0.5 border border-slate-200">
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>{shoe.photoUrl ? 'Ganti Foto' : 'Unggah / Ambil Foto'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleUploadPhoto(idx, e)} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Admin Internal Note, Payment Status & Total Price */}
          <div className="space-y-3.5">
            {/* Internal Staff Notes */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Internal Staf / Outlet</span>
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tulis catatan khusus untuk tim cuci, instruksi khusus pelanggan, atau riwayat penyerahan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Payment Status & Final Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Status Pembayaran */}
              <div className="p-3.5 rounded-2xl border bg-slate-50 border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Status Pembayaran</span>
                  </label>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    paymentStatus === 'sudah_bayar'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {paymentStatus === 'sudah_bayar' ? 'Lunas' : 'Belum Bayar'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('belum_bayar')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                      paymentStatus === 'belum_bayar'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Belum Bayar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('sudah_bayar')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
                      paymentStatus === 'sudah_bayar'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Lunas</span>
                  </button>
                </div>
              </div>

              {/* Total Biaya Akhir (Rp) */}
              <div className="space-y-1 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                <label className="block font-bold text-emerald-900 text-xs">
                  Total Biaya Akhir (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono font-black text-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Perkiraan: {formatRupiah(totalPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke Cloud...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
