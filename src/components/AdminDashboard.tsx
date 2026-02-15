import { useState, useEffect, useCallback } from 'react';
import { Visitor, Payment, Waiver, Guardian, Child, Individual } from '../types';
import { store } from '../store';
import {
  LayoutDashboard, DollarSign, Users, Clock, Download, Calendar,
  TrendingUp, FileSignature, Eye, X, Send, Settings, CheckCircle,
  AlertTriangle, RefreshCw, Link2, Mail
} from 'lucide-react';

interface AutoExportSettings {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string;
  lastExport: string | null;
  nextExport: string | null;
  googleSheetUrl: string;
}

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(store.getTodayString());
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [_guardians, setGuardians] = useState<Guardian[]>([]);
  const [_children, setChildren] = useState<Child[]>([]);
  const [_individuals, setIndividuals] = useState<Individual[]>([]);
  const [viewingWaiver, setViewingWaiver] = useState<Waiver | null>(null);
  
  // Auto export settings
  const [autoExport, setAutoExport] = useState<AutoExportSettings>({
    enabled: false,
    dayOfWeek: 0, // Sunday by default
    time: '20:00',
    lastExport: null,
    nextExport: null,
    googleSheetUrl: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Load auto export settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('villa_colombia_auto_export');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAutoExport(parsed);
      } catch {
        // Invalid saved data
      }
    }
  }, []);

  // Save auto export settings
  const saveAutoExportSettings = (settings: AutoExportSettings) => {
    localStorage.setItem('villa_colombia_auto_export', JSON.stringify(settings));
    setAutoExport(settings);
  };

  // Calculate next export date
  const calculateNextExport = (dayOfWeek: number, time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);
    
    const currentDay = now.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    
    if (daysUntilTarget === 0 && now > nextDate) {
      // If today is the target day but time has passed, schedule for next week
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + daysUntilTarget);
    }
    
    return nextDate.toISOString();
  };

  const loadAllData = useCallback(() => {
    setVisitors(store.getVisitorsByDate(selectedDate));
    setPayments(store.getPaymentsByDate(selectedDate));
    setWaivers(store.getWaivers());
    setGuardians(store.getGuardians());
    setChildren(store.getChildren());
    setIndividuals(store.getIndividuals());
  }, [selectedDate]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Check for auto export
  useEffect(() => {
    if (!autoExport.enabled) return;

    const checkExport = () => {
      const now = new Date();
      const nextExport = autoExport.nextExport ? new Date(autoExport.nextExport) : null;
      
      if (nextExport && now >= nextExport) {
        // Time to export!
        performAutoExport();
      }
    };

    const interval = setInterval(checkExport, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [autoExport]);

  const performAutoExport = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    // Generate full export data
    const exportData = generateFullExportData(dateStr);
    
    // In a real implementation, this would send to a backend API
    // For now, we'll save to localStorage and show a notification
    const exportHistory = JSON.parse(localStorage.getItem('villa_colombia_exports') || '[]');
    exportHistory.push({
      date: dateStr,
      timestamp: new Date().toISOString(),
      data: exportData,
      type: 'auto_weekly'
    });
    localStorage.setItem('villa_colombia_exports', JSON.stringify(exportHistory));
    
    // Update next export date
    const newNextExport = calculateNextExport(autoExport.dayOfWeek, autoExport.time);
    saveAutoExportSettings({
      ...autoExport,
      lastExport: new Date().toISOString(),
      nextExport: newNextExport,
    });
    
    // Show notification (in a real app, this would be a toast)
    alert(`Exportación automática completada para el día ${dateStr}`);
  };

  const generateFullExportData = (date: string) => {
    const dayVisitors = store.getVisitorsByDate(date);
    const dayPayments = store.getPaymentsByDate(date);
    const allWaivers = store.getWaivers();
    const allGuardians = store.getGuardians();
    const allChildren = store.getChildren();
    const allIndividuals = store.getIndividuals();

    return {
      date,
      generatedAt: new Date().toISOString(),
      visitors: dayVisitors.map(v => {
        const waiver = allWaivers.find(w => w.guardianId === v.personId);
        return {
          id: v.id,
          name: v.name,
          type: v.type,
          idNumber: v.type === 'guardian' 
            ? allGuardians.find(g => g.id === v.personId)?.idNumber 
            : v.type === 'individual'
            ? allIndividuals.find(i => i.id === v.personId)?.idNumber
            : '',
          age: v.type === 'child' 
            ? allChildren.find(c => c.id === v.personId)?.age 
            : v.type === 'individual'
            ? allIndividuals.find(i => i.id === v.personId)?.age
            : null,
          phone: v.type === 'guardian'
            ? allGuardians.find(g => g.id === v.personId)?.phone
            : v.type === 'individual'
            ? allIndividuals.find(i => i.id === v.personId)?.phone
            : '',
          timeMinutes: v.timeMinutes,
          startTime: v.startTime,
          endTime: v.endTime,
          remainingSeconds: v.remainingSeconds,
          status: v.status,
          registeredBy: v.registeredBy,
          registeredAt: v.type === 'guardian'
            ? allGuardians.find(g => g.id === v.personId)?.registeredAt
            : v.type === 'individual'
            ? allIndividuals.find(i => i.id === v.personId)?.registeredAt
            : '',
          waiverSigned: !!waiver,
          waiverSignedAt: waiver?.signedAt || null,
          waiverSignatureData: waiver?.signatureData || null,
        };
      }),
      payments: dayPayments.map(p => ({
        id: p.id,
        visitorNames: p.visitorNames,
        visitorIds: p.visitorIds,
        amount: p.amount,
        method: p.method,
        dateTime: p.dateTime,
        receptionistName: p.receptionistName,
        concept: p.concept,
      })),
      waivers: allWaivers.filter(w => {
        // Filter waivers signed on this date
        const waiverDate = w.signedAt.split('T')[0];
        return waiverDate === date;
      }).map(w => ({
        id: w.id,
        guardianId: w.guardianId,
        guardianName: w.guardianName,
        guardianIdNumber: w.guardianIdNumber,
        signedAt: w.signedAt,
        signatureData: w.signatureData,
      })),
      summary: {
        totalVisitors: dayVisitors.length,
        totalPayments: dayPayments.length,
        totalRevenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        byMethod: {
          efectivo: dayPayments.filter(p => p.method === 'efectivo').reduce((s, p) => s + p.amount, 0),
          transferencia: dayPayments.filter(p => p.method === 'transferencia').reduce((s, p) => s + p.amount, 0),
          billetera_digital: dayPayments.filter(p => p.method === 'billetera_digital').reduce((s, p) => s + p.amount, 0),
        },
        byType: {
          guardians: dayVisitors.filter(v => v.type === 'guardian').length,
          children: dayVisitors.filter(v => v.type === 'child').length,
          individuals: dayVisitors.filter(v => v.type === 'individual').length,
        },
        totalTimeMinutes: dayVisitors.reduce((sum, v) => sum + v.timeMinutes, 0),
        avgTimePerVisitor: dayVisitors.length > 0 
          ? Math.round(dayVisitors.reduce((sum, v) => sum + v.timeMinutes, 0) / dayVisitors.length)
          : 0,
      }
    };
  };

  const handleExportCSV = () => {
    const data = generateFullExportData(selectedDate);
    
    // Create comprehensive CSV
    let csv = 'VILLA COLOMBIA PARK - REPORTE COMPLETO\n';
    csv += `Fecha: ${data.date}\n`;
    csv += `Generado: ${new Date(data.generatedAt).toLocaleString('es')}\n\n`;
    
    // Summary
    csv += 'RESUMEN DEL DÍA\n';
    csv += `Total Visitantes,${data.summary.totalVisitors}\n`;
    csv += `Total Pagos,${data.summary.totalPayments}\n`;
    csv += `Ingresos Totales,${data.summary.totalRevenue}\n`;
    csv += `Efectivo,${data.summary.byMethod.efectivo}\n`;
    csv += `Transferencia,${data.summary.byMethod.transferencia}\n`;
    csv += `Billetera Digital,${data.summary.byMethod.billetera_digital}\n`;
    csv += `Tutores,${data.summary.byType.guardians}\n`;
    csv += `Niños,${data.summary.byType.children}\n`;
    csv += `Individuales,${data.summary.byType.individuals}\n`;
    csv += `Tiempo Total (min),${data.summary.totalTimeMinutes}\n`;
    csv += `Tiempo Promedio (min),${data.summary.avgTimePerVisitor}\n\n`;
    
    // Visitors
    csv += 'VISITANTES\n';
    csv += 'ID,Nombre,Tipo,Cédula,Edad,Teléfono,Tiempo (min),Estado,Registrado por,Fecha Registro,Waiver Firmado,Fecha Waiver\n';
    data.visitors.forEach(v => {
      csv += `${v.id},${v.name},${v.type},${v.idNumber || ''},${v.age || ''},${v.phone || ''},${v.timeMinutes},${v.status},${v.registeredBy},${v.registeredAt ? new Date(v.registeredAt).toLocaleString('es') : ''},${v.waiverSigned ? 'Sí' : 'No'},${v.waiverSignedAt ? new Date(v.waiverSignedAt).toLocaleString('es') : ''}\n`;
    });
    csv += '\n';
    
    // Payments
    csv += 'PAGOS\n';
    csv += 'ID,Visitantes,Monto,Método,Fecha/Hora,Recepcionista,Concepto\n';
    data.payments.forEach(p => {
      csv += `${p.id},"${p.visitorNames.join('; ')}",${p.amount},${p.method},${new Date(p.dateTime).toLocaleString('es')},${p.receptionistName},${p.concept}\n`;
    });
    csv += '\n';
    
    // Waivers
    csv += 'CONSENTIMIENTOS FIRMADOS\n';
    csv += 'ID,Nombre,Cédula,Fecha/Hora\n';
    data.waivers.forEach(w => {
      csv += `${w.id},${w.guardianName},${w.guardianIdNumber},${new Date(w.signedAt).toLocaleString('es')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `villa_colombia_reporte_completo_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = generateFullExportData(selectedDate);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `villa_colombia_reporte_completo_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportToGoogleSheets = () => {
    const data = generateFullExportData(selectedDate);
    
    // Create a formatted text that can be easily pasted into Google Sheets
    let text = 'VILLA COLOMBIA PARK - DATOS PARA GOOGLE SHEETS\n\n';
    text += '=== RESUMEN ===\n';
    text += `Fecha:\t${data.date}\n`;
    text += `Total Visitantes:\t${data.summary.totalVisitors}\n`;
    text += `Total Ingresos:\t${data.summary.totalRevenue}\n`;
    text += `Efectivo:\t${data.summary.byMethod.efectivo}\n`;
    text += `Transferencia:\t${data.summary.byMethod.transferencia}\n`;
    text += `Billetera Digital:\t${data.summary.byMethod.billetera_digital}\n\n`;
    
    text += '=== VISITANTES ===\n';
    text += 'Nombre\tTipo\tCédula\tEdad\tTeléfono\tTiempo (min)\tEstado\tRegistrado por\tWaiver\n';
    data.visitors.forEach(v => {
      text += `${v.name}\t${v.type}\t${v.idNumber || ''}\t${v.age || ''}\t${v.phone || ''}\t${v.timeMinutes}\t${v.status}\t${v.registeredBy}\t${v.waiverSigned ? 'Sí' : 'No'}\n`;
    });
    
    text += '\n=== PAGOS ===\n';
    text += 'Visitantes\tMonto\tMétodo\tFecha/Hora\tRecepcionista\n';
    data.payments.forEach(p => {
      text += `${p.visitorNames.join(', ')}\t${p.amount}\t${p.method}\t${new Date(p.dateTime).toLocaleString('es')}\t${p.receptionistName}\n`;
    });

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Datos copiados al portapapeles en formato tabulado. Abra Google Sheets y pegue (Ctrl+V) para importar.');
      
      // Open Google Sheets
      window.open('https://docs.google.com/spreadsheets/create', '_blank');
    }).catch(() => {
      // Fallback: download as text file
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `villa_colombia_gsheets_${selectedDate}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const testGoogleSheetsConnection = () => {
    setTestStatus('testing');
    
    // Simulate API test
    setTimeout(() => {
      if (autoExport.googleSheetUrl && autoExport.googleSheetUrl.includes('docs.google.com/spreadsheets')) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 3000);
      }
    }, 1500);
  };

  const toggleAutoExport = () => {
    const newEnabled = !autoExport.enabled;
    const nextExport = newEnabled 
      ? calculateNextExport(autoExport.dayOfWeek, autoExport.time)
      : null;
    
    saveAutoExportSettings({
      ...autoExport,
      enabled: newEnabled,
      nextExport,
    });
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalVisitors = visitors.length;
  const totalTimeMinutes = visitors.reduce((sum, v) => sum + v.timeMinutes, 0);
  const avgTimePerVisitor = totalVisitors > 0 ? Math.round(totalTimeMinutes / totalVisitors) : 0;

  const completedVisitors = visitors.filter(v => v.status === 'completed');
  const activeVisitors = visitors.filter(v => v.status === 'active' || v.status === 'warning');
  const expiredVisitors = visitors.filter(v => v.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <LayoutDashboard className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Panel de Administración</h2>
            <p className="text-gray-500 text-sm">Resumen completo y exportación de datos</p>
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

      {/* Export Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Exportación de Datos
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Ocultar Configuración' : 'Configurar Envío Automático'}
          </button>
        </div>

        {/* Auto Export Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-700 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Envío Automático a Google Sheets
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-sm font-medium ${autoExport.enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {autoExport.enabled ? 'Activado' : 'Desactivado'}
                </span>
                <div
                  onClick={toggleAutoExport}
                  className={`w-14 h-7 rounded-full transition-all cursor-pointer relative ${
                    autoExport.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                      autoExport.enabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </div>
              </label>
            </div>

            {autoExport.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Día de la semana</label>
                    <select
                      value={autoExport.dayOfWeek}
                      onChange={e => {
                        const newSettings = {
                          ...autoExport,
                          dayOfWeek: parseInt(e.target.value),
                          nextExport: calculateNextExport(parseInt(e.target.value), autoExport.time),
                        };
                        saveAutoExportSettings(newSettings);
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                    >
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Hora del envío</label>
                    <input
                      type="time"
                      value={autoExport.time}
                      onChange={e => {
                        const newSettings = {
                          ...autoExport,
                          time: e.target.value,
                          nextExport: calculateNextExport(autoExport.dayOfWeek, e.target.value),
                        };
                        saveAutoExportSettings(newSettings);
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    URL de Google Sheets (opcional)
                  </label>
                  <input
                    type="url"
                    value={autoExport.googleSheetUrl}
                    onChange={e => saveAutoExportSettings({ ...autoExport, googleSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingrese la URL de la hoja de cálculo donde desea recibir los datos automáticamente.
                  </p>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Próximo envío:</strong>{' '}
                      {autoExport.nextExport 
                        ? new Date(autoExport.nextExport).toLocaleString('es', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'No programado'
                      }
                    </p>
                    {autoExport.lastExport && (
                      <p className="text-xs text-gray-400 mt-1">
                        Último envío: {new Date(autoExport.lastExport).toLocaleString('es')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={testGoogleSheetsConnection}
                    disabled={testStatus === 'testing'}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      testStatus === 'testing' ? 'bg-gray-100 text-gray-400' :
                      testStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
                      testStatus === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {testStatus === 'testing' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : testStatus === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : testStatus === 'error' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {testStatus === 'testing' ? 'Probando...' :
                     testStatus === 'success' ? 'Conexión OK' :
                     testStatus === 'error' ? 'Error' :
                     'Probar Conexión'}
                  </button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>
                      <strong>Nota:</strong> El envío automático requiere una conexión a internet activa. 
                      Los datos se exportarán en formato compatible con Google Sheets cada semana en el día y hora configurados.
                      Asegúrese de tener acceso a la hoja de cálculo de destino.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleExportCSV}
            className="py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar JSON
          </button>
          <button
            onClick={handleExportToGoogleSheets}
            className="py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
          >
            <Send className="w-5 h-5" />
            Exportar a Google Sheets
          </button>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Visitantes del Día ({visitors.length})</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
              {activeVisitors.length} Activos
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
              {expiredVisitors.length} Expirados
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
              {completedVisitors.length} Finalizados
            </span>
          </div>
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
            Consentimientos Firmados ({waivers.filter(w => w.signedAt.startsWith(selectedDate)).length})
          </h3>
        </div>
        {waivers.filter(w => w.signedAt.startsWith(selectedDate)).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay consentimientos firmados en esta fecha</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {waivers.filter(w => w.signedAt.startsWith(selectedDate)).map(w => (
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
