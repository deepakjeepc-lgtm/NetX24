import React, { useState } from 'react';

interface ProductImage6x9Props {
  src: string;
  title: string;
  author?: string;
  category?: string;
  courseCode?: string;
  programCode?: string;
  year?: string;
  releaseDate?: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Strict aspect-[2/3] book cover component.
 * When no custom cover image is uploaded, renders a physical book cover
 * featuring the framed LEKHIX logo at the top, centered IGNOU text (for IGNOU items),
 * and a centered frame with Title, Course Code, and Session / Release Date.
 */
export default function ProductImage6x9({
  src,
  title,
  category = 'Books',
  courseCode,
  programCode,
  releaseDate,
  className = '',
  imgClassName = '',
}: ProductImage6x9Props) {
  const [hasError, setHasError] = useState(false);

  const cleanTitle = (title || '').trim() || 'Untitled';
  const cleanCourseCode = (courseCode || '').trim().toUpperCase();
  const cleanProgramCode = (programCode || '').trim().toUpperCase();
  const displayCode = cleanCourseCode || cleanProgramCode;
  const cleanReleaseDate = (releaseDate || '').trim().toUpperCase();

  // Pure cqw font sizing so title line-wrapping is identical across all card & preview sizes
  const titleLength = cleanTitle.length;
  const titleFontSize =
    titleLength > 48
      ? '3.7cqw'
      : titleLength > 28
      ? '4.2cqw'
      : '4.8cqw';

  return (
    <div
      style={{ containerType: 'inline-size' }}
      className={`relative aspect-[2/3] w-full h-full overflow-hidden select-none bg-[#EAEAE4] dark:bg-[#141417] ${className}`}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={cleanTitle}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`block w-full h-full object-cover object-center transition-transform duration-200 ${imgClassName}`}
        />
      ) : (
        /* Realistic Physical Book Cover — Light & Dark Mode Hardcover with Spine Groove */
        <div className="relative w-full h-full bg-gradient-to-br from-[#FFFFFF] via-[#FAF9F5] to-[#EFECE4] dark:from-[#202026] dark:via-[#151519] dark:to-[#0D0D10] text-[#111111] dark:text-[#F5F5F7] border border-black/15 dark:border-white/15 border-r-[2px] border-r-black/25 dark:border-r-white/25 shadow-inner flex transition-colors duration-200">
          {/* Left 3D Book Spine & Hinge Crease */}
          <div className="w-[7.5%] h-full shrink-0 bg-gradient-to-r from-black/8 via-black/14 to-white/70 dark:from-white/12 dark:via-black/50 dark:to-white/5 border-r border-black/12 dark:border-white/12 relative">
            <div className="absolute inset-y-0 left-[38%] w-px bg-black/20 dark:bg-black/60" />
          </div>

          {/* Main Book Cover Face */}
          <div className="flex-1 h-full px-[8.5%] py-[10%] flex flex-col items-center justify-between text-center min-w-0">
            {/* Top: LEKHIX Framed Logo + Centered Capital "IGNOU" Text (for IGNOU category) */}
            <div className="w-full flex flex-col items-center justify-center shrink-0">
              <div className="w-[29%] border-[1.5px] border-[#111111]/90 dark:border-white/95 px-[2.2cqw] py-[1.1cqw] flex items-center justify-center shrink-0">
                <svg
                  viewBox="26 26 410 88"
                  className="w-full h-auto text-[#111111] dark:text-white opacity-95 block"
                  role="img"
                  aria-label="LEKHIX"
                >
                  <g fill="currentColor">
                    <path d="M37 34 H54 V91 H85 V106 H37 Z" />
                    <path d="M103 34 H153 V49 H120 V63 H148 V77 H120 V91 H153 V106 H103 Z" />
                    <path d="M171 34 H188 V106 H171 Z" />
                    <path d="M188 70 C188 58, 198 46, 212 34 H232 L204 66 L233 106 H213 L191 74 Z" />
                    <path d="M251 34 H268 V63 H292 V34 H309 V106 H292 V77 H268 V106 H251 Z" />
                    <path d="M329 34 H346 V106 H329 Z" />
                    <path d="M364 34 H383 L394 55 L405 34 H424 L404 69 L426 106 H407 L394 82 L381 106 H362 L384 69 Z" />
                  </g>
                </svg>
              </div>

              {category === 'IGNOU' && (
                <span
                  style={{
                    marginTop: '4.4cqw',
                    fontSize: '7.6cqw',
                    color: '#0A87ED',
                    letterSpacing: '0.08em',
                  }}
                  className="font-extrabold uppercase leading-none text-center select-none pointer-events-none"
                >
                  IGNOU
                </span>
              )}
            </div>

            {/* Center: 2 Horizontal Lines Framing Title + Course Code + Release Date */}
            <div
              style={{
                paddingTop: '6.2cqw',
                paddingBottom: '6.2cqw',
                gap: '3.6cqw',
              }}
              className="w-full my-auto border-y border-black/15 dark:border-white/15 flex flex-col items-center justify-center text-center min-h-0"
            >
              <p
                style={{
                  fontSize: titleFontSize,
                  lineHeight: 1.62,
                  paddingTop: '0.16em',
                  paddingBottom: '0.16em',
                  wordBreak: 'break-word',
                }}
                className="font-editorial font-semibold text-[#111111] dark:text-white w-full"
              >
                {cleanTitle}
              </p>

              {(displayCode || cleanReleaseDate) && (
                <div
                  style={{ gap: '1.6cqw' }}
                  className="w-full flex flex-col items-center justify-center"
                >
                  {displayCode && (
                    <span
                      style={{ fontSize: '4.0cqw' }}
                      className="font-bold uppercase tracking-[0.2em] text-[#27272A] dark:text-zinc-200 tabular-nums truncate max-w-full"
                    >
                      {displayCode}
                    </span>
                  )}

                  {cleanReleaseDate && (
                    <span
                      style={{ fontSize: '4.0cqw' }}
                      className="font-bold uppercase tracking-[0.2em] text-[#52525B] dark:text-zinc-300 tabular-nums truncate max-w-full"
                    >
                      {cleanReleaseDate}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Bottom Architectural Hairline Accent */}
            <div className="w-[22%] h-px bg-black/20 dark:bg-white/20 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
