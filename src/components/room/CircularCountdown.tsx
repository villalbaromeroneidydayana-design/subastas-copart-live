import React from 'react';
import { useTranslation, Language } from '../../lib/i18n';

interface CircularCountdownProps {
  seconds: number;
  totalDuration?: number;
  status: string;
  size?: number;
  lang?: Language;
}

export const CircularCountdown: React.FC<CircularCountdownProps> = ({
  seconds,
  totalDuration = 10,
  status,
  size = 130,
  lang: propLang,
}) => {
  const { lang: contextLang, t } = useTranslation();
  const lang = propLang || contextLang || 'en';

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Normalizar tiempo entre 0 y 10 para el dial de Copart
  const displaySeconds = Math.min(seconds, totalDuration);
  const progress = Math.max(0, Math.min(1, displaySeconds / totalDuration));
  const strokeDashoffset = circumference - progress * circumference;

  let strokeColor = '#00a84d'; // Copart green
  let glowColor = 'rgba(0, 168, 77, 0.4)';
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
  } else if (displaySeconds <= 3) {
    strokeColor = '#e01a22'; // Copart red alert
    glowColor = 'rgba(224, 26, 34, 0.6)';
    label = lang === 'es' ? 'ÚLTIMA LLAMADA' : 'LAST CALL!';
  } else if (displaySeconds <= 6) {
    strokeColor = '#ffb81c'; // Copart warning yellow
    glowColor = 'rgba(255, 184, 28, 0.5)';
    label = lang === 'es' ? 'A LAS DOS' : 'GOING TWICE';
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="rgba(15, 23, 42, 0.9)"
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {status === 'prepared' ? (
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
        )}
      </div>
    </div>
  );
};

