import React from 'react';
import { Sparkles, CalendarPlus, Search, MapPin, ShieldCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { CustomerNavTab } from './CustomerBottomNav';

interface NavbarProps {
  activeTab: 'services' | 'admin';
  setActiveTab: (tab: 'services' | 'admin') => void;
  customerTab?: CustomerNavTab;
  setCustomerTab?: (tab: CustomerNavTab) => void;
  unreadCount: number;
  isAdminAuthenticated?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  customerTab = 'services',
  setCustomerTab,
  unreadCount,
  isAdminAuthenticated = false
}) => {
  const customerMenuItems: { id: CustomerNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'services', label: 'Layanan & Harga', icon: Sparkles },
    { id: 'order', label: 'Booking Online', icon: CalendarPlus },
    { id: 'tracker', label: 'Lacak Pesanan', icon: Search },
    { id: 'info', label: 'Info Studio', icon: MapPin },
  ];

  const handleMenuClick = (tabId: CustomerNavTab) => {
    if (activeTab !== 'services') {
      setActiveTab('services');
    }
    if (setCustomerTab) {
      setCustomerTab(tabId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-2">
          
          {/* Brand Logo & Studio Tag */}
          <div 
            id="brand-logo"
            onClick={() => handleMenuClick('services')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-md shadow-emerald-700/10 group-hover:scale-105 transition-all duration-300 border border-slate-100">
              <img 
                src="/logo.jpg" 
                alt="Logo Shoecare Manokwari" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900">
                  Shoecare <span className="text-emerald-600">Manokwari</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-semibold">Buka Hari Ini</span>
                </span>
                <span>•</span>
                <span className="hidden sm:inline">09.00 - 21.00 WIT</span>
              </div>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Menu Tabs (Hidden on Admin view) */}
          {activeTab === 'services' && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
              {customerMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = customerTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMenuClick(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/70 font-black'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Links */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* PWA Install Button */}
            <PWAInstallButton />
            
            {/* WhatsApp Quick Link */}
            <a
              href="https://wa.me/6282239096626?text=Halo%20Admin%20Shoecare%20Manokwari,%20saya%20ingin%20tanya%20seputar%20layanan%20cuci%20sepatu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 transition-all"
              title="Konsultasi Perawatan Sepatu via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanya Studio</span>
            </a>

            {/* Quick Button in Navbar on small screens (when not on order tab) */}
            {activeTab === 'services' && customerTab !== 'order' && (
              <button
                type="button"
                onClick={() => handleMenuClick('order')}
                className="hidden sm:inline-flex md:hidden items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Booking</span>
              </button>
            )}

            {/* Admin View Controls - ONLY VISIBLE WHEN VISITING ADMIN ROUTE / ACTIVE TAB ADMIN */}
            {activeTab === 'admin' && (
              <div className="flex items-center space-x-2">
                <button
                  id="nav-back-to-services-btn"
                  onClick={() => {
                    setActiveTab('services');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  title="Kembali ke Halaman Pelanggan"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Web Pelanggan</span>
                </button>

                <div
                  id="nav-admin-badge"
                  className="relative flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span className="font-extrabold">Admin</span>
                  {isAdminAuthenticated && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300 hidden sm:inline-block ring-2 ring-emerald-600" title="Admin Terotentikasi" />
                  )}
                  {unreadCount > 0 && (
                    <span 
                      id="admin-unread-badge"
                      className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full animate-bounce min-w-[18px] shadow-sm ml-1"
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
