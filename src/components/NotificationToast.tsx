import React from 'react';
import { AdminNotification } from '../types';
import { formatRupiah } from '../utils/storage';
import { BellRing, X, ArrowRight } from 'lucide-react';

interface NotificationToastProps {
  notification: AdminNotification | null;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onOpenAdmin
}) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                Notifikasi Admin
              </span>
              <span className="text-[10px] text-slate-400">Baru Saja</span>
            </div>
            <p className="text-xs font-bold text-white">
              Pesanan Masuk dari {notification.customerName}!
            </p>
            <p className="text-[11px] text-slate-300">
              {notification.serviceName} • Total <span className="text-emerald-400 font-semibold">{formatRupiah(notification.totalPrice)}</span>
            </p>
            <button
              onClick={() => {
                onOpenAdmin();
                onClose();
              }}
              className="mt-2 inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>Buka di Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
