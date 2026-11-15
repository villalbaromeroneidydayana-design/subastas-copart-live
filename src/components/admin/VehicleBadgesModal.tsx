import React, { useState } from 'react';
import { Tag, Volume2, RefreshCw, ShieldCheck, Plus, Trash2, Check, X, Sparkles, AlertCircle, Play, Radio, Mic } from 'lucide-react';
import { CustomBadgeItem, CustomVehicleBadges, Vehicle } from '../../types';
import { sounds } from '../../lib/soundEffects';

interface VehicleBadgesModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBadges: CustomVehicleBadges) => Promise<void>;
}

export const VehicleBadgesModal: React.FC<VehicleBadgesModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onSave,
}) => {
  const existing = vehicle.custom_badges || {};

  const [engineSoundEnabled, setEngineSoundEnabled] = useState<boolean>(existing.engineSoundEnabled ?? true);
  const [engineSoundText, setEngineSoundText] = useState<string>(existing.engineSoundText || 'Engine Sound 🔊');

  const [threeSixtyEnabled, setThreeSixtyEnabled] = useState<boolean>(existing.threeSixtyEnabled ?? true);
  const [threeSixtyText, setThreeSixtyText] = useState<string>(existing.threeSixtyText || '360° View 🔄');

  const [carfaxEnabled, setCarfaxEnabled] = useState<boolean>(existing.carfaxEnabled ?? true);
  const [carfaxText, setCarfaxText] = useState<string>(existing.carfaxText || 'Carfax Clean ✓');

  const [carfaxTitleStatus, setCarfaxTitleStatus] = useState<string>(existing.carfaxTitleStatus || 'Título Limpio / Clean Title');
  const [carfaxAccidents, setCarfaxAccidents] = useState<string>(existing.carfaxAccidents || '0 Accidentes Reportados');
  const [carfaxOwners, setCarfaxOwners] = useState<string>(existing.carfaxOwners || '1 Solo Dueño Anterior');
  const [carfaxServiceRecords, setCarfaxServiceRecords] = useState<string>(existing.carfaxServiceRecords || '14 Registros de Mantenimiento');
  const [carfaxVerifiedNotes, setCarfaxVerifiedNotes] = useState<string>(
    existing.carfaxVerifiedNotes || 'Vehículo verificado en instalaciones oficiales Copart. Chasis intacto, bolsas de aire operativas y odómetro certificado.'
  );

  const [runDriveText, setRunDriveText] = useState<string>(existing.runDriveText || 'RUN & DRIVE');
  const [titleTypeText, setTitleTypeText] = useState<string>(existing.titleTypeText || 'CLEAN TITLE');

  const [extraBadges, setExtraBadges] = useState<CustomBadgeItem[]>(existing.extraBadges || [
    {
      id: 'badge-keys',
      label: 'Llaves Disponibles 🔑',
      action: 'custom_modal',
      color: 'emerald',
      modalTitle: 'Verificación de Llaves y Encendido',
      modalContent: 'El patio certifica la presencia del llavero maestro original y encendido comprobado al ingreso al lote.',
    },
    {
      id: 'badge-inspected',
      label: 'Inspección Copart 100% ✓',
      action: 'custom_modal',
      color: 'blue',
      modalTitle: 'Inspección Multi-Punto Certificada',
      modalContent: 'Diagnóstico general computarizado efectuado: motor, transmisión, dirección y frenos sin códigos de falla activos.',
    }
  ]);

  const [auctioneerWelcomeChant, setAuctioneerWelcomeChant] = useState<string>(
    existing.auctioneerWelcomeChant ||
    `Welcome bidders to Lane A! Coming up right now on the block, we have an incredible ${vehicle.year || 2023} ${vehicle.brand || 'Ford'} ${vehicle.model || 'Mustang GT'}! Clean run and drive, verified with only ${vehicle.odometer ? Number(vehicle.odometer).toLocaleString() : '14,000'} miles, keys in hand! Beautiful unit, folks! Who'll give me 5,000 dollars to open? Let's start the bidding!`
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [voiceType, setVoiceType] = useState<'male' | 'female'>(existing.auctioneerVoiceGender || sounds.voiceGender || 'male');

  const handlePlayVoicePreview = () => {
    setIsPlayingPreview(true);
    try {
      sounds.setVoiceGender(voiceType);
      sounds.speak(auctioneerWelcomeChant.trim(), 1.08);
    } catch { }
    setTimeout(() => setIsPlayingPreview(false), 4500);
  };

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddExtraBadge = () => {
    const newBadge: CustomBadgeItem = {
      id: 'badge-' + Date.now(),
      label: 'Nueva Insignia ⭐',
      action: 'custom_modal',
      color: 'amber',
      modalTitle: 'Detalle de Certificación',
      modalContent: 'Descripción o garantía del componente verificado.',
    };
    setExtraBadges([...extraBadges, newBadge]);
  };

  const handleRemoveExtraBadge = (id: string) => {
    setExtraBadges(extraBadges.filter((b) => b.id !== id));
  };

  const handleUpdateExtraBadge = (id: string, updates: Partial<CustomBadgeItem>) => {
    setExtraBadges(
      extraBadges.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedBadges: CustomVehicleBadges = {
        engineSoundEnabled,
        engineSoundText: engineSoundText.trim() || 'Engine Sound 🔊',
        threeSixtyEnabled,
        threeSixtyText: threeSixtyText.trim() || '360° View 🔄',
        carfaxEnabled,
        carfaxText: carfaxText.trim() || 'Carfax Clean ✓',
        carfaxTitleStatus: carfaxTitleStatus.trim() || 'Título Limpio / Clean Title',
        carfaxAccidents: carfaxAccidents.trim() || '0 Accidentes Reportados',
        carfaxOwners: carfaxOwners.trim() || '1 Solo Dueño Anterior',
        carfaxServiceRecords: carfaxServiceRecords.trim() || '14 Registros de Mantenimiento',
        carfaxVerifiedNotes: carfaxVerifiedNotes.trim(),
        runDriveText: runDriveText.trim() || 'RUN & DRIVE',
        titleTypeText: titleTypeText.trim() || 'CLEAN TITLE',
        extraBadges,
        auctioneerWelcomeChant: auctioneerWelcomeChant.trim(),
        auctioneerVoiceGender: voiceType,
      };

      sounds.setVoiceGender(voiceType);
      await onSave(updatedBadges);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0b1323] border border-amber-500/50 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0e1828]">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                EDITAR BOTONES E INSIGNIAS DE LA FOTO DEL VEHÍCULO
              </h3>
              <p className="text-xs text-slate-400">
                Personaliza qué texto muestran los botones, si están activos y qué función ejecutan al hacer clic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">

          {/* SECCIÓN 1: INSIGNIAS SUPERIORES SOBRE LA FOTO */}
          <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 1. Insignias de Estado Legal y Mecánico (Sobre la Foto)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Insignia Condición (Verde / Resaltada):
                </label>
                <input
                  type="text"
                  value={runDriveText}
                  onChange={(e) => setRunDriveText(e.target.value)}
                  placeholder="RUN & DRIVE, ARRANCA Y CONDUCE..."
                  className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Se muestra en la esquina superior izquierda de la foto.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Insignia Título Legal (Dorado):
                </label>
                <input
                  type="text"
                  value={titleTypeText}
                  onChange={(e) => setTitleTypeText(e.target.value)}
                  placeholder="CLEAN TITLE, SALVAGE, REBUILT..."
                  className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Tipo de título oficial registrado ante el DMV.</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: BOTONES DE ACCIÓN INTERACTIVA (ENGINE SOUND, 360°, CARFAX) */}
          <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> 2. Botones de Acción Interactiva Copart
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Al hacer clic en la sala, cada botón activa su efecto (sonido, giro o ventana de historial).
              </p>
            </div>

            {/* Botón 1: Engine Sound */}
            <div className="p-3 rounded-lg bg-[#0c1628] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chk-engine"
                  checked={engineSoundEnabled}
                  onChange={(e) => setEngineSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="chk-engine" className="font-bold text-white text-xs cursor-pointer flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>Botón de Sonido de Motor</span>
                  </label>
                  <p className="text-[10px] text-slate-400">Acción: Reproduce sonido de arranque y aceleración V8 auténtico.</p>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">Texto del Botón:</label>
                <input
                  type="text"
                  value={engineSoundText}
                  onChange={(e) => setEngineSoundText(e.target.value)}
                  disabled={!engineSoundEnabled}
                  className="w-full bg-[#030712] border border-slate-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            {/* Botón 2: 360° Walkaround */}
            <div className="p-3 rounded-lg bg-[#0c1628] border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chk-360"
                  checked={threeSixtyEnabled}
                  onChange={(e) => setThreeSixtyEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="chk-360" className="font-bold text-white text-xs cursor-pointer flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    <span>Botón Vista 360°</span>
                  </label>
                  <p className="text-[10px] text-slate-400">Acción: Inicia la rotación continua y paseo visual 360° de las fotos.</p>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">Texto del Botón:</label>
                <input
                  type="text"
                  value={threeSixtyText}
                  onChange={(e) => setThreeSixtyText(e.target.value)}
                  disabled={!threeSixtyEnabled}
                  className="w-full bg-[#030712] border border-slate-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>

            {/* Botón 3: Carfax Report */}
            <div className="p-3 rounded-lg bg-[#0c1628] border border-emerald-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="chk-carfax"
                    checked={carfaxEnabled}
                    onChange={(e) => setCarfaxEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="chk-carfax" className="font-bold text-white text-xs cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Botón Reporte Carfax / AutoCheck</span>
                    </label>
                    <p className="text-[10px] text-slate-400">Acción: Abre el modal oficial con los datos de historial configurados abajo.</p>
                  </div>
                </div>

                <div className="w-full sm:w-64">
                  <label className="text-[10px] text-slate-400 block mb-1 font-bold">Texto del Botón:</label>
                  <input
                    type="text"
                    value={carfaxText}
                    onChange={(e) => setCarfaxText(e.target.value)}
                    disabled={!carfaxEnabled}
                    className="w-full bg-[#030712] border border-slate-700 disabled:opacity-40 rounded-lg px-2.5 py-1.5 text-white font-bold"
                  />
                </div>
              </div>

              {/* Sub-formulario de datos del Reporte Carfax */}
              {carfaxEnabled && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#08101e] p-3 rounded-lg">
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-0.5">Estado del Título</label>
                    <input
                      type="text"
                      value={carfaxTitleStatus}
                      onChange={(e) => setCarfaxTitleStatus(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-0.5">Accidentes Reportados</label>
                    <input
                      type="text"
                      value={carfaxAccidents}
                      onChange={(e) => setCarfaxAccidents(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-0.5">Propietarios Anteriores</label>
                    <input
                      type="text"
                      value={carfaxOwners}
                      onChange={(e) => setCarfaxOwners(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 block mb-0.5">Registros de Mantenimiento</label>
                    <input
                      type="text"
                      value={carfaxServiceRecords}
                      onChange={(e) => setCarfaxServiceRecords(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-300 block mb-0.5">Notas del Inspector Copart</label>
                    <textarea
                      rows={2}
                      value={carfaxVerifiedNotes}
                      onChange={(e) => setCarfaxVerifiedNotes(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-700 rounded p-1.5 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: BOTONES E INSIGNIAS ADICIONALES DEBAJO DE LA FOTO */}
          <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Tag className="w-4 h-4" /> 3. Insignias y Botones Personalizados Adicionales (Debajo de la Foto)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Agrega botones con el texto que desees (ej: Llaves 🔑, Airbags 🛡️, Garantía ⭐). Al hacer clic en la sala, mostrarán su detalle.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddExtraBadge}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Botón</span>
              </button>
            </div>

            {extraBadges.length === 0 ? (
              <p className="text-slate-500 italic py-2 text-center">No hay botones adicionales configurados.</p>
            ) : (
              <div className="space-y-2.5">
                {extraBadges.map((badge, idx) => (
                  <div key={badge.id || idx} className="p-3 bg-[#0c1628] border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                        <input
                          type="text"
                          value={badge.label}
                          onChange={(e) => handleUpdateExtraBadge(badge.id, { label: e.target.value })}
                          placeholder="Texto del botón (ej: Llaves Disponibles 🔑)"
                          className="flex-1 bg-[#030712] border border-slate-700 rounded px-2.5 py-1 text-white font-bold"
                        />
                      </div>

                      {/* Color Selector */}
                      <select
                        value={badge.color || 'amber'}
                        onChange={(e) => handleUpdateExtraBadge(badge.id, { color: e.target.value as any })}
                        className="bg-[#030712] border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                      >
                        <option value="amber">Dorado (Amber)</option>
                        <option value="emerald">Verde (Emerald)</option>
                        <option value="blue">Azul (Blue)</option>
                        <option value="purple">Morado (Purple)</option>
                        <option value="slate">Gris (Slate)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveExtraBadge(badge.id)}
                        className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800"
                        title="Eliminar este botón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Título de la Ventana al hacer Clic</label>
                        <input
                          type="text"
                          value={badge.modalTitle || ''}
                          onChange={(e) => handleUpdateExtraBadge(badge.id, { modalTitle: e.target.value })}
                          placeholder="Ej: Verificación Oficial de Llaves"
                          className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-0.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Mensaje o Detalle Informativo</label>
                        <input
                          type="text"
                          value={badge.modalContent || ''}
                          onChange={(e) => handleUpdateExtraBadge(badge.id, { modalContent: e.target.value })}
                          placeholder="Ej: Llave original probada en patio."
                          className="w-full bg-[#030712] border border-slate-700 rounded px-2 py-0.5 text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN 4: CANTO Y SALUDO DE BIENVENIDA DEL MARTILLERO (COPART AUCTION CHANT) */}
          <div className="bg-[#070e1c] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Mic className="w-4 h-4" /> 4. Saludo y Canto de Bienvenida del Martillero (Apertura de Subasta)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  El subastador canta esta bienvenida con voz profesional en inglés al abrir la subasta, elogiando las características del auto y pidiendo la primera puja.
                </p>
              </div>

              {/* Selector de Género de Voz y Preescucha */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-[#030712] p-1 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceType('male');
                      sounds.setVoiceGender('male');
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${voiceType === 'male'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <span>👨 Masculina Americana (Copart)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceType('female');
                      sounds.setVoiceGender('female');
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${voiceType === 'female'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <span>👩 Femenina</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePlayVoicePreview}
                  disabled={isPlayingPreview}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingPreview ? 'Reproduciendo...' : 'Escuchar Voz'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-300 font-bold block mb-1">
                Frase Oficial del Martillero en Inglés (Chant):
              </label>
              <textarea
                rows={3}
                value={auctioneerWelcomeChant}
                onChange={(e) => setAuctioneerWelcomeChant(e.target.value)}
                placeholder="Welcome bidders to Lane A! Coming up on the block..."
                className="w-full bg-[#030712] border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Plantillas rápidas */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[10px] text-slate-400 self-center">Plantillas rápidas:</span>
              <button
                type="button"
                onClick={() => setAuctioneerWelcomeChant(
                  `Welcome bidders to Lane A! Coming up right now on the block, we have an incredible ${vehicle.year || 2023} ${vehicle.brand || 'Ford'} ${vehicle.model || 'Mustang GT'}! Clean run and drive, verified with only ${vehicle.odometer ? Number(vehicle.odometer).toLocaleString() : '14,000'} miles, keys in hand! Beautiful unit, folks! Who'll give me 5,000 dollars to open? Let's start the bidding!`
                )}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 transition"
              >
                Copart Clásico (Elogio Completo)
              </button>
              <button
                type="button"
                onClick={() => setAuctioneerWelcomeChant(
                  `Alright buyers, welcome to Lane A! Look at this clean ${vehicle.year || 2023} ${vehicle.brand || 'Ford'} ${vehicle.model || 'Mustang GT'}! Verified run and drive, mint interior, ready to roll! Starting the bids at 5,000 dollars, let's go!`
                )}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 transition"
              >
                Venta Rápida y Agresiva
              </button>
            </div>
          </div>
        </form>

        {/* Footer con Botones Guardar y Cancelar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0e1828] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleFormSubmit}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black flex items-center gap-2 transition shadow-lg shadow-emerald-950"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Guardando en Sala...' : 'Guardar y Publicar en Sala en Vivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

