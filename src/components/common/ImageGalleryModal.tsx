import React, { useState } from 'react';
import { VehicleImage, PhotoCategory } from '../../types';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ImageGalleryModalProps {
  images: VehicleImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('all');

  if (!isOpen || images.length === 0) return null;

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter((img) => img.category === selectedCategory);

  const activeImage = filteredImages[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredImages.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <ZoomIn className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white text-base sm:text-lg">
            {title || 'Galería de Fotografías en Alta Definición'}
          </h3>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            {currentIndex + 1} / {filteredImages.length}
          </span>
        </div>

        {/* Category Filters */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          {(['all', 'exterior', 'interior', 'motor', 'tablero', 'danos'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`text-xs px-2.5 py-1 rounded transition-colors uppercase font-medium ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <img
          src={activeImage.url}
          alt={activeImage.caption || 'Foto del vehículo'}
          className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-200"
        />

        {/* Navigation arrows */}
        {filteredImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 border border-slate-700 transition shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 border border-slate-700 transition shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Caption */}
        {activeImage.caption && (
          <div className="absolute bottom-4 bg-black/80 backdrop-blur px-4 py-1.5 rounded-full text-xs text-slate-200 border border-slate-700/60">
            {activeImage.caption} • <span className="uppercase text-amber-400 font-semibold">{activeImage.category}</span>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 max-w-full justify-center">
        {filteredImages.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setCurrentIndex(idx)}
            className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition ${
              idx === currentIndex ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center text-slate-200 uppercase truncate">
              {img.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

