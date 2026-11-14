import React, { useState } from 'react';
import { Client, AuctionSession } from '../../types';
import { store } from '../../services/store';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, 
  Phone, MapPin, Calendar, FileText, CheckCircle2, 
  X, Eye, ArrowUpRight 
} from 'lucide-react';

interface ClientsViewProps {
  onOpenRoom?: (session: AuctionSession) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onOpenRoom }) => {
  const [clients, setClients] = useState<Client[]>(store.getClients());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [selectedClientDossier, setSelectedClientDossier] = useState<Client | null>(null);

  const refreshClients = () => {
    setClients([...store.getClients()]);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.full_name || !editingClient.email || !editingClient.phone) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    store.saveClient(editingClient as any);
    setEditingClient(null);
    refreshClients();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Confirma eliminar al cliente ${name}?`)) {
      store.deleteClient(id);
      refreshClients();
      if (selectedClientDossier?.id === id) {
        setSelectedClientDossier(null);
      }
    }
  };

  const getClientSessions = (clientId: string) => {
    return store.getSessions().filter((s) => s.client_id === clientId);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de nuevo cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Gestión de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Administra prospectos e inversionistas para salas de subastas privadas personalizadas.
          </p>
        </div>

        <button
          onClick={() => setEditingClient({
            full_name: '',
            phone: '',
            email: '',
            country: 'Estados Unidos',
            city: 'Miami',
            registration_date: new Date().toISOString().split('T')[0],
            status: 'nuevo',
            notes: ''
          })}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition active:scale-95 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0e1828] p-3 rounded-lg border border-[#1b3152]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070e1a] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070e1a] border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="negociando">Negociando</option>
            <option value="listo_subasta">Listo para Subasta</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#081220] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Subastas</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron clientes registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientSessions = getClientSessions(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-[#122035] transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-900/60 border border-blue-500/50 flex items-center justify-center text-blue-300 font-bold text-xs">
                            {client.full_name.charAt(0)}
                          </div>
                          <span>{client.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{client.city}, {client.country}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {client.registration_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          client.status === 'listo_subasta'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                            : client.status === 'negociando'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                            : client.status === 'cerrado'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {client.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          {clientSessions.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClientDossier(client)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Ver ficha individual del cliente"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Editar datos"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id, client.full_name)}
                            className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: FORMULARIO CREAR / EDITAR CLIENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                {editingClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingClient.full_name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, full_name: e.target.value })}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    placeholder="+1 (786) 555-0192"
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    placeholder="carlos@email.com"
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">País</label>
                  <input
                    type="text"
                    value={editingClient.country || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, country: e.target.value })}
                    placeholder="Estados Unidos / México / etc."
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={editingClient.city || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    placeholder="Miami, FL"
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado del Seguimiento</label>
                  <select
                    value={editingClient.status || 'nuevo'}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value as any })}
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="negociando">Negociando</option>
                    <option value="listo_subasta">Listo para Subasta</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha de Registro</label>
                  <input
                    type="date"
                    value={editingClient.registration_date || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, registration_date: e.target.value })}
                    className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Preferencias</label>
                <textarea
                  rows={3}
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  placeholder="Tipo de vehículos de interés, presupuesto, detalles de contacto..."
                  className="w-full bg-[#070e1a] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA INDIVIDUAL DEL CLIENTE (DOSSIER) */}
      {selectedClientDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-2xl w-full p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                  {selectedClientDossier.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedClientDossier.full_name}</h2>
                  <span className="text-xs text-slate-400">Ficha Individual del Cliente</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientDossier(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Información Personal */}
              <div className="bg-[#070e1a] p-3.5 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Correo:</span>
                  <span className="text-white font-mono">{selectedClientDossier.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Teléfono:</span>
                  <span className="text-white font-mono">{selectedClientDossier.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Ubicación:</span>
                  <span className="text-white">{selectedClientDossier.city}, {selectedClientDossier.country}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Estado de Seguimiento:</span>
                  <span className="text-emerald-400 font-bold uppercase">{selectedClientDossier.status}</span>
                </div>
              </div>

              {selectedClientDossier.notes && (
                <div className="bg-[#070e1a] p-3.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Notas y Requerimientos:</span>
                  <p className="text-slate-300">{selectedClientDossier.notes}</p>
                </div>
              )}

              {/* Historial de Sesiones de Subasta para este cliente */}
              <div>
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Sesiones y Subastas Preparadas ({getClientSessions(selectedClientDossier.id).length})</span>
                </h3>

                {getClientSessions(selectedClientDossier.id).length === 0 ? (
                  <p className="text-slate-500 italic p-3 bg-[#070e1a] rounded border border-slate-800">
                    Aún no se han configurado subastas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getClientSessions(selectedClientDossier.id).map((s) => (
                      <div
                        key={s.id}
                        className="bg-[#070e1a] p-3 rounded-lg border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white">
                            {s.vehicle_snapshot.year} {s.vehicle_snapshot.brand} {s.vehicle_snapshot.model}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            Lote #{s.vehicle_snapshot.lot_number} • Oferta Prevista: ${s.expected_final_price.toLocaleString()} USD
                          </div>
                        </div>

                        {onOpenRoom && (
                          <button
                            onClick={() => {
                              setSelectedClientDossier(null);
                              onOpenRoom(s);
                            }}
                            className="bg-[#002855] hover:bg-[#003d80] text-amber-400 font-bold px-3 py-1 rounded text-xs flex items-center gap-1 border border-amber-400/40"
                          >
                            <span>Abrir Sala</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

