import React from 'react';

/**
 * HarshaX Futuristic Logo Component
 * 
 * Recreates the exact futuristic geometric "HX" emblem, luminous cosmic swoosh,
 * wide geometric "HARSHAX" wordmark, and horizon laser flare beam,
 * perfectly color-blended for lavender (#F3EEFF) and crisp white (#FFFFFF) themes.
 * 
 * Variants:
 * - 'horizontal' (default for navbar/headers): Sleek side-by-side emblem + typography + flare line
 * - 'full' (for login/register/footer/splash): Master stacked insignia (emblem on top, wide wordmark & beam)
 * - 'icon' (for badges/avatars/tickets/favicons): Standalone HX emblem with cosmic swoosh
 * 
 * @param {'horizontal' | 'full' | 'icon'} variant
 * @param {number|string} height - Height of the logo in pixels or CSS units
 * @param {number|string} width - Optional width (calculated automatically by aspect ratio if omitted)
 * @param {string} className - Optional CSS classes
 * @param {object} style - Additional inline styles
 */
export const Logo = ({
  variant = 'horizontal',
  height,
  width,
  className = '',
  style = {},
  ...props
}) => {
  // Shared Gradient Defs
  const renderDefs = (idPrefix = 'hx') => (
    <defs>
      {/* Metallic chrome gradient for H */}
      <linearGradient id={`${idPrefix}-metal`} x1="0.1" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="18%" stopColor="#F1F5F9" />
        <stop offset="38%" stopColor="#CBD5E1" />
        <stop offset="52%" stopColor="#E9D5FF" />
        <stop offset="72%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>

      {/* Metallic bevel facet for H */}
      <linearGradient id={`${idPrefix}-facet`} x1="0" y1="0" x2="1" y2="0.8">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#475569" stopOpacity="0.7" />
      </linearGradient>

      {/* Metallic outline edge */}
      <linearGradient id={`${idPrefix}-edge`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#334155" stopOpacity="0.5" />
      </linearGradient>

      {/* Electric purple gradient for X */}
      <linearGradient id={`${idPrefix}-purple`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="22%" stopColor="#C084FC" />
        <stop offset="65%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7E22CE" />
      </linearGradient>

      {/* Cosmic swoosh luminous gradient */}
      <linearGradient id={`${idPrefix}-swoosh-grad`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.1" />
        <stop offset="20%" stopColor="#A855F7" />
        <stop offset="48%" stopColor="#C084FC" />
        <stop offset="72%" stopColor="#FFFFFF" />
        <stop offset="88%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.6" />
      </linearGradient>

      {/* Wordmark HARSHA metallic navy gradient */}
      <linearGradient id={`${idPrefix}-word-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="45%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      {/* Wordmark X electric violet gradient */}
      <linearGradient id={`${idPrefix}-word-x`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D8B4FE" />
        <stop offset="40%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>

      {/* Laser beam gradient */}
      <linearGradient id={`${idPrefix}-beam-grad`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#A855F7" stopOpacity="0" />
        <stop offset="25%" stopColor="#A855F7" stopOpacity="0.5" />
        <stop offset="45%" stopColor="#C084FC" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#FFFFFF" />
        <stop offset="55%" stopColor="#C084FC" stopOpacity="0.95" />
        <stop offset="75%" stopColor="#A855F7" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
      </linearGradient>

      {/* Flare core glow */}
      <radialGradient id={`${idPrefix}-flare-core`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="35%" stopColor="#E9D5FF" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#A855F7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
      </radialGradient>

      {/* Soft shadow filter for contrast against white/lavender */}
      <filter id={`${idPrefix}-soft-shadow`} x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#17152B" floodOpacity="0.18" />
      </filter>

      {/* Purple aura glow */}
      <filter id={`${idPrefix}-purple-glow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // Reusable Emblem Geometry (in 520x280 local space)
  const renderEmblemGroup = (idPrefix = 'hx') => (
    <g id={`${idPrefix}-emblem-group`}>
      {/* LETTER H */}
      <path
        d="M 194 70 L 232 70 L 202 135 L 262 135 L 292 70 L 330 70 L 266 208 L 250 242 L 226 214 L 238 188 L 178 188 L 166 214 L 134 242 L 150 208 L 176 152 L 168 85 Z"
        fill={`url(#${idPrefix}-metal)`}
        stroke={`url(#${idPrefix}-edge)`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* H 3D Facets */}
      <path d="M 194 70 L 232 70 L 176 152 L 168 85 Z" fill={`url(#${idPrefix}-facet)`} opacity="0.6" />
      <path d="M 292 70 L 330 70 L 280 178 L 262 135 Z" fill={`url(#${idPrefix}-facet)`} opacity="0.5" />

      {/* LETTER X */}
      <path d="M 398 70 L 436 70 L 340 238 L 302 238 Z" fill={`url(#${idPrefix}-purple)`} />
      <path d="M 334 70 L 372 70 L 468 238 L 430 238 Z" fill={`url(#${idPrefix}-purple)`} />
      <path d="M 374 125 L 406 125 L 392 165 L 360 165 Z" fill="#FFFFFF" opacity="0.25" />

      {/* COSMIC ORBITAL SWOOSH LOOP */}
      <path
        d="M 132 242 C 188 238, 258 220, 318 195 C 373 172, 428 135, 463 95 C 488 65, 506 32, 483 22 C 458 12, 433 45, 408 80 C 438 45, 468 28, 483 35 C 498 42, 483 75, 453 110 C 413 155, 353 192, 293 218 C 228 245, 168 252, 132 242 Z"
        fill={`url(#${idPrefix}-swoosh-grad)`}
        filter={`url(#${idPrefix}-purple-glow)`}
      />
      <path
        d="M 160 238 C 240 220, 340 180, 420 120 C 470 82, 495 42, 478 30"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </g>
  );

  // 1. HORIZONTAL VARIANT (Recommended for Navbar & Sticky Headers)
  if (variant === 'horizontal') {
    const computedHeight = height || 38;
    const computedWidth = width || (typeof computedHeight === 'number' ? Math.round(computedHeight * (330 / 58)) : 'auto');

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 330 58"
        width={computedWidth}
        height={computedHeight}
        preserveAspectRatio="xMidYMid meet"
        className={`harshax-logo-horizontal ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
        aria-label="HarshaX Logo"
        {...props}
      >
        {renderDefs('hx-hz')}

        <g filter="url(#hx-hz-soft-shadow)">
          {/* Scaled Emblem on the Left */}
          <g transform="translate(-14, 2) scale(0.23)">
            {renderEmblemGroup('hx-hz')}
          </g>

          {/* Futuristic Typography on the Right */}
          <g transform="translate(102, 36)">
            <text
              x="0"
              y="0"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Montserrat', 'Orbitron', sans-serif"
              fontSize="28"
              fontWeight="900"
              letterSpacing="0.14em"
              fill="url(#hx-hz-word-metal)"
            >
              HARSHA
            </text>
            <text
              x="138"
              y="0"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Montserrat', 'Orbitron', sans-serif"
              fontSize="28"
              fontWeight="900"
              letterSpacing="0.14em"
              fill="url(#hx-hz-word-x)"
            >
              X
            </text>
          </g>

          {/* Glowing Horizon Laser Line under Typography */}
          <g transform="translate(102, 46)">
            <line x1="0" y1="0" x2="200" y2="0" stroke="url(#hx-hz-beam-grad)" strokeWidth="1.8" />
            <ellipse cx="148" cy="0" rx="20" ry="2" fill="url(#hx-hz-flare-core)" />
            <circle cx="148" cy="0" r="1.5" fill="#FFFFFF" filter="url(#hx-hz-purple-glow)" />
          </g>
        </g>
      </svg>
    );
  }

  // 2. ICON-ONLY VARIANT (Emblem only)
  if (variant === 'icon') {
    const computedHeight = height || 38;
    const computedWidth = width || (typeof computedHeight === 'number' ? Math.round(computedHeight * (520 / 280)) : 'auto');

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 520 280"
        width={computedWidth}
        height={computedHeight}
        preserveAspectRatio="xMidYMid meet"
        className={`harshax-logo-icon ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
        aria-label="HarshaX Emblem"
        {...props}
      >
        {renderDefs('hx-ico')}
        <g filter="url(#hx-ico-soft-shadow)" transform="translate(-50, -5)">
          {renderEmblemGroup('hx-ico')}
        </g>
      </svg>
    );
  }

  // 3. FULL MASTER STACKED VARIANT (Emblem on top, Wordmark + Beam below)
  const computedHeight = height || 52;
  const computedWidth = width || (typeof computedHeight === 'number' ? Math.round(computedHeight * (640 / 400)) : 'auto');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 400"
      width={computedWidth}
      height={computedHeight}
      preserveAspectRatio="xMidYMid meet"
      className={`harshax-logo-full ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
      aria-label="HarshaX Logo"
      {...props}
    >
      {renderDefs('hx-full')}

      <g filter="url(#hx-full-soft-shadow)">
        {/* Emblem */}
        <g transform="translate(10, 0)">
          {renderEmblemGroup('hx-full')}
        </g>

        {/* Wordmark */}
        <g transform="translate(320, 335)">
          <text
            x="-36"
            y="0"
            textAnchor="end"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Montserrat', 'Orbitron', sans-serif"
            fontSize="44"
            fontWeight="900"
            letterSpacing="0.22em"
            fill="url(#hx-full-word-metal)"
          >
            HARSHA
          </text>
          <text
            x="-14"
            y="0"
            textAnchor="start"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Montserrat', 'Orbitron', sans-serif"
            fontSize="44"
            fontWeight="900"
            letterSpacing="0.22em"
            fill="url(#hx-full-word-x)"
          >
            X
          </text>
        </g>

        {/* Horizon Laser Flare Beam */}
        <g>
          <line x1="70" y1="368" x2="570" y2="368" stroke="url(#hx-full-beam-grad)" strokeWidth="2.5" />
          <ellipse cx="320" cy="368" rx="48" ry="4" fill="url(#hx-full-flare-core)" />
          <circle cx="320" cy="368" r="3" fill="#FFFFFF" filter="url(#hx-full-purple-glow)" />
        </g>
      </g>
    </svg>
  );
};

export default Logo;
