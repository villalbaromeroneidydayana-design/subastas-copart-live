import React from 'react';

interface CountryFlagProps {
  code?: string;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code = 'us', className = 'w-5 h-3.5' }) => {
  const c = (code || 'us').toLowerCase();

  // 1. Emiratos Árabes Unidos (UAE / Dubai)
  if (c.includes('uae') || c.includes('emirates') || c.includes('dubai') || c.includes('arab') || c.includes('🇦🇪') || c === 'ae') {
    return (
      <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="United Arab Emirates">
        <path fill="#00732f" d="M0 0h640v160H0z"/>
        <path fill="#ffffff" d="M0 160h640v160H0z"/>
        <path fill="#000000" d="M0 320h640v160H0z"/>
        <path fill="#ff0000" d="M0 0h160v480H0z"/>
      </svg>
    );
  }

  // 2. Irak (Iraq / Baghdad)
  if (c.includes('iraq') || c.includes('baghdad') || c.includes('irak') || c.includes('🇮🇶') || c === 'iq') {
    return (
      <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="Iraq">
        <path fill="#ce1126" d="M0 0h640v160H0z"/>
        <path fill="#ffffff" d="M0 160h640v160H0z"/>
        <path fill="#000000" d="M0 320h640v160H0z"/>
        <text x="320" y="260" textAnchor="middle" fill="#007a3d" fontSize="68" fontWeight="bold" fontFamily="sans-serif">الله أكبر</text>
      </svg>
    );
  }

  // 3. México
  if (c.includes('mexico') || c.includes('méxico') || c.includes('monterrey') || c.includes('🇲🇽') || c === 'mx') {
    return (
      <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="Mexico">
        <path fill="#006847" d="M0 0h213.3v480H0z"/>
        <path fill="#ffffff" d="M213.3 0h213.4v480H213.3z"/>
        <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
        <circle cx="320" cy="240" r="34" fill="#8b5a2b"/>
        <circle cx="320" cy="240" r="18" fill="#d4af37"/>
      </svg>
    );
  }

  // 4. Canadá
  if (c.includes('canada') || c.includes('toronto') || c.includes('ontario') || c.includes('🇨🇦') || c === 'ca') {
    return (
      <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="Canada">
        <path fill="#ff0000" d="M0 0h160v480H0zM480 0h160v480H480z"/>
        <path fill="#ffffff" d="M160 0h320v480H160z"/>
        <path fill="#ff0000" d="M320 140l22 55h45l-35 32 18 55-50-34-50 34 18-55-35-32h45z"/>
      </svg>
    );
  }

  // 5. Alemania (Germany)
  if (c.includes('germany') || c.includes('alemania') || c.includes('🇩🇪') || c === 'de') {
    return (
      <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="Germany">
        <path fill="#000000" d="M0 0h640v160H0z"/>
        <path fill="#dd0000" d="M0 160h640v160H0z"/>
        <path fill="#ffce00" d="M0 320h640v160H0z"/>
      </svg>
    );
  }

  // 6. Estados Unidos (USA por defecto para Texas, California, Florida, etc.)
  return (
    <svg viewBox="0 0 640 480" className={`${className} inline-block rounded-[1px] shadow-xs border border-slate-300 shrink-0`} title="United States">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#ffffff" strokeWidth="37" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
      <path fill="#192f5d" d="M0 0h260v260H0z"/>
      <g fill="#ffffff">
        <circle cx="45" cy="45" r="9"/>
        <circle cx="105" cy="45" r="9"/>
        <circle cx="165" cy="45" r="9"/>
        <circle cx="215" cy="45" r="9"/>
        <circle cx="75" cy="95" r="9"/>
        <circle cx="135" cy="95" r="9"/>
        <circle cx="190" cy="95" r="9"/>
        <circle cx="45" cy="145" r="9"/>
        <circle cx="105" cy="145" r="9"/>
        <circle cx="165" cy="145" r="9"/>
        <circle cx="215" cy="145" r="9"/>
        <circle cx="75" cy="195" r="9"/>
        <circle cx="135" cy="195" r="9"/>
        <circle cx="190" cy="195" r="9"/>
      </g>
    </svg>
  );
};
