import { useRef, useState, useEffect } from 'react';
import { Individual } from '../types';
import { store } from '../store';
import { RotateCcw, CheckCircle, AlertTriangle, User } from 'lucide-react';

interface Props {
  individual: Individual;
  onComplete: (individual: Individual) => void;
  onBack: () => void;
}

export function IndividualWaiverSignature({ individual, onComplete, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Check if waiver already signed
  const existingWaiver = store.getWaiverByPerson(individual.id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || existingWaiver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [existingWaiver]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsSigned(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setIsSigned(false);
  };

  const handleSubmit = () => {
    if (!existingWaiver && (!isSigned || !agreed)) return;

    if (!existingWaiver) {
      const canvas = canvasRef.current;
      const signatureData = canvas?.toDataURL('image/png') || '';

      store.addWaiver({
        guardianId: individual.id,
        guardianName: individual.fullName,
        guardianIdNumber: individual.idNumber,
        signatureData,
        signedAt: new Date().toISOString(),
      });

      store.updateIndividual(individual.id, { waiverSigned: true });
    }

    const updatedIndividual = { ...individual, waiverSigned: true };
    onComplete(updatedIndividual);
  };

  if (existingWaiver) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-2xl shadow-lg shadow-cyan-200">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Consentimiento Individual</h2>
            <p className="text-blue-500 text-sm font-medium">Exoneración de responsabilidad</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border-2 border-cyan-200 text-center space-y-3 shadow-lg shadow-cyan-100">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-cyan-700">Consentimiento Ya Firmado</h3>
          <p className="text-cyan-600">
            {individual.fullName} ya firmó el consentimiento el{' '}
            {new Date(existingWaiver.signedAt).toLocaleDateString('es')} a las{' '}
            {new Date(existingWaiver.signedAt).toLocaleTimeString('es')}.
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
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-xl shadow-cyan-200 transform hover:scale-105 active:scale-95"
          >
            Continuar al Pago
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-2xl shadow-lg shadow-amber-200">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Firma de Consentimiento</h2>
          <p className="text-orange-500 text-sm font-medium">Obligatorio para completar el registro</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-1.5 rounded-lg">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 text-lg">EXONERACIÓN DE RESPONSABILIDAD</h3>
        </div>
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 text-sm text-gray-700 space-y-3 max-h-48 overflow-y-auto border-2 border-cyan-100">
          <p>
            Yo, <strong>{individual.fullName}</strong>, identificado(a) con cédula de identidad
            número <strong>{individual.idNumber}</strong>, mayor de edad, actúo en mi propio nombre
            y representación, y declaro lo siguiente:
          </p>
          <p>
            1. <strong>De forma libre y voluntaria</strong>, autorizo mi ingreso al parque de aventuras
            <strong> Villa Colombia Park</strong>, incluyendo el uso de todas las atracciones, juegos mecánicos,
            zonas recreativas, albercas y demás áreas disponibles.
          </p>
          <p>
            2. Reconozco y acepto que las actividades recreativas dentro del parque conllevan riesgos inherentes,
            incluyendo pero no limitados a: caídas, golpes, raspaduras, lesiones musculares, quemaduras solares
            o cualquier otro tipo de lesión física.
          </p>
          <p>
            3. <strong>Eximo de toda responsabilidad</strong> al parque Villa Colombia Park, sus propietarios,
            empleados, administradores y representantes legales, por cualquier lesión, daño físico, pérdida
            de objetos personales o cualquier otro perjuicio que pudiera ocurrir durante mi permanencia en
            las instalaciones del parque.
          </p>
          <p>
            4. Declaro bajo juramento que me encuentro en buen estado de salud física y mental, y no padezco
            condiciones médicas (tales como problemas cardíacos, epilepsia, embarazo, entre otros) que impidan
            mi participación en las actividades del parque.
          </p>
          <p>
            5. Me comprometo a cumplir con todas las normas de seguridad, señalizaciones e instrucciones
            proporcionadas por el personal del parque.
          </p>
          <p>
            6. Entiendo que el parque se reserva el derecho de denegar el acceso o suspender el servicio
            a cualquier persona que no cumpla con las normas establecidas.
          </p>
          <p className="font-semibold text-gray-800">
            Al firmar este documento, confirmo que he leído, entendido y acepto todos los términos
            anteriormente descritos. Esta exoneración tiene validez legal y vinculante.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Firma Digital</h3>
          <button
            onClick={clearSignature}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
        </div>

        <div className="border-2 border-dashed border-cyan-300 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-50 touch-none">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            style={{ height: '160px' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Firme con el dedo o el mouse en el área de arriba
        </p>

        <label className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 cursor-pointer border-2 border-amber-200">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-orange-500 shrink-0"
          />
          <span className="text-sm text-gray-700">
            He leído y acepto la exoneración de responsabilidad. Confirmo que toda la información
            proporcionada es verdadera.
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:from-gray-200 hover:to-gray-300 transition-all transform hover:scale-105"
        >
          Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isSigned || !agreed}
          className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-xl shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
        >
          <CheckCircle className="w-5 h-5" />
          Firmar y Continuar
        </button>
      </div>
    </div>
  );
}
