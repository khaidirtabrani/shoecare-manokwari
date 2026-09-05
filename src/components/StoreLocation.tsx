import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Clock, Phone } from 'lucide-react';

interface StoreLocationProps {
  apiKey?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}

const MapMarker = ({ position, title, storeName, storeAddress, storePhone }: { 
  position: google.maps.LatLngLiteral; 
  title: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}) => {
  const [infowindowOpen, setInfowindowOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        title={title}
        onClick={() => setInfowindowOpen(true)}
      >
        <Pin background={'#059669'} borderColor={'#064e3b'} glyphColor={'#ecfdf5'} scale={1.2}>
          <div className="w-5 h-5 flex items-center justify-center">
             <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
        </Pin>
      </AdvancedMarker>

      {infowindowOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={280}
          onCloseClick={() => setInfowindowOpen(false)}
        >
          <div className="p-1 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                <img 
                  src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-sm leading-tight">{storeName}</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Care Atelier</p>
              </div>
            </div>
            
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{storeAddress}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>09.00 - 21.00 WIT</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+{storePhone}</span>
              </p>
            </div>

            <a 
              href="https://maps.app.goo.gl/TRQ56tUsmaiSz1Xa7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-[11px]"
            >
              <Navigation className="w-3 h-3" />
              <span>Petunjuk Arah</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const StoreLocation: React.FC<StoreLocationProps> = ({ 
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  storeName,
  storeAddress,
  storePhone
}) => {
  const position = { lat: -0.8615152, lng: 134.0498663 };
  
  if (!apiKey) {
    return (
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-widest">
             Konfigurasi Diperlukan
          </div>
          <h2 className="text-2xl font-black text-slate-900">Lokasi Workshop Kami</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm">
            Fitur peta interaktif memerlukan Google Maps API Key. Silakan tambahkan <code className="bg-slate-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> di pengaturan proyek Anda.
          </p>
          <div className="mt-8 p-8 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center space-y-4 bg-white/50">
             <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <MapPin className="w-8 h-8" />
             </div>
             <div className="text-center">
                <p className="font-bold text-slate-700">{storeName}</p>
                <p className="text-sm text-slate-500">{storeAddress}</p>
             </div>
             <a 
              href="https://maps.app.goo.gl/TRQ56tUsmaiSz1Xa7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-bold shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Google Maps</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50 -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Text Content */}
          <div className="w-full lg:w-1/3 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>Workshop Utama</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Kunjungi Studio <br />
              <span className="text-emerald-600">Restorasi Kami</span>
            </h2>
            
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
              Temukan kami di pusat kota Manokwari. Nikmati layanan konsultasi langsung dan lihat bagaimana kami merawat sepatu favorit Anda dengan standar profesional.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alamat Lengkap</p>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{storeAddress}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Jam Operasional</p>
                  <p className="text-sm font-bold text-slate-800 leading-snug">Setiap Hari: 09.00 - 21.00 WIT</p>
                </div>
              </div>
            </div>

            <a 
              href="https://maps.app.goo.gl/TRQ56tUsmaiSz1Xa7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 group"
            >
              <Navigation className="w-4 h-4 group-hover:animate-pulse" />
              <span>Dapatkan Petunjuk Arah</span>
            </a>
          </div>

          {/* Map View */}
          <div className="w-full lg:w-2/3">
            <div className="h-[400px] sm:h-[500px] w-full rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 border-8 border-white relative group">
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={position}
                  defaultZoom={15}
                  mapId="DEMO_MAP_ID"
                  gestureHandling={'cooperative'}
                  disableDefaultUI={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  <MapMarker 
                    position={position} 
                    title={storeName}
                    storeName={storeName}
                    storeAddress={storeAddress}
                    storePhone={storePhone}
                  />
                </Map>
              </APIProvider>
              
              {/* Overlay styling for the map border internal */}
              <div className="absolute inset-0 border-2 border-slate-900/5 rounded-[1.5rem] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
