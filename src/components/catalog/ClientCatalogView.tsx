import React, { useState } from 'react';
import { 
  Car, ShieldCheck, CheckCircle2, Phone, Calendar, 
  Gauge, Key, Fuel, Award, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, Play, Sparkles, Filter, FileText, ArrowRight
} from 'lucide-react';
import { CopartLogo } from '../common/CopartLogo';

export interface CatalogVehicle {
  id: string;
  lot_number: string;
  year: number;
  brand: string;
  model: string;
  trim: string;
  color: string;
  engine: string;
  drivetrain: string;
  transmission: string;
  odometer: string;
  title_type: string;
  primary_damage: string;
  has_keys: boolean;
  run_and_drive: boolean;
  drives_30mph?: boolean;
  sale_date: string;
  location: string;
  retail_value: number;
  target_budget: number;
  highlight_badge?: string;
  video_url?: string;
  images: string[];
  description?: string;
}

const CATALOG_ITEMS: CatalogVehicle[] = [
  {
    id: 'tacoma-2017-roja',
    lot_number: '75244006',
    year: 2017,
    brand: 'Toyota',
    model: 'Tacoma',
    trim: 'SR5 V6 4X4',
    color: 'Rojo',
    engine: '3.5L V6',
    drivetrain: '4X4 (Four Wheel Drive)',
    transmission: 'Automática',
    odometer: '258,586 mi',
    title_type: 'NH - Certificate Of Title',
    primary_damage: 'Abolladuras / Arañazos Menores (Sin choques estructurales)',
    has_keys: true,
    run_and_drive: true,
    sale_date: 'Viernes 27 Nov • 10:00 AM (Carril C - Item 3064)',
    location: 'MA - North Boston',
    retail_value: 15800,
    target_budget: 4500,
    highlight_badge: '⚡ SUBASTA MAÑANA VIERNES',
    images: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Excelente camioneta de trabajo rudo 4x4. Motor 3.5L V6 eterno y confiable. Vendedor certificó motor y caja arrancando.'
  },
  {
    id: 'tacoma-2017-negra-miami',
    lot_number: '74688776',
    year: 2017,
    brand: 'Toyota',
    model: 'Tacoma',
    trim: 'SR 4X2',
    color: 'Negro',
    engine: '2.7L 4 Cilindros (Ultra económica en gasolina)',
    drivetrain: '4X2 (Tracción trasera de carga)',
    transmission: 'Automática',
    odometer: '275,781 mi',
    title_type: 'FL - Clean Title (Título Limpio)',
    primary_damage: 'Desgaste normal de trabajo • Cero golpes graves',
    has_keys: true,
    run_and_drive: true,
    drives_30mph: true,
    sale_date: 'Martes 01 Dic • 12:00 PM',
    location: 'FL - Miami South',
    retail_value: 14200,
    target_budget: 3800,
    highlight_badge: '⭐ TÍTULO LIMPIO • MÁS ECONÓMICA',
    images: [
      'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'La más económica en mantenimiento y consumo. Certificada por Copart probada en pista a más de 30 mph. ¡Te ahorras casi $1,200 USD de presupuesto!'
  },
  {
    id: 'tacoma-2016-negra-pa',
    lot_number: '74963086',
    year: 2016,
    brand: 'Toyota',
    model: 'Tacoma',
    trim: 'SR5 V6 4X4',
    color: 'Negro',
    engine: '3.5L V6',
    drivetrain: '4X4 (Four Wheel Drive)',
    transmission: 'Automática',
    odometer: '225,058 mi (Bajo millaje en su rango)',
    title_type: 'VA - Dealer Only Clean Title (Título Limpio)',
    primary_damage: 'Abolladuras cosméticas leves de batea',
    has_keys: true,
    run_and_drive: true,
    sale_date: 'Lunes 30 Nov • 09:00 PM',
    location: 'PA - Pittsburgh West',
    retail_value: 16500,
    target_budget: 4800,
    highlight_badge: '🛡️ TÍTULO LIMPIO DEALER ONLY',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Menos millas (225k mi) y Título Limpio. Solo accesible por Brokers autorizados con licencia Dealer.'
  },
  {
    id: 'tacoma-2022-doble-cabina',
    lot_number: '74322426',
    year: 2022,
    brand: 'Toyota',
    model: 'Tacoma',
    trim: 'Double Cab (Doble Cabina 4 Puertas)',
    color: 'Granate / Burdeos',
    engine: 'V6 de Última Generación',
    drivetrain: 'Tracción Reforzada',
    transmission: 'Automática',
    odometer: '84,552 mi (Seminueva)',
    title_type: 'AR - Cert Of Title Salvage',
    primary_damage: 'Detalle solo en batea trasera y lateral (Frente y motor intactos)',
    has_keys: true,
    run_and_drive: true,
    sale_date: 'Próxima Subasta (Venta Pura)',
    location: 'AR - Little Rock',
    retail_value: 29968,
    target_budget: 6000,
    highlight_badge: '🔥 SEMINUEVA 2022 • VALE $30,000 USD',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80'
    ],
    description: '¡Oportunidad extraordinaria por $1,000 más! Año 2022 con solo 84,000 millas. Camioneta de $30,000 dólares en la calle.'
  }
];

export const ClientCatalogView: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'todos' | '5k' | 'seminuevas'>('todos');
  const [selectedImageIndices, setSelectedImageIndices] = useState<{ [id: string]: number }>({});
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);

  const filteredVehicles = CATALOG_ITEMS.filter((item) => {
    if (selectedFilter === '5k') return item.target_budget <= 5000;
    if (selectedFilter === 'seminuevas') return item.target_budget > 5000;
    return true;
  });

  const handleNextPhoto = (vId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndices((prev) => {
      const current = prev[vId] || 0;
      return { ...prev, [vId]: (current + 1) % total };
    });
  };

  const handlePrevPhoto = (vId: string, total: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndices((prev) => {
      const current = prev[vId] || 0;
      return { ...prev, [vId]: current > 0 ? current - 1 : total - 1 };
    });
  };

  const handleSelectPhoto = (vId: string, idx: number) => {
    setSelectedImageIndices((prev) => ({ ...prev, [vId]: idx }));
  };

  const handleWhatsAppContact = (vehicle: CatalogVehicle) => {
    const text = `Hola, estuve revisando el catálogo exclusivo de Pujamotor Autos USA y me interesa apartar la postura para la: ${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.trim} (Lote #${vehicle.lot_number}) con presupuesto de $${vehicle.target_budget.toLocaleString()} USD. ¿Me podrían dar más detalles?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans pb-16">
      
      {/* HEADER EXCLUSIVO PARA CLIENTES - 100% INDEPENDIENTE */}
      <header className="bg-[#002855] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-2.5 py-1 rounded border border-white/20">
              <span className="font-black text-sm tracking-widest text-amber-300">PUJAMOTOR</span>
              <span className="text-[10px] block tracking-tighter text-blue-200">AUTOS USA • BROKER</span>
            </div>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-200 block">Catálogo Oficial de Inventario y Subastas</span>
              <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Vehículos Inspeccionados con Run & Drive
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-2.5 py-1 rounded border border-amber-400/40">
              Oportunidades de Subasta
            </span>
          </div>
        </div>
      </header>

      {/* BANNER DE BIENVENIDA */}
      <div className="bg-gradient-to-r from-[#002855] via-[#1d70b8] to-[#002855] text-white py-6 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Licencia Dealer / Broker Oficial Copart
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Catálogo Especial: Camionetas Toyota de Trabajo
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mt-0.5">
              Selección de vehículos certificados para trabajo diario. Todas las unidades cuentan con motor y transmisión probados, llaves originales y sin daños estructurales.
            </p>
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg backdrop-blur">
            <button
              onClick={() => setSelectedFilter('todos')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'todos' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-200 hover:text-white'
              }`}
            >
              Todas ({CATALOG_ITEMS.length})
            </button>
            <button
              onClick={() => setSelectedFilter('5k')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                selectedFilter === '5k' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-200 hover:text-white'
              }`}
            >
              Hasta $5,000 USD
            </button>
            <button
              onClick={() => setSelectedFilter('seminuevas')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'seminuevas' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-200 hover:text-white'
              }`}
            >
              Seminuevas $6,000
            </button>
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE TARJETAS DE VEHÍCULOS */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVehicles.map((vehicle) => {
            const currentImgIdx = selectedImageIndices[vehicle.id] || 0;
            const activeImgUrl = vehicle.images[currentImgIdx] || vehicle.images[0];

            return (
              <div 
                key={vehicle.id}
                className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                {/* Header de la tarjeta */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-2">
                  <div>
                    {vehicle.highlight_badge && (
                      <span className="inline-block bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-1 shadow-sm">
                        {vehicle.highlight_badge}
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h2>
                    <span className="text-xs font-bold text-[#1d70b8] block">
                      {vehicle.trim}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Lote Copart</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                      #{vehicle.lot_number}
                    </span>
                  </div>
                </div>

                {/* Visor Fotográfico Interactivo (Swipe / Clic) */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden group">
                  <img
                    src={activeImgUrl}
                    alt={`${vehicle.year} ${vehicle.model}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setActiveModalImage(activeImgUrl)}
                  />

                  {/* Badges sobre la foto */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="bg-[#00a84d] text-white font-black text-[10.5px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-white" /> Run and Drive
                    </span>
                    {vehicle.drives_30mph && (
                      <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        🛣️ Probada a 30+ mph
                      </span>
                    )}
                  </div>

                  {/* Botón Pantalla Completa HD */}
                  <button
                    onClick={() => setActiveModalImage(activeImgUrl)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow backdrop-blur transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ver HD</span>
                  </button>

                  {/* Flechas de Navegación < y > */}
                  {vehicle.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => handlePrevPhoto(vehicle.id, vehicle.images.length, e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow cursor-pointer opacity-85 hover:opacity-100"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleNextPhoto(vehicle.id, vehicle.images.length, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow cursor-pointer opacity-85 hover:opacity-100"
                        title="Siguiente foto"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Contador de fotos */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                    {currentImgIdx + 1} / {vehicle.images.length} Fotos
                  </div>
                </div>

                {/* Tira de Miniaturas Inferior */}
                {vehicle.images.length > 1 && (
                  <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
                    {vehicle.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectPhoto(vehicle.id, i)}
                        className={`relative shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition cursor-pointer ${
                          i === currentImgIdx ? 'border-[#1d70b8] ring-2 ring-blue-300 scale-105' : 'border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Ficha Técnica / Especificaciones */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    
                    {/* Tabla de Datos Clave */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Motor</span>
                        <span className="font-bold text-slate-800">{vehicle.engine}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Tracción</span>
                        <span className="font-bold text-slate-800">{vehicle.drivetrain}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Odómetro</span>
                        <span className="font-mono font-bold text-slate-800">{vehicle.odometer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Título</span>
                        <span className={`font-bold ${vehicle.title_type.includes('Clean') ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {vehicle.title_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Ubicación</span>
                        <span className="font-medium text-slate-700">{vehicle.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Llaves</span>
                        <span className="font-bold text-emerald-600">✓ Incluye Llave</span>
                      </div>
                    </div>

                    {/* Daño y Fecha */}
                    <div className="text-[11.5px] space-y-1">
                      <p className="text-slate-600">
                        <strong className="text-slate-800">Condición / Daño:</strong> {vehicle.primary_damage}
                      </p>
                      <p className="text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                        📅 <strong>Fecha de Subasta:</strong> {vehicle.sale_date}
                      </p>
                    </div>

                    {vehicle.description && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                        "{vehicle.description}"
                      </p>
                    )}
                  </div>

                  {/* Cuadro de Precio y Botón de Acción */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                      <div>
                        <span className="text-[10px] text-slate-500 line-through block font-medium">
                          Valor en Dealer: ${vehicle.retail_value.toLocaleString()} USD
                        </span>
                        <span className="text-xs font-black text-slate-700">
                          Presupuesto Estimado:
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black font-mono text-[#002855]">
                          ${vehicle.target_budget.toLocaleString()} USD
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Cerrado con gastos de sala
                        </span>
                      </div>
                    </div>

                    {/* Botón WhatsApp de Acción Directa */}
                    <button
                      onClick={() => handleWhatsAppContact(vehicle)}
                      className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 fill-white" />
                      <span>Apartar Postura para este Vehículo</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER OFICIAL PUJAMOTOR */}
      <footer className="max-w-6xl mx-auto px-4 mt-12 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
        <p className="font-bold text-slate-700">PUJAMOTOR AUTOS USA • REPRESENTACIÓN Y COMPRA EN SUBASTAS</p>
        <p className="mt-1">
          Operaciones respaldadas mediante Licencia de Corredor / Dealer Autorizado en EE. UU. Todas las posturas se gestionan con total transparencia.
        </p>
      </footer>

      {/* MODAL FULLSCREEN PARA FOTOS HD */}
      {activeModalImage && (
        <div 
          onClick={() => setActiveModalImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={activeModalImage} 
              alt="HD Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl" 
            />
            <button
              onClick={() => setActiveModalImage(null)}
              className="absolute top-2 right-2 bg-black/70 text-white font-bold px-3 py-1 rounded text-xs hover:bg-black"
            >
              Cerrar ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
