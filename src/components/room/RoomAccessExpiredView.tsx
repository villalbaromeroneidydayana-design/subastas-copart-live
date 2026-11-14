import React from 'react';
import { CopartLogo } from '../common/CopartLogo';
import { Lock, ShieldAlert, ArrowLeft, PhoneCall, FileText } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface RoomAccessExpiredViewProps {
  onBack?: () => void;
  lotNumber?: string;
}

export const RoomAccessExpiredView: React.FC<RoomAccessExpiredViewProps> = ({
  onBack,
  lotNumber = '48291032',
}) => {
  const { lang, setLang, t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Barra superior oficial */}
      <header className="bg-[#002855] border-b-2 border-[#ffb81c] px-4 py-3 shadow-xl sticky top-0 z-40">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CopartLogo size="md" showSubtitle={true} />
            <div className="hidden sm:flex items-center gap-2 bg-[#0c192c] border border-slate-700/80 px-2.5 py-1 rounded text-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('lotPrefix')}</span>
              <span className="font-mono font-black text-amber-400">#{lotNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector EN / ES */}
            <div className="flex items-center bg-[#07111e] border border-slate-700/80 rounded-md p-0.5 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('es')}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  lang === 'es'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ES
              </button>
            </div>

            <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700 px-3 py-1 rounded text-xs font-bold text-rose-300">
              <Lock className="w-3.5 h-3.5" />
              <span>{t('expiredHeader')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor central del mensaje oficial */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="bg-[#0a1120] border-2 border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center animate-fadeIn relative overflow-hidden">
          {/* Acento superior */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-700 via-amber-500 to-rose-600" />
          
          <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase mb-3">
            {t('expiredTitle')}
          </h1>

          <div className="bg-[#050912] p-4 rounded-xl border border-slate-800/90 text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 space-y-3">
            <p className="font-semibold text-slate-200">
              {t('expiredBody1')}
            </p>
            <p className="text-slate-400 text-xs">
              {t('expiredBody2')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('btnReturnHome')}</span>
              </button>
            )}
            <div className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-semibold bg-amber-950/40 border border-amber-800/50 px-4 py-2.5 rounded-lg">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t('supportActive')}</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-[11px] text-slate-500 font-mono border-t border-slate-800/50">
        USA Auto Auctions • VB3™ Live Terminal • Secure Closure Protocol
      </footer>
    </div>
  );
};

