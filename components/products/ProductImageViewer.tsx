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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-0 text-gray-900 backdrop-blur-sm sm:p-4 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} image viewer`}
      onClick={onClose}
    >
      <section
        className="relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(90vh,900px)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-50 flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 shadow-lg transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:right-5 sm:top-5"
          aria-label="Close image viewer"
        >
          <X size={20} />
          <span className="hidden sm:inline">Close</span>
        </button>

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-h-[55vh] min-w-0 flex-1 items-center justify-center overflow-hidden bg-white p-4 pt-16 sm:p-8 lg:min-h-0 lg:pt-8">
            <div className="flex h-full w-full items-center justify-center overflow-auto overscroll-contain rounded-2xl bg-white">
              <img
                src={images[activeIndex]}
                alt={`${productName} view ${activeIndex + 1}`}
                onError={onImageError}
                onClick={(event) => {
                  event.stopPropagation();
                  setIsZoomed((current) => !current);
                }}
                className={`max-h-full rounded-xl object-contain transition-transform duration-300 [touch-action:pinch-zoom] ${
                  isZoomed ? 'max-w-none scale-150 cursor-zoom-out sm:scale-[1.65]' : 'max-w-full scale-100 cursor-zoom-in'
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
                  className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-xl transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:left-6 sm:h-12 sm:w-12"
                  aria-label="View previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNext();
                  }}
                  className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white/95 text-gray-800 shadow-xl transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:right-6 sm:h-12 sm:w-12"
                  aria-label="View next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <span className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-full bg-gray-950/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg sm:block">
              Click image to {isZoomed ? 'zoom out' : 'zoom in'}
            </span>
          </div>

          <aside className="max-h-[38vh] overflow-y-auto border-t border-gray-200 bg-gray-50 p-5 pt-16 lg:max-h-none lg:border-l lg:border-t-0 lg:p-7 lg:pt-20">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">Product image</p>
            <h2 className="mt-3 text-lg font-black leading-snug text-gray-950 lg:text-xl">{productName}</h2>
            <p className="mt-2 text-xs font-bold text-gray-500">
              Image {activeIndex + 1} of {images.length}
            </p>

            <button
              type="button"
              onClick={() => setIsZoomed((current) => !current)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <Minus size={17} /> : <Plus size={17} />}
              {isZoomed ? 'Zoom out' : 'Zoom in'}
            </button>

            {hasMultipleImages && (
              <div className="mt-7 border-t border-gray-200 pt-6">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">More views</p>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => {
                        onIndexChange(index);
                        setIsZoomed(false);
                      }}
                      className={`h-16 w-16 flex-none overflow-hidden rounded-xl border-2 bg-white transition lg:h-auto lg:w-auto lg:aspect-square ${
                        activeIndex === index
                          ? 'border-orange-500 shadow-md'
                          : 'border-gray-200 opacity-65 hover:border-orange-200 hover:opacity-100'
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

            <p className="mt-6 text-xs leading-relaxed text-gray-500">
              Select another view or use the arrows to inspect this product in detail.
            </p>
          </aside>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default ProductImageViewer;
