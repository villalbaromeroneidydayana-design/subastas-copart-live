import React, { useState } from 'react';
import { Vehicle, VehicleImage, PhotoCategory } from '../../types';
import { store } from '../../services/store';
import { ImageGalleryModal } from '../common/ImageGalleryModal';
import { 
  Car, Plus, Search, Edit2, Trash2, Copy, 
  ExternalLink, Upload, Image as ImageIcon, Eye, 
  Check, Star, X, AlertTriangle, Key, Gauge
} from 'lucide-react';

export const VehiclesView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(store.getVehicles());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'photos'>('info');
  const [galleryModalVehicle, setGalleryModalVehicle] = useState<Vehicle | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCategory, setNewImageCategory] = useState<PhotoCategory>('exterior');

  const refreshVehicles = () => {
    setVehicles([...store.getVehicles()]);
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.lot_number.includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      v.year.toString().includes(q)
    );
  });

  const handleDuplicate = (v: Vehicle) => {
    const cloned: Partial<Vehicle> = {
      ...v,
      id: undefined,
      lot_number: Math.floor(10000000 + Math.random() * 90000000).toString(),
      vin: v.vin.slice(0, 10) + Math.random().toString(36).substring(2, 9).toUpperCase(),
      model: `${v.model} (Copia)`,
    };
    store.saveVehicle(cloned as any);
    refreshVehicles();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Confirma eliminar el vehículo ${name}?`)) {
      store.deleteVehicle(id);
      refreshVehicles();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle?.brand || !editingVehicle?.model || !editingVehicle?.year || !editingVehicle?.lot_number || !editingVehicle?.vin) {
      alert('Por favor complete los campos obligatorios: Marca, Modelo, Año, Lote y VIN.');
      return;
    }

    store.saveVehicle(editingVehicle as any);
    setEditingVehicle(null);
    refreshVehicles();
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim() || !editingVehicle) return;
    const currentImages = editingVehicle.images || [];
    const newImg: VehicleImage = {
      id: 'img-' + Math.random().toString(36).substring(2, 8),
      vehicle_id: editingVehicle.id || 'temp',
      url: newImageUrl.trim(),
      category: newImageCategory,
      is_primary: currentImages.length === 0,
      order: currentImages.length + 1,
      caption: `Foto de ${newImageCategory}`,
    };

    setEditingVehicle({
      ...editingVehicle,
      images: [...currentImages, newImg],
    });
    setNewImageUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingVehicle) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const currentImages = editingVehicle.images || [];
          const newImg: VehicleImage = {
            id: 'img-' + Math.random().toString(36).substring(2, 8),
            vehicle_id: editingVehicle.id || 'temp',
            url: base64,
            category: newImageCategory,
            is_primary: currentImages.length === 0,
            order: currentImages.length + 1,
            caption: file.name,
          };
          setEditingVehicle((prev) => prev ? {
            ...prev,
            images: [...(prev.images || []), newImg],
          } : null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const setPrimaryImage = (imgId: string) => {
    if (!editingVehicle?.images) return;
    const updated = editingVehicle.images.map((img) => ({
      ...img,
      is_primary: img.id === imgId,
    }));
    setEditingVehicle({ ...editingVehicle, images: updated });
  };

  const removeImage = (imgId: string) => {
    if (!editingVehicle?.images) return;
    const updated = editingVehicle.images.filter((img) => img.id !== imgId);
    if (updated.length > 0 && !updated.some((i) => i.is_primary)) {
      updated[0].is_primary = true;
    }
    setEditingVehicle({ ...editingVehicle, images: updated });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-amber-400" />
            Biblioteca de Vehículos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra el catálogo de vehículos con especificaciones completas y fotografías para subastas.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle({
              brand: '',
              model: '',
              year: new Date().getFullYear(),
              lot_number: Math.floor(10000000 + Math.random() * 90000000).toString(),
              vin: '1HGCR2F8' + Math.random().toString(36).substring(2, 11).toUpperCase(),
              odometer: 15000,
              odometer_unit: 'mi',
              title_type: 'salvage',
              vehicle_condition: 'run_and_drive',
              primary_damage: 'Front End',
              secondary_damage: 'None',
              has_keys: true,
              location: 'Yard 12 - Atlanta East',
              est_retail_value: 28000,
              images: [],
              equipment: [],
            });
            setActiveTab('info');
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition active:scale-95 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Vehículo</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-[#0e1828] p-3 rounded-lg border border-[#1b3152]">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar vehículo por marca, modelo, lote (#), VIN o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070e1a] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Grid de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const primaryImg = vehicle.images?.find((i) => i.is_primary) || vehicle.images?.[0];
          return (
            <div
              key={vehicle.id}
              className="bg-[#0e1828] border border-[#1b3152] hover:border-amber-500/60 rounded-xl overflow-hidden shadow-lg transition flex flex-col group"
            >
              {/* Imagen del vehículo */}
              <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                {primaryImg ? (
                  <img
                    src={primaryImg.url}
                    alt={vehicle.model}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Car className="w-12 h-12" />
                  </div>
                )}

                {/* Badges superiores */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
                  <span className="bg-black/80 backdrop-blur text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    LOTE #{vehicle.lot_number}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                    vehicle.vehicle_condition === 'run_and_drive'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {vehicle.vehicle_condition === 'run_and_drive' ? 'RUN & DRIVE' : 'STARTS'}
                  </span>
                </div>

                <button
                  onClick={() => setGalleryModalVehicle(vehicle)}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-md backdrop-blur border border-slate-700 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver {vehicle.images?.length || 0} fotos</span>
                </button>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                    {vehicle.year} {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-xs text-slate-400">{vehicle.version || 'Versión estándar'}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-[#070e1a] p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Odómetro:</span>
                      <span className="text-white font-mono font-semibold">
                        {vehicle.odometer.toLocaleString()} {vehicle.odometer_unit.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Título:</span>
                      <span className="text-amber-400 font-semibold uppercase">
                        {vehicle.title_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Daño:</span>
                      <span className="text-slate-300 font-medium">
                        {vehicle.primary_damage || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Est.:</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        ${(vehicle.est_retail_value || 0).toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {vehicle.location || 'Patio USA'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(vehicle)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Duplicar ficha de vehículo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingVehicle(JSON.parse(JSON.stringify(vehicle)));
                        setActiveTab('info');
                      }}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition"
                      title="Editar especificaciones y fotos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id, `${vehicle.year} ${vehicle.brand} ${vehicle.model}`)}
                      className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR VEHÍCULO */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl animate-fadeIn max-h-[92vh] overflow-y-auto flex flex-col">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">
                  {editingVehicle.id ? `Editar: ${editingVehicle.brand} ${editingVehicle.model}` : 'Nuevo Vehículo'}
                </h2>
              </div>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas: Ficha Técnica vs Fotografías */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'info'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. Datos y Especificaciones
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'photos'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>2. Galería de Fotografías ({editingVehicle.images?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: DATOS Y CONDICIONES */}
            {activeTab === 'info' && (
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Identificación */}
                <div>
                  <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
                    Datos de Identificación
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Marca *</label>
                      <input
                        type="text"
                        required
                        value={editingVehicle.brand || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, brand: e.target.value })}
                        placeholder="Ford, Toyota, BMW..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Modelo *</label>
                      <input
                        type="text"
                        required
                        value={editingVehicle.model || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                        placeholder="Mustang GT, Tacoma..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Año *</label>
                      <input
                        type="number"
                        required
                        value={editingVehicle.year || 2023}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, year: parseInt(e.target.value) || 2023 })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Versión / Paquete</label>
                      <input
                        type="text"
                        value={editingVehicle.version || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, version: e.target.value })}
                        placeholder="V8 Fastback, TRD Pro..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Número de Lote *</label>
                      <input
                        type="text"
                        required
                        value={editingVehicle.lot_number || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, lot_number: e.target.value })}
                        placeholder="48291032"
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">VIN (Número de Chasis) *</label>
                      <input
                        type="text"
                        required
                        value={editingVehicle.vin || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, vin: e.target.value })}
                        placeholder="1FA6P8CF9P..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Enlace de Referencia Copart</label>
                      <input
                        type="text"
                        value={editingVehicle.reference_url || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, reference_url: e.target.value })}
                        placeholder="https://www.copart.com/lot/..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Características Mecánicas */}
                <div>
                  <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
                    Características Mecánicas y Kilometraje
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Motor</label>
                      <input
                        type="text"
                        value={editingVehicle.engine || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, engine: e.target.value })}
                        placeholder="5.0L V8 / 3.5L V6"
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Transmisión</label>
                      <input
                        type="text"
                        value={editingVehicle.transmission || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, transmission: e.target.value })}
                        placeholder="Automática / Manual"
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tracción</label>
                      <input
                        type="text"
                        value={editingVehicle.drivetrain || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, drivetrain: e.target.value })}
                        placeholder="AWD / RWD / FWD / 4x4"
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Combustible</label>
                      <input
                        type="text"
                        value={editingVehicle.fuel || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, fuel: e.target.value })}
                        placeholder="Gasolina / Híbrido"
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Odómetro</label>
                      <input
                        type="number"
                        value={editingVehicle.odometer || 0}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, odometer: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Unidad</label>
                      <select
                        value={editingVehicle.odometer_unit || 'mi'}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, odometer_unit: e.target.value as any })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="mi">Millas (mi)</option>
                        <option value="km">Kilómetros (km)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Color Exterior</label>
                      <input
                        type="text"
                        value={editingVehicle.exterior_color || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, exterior_color: e.target.value })}
                        placeholder="Negro, Blanco, Rojo..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Valor Retail Est. ($)</label>
                      <input
                        type="number"
                        value={editingVehicle.est_retail_value || 0}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, est_retail_value: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Condiciones y Daños */}
                <div>
                  <h4 className="text-amber-400 font-bold uppercase tracking-wider text-[11px] mb-2">
                    Condiciones, Título y Daños
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tipo de Título</label>
                      <select
                        value={editingVehicle.title_type || 'salvage'}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, title_type: e.target.value as any })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="clean">Clean Title (Limpio)</option>
                        <option value="salvage">Salvage Certificate</option>
                        <option value="rebuilt">Rebuilt Title</option>
                        <option value="certificate_of_destruction">Cert. Destruction</option>
                        <option value="non_repairable">Non-Repairable</option>
                        <option value="parts_only">Parts Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Estado de Funcionamiento</label>
                      <select
                        value={editingVehicle.vehicle_condition || 'run_and_drive'}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicle_condition: e.target.value as any })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="run_and_drive">Run & Drive (Enciende y Avanza)</option>
                        <option value="starts">Starts (Solo Enciende)</option>
                        <option value="stationary">Stationary (No Enciende)</option>
                        <option value="unknown">Desconocido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Daño Principal</label>
                      <input
                        type="text"
                        value={editingVehicle.primary_damage || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, primary_damage: e.target.value })}
                        placeholder="Front End, Rear End..."
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tiene Llaves</label>
                      <select
                        value={editingVehicle.has_keys ? 'true' : 'false'}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, has_keys: e.target.value === 'true' })}
                        className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="true">SÍ (Llaves Presentes)</option>
                        <option value="false">NO (Sin Llaves)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <label className="block text-slate-300 font-semibold mb-1">Ubicación / Patio Copart</label>
                    <input
                      type="text"
                      value={editingVehicle.location || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, location: e.target.value })}
                      placeholder="Atlanta East (GA), Yard 12..."
                      className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="mt-2.5">
                    <label className="block text-slate-300 font-semibold mb-1">Descripción y Observaciones Completas</label>
                    <textarea
                      rows={3}
                      value={editingVehicle.notes || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, notes: e.target.value })}
                      placeholder="Historial, detalles de reparación, reporte de inspección..."
                      className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('photos')}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-lg transition"
                  >
                    Ir a Cargar Fotografías →
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVehicle(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg"
                    >
                      Guardar Ficha
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: GESTIÓN DE FOTOGRAFÍAS */}
            {activeTab === 'photos' && (
              <div className="space-y-4 text-xs">
                {/* Cargar nueva foto */}
                <div className="bg-[#070e1a] p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Incorporar Nuevas Fotografías</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4">
                      <label className="block text-slate-400 font-semibold mb-1">Categoría</label>
                      <select
                        value={newImageCategory}
                        onChange={(e) => setNewImageCategory(e.target.value as PhotoCategory)}
                        className="w-full bg-[#0e1828] border border-slate-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="exterior">Exterior</option>
                        <option value="interior">Interior</option>
                        <option value="motor">Motor</option>
                        <option value="tablero">Tablero</option>
                        <option value="danos">Daños / Impacto</option>
                      </select>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-slate-400 font-semibold mb-1">URL de Imagen Externa</label>
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://... o enlace de Copart"
                        className="w-full bg-[#0e1828] border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-end gap-2">
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition"
                      >
                        Añadir URL
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">O sube fotos desde tu computador:</span>
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer font-semibold transition">
                      <span>Seleccionar Archivos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Galería actual */}
                <div>
                  <h4 className="font-bold text-slate-300 text-xs mb-2">
                    Fotografías Asociadas ({editingVehicle.images?.length || 0})
                  </h4>

                  {(!editingVehicle.images || editingVehicle.images.length === 0) ? (
                    <div className="p-8 text-center text-slate-500 bg-[#070e1a] rounded-lg border border-slate-800">
                      No hay imágenes cargadas para este vehículo. Agrega fotografías para mostrarlas en la sala en vivo.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {editingVehicle.images.map((img) => (
                        <div
                          key={img.id}
                          className={`relative bg-[#070e1a] rounded-lg border-2 overflow-hidden group ${
                            img.is_primary ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800'
                          }`}
                        >
                          <div className="aspect-[4/3] bg-black">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </div>

                          <div className="p-2 bg-[#09111c] flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {img.category}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(img.id)}
                                className={`p-1 rounded ${
                                  img.is_primary
                                    ? 'text-amber-400'
                                    : 'text-slate-500 hover:text-amber-400'
                                }`}
                                title={img.is_primary ? 'Foto principal' : 'Establecer como foto principal'}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400"
                                title="Eliminar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {img.is_primary && (
                            <span className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                              PRINCIPAL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg transition"
                  >
                    ← Volver a Especificaciones
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg"
                  >
                    Guardar Vehículo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE FOTOGRAFÍAS FULL SCREEN */}
      {galleryModalVehicle && (
        <ImageGalleryModal
          isOpen={true}
          onClose={() => setGalleryModalVehicle(null)}
          images={galleryModalVehicle.images || []}
          title={`${galleryModalVehicle.year} ${galleryModalVehicle.brand} ${galleryModalVehicle.model} - Lote #${galleryModalVehicle.lot_number}`}
        />
      )}
    </div>
  );
};

