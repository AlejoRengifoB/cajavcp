import { useState } from 'react';
import { User } from '../types';
import { store } from '../store';
import { Trees, Eye, EyeOff, LogIn } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = store.authenticate(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 border-4 border-white/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 mb-4 shadow-xl animate-bounce">
            <Trees className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">Villa Colombia Park</h1>
          <p className="text-purple-500 mt-1 font-medium">Sistema de Gestión - Recepción</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-purple-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none text-lg transition-all bg-gradient-to-r from-pink-50 to-purple-50"
              placeholder="Ingrese su usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-purple-700 mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-purple-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none text-lg pr-12 transition-all bg-gradient-to-r from-pink-50 to-purple-50"
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-pink-500 p-1"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border-2 border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 rounded-xl border-2 border-purple-100">
          <p className="text-xs text-purple-600 text-center font-bold mb-2">Credenciales de prueba:</p>
          <div className="text-xs text-purple-400 space-y-1">
            <p><span className="font-bold text-purple-600">Admin:</span> admin / admin123</p>
            <p><span className="font-bold text-purple-600">Recepción:</span> recepcion / recep123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
