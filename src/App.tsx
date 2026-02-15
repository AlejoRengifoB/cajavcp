import { useState, useCallback } from 'react';
import { User, View, Guardian, Child, Individual } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { VisitorRegistration } from './components/VisitorRegistration';
import { WaiverSignature } from './components/WaiverSignature';
import { IndividualWaiverSignature } from './components/IndividualWaiverSignature';
import { TimeManager } from './components/TimeManager';
import { PaymentForm, PaymentHistory, IndividualPaymentForm } from './components/Payments';
import { AdminDashboard } from './components/AdminDashboard';
import { CheckCircle } from 'lucide-react';

interface RegistrationFlow {
  guardian: Guardian;
  children: Child[];
  useAttractions: { guardian: boolean; childIds: string[] };
}

interface IndividualFlow {
  individual: Individual;
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('register');
  const [registrationFlow, setRegistrationFlow] = useState<RegistrationFlow | null>(null);
  const [individualFlow, setIndividualFlow] = useState<IndividualFlow | null>(null);
  const [flowType, setFlowType] = useState<'guardian' | 'individual' | null>(null);
  const [flowStep, setFlowStep] = useState<'register' | 'waiver' | 'payment' | 'success'>('register');

  const handleLogin = useCallback((u: User) => {
    setUser(u);
    setCurrentView('register');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentView('register');
    setRegistrationFlow(null);
    setIndividualFlow(null);
    setFlowType(null);
    setFlowStep('register');
  }, []);

  const handleStartWaiver = useCallback((guardian: Guardian, children: Child[], useAttractions: { guardian: boolean; childIds: string[] }) => {
    setRegistrationFlow({ guardian, children, useAttractions });
    setFlowType('guardian');
    setFlowStep('waiver');
  }, []);

  const handleStartIndividualWaiver = useCallback((individual: Individual) => {
    setIndividualFlow({ individual });
    setFlowType('individual');
    setFlowStep('waiver');
  }, []);

  const handleWaiverComplete = useCallback((guardian: Guardian) => {
    if (registrationFlow) {
      setRegistrationFlow({ ...registrationFlow, guardian });
    }
    setFlowStep('payment');
  }, [registrationFlow]);

  const handleIndividualWaiverComplete = useCallback((individual: Individual) => {
    if (individualFlow) {
      setIndividualFlow({ ...individualFlow, individual });
    }
    setFlowStep('payment');
  }, [individualFlow]);

  const handlePaymentComplete = useCallback(() => {
    setFlowStep('success');
    // Auto-navigate after delay
    setTimeout(() => {
      setFlowStep('register');
      setRegistrationFlow(null);
      setIndividualFlow(null);
      setFlowType(null);
      setCurrentView('timers');
    }, 3000);
  }, []);

  const handleNavigate = useCallback((view: View) => {
    setCurrentView(view);
    if (view === 'register') {
      setFlowStep('register');
      setRegistrationFlow(null);
      setIndividualFlow(null);
      setFlowType(null);
    }
  }, []);

  const handleBackToRegister = useCallback(() => {
    setFlowStep('register');
    setRegistrationFlow(null);
    setIndividualFlow(null);
    setFlowType(null);
  }, []);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Registration Flow
    if (currentView === 'register') {
      if (flowStep === 'success') {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="bg-emerald-100 p-6 rounded-full animate-bounce">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">¡Registro Completado!</h2>
            <p className="text-gray-500 text-lg">El visitante ha sido registrado exitosamente.</p>
            <p className="text-gray-400 text-sm">Redirigiendo a control de tiempos...</p>
          </div>
        );
      }

      // Individual waiver flow
      if (flowStep === 'waiver' && flowType === 'individual' && individualFlow) {
        return (
          <IndividualWaiverSignature
            individual={individualFlow.individual}
            onComplete={handleIndividualWaiverComplete}
            onBack={handleBackToRegister}
          />
        );
      }

      // Guardian waiver flow
      if (flowStep === 'waiver' && flowType === 'guardian' && registrationFlow) {
        return (
          <WaiverSignature
            guardian={registrationFlow.guardian}
            children={registrationFlow.children}
            useAttractions={registrationFlow.useAttractions}
            onComplete={handleWaiverComplete}
            onBack={handleBackToRegister}
          />
        );
      }

      // Individual payment flow
      if (flowStep === 'payment' && flowType === 'individual' && individualFlow) {
        return (
          <IndividualPaymentForm
            user={user}
            individual={individualFlow.individual}
            onComplete={handlePaymentComplete}
            onBack={() => setFlowStep('waiver')}
          />
        );
      }

      // Guardian payment flow
      if (flowStep === 'payment' && flowType === 'guardian' && registrationFlow) {
        return (
          <PaymentForm
            user={user}
            guardian={registrationFlow.guardian}
            children={registrationFlow.children}
            useAttractions={registrationFlow.useAttractions}
            onComplete={handlePaymentComplete}
            onBack={() => setFlowStep('waiver')}
          />
        );
      }

      return (
        <VisitorRegistration
          onStartWaiver={handleStartWaiver}
          onStartIndividualWaiver={handleStartIndividualWaiver}
        />
      );
    }

    if (currentView === 'timers') {
      return <TimeManager />;
    }

    if (currentView === 'payments') {
      return <PaymentHistory />;
    }

    if (currentView === 'admin' && user.role === 'admin') {
      return <AdminDashboard />;
    }

    return (
      <VisitorRegistration
        onStartWaiver={handleStartWaiver}
        onStartIndividualWaiver={handleStartIndividualWaiver}
      />
    );
  };

  return (
    <Layout user={user} currentView={currentView} onNavigate={handleNavigate} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}
