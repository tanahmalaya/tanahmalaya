"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export default function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = openIndex !== null;

  function showPrev() {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }

  function showNext() {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) showPrev();
    else if (delta < -50) showNext();
    touchStartX.current = null;
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-brand-cream rounded-md flex items-center justify-center text-brand-dark/40">
        Tiada gambar
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square bg-brand-cream rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-gold"
            aria-label={`Lihat ${productName} - gambar ${i + 1} dengan lebih besar`}
          >
            <Image src={url} alt={`${productName} - gambar ${i + 1}`} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-brand-dark rounded-full p-2">
                <ZoomIcon />
              </span>
            </span>
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Gambar penuh ${productName}`}
          onClick={() => setOpenIndex(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 text-white shrink-0">
            <span className="text-sm text-white/70">
              {openIndex! + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="p-2 -mr-2 hover:text-brand-gold active:text-brand-gold transition-colors"
              aria-label="Tutup"
            >
              <CloseIcon />
            </button>
          </div>

          <div
            className="relative flex-1 min-h-0"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[openIndex!]}
              alt={`${productName} - gambar ${openIndex! + 1} (penuh)`}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Gambar sebelum"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Gambar seterusnya"
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 shrink-0 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-sm overflow-hidden border-2 transition-colors ${
                    i === openIndex ? "border-brand-gold" : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Pergi ke gambar ${i + 1}`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
