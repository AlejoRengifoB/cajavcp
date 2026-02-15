import { useState, useEffect, useCallback } from 'react';
import { Visitor, Payment, Waiver } from '../types';
import { store } from '../store';
import {
  LayoutDashboard, DollarSign, Users, Clock, Download, Calendar,
  TrendingUp, FileSignature, Eye, X
} from 'lucide-react';

export function AdminPanel() {
  const [selectedDate, setSelectedDate] = useState(store.getTodayString());
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [viewingWaiver, setViewingWaiver] = useState<Waiver | null>(null);

  const loadData = useCallback(() => {
    setVisitors(store.getVisitorsByDate(selectedDate));
    setPayments(store.getPaymentsByDate(selectedDate));
    setWaivers(store.getWaivers());
  }, [selectedDate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalVisitors = visitors.length;
  const totalTimeMinutes = visitors.reduce((sum, v) => sum + v.timeMinutes, 0);
  const avgTimePerVisitor = totalVisitors > 0 ? Math.round(totalTimeMinutes / totalVisitors) : 0;

  const handleExportCSV = () => {
    const csv = store.exportToCSV(selectedDate);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGSheets = () => {
    const csv = store.exportToCSV(selectedDate);
    const encoded = encodeURIComponent(csv);
    // This opens Google Sheets import
    const url = `https://docs.google.com/spreadsheets/create`;
    window.open(url, '_blank');
    // Also copy to clipboard
    navigator.clipboard.writeText(csv).then(() => {
      alert('Datos copiados al portapapeles. Pegue los datos en la hoja de Google Sheets que se abrió.');
    }).catch(() => {
      // Fallback: download as CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `reporte_${selectedDate}.csv`;
      a.click();
    });
    void encoded;
  };

  const completedVisitors = visitors.filter(v => v.status === 'completed');
  const activeVisitors = visitors.filter(v => v.status === 'active' || v.status === 'warning');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <LayoutDashboard className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
            <p className="text-gray-500 text-sm">Resumen y reportes del parque</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-emerald-200" />
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-emerald-100 text-xs font-medium">Ingresos del Día</p>
          <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-200" />
            <span className="text-blue-200 text-xs font-bold">{activeVisitors.length} activos</span>
          </div>
          <p className="text-blue-100 text-xs font-medium">Visitantes del Día</p>
          <p className="text-3xl font-bold">{totalVisitors}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-purple-100 text-xs font-medium">Tiempo Promedio</p>
          <p className="text-3xl font-bold">{avgTimePerVisitor} min</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between mb-2">
            <FileSignature className="w-8 h-8 text-amber-200" />
          </div>
          <p className="text-amber-100 text-xs font-medium">Transacciones</p>
          <p className="text-3xl font-bold">{payments.length}</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportCSV}
          className="flex-1 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
        <button
          onClick={handleExportGSheets}
          className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
        >
          <Download className="w-5 h-5" />
          Exportar a Google Sheets
        </button>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Visitantes del Día ({visitors.length})</h3>
        </div>
        {visitors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay visitantes en esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tiempo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visitors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.type === 'guardian' ? 'Tutor' : v.type === 'child' ? 'Niño' : 'Individual'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.timeMinutes} min</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        v.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        v.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                        v.status === 'expired' ? 'bg-red-100 text-red-700' :
                        v.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {v.status === 'active' ? 'Activo' :
                         v.status === 'warning' ? 'Poco tiempo' :
                         v.status === 'expired' ? 'Expirado' :
                         v.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.registeredBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">Pagos del Día ({payments.length})</h3>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay pagos en esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Hora</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Visitantes</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Concepto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Método</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Recepcionista</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(p.dateTime).toLocaleTimeString('es')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.visitorNames.join(', ')}</td>
                    <td className="px-4 py-3 text-gray-600">{p.concept}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.method === 'efectivo' ? 'bg-green-100 text-green-700' :
                        p.method === 'transferencia' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {p.method === 'efectivo' ? 'Efectivo' :
                         p.method === 'transferencia' ? 'Transferencia' : 'Billetera'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.receptionistName}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">${p.amount.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-700">TOTAL:</td>
                  <td className="px-4 py-3 text-right text-emerald-600 text-lg">${totalRevenue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Waivers */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-amber-500" />
            Consentimientos Firmados ({waivers.length})
          </h3>
        </div>
        {waivers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay consentimientos firmados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {waivers.slice(-20).reverse().map(w => (
              <div key={w.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{w.guardianName}</p>
                  <p className="text-xs text-gray-400">
                    Cédula: {w.guardianIdNumber} • {new Date(w.signedAt).toLocaleDateString('es')} {new Date(w.signedAt).toLocaleTimeString('es')}
                  </p>
                </div>
                <button
                  onClick={() => setViewingWaiver(w)}
                  className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed visitors */}
      {completedVisitors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-700">Visitantes Finalizados ({completedVisitors.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {completedVisitors.map(v => (
              <div key={v.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.timeMinutes} min • {v.registeredBy}</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">Finalizado</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiver Modal */}
      {viewingWaiver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingWaiver(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Consentimiento Firmado</h3>
              <button onClick={() => setViewingWaiver(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Nombre:</strong> {viewingWaiver.guardianName}</p>
              <p><strong>Cédula:</strong> {viewingWaiver.guardianIdNumber}</p>
              <p><strong>Fecha:</strong> {new Date(viewingWaiver.signedAt).toLocaleDateString('es')}</p>
              <p><strong>Hora:</strong> {new Date(viewingWaiver.signedAt).toLocaleTimeString('es')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Firma:</p>
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <img src={viewingWaiver.signatureData} alt="Firma" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
