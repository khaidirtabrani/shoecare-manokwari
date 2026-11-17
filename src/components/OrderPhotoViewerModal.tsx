import React, { useState } from 'react';
import { CustomerOrder, ShoeItemDetail } from '../types';
import { formatRupiah, getAddOnLabel } from '../utils/storage';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Download, 
  ExternalLink, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  MessageSquare, 
  Eye,
  Tag,
  Palette,
  Layers,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface OrderPhotoViewerModalProps {
  order: CustomerOrder;
  initialShoeIndex?: number;
  onClose: () => void;
  onUpdateShoePhoto?: (orderId: string, shoeIndex: number, newPhotoUrl: string) => Promise<void> | void;
}

export const OrderPhotoViewerModal: React.FC<OrderPhotoViewerModalProps> = ({
  order,
  initialShoeIndex = 0,
  onClose,
  onUpdateShoePhoto
}) => {
  const [selectedShoeIndex, setSelectedShoeIndex] = useState(
    Math.min(Math.max(0, initialShoeIndex), Math.max(0, (order.shoeDetails?.length || 1) - 1))
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const shoeDetails: ShoeItemDetail[] = order.shoeDetails && order.shoeDetails.length > 0
    ? order.shoeDetails
    : [{ brandModel: 'Sepatu', shoeType: 'Sneakers / Casual', color: '', conditionNotes: '' }];

  const currentShoe = shoeDetails[selectedShoeIndex] || shoeDetails[0];
  const photoUrl = currentShoe.photoUrl;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownloadPhoto = () => {
    if (!photoUrl) return;
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `foto-sepatu-${order.id}-item-${selectedShoeIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleMaxZoom = () => {
    if (!photoUrl) return;
    setZoomLevel(prev => prev > 1 ? 1 : 2.5);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (onUpdateShoePhoto) {
            onUpdateShoePhoto(order.id, selectedShoeIndex, dataUrl);
          }
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = () => {
    if (window.confirm('Hapus foto untuk sepatu ini?')) {
      if (onUpdateShoePhoto) {
        onUpdateShoePhoto(order.id, selectedShoeIndex, '');
      }
    }
  };

  // Build WhatsApp inquiry URL
  const phone = order.customerPhone.replace(/[^0-9]/g, '');
  const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
  const waMsg = encodeURIComponent(
    `Halo Kak ${order.customerName},\n\nKami dari *Shoecare Manokwari* ingin mengonfirmasi terkait fisik sepatu *${currentShoe.brandModel || 'Sepatu'}* pada pesanan *${order.id}*.\n\nCatatan kondisi: "${currentShoe.conditionNotes || 'Normal'}"\n\nApakah ada perhatian khusus yang ingin disampaikan sebelum proses pencucian kami mulai? Terima kasih!`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#121620] border border-[#262d3d] text-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#232838] bg-[#161a26]/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Galeri Foto Sepatu
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#222938] text-amber-300 font-bold border border-[#2d374d]">
                  {order.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pelanggan: <strong className="text-slate-200">{order.customerName}</strong> • {order.pairCount} Pasang Sepatu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#222938] transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Shoe Selector Tabs */}
        {shoeDetails.length > 1 && (
          <div className="flex items-center space-x-2 px-5 sm:px-6 py-2.5 bg-[#0e1117] border-b border-[#232838] overflow-x-auto shrink-0 scrollbar-none">
            {shoeDetails.map((shoe, idx) => {
              const isSelected = selectedShoeIndex === idx;
              const hasPhoto = Boolean(shoe.photoUrl && shoe.photoUrl.trim() !== '');

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedShoeIndex(idx);
                    handleResetZoom();
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-[#181d28] hover:bg-[#202736] text-slate-300 border-[#283244]'
                  }`}
                >
                  <span>Sepatu #{idx + 1}</span>
                  <span className="opacity-80 font-normal truncate max-w-[100px]">
                    {shoe.brandModel || 'Item'}
                  </span>
                  {hasPhoto ? (
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400'}`} title="Ada foto" />
                  ) : (
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                      Kosong
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Photo Viewer Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 bg-[#0b0d13] p-4 sm:p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-[#232838] relative min-h-[350px] sm:min-h-[440px]">
            {/* Top Toolbar Controls */}
            {photoUrl && (
              <div className="w-full flex items-center justify-between z-10 mb-3 bg-[#151924]/80 backdrop-blur-md p-2 rounded-2xl border border-[#232938]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-slate-400 px-2">
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Perbesar"
                    className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2a3347] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Perkecil"
                    className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2a3347] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    title="Putar 90 Derajat"
                    className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2a3347] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset Tampilan"
                    className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2a3347] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                  <button
                    type="button"
                    onClick={handleToggleMaxZoom}
                    title="Perbesar / Zoom Penuh"
                    className="p-1.5 rounded-lg bg-[#202636] hover:bg-[#2a3347] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPhoto}
                    title="Unduh Foto Sepatu"
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Photo Canvas Area */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden rounded-2xl bg-[#08090d] border border-[#1b202c] relative p-3">
              {photoUrl ? (
                <div 
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 select-none overflow-hidden"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={photoUrl}
                    alt={`Foto Sepatu ${currentShoe.brandModel || ''}`}
                    className="max-h-[380px] sm:max-h-[460px] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-all"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-center p-8 max-w-sm space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-[#181d28] border border-[#2a3347] flex items-center justify-center text-slate-500">
                    <ImageIcon className="w-8 h-8 opacity-60" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      Belum Ada Foto Sepatu
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Pelanggan tidak melampirkan foto awal saat pemesanan, atau order ini diinput langsung di kasir outlet.
                    </p>
                  </div>

                  <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto / Unggah Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Navigation Arrows for Multiple Shoes */}
            {shoeDetails.length > 1 && (
              <div className="flex items-center justify-between w-full mt-3 pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  disabled={selectedShoeIndex === 0}
                  onClick={() => {
                    setSelectedShoeIndex(prev => Math.max(0, prev - 1));
                    handleResetZoom();
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#191d29] hover:bg-[#23293a] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-semibold cursor-pointer border border-[#262e40]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sepatu Sebelumnya</span>
                </button>

                <span className="font-mono text-[11px] text-slate-400">
                  {selectedShoeIndex + 1} / {shoeDetails.length}
                </span>

                <button
                  type="button"
                  disabled={selectedShoeIndex === shoeDetails.length - 1}
                  onClick={() => {
                    setSelectedShoeIndex(prev => Math.min(shoeDetails.length - 1, prev + 1));
                    handleResetZoom();
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#191d29] hover:bg-[#23293a] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-semibold cursor-pointer border border-[#262e40]"
                >
                  <span>Sepatu Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Information & Action Panel (5 cols on lg) */}
          <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 bg-[#121620] overflow-y-auto">
            {/* Upload Notification */}
            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Foto sepatu berhasil diperbarui!</span>
              </div>
            )}

            {/* Shoe Specs Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Spesifikasi Fisik Sepatu</span>
                </h4>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Sepatu #{selectedShoeIndex + 1}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#181d28] border border-[#262e40] space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Merk / Model</span>
                  <p className="font-extrabold text-white text-sm sm:text-base mt-0.5">
                    {currentShoe.brandModel || 'Sepatu Casual'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#232838]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Bahan / Jenis</span>
                    </span>
                    <p className="font-semibold text-slate-200 text-xs mt-0.5">
                      {currentShoe.shoeType || 'Sneakers / Casual'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-slate-400" />
                      <span>Warna</span>
                    </span>
                    <p className="font-semibold text-slate-200 text-xs mt-0.5">
                      {currentShoe.color || 'Standar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Condition Notes / Damage Warning Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Catatan Noda & Kerusakan Awal</span>
              </h4>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                    Kondisi Sebelum Cuci
                  </span>
                </div>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                  {currentShoe.conditionNotes ? (
                    `"${currentShoe.conditionNotes}"`
                  ) : (
                    <span className="text-slate-400 italic">Tidak ada catatan noda khusus yang dimasukkan pelanggan.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Service & Order Meta */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Info Paket Layanan</span>
              </h4>

              <div className="p-3.5 rounded-2xl bg-[#181d28] border border-[#262e40] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Layanan:</span>
                  <span className="font-bold text-white">{order.serviceName}</span>
                </div>
                {order.selectedAddOns && order.selectedAddOns.length > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Add-ons:</span>
                    <span className="font-semibold">{order.selectedAddOns.map(getAddOnLabel).join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#232838]">
                  <span className="text-slate-400">Total Biaya:</span>
                  <span className="font-mono font-bold text-amber-400">{formatRupiah(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Quick Admin Actions */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Aksi Cepat Admin
              </h4>

              <div className="space-y-2">
                {/* Upload or Change Photo Button */}
                <label className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-[#1e2433] hover:bg-[#273042] text-slate-200 hover:text-white font-bold text-xs border border-[#2b3547] transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{photoUrl ? 'Ganti / Perbarui Foto Ini' : 'Unggah Foto Sepatu'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* WhatsApp Chat button */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Hubungi Pelanggan via WhatsApp</span>
                </a>

                {/* Delete Photo Button if photo exists */}
                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto Sepatu Ini</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-[#161a26] border-t border-[#232838] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Foto tersimpan aman di sistem Shoecare Manokwari</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#232938] hover:bg-[#2d3547] text-white font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
