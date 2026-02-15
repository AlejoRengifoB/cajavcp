import { useState, useEffect, useCallback } from 'react';
import { User, Guardian, Child, Individual, Payment } from '../types';
import { store } from '../store';
import { CreditCard, DollarSign, Banknote, Smartphone, ArrowRightLeft, Calendar, Users, User as UserIcon } from 'lucide-react';

interface PaymentFormProps {
  user: User;
  guardian: Guardian;
  children: Child[];
  useAttractions: { guardian: boolean; childIds: string[] };
  onComplete: () => void;
  onBack: () => void;
}

const PACKAGES = [
  { label: '1 Lanzada Tobogán', time: 1, price: 4990 },
  { label: '12 Minutos', time: 12, price: 19990 },
  { label: '30 Minutos', time: 30, price: 24990 },
  { label: '1 Hora', time: 60, price: 34990 },
  { label: '2 Horas', time: 120, price: 44990 },
];

export function PaymentForm({ user, guardian, children: childrenProp, useAttractions, onComplete, onBack }: PaymentFormProps) {
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [pricePerPerson, setPricePerPerson] = useState(24990);
  const [method, setMethod] = useState<Payment['method']>('efectivo');

  const attendees: { id: string; name: string; type: 'guardian' | 'child' }[] = [];
  if (useAttractions.guardian) {
    attendees.push({ id: guardian.id, name: guardian.fullName, type: 'guardian' });
  }
  childrenProp.filter(c => useAttractions.childIds.includes(c.id)).forEach(c => {
    attendees.push({ id: c.id, name: c.fullName, type: 'child' });
  });

  const totalAmount = attendees.length * pricePerPerson;
  const today = store.getTodayString();

  const handlePayment = () => {
    // Create visitors
    const visitorIds: string[] = [];
    const visitorNames: string[] = [];

    attendees.forEach(a => {
      const visitor = store.addVisitor({
        type: a.type,
        personId: a.id,
        name: a.name,
        guardianId: guardian.id,
        timeMinutes,
        startTime: null,
        endTime: null,
        remainingSeconds: timeMinutes * 60,
        status: 'pending',
        registeredBy: user.name,
        date: today,
        paid: true,
      });
      visitorIds.push(visitor.id);
      visitorNames.push(a.name);
    });

    // Record payment
    store.addPayment({
      visitorIds,
      visitorNames,
      amount: totalAmount,
      method,
      dateTime: new Date().toISOString(),
      date: today,
      receptionistName: user.name,
      concept: `${timeMinutes} min - ${attendees.length} persona(s)`,
    });

    onComplete();
  };

  const methodOptions: { value: Payment['method']; label: string; icon: React.ReactNode }[] = [
    { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
    { value: 'transferencia', label: 'Transferencia', icon: <ArrowRightLeft className="w-5 h-5" /> },
    { value: 'billetera_digital', label: 'Billetera Digital', icon: <Smartphone className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <CreditCard className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Pago y Asignación de Tiempo</h2>
          <p className="text-purple-500 text-sm font-medium">Configure el tiempo y registre el pago</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-5">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          Personas que usarán atracciones ({attendees.length})
        </h3>
        <div className="space-y-2">
          {attendees.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${a.type === 'guardian' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-green-500'}`} />
              <span className="font-medium text-gray-700">{a.name}</span>
              <span className="text-xs text-purple-400">({a.type === 'guardian' ? 'Tutor' : 'Niño'})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Paquetes de Tiempo y Precio */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-pink-100 p-5 space-y-4">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Seleccionar Paquete</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PACKAGES.map((pkg, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTimeMinutes(pkg.time);
                setPricePerPerson(pkg.price);
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 transform hover:scale-105 ${
                timeMinutes === pkg.time && pricePerPerson === pkg.price
                  ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-500 shadow-lg shadow-pink-200'
                  : 'bg-white border-gray-100 hover:border-pink-300'
              }`}
            >
              <span className={`font-bold ${timeMinutes === pkg.time && pricePerPerson === pkg.price ? 'text-pink-700' : 'text-gray-800'}`}>
                {pkg.label}
              </span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">${pkg.price.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5 space-y-4">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Tiempo Personalizado</h3>
          <div className="relative">
            <input
              type="number"
              value={timeMinutes}
              onChange={e => setTimeMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 outline-none text-lg font-bold bg-gradient-to-r from-cyan-50 to-blue-50"
              min="1"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">min</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-5 space-y-4">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Precio Personalizado</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</span>
            <input
              type="number"
              value={pricePerPerson}
              onChange={e => setPricePerPerson(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none text-lg font-bold bg-gradient-to-r from-purple-50 to-pink-50"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-100 p-5 space-y-4">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Método de Pago</h3>
        <div className="grid grid-cols-3 gap-2">
          {methodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMethod(opt.value)}
              className={`py-4 rounded-xl font-bold text-sm transition-all transform hover:scale-105 flex flex-col items-center gap-2 ${
                method === opt.value
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl shadow-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-bold">Total a Pagar</p>
            <p className="text-4xl font-black">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
        </div>
        <p className="text-white/80 text-sm mt-2 font-medium">
          {attendees.length} persona(s) × ${pricePerPerson.toLocaleString()} = ${totalAmount.toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105"
        >
          Volver
        </button>
        <button
          onClick={handlePayment}
          disabled={attendees.length === 0}
          className="flex-1 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white rounded-xl font-bold text-lg hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 transition-all shadow-xl shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
        >
          <CreditCard className="w-5 h-5" />
          Confirmar Pago
        </button>
      </div>
    </div>
  );
}

// Individual Payment Form
interface IndividualPaymentFormProps {
  user: User;
  individual: Individual;
  onComplete: () => void;
  onBack: () => void;
}

export function IndividualPaymentForm({ user, individual, onComplete, onBack }: IndividualPaymentFormProps) {
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [pricePerPerson, setPricePerPerson] = useState(24990);
  const [method, setMethod] = useState<Payment['method']>('efectivo');

  const totalAmount = pricePerPerson;
  const today = store.getTodayString();

  const handlePayment = () => {
    // Create visitor
    const visitor = store.addVisitor({
      type: 'individual',
      personId: individual.id,
      name: individual.fullName,
      guardianId: individual.id, // For individuals, they are their own guardian
      timeMinutes,
      startTime: null,
      endTime: null,
      remainingSeconds: timeMinutes * 60,
      status: 'pending',
      registeredBy: user.name,
      date: today,
      paid: true,
    });

    // Record payment
    store.addPayment({
      visitorIds: [visitor.id],
      visitorNames: [individual.fullName],
      amount: totalAmount,
      method,
      dateTime: new Date().toISOString(),
      date: today,
      receptionistName: user.name,
      concept: `${timeMinutes} min - 1 persona individual`,
    });

    onComplete();
  };

  const methodOptions: { value: Payment['method']; label: string; icon: React.ReactNode }[] = [
    { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-5 h-5" /> },
    { value: 'transferencia', label: 'Transferencia', icon: <ArrowRightLeft className="w-5 h-5" /> },
    { value: 'billetera_digital', label: 'Billetera Digital', icon: <Smartphone className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-2xl shadow-lg shadow-cyan-200">
          <CreditCard className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Pago Individual</h2>
          <p className="text-blue-500 text-sm font-medium">Configure el tiempo y registre el pago</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 mb-3 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-cyan-500" />
          Persona Individual
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <span className="font-medium text-gray-700">{individual.fullName}</span>
            <span className="text-xs text-cyan-500">(Individual - {individual.age} años)</span>
          </div>
        </div>
      </div>

      {/* Paquetes de Tiempo y Precio */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5 space-y-4">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Seleccionar Paquete</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PACKAGES.map((pkg, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTimeMinutes(pkg.time);
                setPricePerPerson(pkg.price);
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 transform hover:scale-105 ${
                timeMinutes === pkg.time && pricePerPerson === pkg.price
                  ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-500 shadow-lg shadow-cyan-200'
                  : 'bg-white border-gray-100 hover:border-cyan-300'
              }`}
            >
              <span className={`font-bold ${timeMinutes === pkg.time && pricePerPerson === pkg.price ? 'text-cyan-700' : 'text-gray-800'}`}>
                {pkg.label}
              </span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">${pkg.price.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5 space-y-4">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Tiempo Personalizado</h3>
          <div className="relative">
            <input
              type="number"
              value={timeMinutes}
              onChange={e => setTimeMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 outline-none text-lg font-bold bg-gradient-to-r from-cyan-50 to-blue-50"
              min="1"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">min</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-5 space-y-4">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Precio Personalizado</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</span>
            <input
              type="number"
              value={pricePerPerson}
              onChange={e => setPricePerPerson(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none text-lg font-bold bg-gradient-to-r from-purple-50 to-pink-50"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-100 p-5 space-y-4">
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Método de Pago</h3>
        <div className="grid grid-cols-3 gap-2">
          {methodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMethod(opt.value)}
              className={`py-4 rounded-xl font-bold text-sm transition-all transform hover:scale-105 flex flex-col items-center gap-2 ${
                method === opt.value
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200'
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl shadow-cyan-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-bold">Total a Pagar</p>
            <p className="text-4xl font-black">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105"
        >
          Volver
        </button>
        <button
          onClick={handlePayment}
          className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-xl shadow-cyan-200 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
        >
          <CreditCard className="w-5 h-5" />
          Confirmar Pago
        </button>
      </div>
    </div>
  );
}

// Payment history view
export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDate, setSelectedDate] = useState(store.getTodayString());

  const loadPayments = useCallback(() => {
    setPayments(store.getPaymentsByDate(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const byMethod = {
    efectivo: payments.filter(p => p.method === 'efectivo').reduce((s, p) => s + p.amount, 0),
    transferencia: payments.filter(p => p.method === 'transferencia').reduce((s, p) => s + p.amount, 0),
    billetera_digital: payments.filter(p => p.method === 'billetera_digital').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <CreditCard className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Registro de Pagos</h2>
          <p className="text-purple-500 text-sm font-medium">Historial y resumen de ventas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-2 rounded-xl">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-pink-500 outline-none text-lg bg-gradient-to-r from-pink-50 to-purple-50"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-purple-200">
          <p className="text-white/80 text-xs font-bold">Total del Día</p>
          <p className="text-2xl font-black">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border-2 border-green-100 shadow-md">
          <p className="text-green-500 text-xs font-bold flex items-center gap-1"><Banknote className="w-3 h-3" /> Efectivo</p>
          <p className="text-xl font-bold text-gray-800">${byMethod.efectivo.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border-2 border-blue-100 shadow-md">
          <p className="text-blue-500 text-xs font-bold flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> Transfer.</p>
          <p className="text-xl font-bold text-gray-800">${byMethod.transferencia.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border-2 border-purple-100 shadow-md">
          <p className="text-purple-500 text-xs font-bold flex items-center gap-1"><Smartphone className="w-3 h-3" /> Billetera</p>
          <p className="text-xl font-bold text-gray-800">${byMethod.billetera_digital.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 overflow-hidden">
        <div className="p-4 border-b-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Transacciones ({payments.length})</h3>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-purple-200 to-pink-200 w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <p className="font-bold text-purple-400">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-50">
            {payments.map(p => (
              <div key={p.id} className="p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{p.visitorNames.join(', ')}</p>
                    <p className="text-xs text-purple-400 mt-0.5">
                      {new Date(p.dateTime).toLocaleTimeString('es')} • {p.receptionistName} • {p.concept}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 text-lg">${p.amount.toLocaleString()}</p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      p.method === 'efectivo' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                      p.method === 'transferencia' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                      'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
                    }`}>
                      {p.method === 'efectivo' ? 'Efectivo' : p.method === 'transferencia' ? 'Transferencia' : 'Billetera'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
