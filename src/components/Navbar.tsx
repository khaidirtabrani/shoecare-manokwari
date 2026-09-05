import React from 'react';
import { Sparkles, CalendarPlus, ShieldCheck, Lock, MessageCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'services' | 'admin';
  setActiveTab: (tab: 'services' | 'admin') => void;
  unreadCount: number;
  isAdminAuthenticated?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  isAdminAuthenticated = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Studio Tag */}
          <div 
            id="brand-logo"
            onClick={() => {
              setActiveTab('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex items-center space-x-3.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-md shadow-emerald-700/10 group-hover:scale-105 transition-all duration-300 border border-slate-100">
              <img 
                src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
                alt="Logo Shoecare Manokwari" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Shoecare <span className="text-emerald-600">Manokwari</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/70">
                  Care Atelier
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-semibold">Buka Hari Ini</span>
                </span>
                <span>•</span>
                <span className="hidden sm:inline">09.00 - 21.00 WIT</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            {/* WhatsApp Quick Link */}
            <a
              href="https://wa.me/6282239096626?text=Halo%20Admin%20Shoecare%20Manokwari,%20saya%20ingin%20tanya%20seputar%20layanan%20cuci%20sepatu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 transition-all"
              title="Konsultasi Perawatan Sepatu via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanya Studio</span>
            </a>

            {/* Unified 1 Menu: Daftar Cuci & Harga */}
            <button
              id="nav-services-btn"
              onClick={() => {
                setActiveTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <CalendarPlus className="w-4 h-4 text-emerald-400" />
              <span>Daftar Cuci & Harga</span>
            </button>

            {/* Admin Panel Button with Notification Badge */}
            <button
              id="nav-admin-btn"
              onClick={() => {
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isAdminAuthenticated ? (
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">Admin</span>
              {isAdminAuthenticated && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 hidden sm:inline-block ring-2 ring-emerald-600" title="Admin Terotentikasi" />
              )}
              {unreadCount > 0 && (
                <span 
                  id="admin-unread-badge"
                  className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full animate-bounce min-w-[18px] shadow-sm"
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
