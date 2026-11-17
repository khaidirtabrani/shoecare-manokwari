import React, { useState } from 'react';
import { CustomerOrder } from '../types';
import { formatRupiah, buildWhatsAppAdminUrl } from '../utils/storage';
import { CheckCircle2, MessageSquare, Copy, Check, X, Sparkles, Search } from 'lucide-react';

interface OrderSuccessModalProps {
  order: CustomerOrder;
  adminPhone: string;
  onClose: () => void;
  onTrackOrder?: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  adminPhone,
  onClose,
  onTrackOrder
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waUrl = buildWhatsAppAdminUrl(order, adminPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="order-success-modal"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h3>
          <p className="text-sm text-slate-600">
            Terima kasih, Kak <span className="font-semibold text-slate-800">{order.customerName}</span>. Pesanan cuci sepatu Anda telah didaftarkan ke sistem.
          </p>
        </div>

        {/* Order ID Ticket */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor Resi / ID Pesanan</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>

          <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-wider">
            {order.id}
          </div>

          <div className="border-t border-slate-200/80 pt-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between">
              <span>Layanan:</span>
              <span className="font-semibold text-slate-900">{order.serviceName} ({order.pairCount} Pasang)</span>
            </div>
            {order.deliveryMethod === 'pickup' && (
              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-emerald-200">
                <span>🛵 Antar-Jemput Kurir:</span>
                <span className="font-bold truncate max-w-[180px]">{order.pickupZone || 'Wilayah Manokwari'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total Estimasi Biaya:</span>
              <span className="font-bold text-emerald-700">{formatRupiah(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* WhatsApp Direct Dispatch Button */}
          <a
            id="btn-whatsapp-admin"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim Chat WhatsApp ke Admin Sekarang</span>
          </a>

          {onTrackOrder && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.id)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Lacak Progres Cuci Pesanan Ini</span>
            </button>
          )}

          <button
            id="btn-modal-close"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <span>Selesai & Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
