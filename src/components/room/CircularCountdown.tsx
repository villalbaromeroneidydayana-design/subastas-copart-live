import React from 'react';
import { useTranslation, Language } from '../../lib/i18n';

interface CircularCountdownProps {
  seconds: number;
  totalDuration?: number;
  status: string;
  size?: number;
  lang?: Language;
  theme?: 'dark' | 'light';
  highBidderState?: string;
  currentPrice?: number;
  highBidderPaddle?: string;
}

export const CircularCountdown: React.FC<CircularCountdownProps> = ({
  seconds,
  totalDuration = 15,
  status,
  size = 130,
  lang: propLang,
  theme = 'dark',
  highBidderState = 'California',
  currentPrice,
  highBidderPaddle,
}) => {
  const { lang: contextLang, t } = useTranslation();
  const lang = propLang || contextLang || 'en';

  const strokeWidth = theme === 'light' ? 12 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Normalizar tiempo entre 0 y 15 para el dial de Copart
  const displaySeconds = Math.min(seconds, totalDuration);
  const progress = Math.max(0, Math.min(1, displaySeconds / totalDuration));
  const strokeDashoffset = circumference - progress * circumference;

  let strokeColor = theme === 'light' ? '#1d70b8' : '#00a84d'; // Copart VB3 Blue in light theme
  const isWinningClient = Boolean(highBidderPaddle && (highBidderPaddle.includes('101') || highBidderPaddle.includes('Paleta #101')));
  if (theme === 'light' && isWinningClient) {
    strokeColor = '#00a84d'; // Verde Copart de liderazgo
  }
  let glowColor = theme === 'light' ? 'rgba(29, 112, 184, 0.25)' : 'rgba(0, 168, 77, 0.4)';
  let label = lang === 'es' ? 'OFERTAS' : 'BIDDING';

  if (status === 'prepared') {
    strokeColor = '#0284c7'; // Copart Blue
    glowColor = 'rgba(2, 132, 199, 0.25)';
    label = lang === 'es' ? 'EN ESPERA' : 'PRE-BID';
  } else if (status === 'paused') {
    strokeColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.3)';
    label = lang === 'es' ? 'PAUSADA' : 'PAUSED';
  } else if (status === 'sold') {
    strokeColor = '#eab308'; // Sold gold
    glowColor = 'rgba(234, 179, 8, 0.5)';
    label = lang === 'es' ? '¡VENDIDO!' : 'SOLD!';
  } else if (status === 'unsold') {
    strokeColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.5)';
    label = lang === 'es' ? 'FINALIZADO' : 'CLOSED';
  } else if (displaySeconds <= 4) {
    strokeColor = '#e01a22'; // Copart red alert
    glowColor = 'rgba(224, 26, 34, 0.6)';
    label = lang === 'es' ? 'ÚLTIMA LLAMADA' : 'LAST CALL!';
  } else if (displaySeconds <= 8) {
    strokeColor = '#ffb81c'; // Copart warning yellow
    glowColor = 'rgba(255, 184, 28, 0.5)';
    label = lang === 'es' ? 'A LAS DOS' : 'GOING TWICE';
  }

  const trackBg = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const fillBg = theme === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.9)';

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
      >
        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackBg}
          strokeWidth={strokeWidth}
          fill={fillBg}
        />

        {/* Dynamic countdown ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={status === 'prepared' ? 0 : strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-linear"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {theme === 'light' ? (
          /* DISEÑO IDÉNTICO A COPART VB3 LIGHT DEL SCREENSHOT */
          status === 'sold' ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {highBidderState}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 leading-tight">
                ${(currentPrice || 6150).toLocaleString()}
              </span>
              <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">
                ¡SOLD!
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs">{highBidderState.toLowerCase().includes('mexico') ? '🇲🇽' : '🇺🇸'}</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate max-w-[85px]">
                  {highBidderState}
                </span>
              </div>
              <span className={`text-xl sm:text-2xl font-black font-mono leading-tight ${isWinningClient ? 'text-emerald-600' : 'text-[#1d70b8]'}`}>
                ${(currentPrice || 6150).toLocaleString()}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9.5px] font-black uppercase tracking-wider ${isWinningClient ? 'text-emerald-700 font-bold' : 'text-[#1d70b8]'}`}>
                  {isWinningClient ? 'HIGH BIDDER ✓' : (highBidderPaddle ? `${highBidderPaddle} Bid!` : 'Bid!')}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1 rounded ${displaySeconds <= 4 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                  {displaySeconds}s
                </span>
              </div>
            </div>
          )
        ) : (
          /* MODO CLÁSICO OSCURO */
          status === 'prepared' ? (
            <>
              <span className="text-sm font-black font-mono text-cyan-300 tracking-wider">
                STANDBY
              </span>
              <span
                className="text-[9px] font-bold tracking-widest uppercase mt-0.5 px-1 py-0.2 rounded"
                style={{ color: strokeColor }}
              >
                {label}
              </span>
            </>
          ) : status === 'paused' ? (
            <>
              <span className="text-sm font-black font-mono text-amber-300 tracking-wider">
                PAUSA
              </span>
              <span
                className="text-[9px] font-bold tracking-widest uppercase mt-0.5 px-1 py-0.2 rounded"
                style={{ color: strokeColor }}
              >
                {label}
              </span>
            </>
          ) : status === 'sold' ? (
            <span className="text-xl font-black text-amber-400 tracking-wider animate-bounce">
              SOLD!
            </span>
          ) : status === 'unsold' ? (
            <span className="text-sm font-black text-rose-400 uppercase">
              CERRADO
            </span>
          ) : (
            <>
              <span
                className={`text-3xl font-black font-mono transition-transform duration-150 ${
                  displaySeconds <= 3 ? 'text-red-400 scale-110 animate-pulse' : 'text-white'
                }`}
              >
                {displaySeconds}s
              </span>
              <span
                className="text-[9px] font-bold tracking-widest uppercase mt-0.5 px-1 py-0.2 rounded"
                style={{ color: strokeColor }}
              >
                {label}
              </span>
            </>
          )
        )}
      </div>
    </div>
  );
};

