import React from 'react';

interface LekhixLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'adaptive' | 'monolith';
}

/**
 * Renders the user's original framed LEKHIX logo (LOGO (2).png):
 * Bold geometric LEKHIX wordmark with the custom curved-junction 'K'
 * enclosed in a crisp rectangular border frame, with generous kerning
 * between all letters (L E K H I X).
 */
export default function LekhixLogo({
  className = '',
  size = 'md',
  variant = 'adaptive',
}: LekhixLogoProps) {
  const dimensions = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
  }[size];

  if (variant === 'monolith') {
    return (
      <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <svg
          viewBox="0 0 460 140"
          className={`${dimensions} w-auto`}
          role="img"
          aria-label="LEKHIX"
        >
          <rect width="460" height="140" fill="#0A0A0C" />
          <rect
            x="6"
            y="6"
            width="448"
            height="128"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="11"
          />
          <g fill="#FFFFFF">
            {/* L */}
            <path d="M37 34 H54 V91 H85 V106 H37 Z" />
            {/* E */}
            <path d="M103 34 H153 V49 H120 V63 H148 V77 H120 V91 H153 V106 H103 Z" />
            {/* Custom K with signature curved/geometric junction */}
            <path d="M171 34 H188 V106 H171 Z" />
            <path d="M188 70 C188 58, 198 46, 212 34 H232 L204 66 L233 106 H213 L191 74 Z" />
            {/* H */}
            <path d="M251 34 H268 V63 H292 V34 H309 V106 H292 V77 H268 V106 H251 Z" />
            {/* I (cleanly separated from H and X) */}
            <path d="M329 34 H346 V106 H329 Z" />
            {/* X (starts at x=364, 18px clear gap from I) */}
            <path d="M364 34 H383 L394 55 L405 34 H424 L404 69 L426 106 H407 L394 82 L381 106 H362 L384 69 Z" />
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <svg
        viewBox="0 0 460 140"
        className={`${dimensions} w-auto text-[#111111] dark:text-[#FFFFFF] transition-colors duration-150`}
        role="img"
        aria-label="LEKHIX"
      >
        {/* Crisp rectangular border frame matching LOGO (2).png */}
        <rect
          x="6"
          y="6"
          width="448"
          height="128"
          fill="none"
          stroke="currentColor"
          strokeWidth="11"
        />
        <g fill="currentColor">
          {/* L */}
          <path d="M37 34 H54 V91 H85 V106 H37 Z" />
          {/* E */}
          <path d="M103 34 H153 V49 H120 V63 H148 V77 H120 V91 H153 V106 H103 Z" />
          {/* Custom K with curved junction */}
          <path d="M171 34 H188 V106 H171 Z" />
          <path d="M188 70 C188 58, 198 46, 212 34 H232 L204 66 L233 106 H213 L191 74 Z" />
          {/* H */}
          <path d="M251 34 H268 V63 H292 V34 H309 V106 H292 V77 H268 V106 H251 Z" />
          {/* I (cleanly separated from H and X) */}
          <path d="M329 34 H346 V106 H329 Z" />
          {/* X (starts at x=364, 18px clear gap from I) */}
          <path d="M364 34 H383 L394 55 L405 34 H424 L404 69 L426 106 H407 L394 82 L381 106 H362 L384 69 Z" />
        </g>
      </svg>
    </span>
  );
}
