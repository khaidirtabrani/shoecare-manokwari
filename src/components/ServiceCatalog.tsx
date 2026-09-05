import React from 'react';
import { SERVICES, ADD_ONS } from '../data/services';
import { ServiceTier } from '../types';
import { formatRupiah } from '../utils/storage';
import { 
  Check, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Palette, 
  Brush, 
  Star, 
  Droplets, 
  Shield, 
  CheckCircle2,
  Layers,
  HeartHandshake
} from 'lucide-react';

interface ServiceCatalogProps {
  onSelectService: (serviceId: ServiceTier) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onSelectService }) => {
  const getIcon = (id: ServiceTier) => {
    switch (id) {
      case 'reguler':
        return <Brush className="w-5 h-5 text-blue-600" />;
      case 'premium':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'express':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'repaint':
        return <Palette className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Welcome Header */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden border border-slate-800">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-300" />
            <span>Spesialis Cuci & Perawatan Sepatu Premium</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-tight">
            Sepatu Bersih Maksimal, Higienis & Tampak Seperti Baru.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
            Layanan cuci sepatu profesional dengan formula pembersih khusus bahan, bebas bahan kimia keras perusak sol, dan sistem pengerjaan higienis. Siap jemput ke lokasi Anda atau serah terima di studio!
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              id="btn-hero-order"
              onClick={() => document.getElementById('form-cuci-sepatu')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <span>Daftar Cuci Sepatu Sekarang ↓</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-hero-pricing"
              onClick={() => document.getElementById('daftar-harga-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <span>Lihat Detail Paket & Harga ↓</span>
            </button>
          </div>

          {/* Trust stats strip */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
            <div>
              <div className="text-2xl font-black text-white">5.200+</div>
              <div className="text-xs text-slate-400">Pasang Sepatu Selesai</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">99.6%</div>
              <div className="text-xs text-slate-400">Tingkat Kepuasan</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">24 Jam</div>
              <div className="text-xs text-slate-400">Tersedia Layanan Kilat</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400">Pembersih Berkualitas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Pricing Cards Grid */}
      <section id="daftar-harga-section" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Tarif & Paket Perawatan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pilihan Paket Cuci Sepatu
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Tarif transparan per pasang tanpa biaya tersembunyi. Pilih paket sesuai kebutuhan kondisi sepatu Anda.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full w-fit">
            *Harga tertera per pasang sepatu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((srv) => {
            const isFavorite = srv.id === 'premium';
            return (
              <div
                key={srv.id}
                id={`service-card-${srv.id}`}
                className={`flex flex-col justify-between bg-white rounded-2xl border transition-all duration-300 relative p-6.5 hover:-translate-y-1 ${
                  isFavorite 
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30' 
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-lg'
                }`}
              >
                {/* Badge indicator */}
                {srv.badge && (
                  <div className="absolute -top-3.5 right-6">
                    <span className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md ${
                      isFavorite 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-white' 
                        : 'bg-slate-900 text-white'
                    }`}>
                      {srv.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Package Illustration */}
                  {srv.imageUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 relative group/img">
                      <img 
                        src={srv.imageUrl} 
                        alt={srv.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-xs">
                      {getIcon(srv.id)}
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{srv.duration}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">{srv.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[38px] leading-relaxed">{srv.description}</p>
                  </div>

                  {/* Price display */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">Biaya Paket</span>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatRupiah(srv.price)}
                    </div>
                  </div>

                  {/* Included features checklist */}
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Perawatan Termasuk:</p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      {srv.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-200/60">
                    <span className="font-bold text-slate-800">Cocok Untuk: </span>
                    {srv.recommendedFor}
                  </div>
                </div>

                {/* Select button */}
                <div className="pt-6 mt-4 border-t border-slate-100">
                  <button
                    id={`btn-select-${srv.id}`}
                    onClick={() => onSelectService(srv.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isFavorite
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Pilih Paket & Daftar Cuci</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sneaker Materials Guide - Atelier Trust Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Keahlian Perawatan Bahan
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">
            Aman Untuk Segala Macam Jenis Bahan Sepatu
          </h3>
          <p className="text-slate-600 text-sm">
            Setiap bahan sepatu memiliki sensitivitas berbeda. Tim teknisi kami menggunakan teknik khusus dan jenis sikat bertingkat agar serat bahan tetap awet.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              👟
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Canvas & Mesh</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembersihan pori kain secara mendalam tanpa membuat serat terburai atau berbulu.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              👞
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Leather (Kulit)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Formula pelembab pH seimbang menjaga kelembapan kulit agar tidak pecah atau retak.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              ✨
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Suede & Nubuck</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Metode semi-dry cleaning dan sikat kuningan halus agar tekstur beludru tetap lembut natural.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              🧪
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Midsole & Sol Boost</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembersihan kerak kotoran sol dan opsi unyellowing membalikkan oksidasi warna kuning.
            </p>
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perawatan Tambahan</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Add-Ons Khusus Sepatu Kesayangan</h3>
            <p className="text-sm text-slate-600 mt-1">Dapat dikombinasikan dengan paket cuci apa pun saat pengisian formulir pemesanan.</p>
          </div>
          <div className="text-xs text-emerald-700 font-semibold bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-full w-fit">
            Opsional & Fleksibel
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ADD_ONS.map((addon) => (
            <div key={addon.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">Per Pasang</span>
                  <Droplets className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{addon.name}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{addon.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Biaya Tambahan</span>
                <span className="text-sm font-black text-emerald-700">+{formatRupiah(addon.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Process Workflow Steps */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alur Pelayanan</span>
          <h3 className="text-2xl font-extrabold text-slate-900">4 Langkah Mudah Cuci di Shoecare Manokwari</h3>
          <p className="text-xs text-slate-500">Proses cepat tanpa repot dari pendaftaran sampai sepatu kembali bersih siap pakai.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shadow-sm">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Daftar Formulir Online</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih paket cuci, isi data sepatu, serta tentukan metode antar sendiri ke toko atau dijemput kurir.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shadow-sm">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Notifikasi & Konfirmasi</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sistem langsung membunyikan lonceng notifikasi di panel admin. Admin siap konfirmasi via WhatsApp.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shadow-sm">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Pencucian Spesialis</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pembersihan mendalam dengan chemical ramah bahan, anti-bakteri, serta pengeringan suhu terkontrol.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shadow-sm">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Selesai & Siap Pakai</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sepatu wangi, bersih, bebas kuman siap diambil di toko atau kami antarkan langsung kembali ke alamat Anda.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
