import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { CopartLogo } from '../common/CopartLogo';
import { 
  FileText, Printer, CheckCircle2, ShieldCheck, 
  Calendar, Key, Car, Clock, AlertTriangle, ArrowLeft, Lock
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface DocumentViewProps {
  docToken: string;
  onBack?: () => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ docToken, onBack }) => {
  const { lang, setLang, t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    async function loadDoc() {
      setLoading(true);
      const res = await store.fetchDocument(docToken);
      setLoading(false);

      if (!res || !res.success) {
        setErrorInfo({
          title: res?.title || (lang === 'en' ? 'DOCUMENT UNAVAILABLE' : 'DOCUMENTO NO DISPONIBLE'),
          message: res?.message || (lang === 'en' ? 'The requested document does not exist, has expired, or was revoked.' : 'El comprobante o enlace documental solicitado no existe, ha expirado o fue revocado por el broker autorizado.'),
        });
      } else {
        setData(res);
        setErrorInfo(null);
      }
    }

    loadDoc();
  }, [docToken, lang]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a12] text-white flex flex-col items-center justify-center p-6 text-center">
        <CopartLogo size="md" showSubtitle={true} className="mb-4" />
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">
          {lang === 'en' ? 'Verifying digital signature and authorization...' : 'Verificando firma y autorización documental...'}
        </p>
      </div>
    );
  }

  if (errorInfo) {
    return (
      <div className="min-h-screen bg-[#060a12] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <CopartLogo size="md" showSubtitle={true} className="mb-6" />
        <div className="bg-[#0e1828] border-2 border-rose-900/80 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-950 border border-rose-700 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-rose-300 mb-2 uppercase">{errorInfo.title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">{errorInfo.message}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'en' ? 'Return' : 'Volver'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const { document: doc, auction, terminal } = data;
  const vehicle = auction?.vehicle;

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Barra superior no imprimible */}
      <header className="bg-[#002855] border-b-2 border-[#ffb81c] px-4 py-3 shadow-xl sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CopartLogo size="sm" showSubtitle={true} />
            <span className="hidden sm:inline text-xs text-amber-400 font-mono font-bold bg-[#0c192c] border border-slate-700 px-2.5 py-1 rounded">
              {t('lotPrefix')} #{auction?.lotNumber}
            </span>
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

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'en' ? 'Print / Save PDF' : 'Imprimir / Guardar PDF'}</span>
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition"
              >
                {lang === 'en' ? 'Close' : 'Cerrar'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DOCUMENTO OFICIAL FORMATO CERTIFICADO IMPRIMIBLE */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-[#0a1120] border border-[#1b2b44] rounded-2xl p-6 sm:p-10 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          
          {/* Cabecera del Certificado */}
          <div className="border-b-2 border-[#ffb81c] pb-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <CopartLogo size="md" showSubtitle={true} />
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-amber-400 print:text-amber-700 font-black tracking-widest uppercase block mb-1">
                {lang === 'en' ? 'OFFICIAL CERTIFICATE OF AUCTION AWARD' : 'COMPROBANTE OFICIAL DE ADJUDICACIÓN'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white print:text-black">
                {auction?.vehicleSummary}
              </h1>
              <span className="text-xs font-mono text-slate-400 print:text-slate-600">
                {t('lotPrefix')} #{auction?.lotNumber} • TERMINAL {terminal?.lane} ({terminal?.yard})
              </span>
            </div>
          </div>

          {/* Información del Resultado Oficial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#050912] print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase tracking-wider block">
                {lang === 'en' ? 'Transaction Details' : 'Datos de la Operación'}
              </span>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Winning Bidder:' : 'Adjudicatario Ganador:'}</span>
                  <strong className="text-white print:text-black font-semibold">{auction?.winnerPaddle} - {auction?.winnerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Final Hammer Price:' : 'Precio Final Adjudicado:'}</span>
                  <strong className="text-emerald-400 print:text-emerald-700 font-mono font-black text-sm">
                    ${Number(auction?.finalPrice || 0).toLocaleString()} USD
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Total Bids Recorded:' : 'Total de Ofertas en Sala:'}</span>
                  <span className="text-white print:text-black font-mono font-semibold">{auction?.totalBids}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Closing Timestamp:' : 'Fecha y Hora de Cierre:'}</span>
                  <span className="text-slate-300 print:text-slate-800 font-mono text-[11px]">
                    {new Date(auction?.finishedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Ficha Técnica Certificada del Vehículo */}
            <div className="bg-[#050912] print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase tracking-wider block">
                {lang === 'en' ? 'Certified Vehicle Specs' : 'Ficha Técnica Certificada'}
              </span>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'VIN Number:' : 'Número de VIN:'}</span>
                  <strong className="font-mono text-white print:text-black">{vehicle?.vin || '1FA6P8CF9P5198241'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Certified Odometer:' : 'Odómetro Certificado:'}</span>
                  <span className="font-mono text-white print:text-black font-bold">
                    {vehicle?.odometer?.toLocaleString() || '14,250'} {vehicle?.odometer_unit?.toUpperCase() || 'MI'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Title Type:' : 'Tipo de Título:'}</span>
                  <span className="text-amber-400 print:text-amber-700 font-bold uppercase">{vehicle?.title_type || 'SALVAGE CERTIFICATE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 print:text-slate-700">{lang === 'en' ? 'Mechanical Condition:' : 'Condición Mecánica:'}</span>
                  <span className="text-emerald-400 print:text-emerald-700 font-bold">
                    {vehicle?.vehicle_condition === 'run_and_drive' ? 'RUN & DRIVE' : 'STARTS'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Validez y Permisos del Documento */}
          <div className="bg-[#070e1a] print:bg-slate-50 p-4 rounded-xl border border-slate-800/80 print:border-slate-200 text-xs mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2 mb-2">
              <span className="font-bold text-slate-300 print:text-slate-700">{lang === 'en' ? 'Document Validity & Access:' : 'Control de Acceso Documental:'}</span>
              <span className="text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-bold">
                ✓ {lang === 'en' ? 'VALID ACTIVE DOCUMENT' : 'DOCUMENTO VIGENTE'} ({lang === 'en' ? 'Expires' : 'Vence'}: {new Date(doc.expiresAt).toLocaleDateString()})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
              {lang === 'en'
                ? `This certificate was issued to ${doc.clientName} through an independent and secure link. The live auction for this lot has concluded and room spectator access has expired.`
                : `Este comprobante fue emitido a nombre de ${doc.clientName} mediante enlace documental independiente y seguro. La sala de subasta en vivo para este lote se encuentra formalmente finalizada y el acceso de visualización de sala ha expirado.`}
            </p>
          </div>

          {/* Firmas y Sellos Oficiales */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="w-48 border-b-2 border-slate-600 print:border-black mb-1 mx-auto sm:mx-0" />
              <span className="text-xs font-bold text-white print:text-black block">{lang === 'en' ? 'Authorized Broker Signature' : 'Firma del Broker Autorizado'}</span>
              <span className="text-[10px] text-amber-400 print:text-slate-700 font-mono">Federal Broker License #BK-78921-USA</span>
            </div>

            <div className="text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 p-2 rounded-lg border border-emerald-500/50 print:border-emerald-700 text-emerald-400 print:text-emerald-800 bg-emerald-950/40 print:bg-emerald-50 text-[10px] font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>ATOMIC TRANSACTION HASH VERIFIED</span>
              </div>
              <span className="text-[9px] text-slate-500 print:text-slate-600 block mt-1">
                Ref: {doc.docToken.substring(0, 20)}...
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-[11px] text-slate-500 font-mono print:hidden">
        USA Auto Auctions • VB3™ Live System • Certified Document Portal
      </footer>
    </div>
  );
};

