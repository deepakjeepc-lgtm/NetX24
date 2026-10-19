import React, { useState } from 'react';

interface ProductImage6x9Props {
  src: string;
  title: string;
  author?: string;
  category?: 'Books' | 'Stationery';
  className?: string;
  imgClassName?: string;
  pedestal?: boolean;
}

/**
 * Single-layer strict 6×9 inch (aspect-[2/3]) image component.
 * Renders the cover/product directly edge-to-edge without any nested card boxes.
 */
export default function ProductImage6x9({
  src,
  title,
  author,
  category = 'Books',
  className = '',
  imgClassName = '',
}: ProductImage6x9Props) {
  const [hasError, setHasError] = useState(false);

  const normalizedSrc =
    src && src.startsWith('/catalog/')
      ? `${src.split('?')[0]}?v=4`
      : src;

  return (
    <div
      className={`relative aspect-[2/3] w-full h-full overflow-hidden select-none bg-[#EAEAE4] dark:bg-[#141417] ${className}`}
    >
      {!hasError && normalizedSrc ? (
        <img
          src={normalizedSrc}
          alt={title}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`block w-full h-full object-cover object-center transition-transform duration-200 ${imgClassName}`}
        />
      ) : (
        <div className="w-full h-full bg-[#18181B] dark:bg-[#18181D] text-[#F5F5F7] p-8 flex flex-col justify-between">
          <div className="text-[10px] tracking-[0.22em] uppercase text-zinc-400">
            LEKHIX · {category} · 6×9 IN
          </div>
          <div className="my-auto py-6 border-y border-white/15 text-center">
            <p className="font-editorial text-2xl font-semibold leading-snug text-white line-clamp-3">
              {title}
            </p>
          </div>
          <div className="text-[11px] tracking-[0.18em] uppercase text-zinc-400 text-center truncate">
            {author || 'LEKHIX ATELIER'}
          </div>
        </div>
      )}
    </div>
  );
}
