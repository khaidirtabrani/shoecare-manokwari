import React, { useState, useRef, useCallback, useEffect } from 'react';
import dirtySneakerImg from '../assets/images/dirty_sneaker_1788792001911.jpg';
import cleanSneakerImg from '../assets/images/clean_sneaker_1788792033622.jpg';
import dirtyUnyellowingImg from '../assets/images/dirty_unyellowing_before_1788792504735.jpg';
import cleanUnyellowingImg from '../assets/images/clean_unyellowing_after_1788792525702.jpg';
import dirtySuedeImg from '../assets/images/dirty_suede_before_1788792544124.jpg';
import cleanSuedeImg from '../assets/images/clean_suede_after_1788792561287.jpg';
import { 
  Sparkles, 
  MoveHorizontal, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  CheckCircle2
} from 'lucide-react';

export interface BeforeAfterSlideItem {
  id: string;
  tabLabel: string;
  title: string;
  serviceTag: string;
  caption: string;
  beforeImg: string;
  afterImg: string;
  beforeLabel: string;
  afterLabel: string;
}

export const BEFORE_AFTER_SLIDES: BeforeAfterSlideItem[] = [
  {
    id: 'sneakers-deep-clean',
    tabLabel: 'Sneaker Putih',
    title: 'Sneakers Putih (Deep Clean)',
    serviceTag: 'Deep Clean',
    caption: 'Noda lumpur, tanah & debu jalanan hilang total, warna kain & sol putih cerah kembali.',
    beforeImg: dirtySneakerImg,
    afterImg: cleanSneakerImg,
    beforeLabel: 'Sebelum (Kotor)',
    afterLabel: 'Sesudah (Bersih)',
  },
  {
    id: 'midsole-unyellowing',
    tabLabel: 'Sol Menguning',
    title: 'Midsole Sol Menguning (Unyellowing)',
    serviceTag: 'Unyellowing Treatment',
    caption: 'Karet sol midsole yang menguning akibat oksidasi kembali bersih putih cerah seperti baru.',
    beforeImg: dirtyUnyellowingImg,
    afterImg: cleanUnyellowingImg,
    beforeLabel: 'Sebelum (Kuning)',
    afterLabel: 'Sesudah (Putih)',
  },
  {
    id: 'suede-leather',
    tabLabel: 'Suede & Kulit',
    title: 'Perawatan Suede & Leather',
    serviceTag: 'Suede Care',
    caption: 'Bahan suede berdebu dan bernoda air dibersihkan dengan sabun khusus tanpa merusak tekstur beludru.',
    beforeImg: dirtySuedeImg,
    afterImg: cleanSuedeImg,
    beforeLabel: 'Sebelum (Kusam)',
    afterLabel: 'Sesudah (Segar)',
  },
];

interface BeforeAfterSliderProps {
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ className = '' }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeSlide = BEFORE_AFTER_SLIDES[currentSlideIndex];

  // Reset slider position to 50% when slide changes
  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    setSliderPosition(50);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? BEFORE_AFTER_SLIDES.length - 1 : prev - 1));
    setSliderPosition(50);
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === BEFORE_AFTER_SLIDES.length - 1 ? 0 : prev + 1));
    setSliderPosition(50);
  };

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  return (
    <div className={`w-full ${className}`}>
      {/* Outer Card with ambient glow border */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-br from-emerald-500/30 via-slate-800 to-slate-900 shadow-2xl border border-emerald-500/20">
        
        {/* Top Header: Title, Category Badge & Slide Navigation */}
        <div className="px-4 py-3 bg-slate-900/95 rounded-t-[22px] flex items-center justify-between border-b border-slate-800/80 gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-100 uppercase tracking-wider block truncate">
                {activeSlide.title}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="hidden sm:flex items-center space-x-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mr-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{activeSlide.serviceTag}</span>
            </div>

            {/* Slide Arrows */}
            <button
              type="button"
              onClick={handlePrevSlide}
              title="Foto Sebelumnya"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-400 px-1">
              {currentSlideIndex + 1}/{BEFORE_AFTER_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={handleNextSlide}
              title="Foto Selanjutnya"
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Category Selector Pills */}
        <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {BEFORE_AFTER_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {isActive && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
                <span>{slide.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Comparison Canvas */}
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (e.touches.length > 0) handleMove(e.touches[0].clientX);
          }}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[260px] sm:h-[320px] lg:h-[340px] overflow-hidden select-none cursor-ew-resize group bg-slate-950"
        >
          {/* Layer 1 (Base): Clean Shoe (After) */}
          <img
            key={`after-${activeSlide.id}`}
            src={activeSlide.afterImg}
            alt={`${activeSlide.title} sesudah dicuci`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-300"
          />

          {/* Layer 2 (Overlay clipped): Dirty Shoe (Before) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              key={`before-${activeSlide.id}`}
              src={activeSlide.beforeImg}
              alt={`${activeSlide.title} sebelum dicuci`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none max-w-none transition-opacity duration-300"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: '100%'
              }}
            />

            {/* Dark vignette tint on dirty side for contrast */}
            <div className="absolute inset-0 bg-slate-950/15" />
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(16,185,129,0.8)] pointer-events-none z-20"
            style={{ left: `calc(${sliderPosition}% - 2px)` }}
          >
            {/* Center Handle Button */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/50 cursor-ew-resize">
              <MoveHorizontal className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* Floating side navigators inside canvas on hover */}
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Slide sebelumnya"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-75 hover:opacity-100 transition-all cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Slide selanjutnya"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xs border border-white/10 opacity-75 hover:opacity-100 transition-all cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Before Badge (Left) */}
          <div 
            className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-[11px] font-extrabold text-slate-300 shadow-lg pointer-events-none transition-opacity"
            style={{ opacity: sliderPosition > 18 ? 1 : 0.2 }}
          >
            {activeSlide.beforeLabel}
          </div>

          {/* After Badge (Right) */}
          <div 
            className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-[11px] font-extrabold text-emerald-300 shadow-lg flex items-center space-x-1 pointer-events-none transition-opacity"
            style={{ opacity: sliderPosition < 82 ? 1 : 0.2 }}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{activeSlide.afterLabel}</span>
          </div>

          {/* Floating hint on hover or start */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300 flex items-center space-x-1.5 pointer-events-none">
            <MoveHorizontal className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Geser garis untuk melihat perbandingan</span>
          </div>
        </div>

        {/* Caption bar for this specific transformation */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start space-x-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">
            {activeSlide.caption}
          </p>
        </div>

        {/* Bottom Quick Select Presets & Guarantee Strip */}
        <div className="p-3 bg-slate-900/95 rounded-b-[22px] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setSliderPosition(100)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                sliderPosition >= 90
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Sebelum
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(50)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                sliderPosition > 35 && sliderPosition < 65
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              50 : 50
            </button>
            <button
              type="button"
              onClick={() => setSliderPosition(0)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                sliderPosition <= 10
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              Sesudah
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Garansi Cuci Bersih Maksimal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
