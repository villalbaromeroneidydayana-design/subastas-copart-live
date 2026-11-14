import React from 'react';

interface AuctionBrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AuctionBrandLogo: React.FC<AuctionBrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: { width: 140, height: 38 },
    md: { width: 175, height: 46 },
    lg: { width: 220, height: 58 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 220 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="brandRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* Live Signal Beacon Dot */}
        <circle cx="28" cy="12" r="4" fill="#ef4444" className="animate-ping" opacity="0.8" />
        <circle cx="28" cy="12" r="3" fill="#ef4444" />

        {/* Gavel / Hexagon Icon Badge */}
        <path
          d="M 12 18 L 28 9 L 44 18 L 44 36 L 28 45 L 12 36 Z"
          fill="#0c1524"
          stroke="url(#brandGold)"
          strokeWidth="2"
        />
        <path
          d="M 22 28 L 34 20 M 20 25 L 25 21 M 31 31 L 36 27"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Main Logo Text */}
        <text
          x="55"
          y="32"
          fill="#ffffff"
          fontSize="22"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          AUTOBID
        </text>
        <text
          x="152"
          y="32"
          fill="#38bdf8"
          fontSize="22"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
        >
          LIVE
        </text>

        {/* Subtitle Badge */}
        <rect x="55" y="36" width="138" height="10" rx="2" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        <text
          x="124"
          y="44"
          fill="#94a3b8"
          fontSize="7.5"
          fontWeight="700"
          fontFamily="monospace"
          textAnchor="middle"
          letterSpacing="1.5px"
        >
          VB3 TERMINAL EN DIRECTO
        </text>
      </svg>
    </div>
  );
};

