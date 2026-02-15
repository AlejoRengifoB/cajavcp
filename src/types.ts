export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'receptionist';
  name: string;
}

export interface Guardian {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  registeredAt: string;
  waiverSigned: boolean;
}

export interface Child {
  id: string;
  fullName: string;
  age: number;
  guardianId: string;
}

export interface Individual {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  age: number;
  registeredAt: string;
  waiverSigned: boolean;
}

export interface Visitor {
  id: string;
  type: 'guardian' | 'child' | 'individual';
  personId: string;
  name: string;
  guardianId: string;
  timeMinutes: number;
  startTime: string | null;
  endTime: string | null;
  remainingSeconds: number;
  status: 'pending' | 'active' | 'warning' | 'expired' | 'completed';
  registeredBy: string;
  date: string;
  paid: boolean;
}

export interface Waiver {
  id: string;
  guardianId: string;
  guardianName: string;
  guardianIdNumber: string;
  signatureData: string;
  signedAt: string;
}

export interface Payment {
  id: string;
  visitorIds: string[];
  visitorNames: string[];
  amount: number;
  method: 'efectivo' | 'transferencia' | 'billetera_digital';
  dateTime: string;
  date: string;
  receptionistName: string;
  concept: string;
}

export type View = 'login' | 'dashboard' | 'register' | 'waiver' | 'timers' | 'payments' | 'admin';
