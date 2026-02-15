import { User, Guardian, Child, Individual, Visitor, Waiver, Payment } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const defaultUsers: User[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
  { id: '2', username: 'recepcion', password: 'recep123', role: 'receptionist', name: 'Recepcionista 1' },
  { id: '3', username: 'recepcion2', password: 'recep123', role: 'receptionist', name: 'Recepcionista 2' },
];

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  // Users
  getUsers: (): User[] => getItem('park_users', defaultUsers),
  authenticate: (username: string, password: string): User | null => {
    const users = getItem<User[]>('park_users', defaultUsers);
    return users.find(u => u.username === username && u.password === password) || null;
  },

  // Guardians
  getGuardians: (): Guardian[] => getItem('park_guardians', []),
  addGuardian: (g: Omit<Guardian, 'id' | 'registeredAt' | 'waiverSigned'>): Guardian => {
    const guardians = getItem<Guardian[]>('park_guardians', []);
    const newG: Guardian = {
      ...g,
      id: generateId(),
      registeredAt: new Date().toISOString(),
      waiverSigned: false,
    };
    guardians.push(newG);
    setItem('park_guardians', guardians);
    return newG;
  },
  updateGuardian: (id: string, updates: Partial<Guardian>) => {
    const guardians = getItem<Guardian[]>('park_guardians', []);
    const idx = guardians.findIndex(g => g.id === id);
    if (idx >= 0) {
      guardians[idx] = { ...guardians[idx], ...updates };
      setItem('park_guardians', guardians);
    }
  },
  findGuardianByIdNumber: (idNumber: string): Guardian | undefined => {
    return getItem<Guardian[]>('park_guardians', []).find(g => g.idNumber === idNumber);
  },

  // Children
  getChildren: (): Child[] => getItem('park_children', []),
  getChildrenByGuardian: (guardianId: string): Child[] => {
    return getItem<Child[]>('park_children', []).filter(c => c.guardianId === guardianId);
  },
  addChild: (c: Omit<Child, 'id'>): Child => {
    const children = getItem<Child[]>('park_children', []);
    const newC: Child = { ...c, id: generateId() };
    children.push(newC);
    setItem('park_children', children);
    return newC;
  },

  // Individuals
  getIndividuals: (): Individual[] => getItem('park_individuals', []),
  findIndividualByIdNumber: (idNumber: string): Individual | undefined => {
    return getItem<Individual[]>('park_individuals', []).find(i => i.idNumber === idNumber);
  },
  addIndividual: (i: Omit<Individual, 'id' | 'registeredAt' | 'waiverSigned'>): Individual => {
    const individuals = getItem<Individual[]>('park_individuals', []);
    const newI: Individual = {
      ...i,
      id: generateId(),
      registeredAt: new Date().toISOString(),
      waiverSigned: false,
    };
    individuals.push(newI);
    setItem('park_individuals', individuals);
    return newI;
  },
  updateIndividual: (id: string, updates: Partial<Individual>) => {
    const individuals = getItem<Individual[]>('park_individuals', []);
    const idx = individuals.findIndex(i => i.id === id);
    if (idx >= 0) {
      individuals[idx] = { ...individuals[idx], ...updates };
      setItem('park_individuals', individuals);
    }
  },
  getWaiverByIndividual: (individualId: string): Waiver | undefined => {
    return getItem<Waiver[]>('park_waivers', []).find(w => w.guardianId === individualId && w.guardianId.startsWith('ind_'));
  },

  // Visitors
  getVisitors: (): Visitor[] => getItem('park_visitors', []),
  getVisitorsByDate: (date: string): Visitor[] => {
    return getItem<Visitor[]>('park_visitors', []).filter(v => v.date === date);
  },
  addVisitor: (v: Omit<Visitor, 'id'>): Visitor => {
    const visitors = getItem<Visitor[]>('park_visitors', []);
    const newV: Visitor = { ...v, id: generateId() };
    visitors.push(newV);
    setItem('park_visitors', visitors);
    return newV;
  },
  updateVisitor: (id: string, updates: Partial<Visitor>) => {
    const visitors = getItem<Visitor[]>('park_visitors', []);
    const idx = visitors.findIndex(v => v.id === id);
    if (idx >= 0) {
      visitors[idx] = { ...visitors[idx], ...updates };
      setItem('park_visitors', visitors);
    }
    return visitors[idx];
  },

  // Waivers
  getWaivers: (): Waiver[] => getItem('park_waivers', []),
  addWaiver: (w: Omit<Waiver, 'id'>): Waiver => {
    const waivers = getItem<Waiver[]>('park_waivers', []);
    const newW: Waiver = { ...w, id: generateId() };
    waivers.push(newW);
    setItem('park_waivers', waivers);
    return newW;
  },
  getWaiverByGuardian: (guardianId: string): Waiver | undefined => {
    return getItem<Waiver[]>('park_waivers', []).find(w => w.guardianId === guardianId);
  },
  getWaiverByPerson: (personId: string): Waiver | undefined => {
    return getItem<Waiver[]>('park_waivers', []).find(w => w.guardianId === personId);
  },

  // Payments
  getPayments: (): Payment[] => getItem('park_payments', []),
  getPaymentsByDate: (date: string): Payment[] => {
    return getItem<Payment[]>('park_payments', []).filter(p => p.date === date);
  },
  addPayment: (p: Omit<Payment, 'id'>): Payment => {
    const payments = getItem<Payment[]>('park_payments', []);
    const newP: Payment = { ...p, id: generateId() };
    payments.push(newP);
    setItem('park_payments', payments);
    return newP;
  },

  // Export
  exportToCSV: (date: string): string => {
    const visitors = getItem<Visitor[]>('park_visitors', []).filter(v => v.date === date);
    const payments = getItem<Payment[]>('park_payments', []).filter(p => p.date === date);

    let csv = 'REPORTE DIARIO - ' + date + '\n\n';
    csv += 'VISITANTES\n';
    csv += 'Nombre,Tipo,Tiempo (min),Estado,Registrado por\n';
    visitors.forEach(v => {
      csv += `${v.name},${v.type},${v.timeMinutes},${v.status},${v.registeredBy}\n`;
    });
    csv += '\nPAGOS\n';
    csv += 'Visitantes,Monto,Método,Fecha/Hora,Recepcionista,Concepto\n';
    payments.forEach(p => {
      csv += `${p.visitorNames.join('; ')},${p.amount},${p.method},${p.dateTime},${p.receptionistName},${p.concept}\n`;
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    csv += `\nTOTAL INGRESOS: $${totalRevenue.toLocaleString()}\n`;
    csv += `TOTAL VISITANTES: ${visitors.length}\n`;

    return csv;
  },

  getTodayString: (): string => {
    return new Date().toISOString().split('T')[0];
  }
};
