import React, { useMemo, useState } from 'react';
import { CustomerOrder } from '../types';
import { Search, User, Phone, Calendar, ShoppingBag, Crown, Trash2, AlertTriangle, X } from 'lucide-react';
import { formatRupiah } from '../utils/storage';

interface CustomerDatabaseProps {
  orders: CustomerOrder[];
  onViewCustomerOrders?: (custName: string) => void;
  onDeleteCustomer?: (customerPhone: string, customerName: string) => Promise<void> | void;
}

export const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({ 
  orders, 
  onViewCustomerOrders,
  onDeleteCustomer 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<{
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract unique customers based on phone number
  const customers = useMemo(() => {
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: string;
      isPriority: boolean;
    }>();

    // Sort orders oldest to newest so lastOrderDate gets overwritten with the latest
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedOrders.forEach(order => {
      const existing = customerMap.get(order.customerPhone);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.totalPrice;
        existing.lastOrderDate = order.createdAt;
        existing.name = order.customerName; 
        existing.isPriority = existing.totalSpent >= 1000000;
      } else {
        const totalSpent = order.totalPrice;
        customerMap.set(order.customerPhone, {
          name: order.customerName,
          phone: order.customerPhone,
          totalOrders: 1,
          totalSpent: totalSpent,
          lastOrderDate: order.createdAt,
          isPriority: totalSpent >= 1000000
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query)
    );
  }, [customers, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteCustomer) {
        await onDeleteCustomer(customerToDelete.phone, customerToDelete.name);
      }
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Failed to delete customer:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-500" />
            <span>Buku Kontak Pelanggan (CRM)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lengkap pelanggan berdasarkan nomor WhatsApp. Total {customers.length} pelanggan terdaftar.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="px-6 py-4">Nama Pelanggan</th>
                <th className="px-6 py-4">No. WhatsApp</th>
                <th className="px-6 py-4">Status Prioritas</th>
                <th className="px-6 py-4 text-center">Total Order</th>
                <th className="px-6 py-4 text-right">Total Transaksi</th>
                <th className="px-6 py-4">Transaksi Terakhir</th>
                <th className="px-6 py-4 text-center">Menu / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${customer.isPriority ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${customer.isPriority ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {customer.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">{customer.name}</span>
                          {customer.isPriority && (
                            <span className="text-[10px] text-amber-700 font-extrabold inline-flex items-center space-x-1">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>Pelanggan VIP</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-600 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`https://wa.me/${customer.phone}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 hover:underline">
                          {customer.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.isPriority ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>Prioritas (Diskon Rp 100rb)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          <span>Standar</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{customer.totalOrders}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${customer.isPriority ? 'text-amber-700 font-extrabold' : 'text-slate-800'}`}>
                        {formatRupiah(customer.totalSpent)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(customer.lastOrderDate).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setCustomerToDelete(customer)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                        title={`Hapus data pelanggan ${customer.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                    {searchQuery ? 'Tidak ada pelanggan yang cocok dengan pencarian Anda.' : 'Belum ada data pelanggan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Hapus Data Pelanggan?</h3>
                  <p className="text-xs text-slate-500">Konfirmasi tindakan penghapusan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              <p>
                Anda akan menghapus data pelanggan <strong className="text-slate-900 font-bold">{customerToDelete.name}</strong> ({customerToDelete.phone}).
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                ⚠️ Seluruh <strong className="font-bold">{customerToDelete.totalOrders} pesanan</strong> (total transaksi {formatRupiah(customerToDelete.totalSpent)}) milik pelanggan ini akan ikut dihapus secara permanen dari sistem dan database.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Menghapus...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
