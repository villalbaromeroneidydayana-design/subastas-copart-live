import React from 'react';

interface CopartLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const CopartLogo: React.FC<CopartLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const sizeMap = {
    sm: { width: 110, height: 38 },
    md: { width: 140, height: 48 },
    lg: { width: 180, height: 60 },
    xl: { width: 230, height: 78 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="copartRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7a8b9e" />
            <stop offset="50%" stopColor="#c5d1e0" />
            <stop offset="100%" stopColor="#4a5868" />
          </linearGradient>
          <linearGradient id="copartBlueSwoosh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0072ce" />
            <stop offset="100%" stopColor="#003a8c" />
          </linearGradient>
          <filter id="copartShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6"/>
          </filter>
        </defs>

        {/* The iconic Red Dot at the top center of Copart oval */}
        <circle cx="115" cy="7" r="4.5" fill="#e01a22" className="animate-pulse" />

        {/* Outer metallic border ellipse */}
        <ellipse cx="115" cy="36" rx="72" ry="24" fill="url(#copartRing)" />
        
        {/* Inner black ellipse */}
        <ellipse cx="115" cy="36" rx="67" ry="20" fill="#0c1118" />

        {/* Lower blue swoosh inside the ellipse */}
        <path
          d="M 54 39 C 68 53, 155 53, 172 38 C 160 48, 75 48, 54 39 Z"
          fill="url(#copartBlueSwoosh)"
        />

        {/* "Copart" text in bold italic white font */}
        <text
          x="112"
          y="44"
          fill="#ffffff"
          fontSize="33"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Impact, Arial Black, sans-serif"
          textAnchor="middle"
          letterSpacing="-0.5px"
          filter="url(#copartShadow)"
        >
          Copart
        </text>
      </svg>

      {showSubtitle && (
        <div className="flex flex-col leading-tight border-l border-slate-700 pl-2">
          <span className="text-xs font-bold text-amber-400 tracking-wider">VB3™ LIVE</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Auction Terminal</span>
        </div>
      )}
    </div>
  );
};

