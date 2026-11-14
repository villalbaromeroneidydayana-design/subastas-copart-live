import React, { useState } from 'react';
import { CopartLogo } from '../common/CopartLogo';
import { DashboardView } from './DashboardView';
import { ClientsView } from './ClientsView';
import { VehiclesView } from './VehiclesView';
import { AuctionWizard } from './AuctionWizard';
import { HistoryView } from './HistoryView';
import { SettingsView } from './SettingsView';
import { AuctionSession } from '../../types';
import { 
  Home, Users, Car, PlayCircle, History, 
  Settings, Menu, X, ExternalLink, ShieldCheck, 
  ChevronRight, Volume2
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface AdminLayoutProps {
  onOpenLiveRoom: (session: AuctionSession) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onOpenLiveRoom }) => {
  const { lang, setLang, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'inicio' | 'clientes' | 'vehiculos' | 'subastas' | 'historial' | 'configuracion'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'inicio', label: lang === 'en' ? 'Overview' : 'Inicio', icon: Home },
    { id: 'clientes', label: lang === 'en' ? 'Clients' : 'Clientes', icon: Users },
    { id: 'vehiculos', label: lang === 'en' ? 'Vehicles' : 'Vehículos', icon: Car },
    { id: 'subastas', label: lang === 'en' ? 'Live Auctions' : 'Subastas', icon: PlayCircle },
    { id: 'historial', label: lang === 'en' ? 'History' : 'Historial', icon: History },
    { id: 'configuracion', label: lang === 'en' ? 'Settings' : 'Configuración', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR DE NAVEGACIÓN LATERAL */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1320] border-r border-[#192b45] flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo y Encabezado */}
          <div className="p-4 border-b border-[#192b45] flex items-center justify-between">
            <CopartLogo size="md" showSubtitle={true} />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-3 space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-[#101d30]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-75" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-[#192b45] text-xs text-slate-400 space-y-2 bg-[#080f1a]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-semibold">
              {lang === 'en' ? 'VB3 Terminal Online' : 'Simulador VB3 Online'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            USA Auto Auctions • VB3 Engine
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra Superior con Selector de Idioma EN / ES */}
        <header className="bg-[#0a1320] border-b border-[#192b45] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                {lang === 'en' ? 'LANE A • LIVE TERMINAL CONSOLE' : 'SALA A • CONSOLA DE TERMINAL EN VIVO'}
              </span>
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
                title="Switch to English"
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
                title="Cambiar a Español"
              >
                ES
              </button>
            </div>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'inicio' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab as any)}
              onOpenRoom={onOpenLiveRoom}
            />
          )}
          {activeTab === 'clientes' && <ClientsView onOpenRoom={onOpenLiveRoom} />}
          {activeTab === 'vehiculos' && <VehiclesView />}
          {activeTab === 'subastas' && <AuctionWizard onOpenRoom={onOpenLiveRoom} />}
          {activeTab === 'historial' && <HistoryView />}
          {activeTab === 'configuracion' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

