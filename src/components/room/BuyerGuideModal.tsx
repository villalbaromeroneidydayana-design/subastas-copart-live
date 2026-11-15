import React from 'react';
import { 
  HelpCircle, 
  X, 
  UserCheck, 
  PhoneCall, 
  Volume2, 
  Gavel, 
  ShieldCheck, 
  FileCheck2, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface BuyerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerName?: string;
  paddleNumber?: string;
  lotNumber?: string;
}

export const BuyerGuideModal: React.FC<BuyerGuideModalProps> = ({
  isOpen,
  onClose,
  brokerName = 'Broker Oficial Copart',
  paddleNumber = '101',
  lotNumber = '48291032',
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Tu Broker Autorizado te Representa en Vivo',
      icon: UserCheck,
      color: 'emerald',
      desc: `Tu broker (${brokerName}) está conectado en la sala operando con la Paleta Oficial #${paddleNumber}. Tú no necesitas realizar configuraciones técnicas ni presionar botones complejos; tu broker ejecuta las pujas acordadas contigo respetando el presupuesto pactado.`,
    },
    {
      step: '2',
      title: 'Coordinación Directa por Llamada de WhatsApp',
      icon: PhoneCall,
      color: 'blue',
      desc: 'Mantén la videollamada o llamada de WhatsApp activa mientras miras esta pantalla. Antes de lanzar cada oferta, tu broker te consulta el importe exacto para que tú tengas el 100% del control de la decisión de compra.',
    },
    {
      step: '3',
      title: 'Telemetría y Martillero Real Copart en Tiempo Real',
      icon: Volume2,
      color: 'amber',
      desc: 'El marcador de precio, el reloj de cuenta regresiva (10 seg) y el subastador oficial en inglés transmiten exactamente lo que ocurre en el carril de subasta en Estados Unidos. Cuando tu broker oferta, verás el marcador subir y el letrero verde "Liderando Subasta".',
    },
    {
      step: '4',
      title: 'Adjudicación Ganadora y Facturación Oficial Copart',
      icon: FileCheck2,
      color: 'purple',
      desc: 'Al cerrarse el remate con el golpe de martillo (SOLD), la compra queda confirmada para tu paleta y se emite el comprobante y Bill of Sale oficial de Copart a tu nombre para proceder con la liquidación contractual segura.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#08101e] border border-blue-500/50 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#002855]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-300 font-mono tracking-wider">
                GUÍA DE INDUCCIÓN AL COMPRADOR
              </span>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                ¿Cómo funciona tu Sala en Vivo Copart VB3?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido de Pasos */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="space-y-3.5">
            {steps.map((st) => {
              const IconComp = st.icon;
              return (
                <div
                  key={st.step}
                  className="bg-[#0b162a] border border-slate-800 rounded-xl p-4 flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    {st.step}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                      <IconComp className="w-4 h-4 text-amber-400" />
                      <span>{st.title}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caja de seguridad fiduciaria */}
          <div className="bg-[#062014] border border-emerald-500/50 rounded-xl p-3.5 flex items-center gap-3 text-emerald-200">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-[11px]">
              <strong className="text-white block font-bold mb-0.5">
                Seguridad y Transparencia Garantizada (6 Comprobaciones Oficiales):
              </strong>
              <span>
                El lote #{lotNumber} y tu intermediario cuentan con certificación oficial y cuenta fiduciaria registrada ante Copart en Estados Unidos.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#091222] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Paleta Representada: <strong className="text-amber-400 font-black">#{paddleNumber}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Entendido, volver a la sala
          </button>
        </div>
      </div>
    </div>
  );
};
