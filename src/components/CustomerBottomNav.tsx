import React from 'react';
import { Sparkles, CalendarPlus, Search, MapPin } from 'lucide-react';

export type CustomerNavTab = 'services' | 'order' | 'tracker' | 'info';

interface CustomerBottomNavProps {
  currentTab: CustomerNavTab;
  onTabChange: (tab: CustomerNavTab) => void;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentTab,
  onTabChange
}) => {
  const tabs: { id: CustomerNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'services', label: 'Layanan', icon: Sparkles },
    { id: 'order', label: 'Booking', icon: CalendarPlus },
    { id: 'tracker', label: 'Lacak', icon: Search },
    { id: 'info', label: 'Info & Rute', icon: MapPin },
  ];

  return (
    <nav 
      aria-label="Menu Navigasi Bawah"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-bottom"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              onTabChange(tab.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer relative ${
              isActive 
                ? 'text-emerald-700 font-extrabold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              isActive 
                ? 'bg-emerald-100/90 text-emerald-800 scale-105 shadow-2xs' 
                : 'bg-transparent text-slate-500'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-black text-emerald-800' : 'font-semibold text-slate-600'}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
