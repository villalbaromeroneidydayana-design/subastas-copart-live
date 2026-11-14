import React, { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../lib/soundEffects';
import { 
  Settings, Database, Volume2, ShieldCheck, 
  RotateCcw, Check, Copy, Terminal, ExternalLink 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestSound = (type: 'bid' | 'gavel' | 'tick' | 'sold') => {
    switch (type) {
      case 'bid':
        sounds.playBidPing();
        break;
      case 'gavel':
        sounds.playGavel();
        break;
      case 'tick':
        sounds.playCountdownTick(1.2);
        break;
      case 'sold':
        sounds.playSoldFanfare();
        break;
    }
  };

  const handleCopySqlPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleResetFactory = () => {
    if (confirm('¿Desea restablecer todos los clientes, vehículos y sesiones a los valores de demostración iniciales?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 text-xs max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Configuración del Sistema
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajustes de conectividad con Supabase, motor de audio y administración de datos.
        </p>
      </div>

      {/* Tarjeta de Conexión Supabase */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Conexión con Supabase (Backend & PostgreSQL)</h3>
              <p className="text-[11px] text-slate-400">
                Alberga tablas con RLS, autenticación, Storage de fotografías y canales en tiempo real.
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
            isSupabaseConfigured
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
              : 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
          }`}>
            {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demostración / Offline Activo'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">VITE_SUPABASE_URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">VITE_SUPABASE_ANON_KEY</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="p-3 bg-[#070e1a] rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-mono text-[11px]">
                Script SQL con RLS, Storage y Realtime listo en: <strong className="text-amber-400">supabase/schema.sql</strong>
              </span>
            </div>
            <button
              onClick={handleCopySqlPath}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copiado' : 'Copiar Ruta'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Pruebas de Audio de Subasta */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Volume2 className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-white text-sm">Efectos de Sonido Procedurales Web Audio API</h3>
            <p className="text-[11px] text-slate-400">
              Generados en tiempo real sin latencia ni dependencia de archivos externos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => handleTestSound('bid')}
            className="bg-[#070e1a] hover:bg-[#122035] border border-slate-800 hover:border-emerald-500/50 p-3 rounded-lg text-left transition"
          >
            <span className="font-bold text-white block">Campana Copart</span>
            <span className="text-[10px] text-emerald-400">Sonido de puja entrante</span>
          </button>

          <button
            onClick={() => handleTestSound('gavel')}
            className="bg-[#070e1a] hover:bg-[#122035] border border-slate-800 hover:border-amber-500/50 p-3 rounded-lg text-left transition"
          >
            <span className="font-bold text-white block">Martillo de Madera</span>
            <span className="text-[10px] text-amber-400">Golpe de adjudicación</span>
          </button>

          <button
            onClick={() => handleTestSound('tick')}
            className="bg-[#070e1a] hover:bg-[#122035] border border-slate-800 hover:border-red-500/50 p-3 rounded-lg text-left transition"
          >
            <span className="font-bold text-white block">Alerta Última Llamada</span>
            <span className="text-[10px] text-red-400">Cuenta regresiva urgente</span>
          </button>

          <button
            onClick={() => handleTestSound('sold')}
            className="bg-[#070e1a] hover:bg-[#122035] border border-slate-800 hover:border-purple-500/50 p-3 rounded-lg text-left transition"
          >
            <span className="font-bold text-white block">Fanfarria SOLD!</span>
            <span className="text-[10px] text-purple-400">Celebración de ganador</span>
          </button>
        </div>
      </div>

      {/* Restablecer Datos de Demostración */}
      <div className="bg-[#0e1828] border border-rose-950/60 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-rose-300 text-sm">Restablecer Datos de Prueba</h3>
          <p className="text-[11px] text-slate-400">
            Reinicia todos los clientes, vehículos con fotos y salas a su estado de fábrica de demostración.
          </p>
        </div>
        <button
          onClick={handleResetFactory}
          className="bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold px-4 py-2 rounded-lg transition"
        >
          Restablecer Fábrica
        </button>
      </div>
    </div>
  );
};

