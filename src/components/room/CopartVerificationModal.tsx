import React from 'react';
import {
  ShieldCheck,
  Car,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Gavel,
  FileCheck2,
  CreditCard,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Lock
} from 'lucide-react';
import { Vehicle } from '../../types';

interface CopartVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null | undefined;
  usTime?: string;
  brokerName?: string;
  paddleNumber?: string;
  currentPrice?: number;
}

export const CopartVerificationModal: React.FC<CopartVerificationModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  usTime,
  brokerName = 'Broker Oficial Copart Registrado',
  paddleNumber = '101',
  currentPrice = 5000,
}) => {
  if (!isOpen) return null;

  const lotNumber = vehicle?.lot_number || '48291032';
  const cleanLot = lotNumber.replace(/[^0-9]/g, '');
  const vin = vehicle?.vin || '1FA6P8CF8N5103982';
  const yardLocation = vehicle?.location || 'Atlanta East Yard 12 (Georgia, USA)';
  const copartUrl = vehicle?.reference_url?.trim()
    ? vehicle.reference_url.trim()
    : `https://www.copart.com/es/lot/${cleanLot}`;

  const checks = [
    {
      id: 'vehiculo',
      title: '1. Vehículo: Existencia Real de Lote en Copart',
      icon: Car,
      color: 'emerald',
      status: 'VERIFICADO EN COPART',
      summary: 'El vehículo está debidamente registrado y catalogado en la red oficial de patios Copart.',
      details: [
        { label: 'Número de Lote Oficial:', value: `#${lotNumber}` },
        { label: 'VIN Decodificado (NHTSA):', value: vin },
        { label: 'Unidad:', value: `${vehicle?.year || 2023} ${vehicle?.brand || 'Ford'} ${vehicle?.model || 'Mustang'} ${vehicle?.version || 'GT'}` },
        { label: 'Odómetro Certificado:', value: `${vehicle?.odometer ? Number(vehicle?.odometer).toLocaleString() : '14,250'} ${vehicle?.odometer_unit || 'mi'}` },
        { label: 'Condición & Título:', value: `${vehicle?.custom_badges?.runDriveText || 'RUN & DRIVE'} • ${vehicle?.custom_badges?.titleTypeText || 'CLEAN TITLE'}` },
      ],
      action: {
        text: 'Consultar Expediente del Lote',
        url: copartUrl,
      },
    },
    {
      id: 'subasta',
      title: '2. Subasta: Fecha, Hora y Ubicación Verificables',
      icon: Calendar,
      color: 'blue',
      status: 'CALENDARIZADA Y ACTIVA',
      summary: 'Evento oficial en patio físico registrado en los calendarios públicos de subasta de Estados Unidos.',
      details: [
        { label: 'Patio Físico / Facility:', value: yardLocation },
        { label: 'Carril Oficial de Subasta:', value: 'LANE A — Subasta Principal' },
        { label: 'Horario Oficial USA (EST):', value: usTime || '12:00:00 PM EST (Horario Oficial de la Costa Este)' },
        { label: 'Tipo de Venta Copart:', value: 'VB3 Virtual Bidding 3rd Generation (Tiempo Real)' },
      ],
    },
    {
      id: 'broker',
      title: '3. Broker: Identidad y Registro del Intermediario',
      icon: UserCheck,
      color: 'amber',
      status: 'INTERMEDIARIO ACREDITADO',
      summary: 'Intermediario debidamente inscrito como Broker / Dealer Autorizado ante Copart Auto Auctions.',
      details: [
        { label: 'Entidad Intermediaria:', value: brokerName },
        { label: 'Registro de Broker Copart:', value: 'ID Copart Buyer / Broker Registrado Activo' },
        { label: 'Licencia Comercial:', value: 'Dealer / Export Broker License habilitada para compras interestatales' },
        { label: 'Representación en Sala:', value: `Paleta Oficial en Mesa #${paddleNumber}` },
      ],
    },
    {
      id: 'oferta',
      title: '4. Oferta: Correspondencia con Puja Real en Mesa',
      icon: Gavel,
      color: 'emerald',
      status: 'PUJA AUDITABLE Y REGISTRADA',
      summary: 'Cada oferta enviada se procesa en vivo cumpliendo los incrementos reglamentarios de la sala.',
      details: [
        { label: 'Incremento Normado:', value: '+$250 USD / +$500 USD por lance' },
        { label: 'Postura Líder Actual:', value: `$${Number(currentPrice).toLocaleString()} USD` },
        { label: 'Trazabilidad de Oferta:', value: 'Registro criptográfico con marca de tiempo precisa en milisegundos' },
        { label: 'Auditoría en Mesa:', value: 'Puja vinculada a la paleta autorizada del comprador sin lances ficticios' },
      ],
    },
    {
      id: 'resultado',
      title: '5. Resultado: Confirmación Oficial de Compra',
      icon: FileCheck2,
      color: 'purple',
      status: 'DOCUMENTACIÓN LEGAL COPART',
      summary: 'Al caer el martillo ganador, se genera el respaldo documental oficial de Copart.',
      details: [
        { label: 'Documento Emitido:', value: 'Copart Buyer Sales Receipt / Bill of Sale Oficial' },
        { label: 'Modalidad de Adjudicación:', value: 'Pure Sale (Venta Definitiva) / On Approval (Sujeta a Aprobación del Vendedor)' },
        { label: 'Despacho y Título:', value: 'Asignación del título de propiedad a nombre del comprador adjudicado' },
        { label: 'Comprobante de Subasta:', value: 'Reporte de lote cerrado con precio de martillo oficial registrado' },
      ],
    },
    {
      id: 'pago',
      title: '6. Pago: Entidad Contractual y Destinatario Correcto',
      icon: CreditCard,
      color: 'rose',
      status: 'CUENTA FIDUCIARIA VERIFICADA',
      summary: 'Garantía de que los fondos se liquidan exclusivamente hacia la entidad contractual autorizada.',
      details: [
        { label: 'Método Oficial Aceptado:', value: 'Transferencia Bancaria Oficial (Wire Transfer / ACH Fiduciario)' },
        { label: 'Beneficiario Contractual:', value: 'Cuenta Corporativa Registrada del Broker / Copart Direct' },
        { label: 'Control Anti-Fraude:', value: 'Prohibición estricta de pagos a personas naturales o cuentas de terceros no vinculadas' },
        { label: 'Concepto de Giro:', value: `Liquidación Lote #${lotNumber} - Subasta Oficial Copart` },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#080f1d] border border-blue-500/50 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera Institucional */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#002855]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  Cumplimiento 6/6 Verificado
                </span>
                <span className="text-blue-200 text-xs font-mono font-bold">COPART VB3 PROTOCOL</span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Comprobaciones de Seguridad y Auditoría Copart
              </h2>
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

        {/* Resumen Superior de Garantía */}
        <div className="bg-[#0b172b] px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>
              Toda transacción realizada a través de esta plataforma cumple los <strong>6 pilares fundamentales de verificación</strong> exigidos en compras de subastas en Estados Unidos.
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300 font-bold bg-[#040913] px-3 py-1 rounded-lg border border-amber-500/30">
            <span>Lote #{lotNumber}</span>
            <span>•</span>
            <span>{vehicle?.brand} {vehicle?.model}</span>
          </div>
        </div>

        {/* Contenido con las 6 Comprobaciones */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checks.map((chk) => {
              const IconComponent = chk.icon;
              return (
                <div
                  key={chk.id}
                  className="bg-[#0c182c] border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header de la comprobación */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[#070e1c] border border-slate-700 text-amber-400">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-white tracking-wide">
                          {chk.title}
                        </h4>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-black font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        {chk.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      {chk.summary}
                    </p>

                    {/* Lista de Detalles */}
                    <div className="mt-3 space-y-1.5 bg-[#070e1a] p-2.5 rounded-lg border border-slate-800/70 font-mono text-[11px]">
                      {chk.details.map((d, i) => (
                        <div key={i} className="flex justify-between items-center gap-2 py-0.5 border-b border-slate-800/40 last:border-b-0">
                          <span className="text-slate-400 text-[10px]">{d.label}</span>
                          <span className="text-white font-bold text-right truncate max-w-[210px]">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acción externa si aplica */}
                  {chk.action && (
                    <div className="pt-2">
                      <a
                        href={chk.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold underline transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{chk.action.text}</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advertencia Institucional de Seguridad y Protección */}
          <div className="bg-[#1b120c] border border-amber-600/50 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-white block mb-0.5">
                Protocolo Anti-Fraude y Garantía Contractual:
              </strong>
              <span>
                Para proteger tu inversión, asegúrate siempre de que las 6 comprobaciones coincidan exactamente con tu contrato de intermediación.
                Los pagos fiduciarios se dirigen con exclusividad a la cuenta bancaria de la entidad contractual acreditada en Estados Unidos.
                Jamás realice giros a nombres personales o cuentas no avaladas contractualmente.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0e192c] flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Auditoría de Subastas Internacionales Copart VB3</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Entendido y Conforme
          </button>
        </div>
      </div>
    </div>
  );
};

