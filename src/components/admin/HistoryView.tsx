import React, { useState } from 'react';
import { store } from '../../services/store';
import { AuctionResult } from '../../types';
import { CopartLogo } from '../common/CopartLogo';
import { 
  History, Award, Calendar, CheckCircle2, 
  XCircle, Printer, Search, FileText, X,
  Share2, ExternalLink, Lock, Check
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [results] = useState<AuctionResult[]>(store.getResults());
  const [selectedResult, setSelectedResult] = useState<AuctionResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [docTokenMap, setDocTokenMap] = useState<Record<string, string>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGenerateOrGetDoc = async (res: AuctionResult) => {
    // Buscar si ya tiene documento
    const docs = await store.fetchSessionDocuments(res.session_id);
    if (docs && docs.length > 0) {
      const active = docs.find((d: any) => !d.isRevoked);
      if (active) {
        setDocTokenMap((prev) => ({ ...prev, [res.session_id]: active.docToken }));
        copyLink(active.docToken);
        return;
      }
    }

    // Si no tiene, generar uno nuevo
    const created = await store.createDocumentLink(res.session_id, {
      clientName: res.client_name,
      clientEmail: res.client_email,
      expiresInDays: 7,
    });
    if (created && created.success && created.docToken) {
      setDocTokenMap((prev) => ({ ...prev, [res.session_id]: created.docToken }));
      copyLink(created.docToken);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/documento/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const filteredResults = results.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.vehicle_summary.toLowerCase().includes(q) ||
      r.client_name.toLowerCase().includes(q) ||
      r.lot_number.includes(q) ||
      r.winner_name.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            Historial de Subastas y Resultados
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro de subastas finalizadas, actas de adjudicación y certificados de resultado.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-[#0e1828] p-3 rounded-lg border border-[#1b3152]">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por lote, vehículo, cliente o adjudicatario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070e1a] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#081220] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Lote / Vehículo</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4">Precio Adjudicado</th>
                <th className="py-3 px-4">Ganador Registrado</th>
                <th className="py-3 px-4">Fecha Finalización</th>
                <th className="py-3 px-4 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Aún no hay resultados de subastas cerradas en el historial.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => (
                  <tr key={res.id} className="hover:bg-[#122035] transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{res.vehicle_summary}</div>
                      <div className="text-[10px] text-amber-400 font-mono">Lote #{res.lot_number}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{res.client_name}</div>
                      <div className="text-[10px] text-slate-400">{res.client_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {res.is_client_winner ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Adjudicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-950/80 border border-rose-600/60 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Superado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                      ${res.final_price.toLocaleString()} USD
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-semibold">{res.winner_name}</div>
                      <div className="text-[10px] text-slate-400">[{res.winner_location}]</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(res.finished_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleGenerateOrGetDoc(res)}
                        className="bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-300 font-semibold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition"
                        title="Generar y copiar enlace privado documental para el cliente"
                      >
                        {copiedToken === docTokenMap[res.session_id] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>¡Enlace Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Enlace Cliente</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedResult(res)}
                        className="bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 font-semibold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Acta</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / COMPROBANTE OFICIAL IMPRIMIBLE */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1828] border border-[#1b3152] rounded-xl max-w-xl w-full p-6 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <CopartLogo size="sm" showSubtitle={true} />
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha para Imprimir */}
            <div className="bg-[#070e1a] p-5 rounded-xl border border-slate-800 space-y-4 print:bg-white print:text-black">
              <div className="text-center border-b border-slate-800 pb-3">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  CERTIFICADO OFICIAL DE RESULTADO DE SUBASTA
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  {selectedResult.vehicle_summary}
                </h2>
                <span className="text-xs font-mono text-slate-400">LOTE #{selectedResult.lot_number}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Cliente Presentado:</span>
                  <span className="font-bold text-white">{selectedResult.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha y Hora de Cierre:</span>
                  <span className="font-mono text-slate-300">{new Date(selectedResult.finished_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Precio Inicial de Salida:</span>
                  <span className="font-mono text-white">${selectedResult.starting_price.toLocaleString()} USD</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Precio Final de Cierre:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${selectedResult.final_price.toLocaleString()} USD
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total de Ofertas Realizadas:</span>
                  <span className="font-mono text-white">{selectedResult.total_bids}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Adjudicatario Ganador:</span>
                  <span className="font-bold text-amber-300">{selectedResult.winner_name}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0a1320] rounded border border-slate-800 text-center">
                <span className="text-slate-400 block text-[11px] mb-1">Estado Oficial:</span>
                <span className={`text-sm font-black uppercase tracking-wider ${
                  selectedResult.is_client_winner ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {selectedResult.is_client_winner
                    ? 'VEHÍCULO ADJUDICADO AL CLIENTE'
                    : 'SUBASTA CERRADA - SUPERADO POR TERCERO'}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 text-center italic">
                * Documento emitido para fines de presentación y seguimiento de simulación privada en sala gemela Copart VB3.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>

              <button
                onClick={() => setSelectedResult(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

