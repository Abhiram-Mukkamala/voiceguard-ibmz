import React from 'react';

/**
 * High-refraction liquid glass.
 * Two turbulence layers merged → feDisplacementMap scale=90 → strong lens warp.
 * Both layers animate independently so the surface is always alive (never frozen).
 */
export function LiquidGlassFilter() {
  return (
    <svg
      style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none', zIndex: -1 }}
      aria-hidden="true"
    >
      <defs>
        <filter
          id="liquid-distort"
          x="-8%" y="-8%"
          width="116%" height="116%"
          colorInterpolationFilters="sRGB"
        >
          {/* Slow broad warp */}
          <feTurbulence
            type="turbulence"
            baseFrequency="0.007 0.010"
            numOctaves="2"
            seed="5"
            result="warp-a"
          />

          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.030"
            numOctaves="3"
            seed="17"
            result="warp-b"
          />

          <feMerge result="warp-combined">
            <feMergeNode in="warp-a" />
            <feMergeNode in="warp-b" />
          </feMerge>

          {/* scale=90 → near-100% refraction */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp-combined"
            scale="90"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          <feComposite in="displaced" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  strong?: boolean;
  rounded?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function LiquidGlass({
  children,
  className = '',
  style = {},
  strong = false,
  rounded = '1rem',
  as: Tag = 'div',
}: LiquidGlassProps) {
  const cls = strong ? 'liquid-glass-strong' : 'liquid-glass';
  const AnyTag = Tag as React.ElementType;
  return (
    <AnyTag
      className={`${cls} ${className}`}
      style={{ borderRadius: rounded, ...style }}
    >
      {children}
    </AnyTag>
  );
}
