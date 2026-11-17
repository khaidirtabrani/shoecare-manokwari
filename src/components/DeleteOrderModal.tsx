import React, { useState } from 'react';
import { CustomerOrder } from '../types';
import { formatRupiah } from '../utils/storage';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteOrderModalProps {
  order: CustomerOrder;
  onClose: () => void;
  onConfirmDelete: (orderId: string) => Promise<void> | void;
}

export const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({
  order,
  onClose,
  onConfirmDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(order.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete order:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div 
      id="modal-delete-order"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-rose-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Data Pesanan</h3>
              <p className="text-xs text-slate-500">Konfirmasi penghapusan permanen</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text & order preview */}
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-800 space-y-1">
            <p className="font-bold text-xs flex items-center space-x-1.5">
              <span>⚠️ Peringatan Penting:</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Data yang dihapus akan terhapus secara permanen dari server database <strong>Cloud Firestore</strong> dan tidak dapat dikembalikan.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-slate-500">ID Pesanan:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                #{order.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nama Pelanggan:</span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">No. WhatsApp:</span>
              <span className="font-mono text-slate-700">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-medium text-slate-800">{order.serviceName} ({order.pairCount} Pasang)</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-semibold">Total Biaya:</span>
              <span className="font-black text-emerald-700 font-mono">{formatRupiah(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
