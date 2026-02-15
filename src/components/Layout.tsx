import { User, View } from '../types';
import { Trees, UserPlus, Timer, CreditCard, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  user: User;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, currentView, onNavigate, onLogout, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { view: 'register' as View, label: 'Registro', icon: UserPlus },
    { view: 'timers' as View, label: 'Tiempos', icon: Timer },
    { view: 'payments' as View, label: 'Pagos', icon: CreditCard },
    ...(user.role === 'admin' ? [{ view: 'admin' as View, label: 'Panel Admin', icon: LayoutDashboard }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('register')}>
            <div className="bg-white/30 rounded-xl p-2 animate-bounce">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight drop-shadow-md">Villa Colombia Park</h1>
              <p className="text-pink-100 text-xs">{user.name} • {user.role === 'admin' ? 'Administrador' : 'Recepcionista'}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                  currentView === item.view
                    ? 'bg-white/30 text-white shadow-lg shadow-pink-500/30'
                    : 'text-pink-100 hover:bg-white/20 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-pink-100 hover:bg-red-500/30 hover:text-white transition-all ml-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-emerald-500/30 px-4 py-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => { onNavigate(item.view); setMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentView === item.view
                    ? 'bg-white/30 text-white'
                    : 'text-pink-100 hover:bg-white/20'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-pink-100 hover:bg-red-500/30 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
