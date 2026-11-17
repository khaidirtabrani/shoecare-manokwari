import React from 'react';
import { AdminSettings } from '../types';
import { MANOKWARI_DELIVERY_ZONES, SHOECARE_WORKSHOP_COORDS } from '../data/deliveryZones';
import { formatRupiah } from '../utils/storage';
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  CheckCircle2, 
  CalendarPlus,
  Compass,
  ArrowRight
} from 'lucide-react';

interface StudioInfoProps {
  settings: AdminSettings;
  onBookingClick: () => void;
}

export const StudioInfo: React.FC<StudioInfoProps> = ({ settings, onBookingClick }) => {
  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Cuci Sepatu Profesional Manokwari</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Rawat Sepatu Kesayangan Anda Bersama <span className="text-emerald-400">Shoecare Manokwari</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Kami hadir dengan standar perawatan sepatu modern di Manokwari, Papua Barat. Menggunakan formula pembersih khusus ramah lingkungan, teknik cuci presisi sesuai bahan material, serta layanan antar-jemput kurir langsung ke depan pintu rumah Anda.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBookingClick}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Booking Cuci Sekarang</span>
            </button>
            <a
              href={`https://wa.me/${settings.adminPhone}?text=Halo%20Admin%20Shoecare%20Manokwari,%20saya%20ingin%20tanya%20seputar%20layanan%20cuci%20sepatu`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center space-x-2 transition-all border border-white/20"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Chat WhatsApp Studio</span>
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Jam Operasional & Lokasi Outlet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Lokasi & Akses */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Alamat Workshop & Drop-off</h3>
              <p className="text-xs text-slate-500">Pusat pengerjaan & penerimaan sepatu</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <p className="font-bold text-slate-900 leading-snug">
              {settings.storeAddress}
            </p>
            <p className="text-slate-500">
              Patokan: Kawasan Sanggeng dekat pusat kota Manokwari Barat, akses mudah dengan kendaraan roda dua maupun roda empat.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center space-x-1.5 font-medium">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Koordinat: Sanggeng (-0.8614, 134.0620)</span>
            </span>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(settings.storeAddress + ', Manokwari, Papua Barat')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline inline-flex items-center space-x-1"
            >
              <span>Buka Peta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Card 2: Jam Operasional */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Jam Operasional</h3>
              <p className="text-xs text-slate-500">Buka setiap hari untuk melayani Anda</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 block">Senin - Minggu (Setiap Hari)</span>
                <span className="text-[11px] text-emerald-700">Penerimaan drop-off & antar jemput</span>
              </div>
              <span className="font-extrabold text-emerald-800 font-mono text-sm">
                09.00 - 21.00 WIT
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Layanan Kurir Antar-Jemput</span>
                <span className="text-[11px] text-slate-500">Jadwal penjemputan oleh tim kurir</span>
              </div>
              <span className="font-bold text-slate-700 font-mono text-xs">
                10.00 - 20.00 WIT
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Customer service online siap merespons pertanyaan Anda setiap hari.</span>
          </div>
        </div>
      </div>

      {/* Wilayah Jangkauan Antar-Jemput Kurir */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Zonasi Kurir Antar-Jemput Manokwari</h3>
              <p className="text-xs text-slate-500">Tarif transparan & penjemputan terjadwal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBookingClick}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>Pesan dengan Kurir</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MANOKWARI_DELIVERY_ZONES.map((zone) => (
            <div key={zone.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs">{zone.name.split(':')[0]}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  ~{zone.distanceEstimateKm} km
                </span>
              </div>
              <p className="font-bold text-slate-800 text-xs truncate">
                {zone.name.split(':')[1] || zone.district}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {zone.coverage.join(', ')}
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Tarif PP:</span>
                <span className="font-extrabold text-emerald-700 font-mono">
                  {formatRupiah(zone.priceRoundTrip)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Pilar Keunggulan & Garansi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Sparkles,
            title: 'Pembersih Organik',
            desc: 'Aman untuk berbagai bahan: suede, canvas, knit, leather, hingga nubuck tanpa merusak warna asli.'
          },
          {
            icon: ShieldCheck,
            title: 'Aman Lem & Sol',
            desc: 'Teknik pengeringan suhu ruangan khusus tanpa paparan sinar matahari terik yang membuat lem sepatu getas.'
          },
          {
            icon: CheckCircle2,
            title: 'Parfum Anti-Bakteri',
            desc: 'Menggunakan semprotan antibakteri premium yang membunuh kuman penyebab bau apek hingga berminggu-minggu.'
          },
          {
            icon: Truck,
            title: 'Kurir Praktis',
            desc: 'Tidak sempat ke outlet? Kurir kami siap jemput dan antar kembali sepatu Anda yang sudah bersih berkilau.'
          }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
