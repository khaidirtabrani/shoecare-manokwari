import React, { useState } from 'react';
import { CustomerOrder, AdminSettings } from '../types';
import { formatRupiah, getAddOnLabel } from '../utils/storage';
import { Printer, X, Sparkles, CheckCircle2, Camera, Eye, ZoomIn } from 'lucide-react';

interface InvoiceModalProps {
  order: CustomerOrder;
  settings: AdminSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  settings,
  onClose
}) => {
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6 max-h-[95vh] overflow-y-auto print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Controls - Hidden when printing */}
        <div className="flex items-center justify-between print:hidden border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nota Struk Digital</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="space-y-6 text-slate-800 text-xs">
          
          {/* Header Store */}
          <div className="text-center space-y-2 border-b border-dashed border-slate-300 pb-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm">
                <img 
                  src="/logo.jpg" 
                  alt="Logo Shoecare Manokwari" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-slate-900 font-black text-lg uppercase tracking-tight">{settings.storeName}</span>
            </div>
            <p className="text-slate-500 text-[11px]">{settings.storeAddress}</p>
            <p className="text-slate-500 text-[11px]">WhatsApp CS: +{settings.adminPhone}</p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-dashed border-slate-300 text-[11px]">
            <div>
              <p className="text-slate-500">No. Nota:</p>
              <p className="font-mono font-bold text-slate-900 text-xs">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Tanggal Pesan:</p>
              <p className="font-medium text-slate-900">
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Pelanggan:</p>
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-slate-600">{order.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Status Pembayaran:</p>
              <p className="font-semibold text-slate-900 capitalize">
                {order.paymentStatus === 'sudah_bayar' ? 'Lunas' : 'Belum Bayar'}
              </p>
            </div>
            {order.deliveryMethod === 'pickup' && order.pickupAddress && (
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <p className="text-slate-500">Layanan Pengiriman:</p>
                <p className="font-bold text-slate-900">
                  Antar-Jemput Kurir ({order.pickupZone || 'Manokwari'})
                </p>
                <p className="text-slate-600 text-[10px]">
                  Alamat: {order.pickupAddress} {order.pickupBenchmark ? `• Patokan: ${order.pickupBenchmark}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Shoe items list */}
          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Rincian Sepatu ({order.pairCount} Pasang):</p>
            <div className="space-y-1.5">
              {order.shoeDetails.map((shoe, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-3">
                    {shoe.photoUrl ? (
                      <div 
                        onClick={() => setPreviewPhoto({ url: shoe.photoUrl || '', title: `${shoe.brandModel || 'Sepatu'} (Sepatu #${idx + 1})` })}
                        className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 relative group shadow-2xs"
                        title="Klik untuk perbesar foto"
                      >
                        <img 
                          src={shoe.photoUrl} 
                          alt={shoe.brandModel} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                        <Camera className="w-4 h-4 opacity-40" />
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-900 text-xs">#{idx + 1} {shoe.brandModel || 'Sepatu'}</span>
                      <p className="text-[10px] text-slate-500">{shoe.shoeType} {shoe.color ? `• Warna: ${shoe.color}` : ''}</p>
                      {shoe.conditionNotes && (
                        <p className="text-[10px] text-slate-500 italic">Kondisi: {shoe.conditionNotes}</p>
                      )}
                    </div>
                  </div>

                  {shoe.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto({ url: shoe.photoUrl || '', title: `${shoe.brandModel || 'Sepatu'} (Sepatu #${idx + 1})` })}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 print:hidden flex items-center space-x-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Foto</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Table */}
          <div className="space-y-2 pt-2 border-t border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>{order.serviceName} ({order.pairCount}x @ {formatRupiah(order.servicePrice)})</span>
              <span className="font-semibold">{formatRupiah(order.servicePrice * order.pairCount)}</span>
            </div>

            {order.selectedAddOns.length > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Add-ons ({order.selectedAddOns.map(getAddOnLabel).join(', ')})</span>
                <span>+{formatRupiah(order.addOnsTotal)}</span>
              </div>
            )}

            {order.deliveryMethod === 'pickup' && order.deliveryFee && order.deliveryFee > 0 ? (
              <div className="flex justify-between text-slate-700">
                <span>Ongkir Antar-Jemput ({order.pickupZone || 'Manokwari'})</span>
                <span className="font-semibold">+{formatRupiah(order.deliveryFee)}</span>
              </div>
            ) : null}

            {order.discount && order.discount > 0 ? (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Potongan Pelanggan Prioritas (VIP)</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
            ) : null}

            <div className="flex justify-between items-center pt-2 border-t border-slate-300 font-bold text-sm text-slate-900">
              <span>TOTAL PEMBAYARAN:</span>
              <span className="text-emerald-700 text-base">{formatRupiah(order.totalPrice)}</span>
            </div>
            <div className="flex justify-center pt-1">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                order.paymentStatus === 'sudah_bayar'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
              }`}>
                {order.paymentStatus === 'sudah_bayar' ? 'LUNAS / PAID' : 'BELUM BAYAR / UNPAID'}
              </span>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1 text-center">
            <p className="font-semibold text-slate-700">Syarat & Ketentuan Layanan:</p>
            <p>1. Pengambilan sepatu wajib menunjukkan nomor resi nota ini.</p>
            <p>2. Kerusakan akibat material sepatu yang sudah lapuk/rapuh di luar tanggung jawab toko.</p>
            <p>3. Konfirmasi penyelesaian pesanan maksimal 2x24 jam setelah sepatu diterima kembali.</p>
            <p className="pt-2 font-medium text-slate-800">Terima kasih atas kepercayaan Anda merawat sepatu di Shoecare Manokwari!</p>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Shoe Photo */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in print:hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs sm:text-sm">{previewPhoto.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.title} 
                className="w-full h-full object-contain max-h-[60vh]"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Foto kondisi awal sepatu</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
