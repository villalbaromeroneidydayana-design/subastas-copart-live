import React, { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, User, Phone, Car, Share2 } from 'lucide-react';
import { Vehicle } from '../../types';

interface WhatsAppInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerUrl: string;
  vehicle: Vehicle | null | undefined;
  buyerName?: string;
  lotNumber?: string;
  yardLocation?: string;
  paddleNumber?: string;
}

export const WhatsAppInviteModal: React.FC<WhatsAppInviteModalProps> = ({
  isOpen,
  onClose,
  buyerUrl,
  vehicle,
  buyerName = 'Cliente VIP',
  lotNumber,
  yardLocation,
  paddleNumber = '101',
}) => {
  const [clientName, setClientName] = useState(buyerName);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lot = lotNumber || vehicle?.lot_number || '48291032';
  const vehTitle = `${vehicle?.year || 2023} ${vehicle?.brand || 'Ford'} ${vehicle?.model || 'Mustang GT'}`;
  const yard = yardLocation || vehicle?.location || 'Atlanta East Yard 12 (Georgia, USA)';

  const defaultMessage = `🏛️ ACCESO VIP: SALA OFICIAL DE SUBASTAS COPART VB3

Estimado/a ${clientName.trim() || 'Cliente'},

Le comparto su enlace de acceso exclusivo a la sala de subastas de Copart (Lane A), donde estaré representando sus ofertas en tiempo real:

🚗 Vehículo: ${vehTitle}
🏷️ Lote Copart: #${lot}
📍 Patio Asignado: ${yard}
🎟️ Su Paleta Oficial: #${paddleNumber} (Broker Autorizado)

👉 Ingrese a la sala en vivo con un solo clic aquí:
${buyerUrl}

📞 Seguimos conectados por videollamada de WhatsApp para coordinar juntos cada oferta al momento que inicie el remate.`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(defaultMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(defaultMessage);
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0b1323] border border-emerald-500/60 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#072418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-wider">
                COPART VB3 • BROKER DESK
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Invitar al Cliente por WhatsApp
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

        {/* Formulario rápido */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nombre del Cliente:</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Carlos Mendoza"
                className="w-full bg-[#050c18] border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Teléfono con prefijo (Opcional):</span>
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ej: +52 55 1234 5678"
                className="w-full bg-[#050c18] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Previsualización del mensaje */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">
              Mensaje Pre-redactado para enviar por WhatsApp:
            </label>
            <textarea
              rows={9}
              readOnly
              value={defaultMessage}
              className="w-full bg-[#040812] border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] leading-relaxed resize-none select-all"
            />
          </div>

          <div className="bg-[#081525] border border-blue-900/60 p-3 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px]">
            <Car className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              El cliente recibirá este mensaje, tocará el enlace y entrará de inmediato a la <strong>Sala en Vivo</strong> con vista oficial de Copart VB3. Mientras mira la pantalla, ustedes siguen coordinando cada oferta por la llamada de WhatsApp.
            </span>
          </div>
        </div>

        {/* Footer con Botones */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#08111e] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-6 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-emerald-950 active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Abrir WhatsApp y Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

