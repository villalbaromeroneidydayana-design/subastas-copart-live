import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { Client, Vehicle, PhotoCategory } from '../../types';
import { 
  Car, User, Briefcase, DollarSign, CheckCircle, 
  ArrowRight, ArrowLeft, X, Flame, Sparkles, AlertTriangle, Award
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface NextLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess: (linksData: {
    brokerUrl: string;
    buyerUrl: string;
    buyerName: string;
    brokerName: string;
    clientMaxBudget: number;
    lotNumber: string;
    title: string;
  }) => void;
}

export const NextLotModal: React.FC<NextLotModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}) => {
  const { lang, t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cliente Real y Presupuesto
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('Alejandro Gómez');
  const [buyerEmail, setBuyerEmail] = useState<string>('alejandro.gomez@email.com');
  const [buyerPhone, setBuyerPhone] = useState<string>('+1 (305) 555-0812');
  const [clientMaxBudget, setClientMaxBudget] = useState<number>(10000);

  // Broker Real
  const [brokerName, setBrokerName] = useState<string>('Broker Miguel Santos');
  const [brokerEmail, setBrokerEmail] = useState<string>('miguel.santos@subastas.com');
  const [brokerPhone, setBrokerPhone] = useState<string>('+1 (305) 555-0999');

  // Vehículo
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customLotNumber, setCustomLotNumber] = useState<string>('59201441');

  // Parámetros
  const [startingPrice, setStartingPrice] = useState<number>(4000);
  const [bidIncrement, setBidIncrement] = useState<number>(250);
  const [reservePrice, setReservePrice] = useState<number>(12000);

  const clients = store.getClients();
  const vehicles = store.getVehicles();

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
      setBuyerName(clients[0].full_name);
      setBuyerEmail(clients[0].email);
      setBuyerPhone(clients[0].phone);
    }
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
      setCustomLotNumber(vehicles[0].lot_number);
    }
  }, [clients, vehicles]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSelectClient = (c: Client) => {
    setSelectedClientId(c.id);
    setBuyerName(c.full_name);
    setBuyerEmail(c.email);
    setBuyerPhone(c.phone);
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    setCustomLotNumber(v.lot_number);
    if (v.est_retail_value) {
      setReservePrice(Math.round(v.est_retail_value * 0.4));
    }
  };

  const getFullUrl = (relativeHash: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : `${window.location.pathname}`;
    return `${origin}${pathname}${relativeHash}`;
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) {
      setSubmitError('Debes seleccionar un vehículo.');
      return;
    }

    const finalBuyerName = clientMode === 'existing' && selectedClient ? selectedClient.full_name : buyerName.trim();
    const finalBuyerEmail = clientMode === 'existing' && selectedClient ? selectedClient.email : buyerEmail.trim();
    const finalBuyerPhone = clientMode === 'existing' && selectedClient ? selectedClient.phone : buyerPhone.trim();

    if (!finalBuyerName) {
      setSubmitError('El nombre del comprador es obligatorio.');
      return;
    }
    if (!brokerName.trim()) {
      setSubmitError('El nombre del broker es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        lotNumber: customLotNumber || selectedVehicle.lot_number,
        vehicle: selectedVehicle,
        startingPrice,
        minIncrement: bidIncrement,
        reservePrice,
        clientMaxBudget,
        buyerName: finalBuyerName,
        buyerEmail: finalBuyerEmail,
        buyerPhone: finalBuyerPhone,
        brokerName: brokerName.trim(),
        brokerEmail: brokerEmail.trim(),
        brokerPhone: brokerPhone.trim(),
      };

      const result = await store.loadNextLot(sessionId, payload);

      if (result.success && result.session) {
        const s = result.session;
        const brokerUrl = getFullUrl(s.links?.brokerLink || `#/sala/${s.roomToken}?broker=${s.brokerAccessToken}`);
        const buyerUrl = getFullUrl(s.links?.buyerLink || `#/sala/${s.roomToken}?cliente=${s.buyerAccessToken}`);

        onSuccess({
          brokerUrl,
          buyerUrl,
          buyerName: finalBuyerName,
          brokerName: brokerName.trim(),
          clientMaxBudget,
          lotNumber: String(s.lotNumber),
          title: `${selectedVehicle.year} ${selectedVehicle.brand} ${selectedVehicle.model}`,
        });
        onClose();
      } else {
        setSubmitError(result.error || 'No se pudo cargar el siguiente lote.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1828] border border-amber-500/50 rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl animate-fadeIn max-h-[92vh] overflow-y-auto flex flex-col text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{lang === 'en' ? 'Prepare Next Lot (Same Lane A)' : 'Preparar Siguiente Lote (Misma Sala Lane A)'}</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {lang === 'en'
                ? `Attend a new buyer & broker in this live lane. Step ${currentStep} of 4.`
                : `Atiende a un nuevo cliente y broker en esta misma sala en vivo. Paso ${currentStep} de 4.`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitError && (
          <div className="mb-3 p-3 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Pasos */}
        <div className="flex-1 space-y-4">
          
          {/* PASO 1: CLIENTE Y PRESUPUESTO */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>{lang === 'en' ? 'Step 1: Real Buyer & Maximum Budget' : 'Paso 1: Nuevo Cliente Comprador y Presupuesto'}</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {lang === 'en'
                    ? 'The previous buyer session will expire and the new buyer will receive a secure access link with their authorized budget.'
                    : 'El cliente anterior quedará desconectado y el nuevo cliente recibirá su enlace exclusivo con su presupuesto específico.'}
                </p>
              </div>

              {/* Selector modo cliente */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-3 py-1 rounded font-bold transition ${
                    clientMode === 'existing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Clientes Registrados ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-3 py-1 rounded font-bold transition ${
                    clientMode === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nuevo Cliente Directo
                </button>
              </div>

              {clientMode === 'existing' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition ${
                        selectedClientId === c.id
                          ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/30'
                          : 'border-slate-800 bg-[#070e1a] hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-white">{c.full_name}</div>
                      <div className="text-slate-400 text-[11px]">{c.email}</div>
                      <div className="text-slate-500 text-[10px]">{c.city}, {c.country}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+1 (555) 0182"
                      className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Presupuesto */}
              <div className="bg-[#0b1728] border border-emerald-900/60 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Presupuesto Máximo de este Cliente ($ USD):</span>
                  </label>
                  <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-600/40">
                    ${clientMaxBudget.toLocaleString()} USD
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[5000, 7500, 10000, 12500, 15000, 20000, 25000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setClientMaxBudget(preset)}
                      className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                        clientMaxBudget === preset
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  step="250"
                  min="1000"
                  value={clientMaxBudget}
                  onChange={(e) => setClientMaxBudget(Math.max(500, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#070e1a] border border-slate-700 rounded px-3 py-1.5 text-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          )}

          {/* PASO 2: BROKER REAL */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Paso 2: Nuevo Broker Real Autorizado</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  El nuevo broker representará al cliente con la <strong>Paleta #101</strong> y tendrá garantizada la adjudicación al finalizar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nombre del Broker</label>
                  <input
                    type="text"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    placeholder="Ej. Broker Roberto M."
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={brokerEmail}
                    onChange={(e) => setBrokerEmail(e.target.value)}
                    placeholder="broker@subastas.com"
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Teléfono Directo</label>
                  <input
                    type="text"
                    value={brokerPhone}
                    onChange={(e) => setBrokerPhone(e.target.value)}
                    placeholder="+1 (404) 555-0199"
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 text-xs flex items-start gap-2.5">
                <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block">Garantía Inmutable para el Broker Real:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    Al bajar el martillo (SOLD), la victoria queda asignada al broker real (Paleta #101). Los demás postores son competidores ficticios regulados por debajo del presupuesto del cliente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: SELECCIONAR VEHÍCULO */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Paso 3: Selecciona el Vehículo del Siguiente Lote</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  El vehículo reemplazará inmediatamente la pantalla y el cronómetro de la sala en vivo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`p-2.5 rounded-lg border-2 cursor-pointer transition flex items-center gap-3 ${
                      selectedVehicleId === v.id
                        ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/20'
                        : 'border-slate-800 bg-[#070e1a] hover:border-slate-700'
                    }`}
                  >
                    <div className="w-16 h-12 bg-slate-900 rounded overflow-hidden flex-shrink-0 border border-slate-800">
                      {v.images?.[0] ? (
                        <img src={v.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-6 h-6 text-slate-700 m-auto mt-3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">{v.year} {v.brand} {v.model}</div>
                      <div className="text-amber-400 font-mono text-[11px]">Lote #{v.lot_number}</div>
                      <div className="text-slate-400 text-[10px] truncate">{v.primary_damage || 'Frontal'} • {v.vehicle_condition}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedVehicle && (
                <div className="bg-[#070e1a] p-2.5 rounded border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Número de Lote en Pantalla:</span>
                  <input
                    type="text"
                    value={customLotNumber}
                    onChange={(e) => setCustomLotNumber(e.target.value)}
                    className="w-32 bg-[#0a1424] border border-amber-500/50 rounded px-2 py-1 text-amber-300 font-mono font-bold text-right"
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 4: PARÁMETROS Y RESUMEN */}
          {currentStep === 4 && selectedVehicle && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Paso 4: Parámetros del Remate y Confirmación</span>
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#070e1a] p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Precio Inicial ($)</label>
                  <input
                    type="number"
                    step="100"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(parseInt(e.target.value) || 1000)}
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Incremento ($)</label>
                  <input
                    type="number"
                    step="50"
                    value={bidIncrement}
                    onChange={(e) => setBidIncrement(parseInt(e.target.value) || 100)}
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Reserva ($)</label>
                  <input
                    type="number"
                    step="500"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(parseInt(e.target.value) || 5000)}
                    className="w-full bg-[#0a1424] border border-slate-700 rounded p-1.5 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="p-3 bg-[#08101d] rounded border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Siguiente Lote:</span>
                  <span className="text-amber-400 font-bold">
                    {selectedVehicle.year} {selectedVehicle.brand} {selectedVehicle.model} (Lote #{customLotNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nuevo Cliente:</span>
                  <span className="text-white font-bold">{clientMode === 'existing' && selectedClient ? selectedClient.full_name : buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Presupuesto Asignado:</span>
                  <span className="text-emerald-400 font-mono font-bold">${clientMaxBudget.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Broker Real:</span>
                  <span className="text-amber-300 font-bold">{brokerName} (Paleta #101)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3.5 py-1.5 rounded flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Back' : 'Anterior'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3.5 py-1.5 rounded transition"
            >
              {lang === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={(currentStep === 1 && clientMode === 'new' && !buyerName.trim()) || (currentStep === 3 && !selectedVehicleId)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1 transition shadow"
            >
              <span>{lang === 'en' ? 'Next' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-5 py-2 rounded flex items-center gap-1.5 transition shadow-lg active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>{isSubmitting ? (lang === 'en' ? 'Loading Lot...' : 'Cargando Lote...') : (lang === 'en' ? 'Load Lot to Lane A' : 'Cargar Lote a esta Sala')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

