import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';

interface ProductImageViewerProps {
  images: string[];
  activeIndex: number;
  productName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onImageError: React.ReactEventHandler<HTMLImageElement>;
}

const ProductImageViewer = ({
  images,
  activeIndex,
  productName,
  onClose,
  onIndexChange,
  onImageError
}: ProductImageViewerProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const hasMultipleImages = images.length > 1;

  const showPrevious = () => {
    onIndexChange((activeIndex - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const showNext = () => {
    onIndexChange((activeIndex + 1) % images.length);
    setIsZoomed(false);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultipleImages) showPrevious();
      if (event.key === 'ArrowRight' && hasMultipleImages) showNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, hasMultipleImages, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-gray-950/96 text-white backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} image viewer`}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{productName}</p>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            Image {activeIndex + 1} of {images.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed((current) => !current)}
            className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-black transition hover:bg-white/20"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <Minus size={17} /> : <Plus size={17} />}
            <span className="hidden sm:inline">{isZoomed ? 'Zoom out' : 'Zoom in'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center gap-2 rounded-full bg-orange-500 px-4 text-xs font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400"
            aria-label="Close image viewer"
          >
            <X size={21} />
            <span>Close</span>
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain p-4 sm:p-8">
        <div className={`flex min-h-full items-center justify-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}>
          <img
            src={images[activeIndex]}
            alt={`${productName} view ${activeIndex + 1}`}
            onError={onImageError}
            onClick={(event) => {
              event.stopPropagation();
              setIsZoomed((current) => !current);
            }}
            className={`max-h-[calc(100vh-11rem)] rounded-2xl object-contain shadow-2xl transition-transform duration-300 [touch-action:pinch-zoom] ${
              isZoomed ? 'max-w-none scale-150 sm:scale-[1.75]' : 'max-w-full scale-100'
            }`}
          />
        </div>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className="fixed left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-gray-950/70 shadow-xl transition hover:bg-white hover:text-gray-950 sm:left-6 sm:h-14 sm:w-14"
              aria-label="View previous image"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="fixed right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-gray-950/70 shadow-xl transition hover:bg-white hover:text-gray-950 sm:right-6 sm:h-14 sm:w-14"
              aria-label="View next image"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div
          className="border-t border-white/10 bg-gray-950/80 px-4 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex max-w-3xl justify-center gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => {
                  onIndexChange(index);
                  setIsZoomed(false);
                }}
                className={`h-14 w-14 flex-none overflow-hidden rounded-xl border-2 transition sm:h-16 sm:w-16 ${
                  activeIndex === index ? 'border-orange-500 opacity-100' : 'border-transparent opacity-45 hover:opacity-80'
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={activeIndex === index ? 'true' : undefined}
              >
                <img
                  src={image}
                  alt=""
                  onError={onImageError}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ProductImageViewer;
