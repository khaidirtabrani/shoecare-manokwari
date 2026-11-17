import React from 'react';
import { Camera, Eye } from 'lucide-react';

interface ShoeThumbnailProps {
  type?: string;
  className?: string;
  photoUrl?: string;
  onClick?: (e: React.MouseEvent) => void;
  showViewBadge?: boolean;
}

export const ShoeThumbnail: React.FC<ShoeThumbnailProps> = ({
  type,
  className = 'w-13 h-13',
  photoUrl,
  onClick,
  showViewBadge = true
}) => {
  const hasPhoto = Boolean(photoUrl && photoUrl.trim() !== '');

  if (hasPhoto) {
    return (
      <div 
        onClick={onClick}
        title={onClick ? "Klik untuk melihat foto sepatu" : "Foto Sepatu"}
        className={`relative rounded-xl overflow-hidden bg-[#181d28] border border-[#232838] hover:border-amber-400/50 flex items-center justify-center shrink-0 group/thumb transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <img 
          src={photoUrl} 
          alt="Foto Sepatu" 
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover overlay with eye icon */}
        {onClick && (
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-4 h-4 text-white drop-shadow" />
          </div>
        )}

        {/* Camera indicator badge */}
        {showViewBadge && (
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
            <Camera className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/90 via-[#151924] to-slate-900 border border-slate-700/60 flex items-center justify-center p-1.5 shadow-inner shrink-0 ${onClick ? 'cursor-pointer hover:border-slate-500' : ''} ${className}`}
    >
      <img 
        src="/order-shoe-logo.png" 
        alt="Logo Order Sepatu" 
        className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-105"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== window.location.origin + '/9899434-removebg-preview.png') {
            target.src = '/9899434-removebg-preview.png';
          }
        }}
      />
    </div>
  );
};
