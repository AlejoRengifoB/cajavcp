import { useState, useEffect, useRef, useCallback } from 'react';
import { Visitor } from '../types';
import { store } from '../store';
import { Timer, Play, RotateCcw, Clock, AlertTriangle, CheckCircle, Volume2, VolumeX } from 'lucide-react';

export function TimeManager() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const expiredAlerted = useRef<Set<string>>(new Set());

  const today = store.getTodayString();

  const loadVisitors = useCallback(() => {
    const allVisitors = store.getVisitorsByDate(today);
    setVisitors(allVisitors.filter(v => v.status !== 'completed'));
  }, [today]);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  useEffect(() => {
    const interval = setInterval(() => {
      const allVisitors = store.getVisitorsByDate(today);
      const active = allVisitors.filter(v => v.status !== 'completed');

      active.forEach(v => {
        if (v.status === 'active' || v.status === 'warning') {
          if (v.startTime) {
            const elapsed = Math.floor((Date.now() - new Date(v.startTime).getTime()) / 1000);
            const remaining = Math.max(0, v.timeMinutes * 60 - elapsed);

            let newStatus: Visitor['status'] = 'active';
            if (remaining <= 0) {
              newStatus = 'expired';
            } else if (remaining <= 300) {
              newStatus = 'warning';
            }

            if (remaining !== v.remainingSeconds || newStatus !== v.status) {
              store.updateVisitor(v.id, { remainingSeconds: remaining, status: newStatus });
            }

            if (newStatus === 'expired' && !expiredAlerted.current.has(v.id) && soundEnabled) {
              playAlert(v.name);
              expiredAlerted.current.add(v.id);
            }
          }
        }
      });

      loadVisitors();
    }, 1000);

    return () => clearInterval(interval);
  }, [today, soundEnabled, loadVisitors]);

  const playAlert = (visitorName: string) => {
    try {
      // Use speech synthesis to announce the name 3 times
      if ('speechSynthesis' in window) {
        // Cancel previous speech
        window.speechSynthesis.cancel();

        const message = `${visitorName} ha acabado su tiempo. ${visitorName} ha acabado su tiempo. ${visitorName} ha acabado su tiempo.`;
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Try to find a friendly Latin American Spanish voice
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(voice => 
          (voice.lang.includes('es-MX') || voice.lang.includes('es-419') || voice.lang.includes('es-CO') || voice.lang.includes('es-AR')) && 
          (voice.name.includes('Female') || voice.name.includes('Mujer') || voice.name.includes('Google'))
        ) || voices.find(voice => voice.lang.includes('es-MX') || voice.lang.includes('es-419')) 
          || voices.find(voice => voice.lang.includes('es'));

        if (spanishVoice) {
          utterance.voice = spanishVoice;
        }

        utterance.lang = 'es-MX';
        utterance.rate = 1.0; 
        utterance.pitch = 1.2; // Slightly higher pitch for friendliness
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
      }

      // Also play beep sound
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
      const ctx = audioRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.8);
      }, 300);
    } catch {
      // Audio not supported
    }
  };

  const startTimer = (id: string) => {
    store.updateVisitor(id, {
      startTime: new Date().toISOString(),
      status: 'active',
    });
    loadVisitors();
  };

  const renewTime = (id: string, extraMinutes: number) => {
    const visitor = visitors.find(v => v.id === id);
    if (!visitor) return;

    const newTotal = visitor.timeMinutes + extraMinutes;
    store.updateVisitor(id, {
      timeMinutes: newTotal,
      status: 'active',
      remainingSeconds: visitor.remainingSeconds + extraMinutes * 60,
    });
    expiredAlerted.current.delete(id);
    loadVisitors();
  };

  const completeVisitor = (id: string) => {
    store.updateVisitor(id, {
      status: 'completed',
      endTime: new Date().toISOString(),
    });
    loadVisitors();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-400 shadow-lg shadow-emerald-100';
      case 'warning': return 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400 shadow-lg shadow-amber-100';
      case 'expired': return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400 shadow-lg shadow-red-100 animate-pulse';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getTimerColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-4 py-1.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full text-xs font-bold shadow-md">PENDIENTE</span>;
      case 'active': return <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-full text-xs font-bold shadow-md shadow-green-200">ACTIVO</span>;
      case 'warning': return <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full text-xs font-bold shadow-md shadow-amber-200">⚠ POCO TIEMPO</span>;
      case 'expired': return <span className="px-4 py-1.5 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-full text-xs font-bold shadow-md shadow-red-200 animate-bounce">⏰ EXPIRADO</span>;
      default: return null;
    }
  };

  const pendingVisitors = visitors.filter(v => v.status === 'pending');
  const activeVisitors = visitors.filter(v => v.status === 'active' || v.status === 'warning');
  const expiredVisitors = visitors.filter(v => v.status === 'expired');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-2xl shadow-lg shadow-orange-200 animate-bounce">
            <Timer className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">Control de Tiempos</h2>
            <p className="text-orange-600 text-sm font-medium">Temporizadores en tiempo real</p>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-2xl transition-all transform hover:scale-110 ${soundEnabled ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400'}`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 text-center shadow-lg">
          <p className="text-3xl font-bold text-gray-700">{pendingVisitors.length}</p>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Pendientes</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl p-4 text-center shadow-lg shadow-green-200">
          <p className="text-3xl font-bold text-white">{activeVisitors.length}</p>
          <p className="text-xs text-green-100 font-bold uppercase tracking-wide">Activos</p>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl p-4 text-center shadow-lg shadow-red-200">
          <p className="text-3xl font-bold text-white">{expiredVisitors.length}</p>
          <p className="text-xs text-red-100 font-bold uppercase tracking-wide">Expirados</p>
        </div>
      </div>

      {visitors.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-yellow-300 to-orange-400 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-200 animate-pulse">
            <Clock className="w-12 h-12 text-white" />
          </div>
          <p className="text-lg font-bold text-purple-600">No hay visitantes activos hoy</p>
          <p className="text-sm text-purple-400">Registre visitantes para iniciar temporizadores</p>
        </div>
      )}

      {/* Expired first */}
      {expiredVisitors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Tiempo Expirado
          </h3>
          {expiredVisitors.map(v => (
            <div key={v.id} className={`rounded-2xl border-2 p-4 ${getStatusColor(v.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{v.name}</h4>
                  <p className="text-xs text-gray-500">{v.type === 'guardian' ? 'Tutor' : v.type === 'child' ? 'Niño' : 'Individual'} • {v.timeMinutes} min contratados</p>
                </div>
                {getStatusBadge(v.status)}
              </div>
              <div className={`text-4xl font-mono font-bold text-center py-2 ${getTimerColor(v.status)}`}>
                {formatTime(v.remainingSeconds)}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => renewTime(v.id, 15)}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center justify-center gap-1 text-sm shadow-lg shadow-amber-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  +15 min
                </button>
                <button
                  onClick={() => renewTime(v.id, 30)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-500 hover:to-cyan-600 transition-all transform hover:scale-105 flex items-center justify-center gap-1 text-sm shadow-lg shadow-blue-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  +30 min
                </button>
                <button
                  onClick={() => completeVisitor(v.id)}
                  className="flex-1 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold hover:from-gray-500 hover:to-gray-600 transition-all transform hover:scale-105 flex items-center justify-center gap-1 text-sm shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active */}
      {activeVisitors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600 flex items-center gap-2 text-lg">
            <Play className="w-5 h-5 text-emerald-500" />
            Activos
          </h3>
          {activeVisitors.map(v => (
            <div key={v.id} className={`rounded-2xl border-2 p-4 ${getStatusColor(v.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{v.name}</h4>
                  <p className="text-xs text-gray-500">{v.type === 'guardian' ? 'Tutor' : v.type === 'child' ? 'Niño' : 'Individual'} • {v.timeMinutes} min</p>
                </div>
                {getStatusBadge(v.status)}
              </div>
              <div className={`text-4xl font-mono font-bold text-center py-2 ${getTimerColor(v.status)}`}>
                {formatTime(v.remainingSeconds)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${v.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max(0, (v.remainingSeconds / (v.timeMinutes * 60)) * 100)}%` }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => renewTime(v.id, 15)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-xl font-bold hover:from-amber-200 hover:to-orange-200 transition-all transform hover:scale-105 text-sm shadow-md"
                >
                  +15 min
                </button>
                <button
                  onClick={() => renewTime(v.id, 30)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-xl font-bold hover:from-blue-200 hover:to-cyan-200 transition-all transform hover:scale-105 text-sm shadow-md"
                >
                  +30 min
                </button>
                <button
                  onClick={() => completeVisitor(v.id)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-xl font-bold hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105 text-sm shadow-md"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending */}
      {pendingVisitors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-slate-600 flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-gray-500" />
            Pendientes de Iniciar
          </h3>
          {pendingVisitors.map(v => (
            <div key={v.id} className={`rounded-2xl border-2 p-4 ${getStatusColor(v.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{v.name}</h4>
                  <p className="text-xs text-gray-500">{v.type === 'guardian' ? 'Tutor' : v.type === 'child' ? 'Niño' : 'Individual'} • {v.timeMinutes} min contratados</p>
                </div>
                {getStatusBadge(v.status)}
              </div>
              <div className="text-3xl font-mono font-bold text-center py-2 text-gray-400">
                {formatTime(v.timeMinutes * 60)}
              </div>
              <button
                onClick={() => startTimer(v.id)}
                className="w-full py-3 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white rounded-xl font-bold hover:from-emerald-500 hover:via-green-600 hover:to-teal-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-green-200 active:scale-95"
              >
                <Play className="w-5 h-5" />
                Iniciar Tiempo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
