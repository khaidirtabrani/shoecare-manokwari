import React from 'react';
import { CustomerOrder, AdminSettings } from '../types';
import { formatRupiah } from '../utils/storage';
import { Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';

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
                  src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
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
              <p className="text-slate-500">Metode Penyerahan:</p>
              <p className="font-semibold text-slate-900">
                {order.deliveryMethod === 'pickup' 
                  ? `Kurir Maxim (${order.maximVehicle === 'mobil' ? 'Mobil' : 'Motor'})` 
                  : 'Drop-off Outlet'}
              </p>
              {order.deliveryMethod === 'pickup' && order.pickupZone && (
                <p className="text-[10px] text-slate-500 font-medium">{order.pickupZone}</p>
              )}
            </div>
          </div>

          {/* Shoe items list */}
          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Rincian Sepatu ({order.pairCount} Pasang):</p>
            <div className="space-y-1.5">
              {order.shoeDetails.map((shoe, idx) => (
                <div key={idx} className="flex justify-between items-start bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-900">#{idx + 1} {shoe.brandModel || 'Sepatu'}</span>
                    <p className="text-[10px] text-slate-500">{shoe.shoeType} {shoe.color ? `• Warna: ${shoe.color}` : ''}</p>
                    {shoe.conditionNotes && (
                      <p className="text-[10px] text-slate-500 italic">Kondisi: {shoe.conditionNotes}</p>
                    )}
                  </div>
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
                <span>Add-ons ({order.selectedAddOns.join(', ')})</span>
                <span>+{formatRupiah(order.addOnsTotal)}</span>
              </div>
            )}

            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Ongkir Maxim Manokwari ({order.maximVehicle === 'mobil' ? 'Mobil' : 'Motor'}{order.maximTripType === 'pp' ? ' PP' : ''})
                </span>
                <span>+{formatRupiah(order.deliveryFee)}</span>
              </div>
            )}

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
    </div>
  );
};
