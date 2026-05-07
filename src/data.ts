export type Role = 'admin' | 'manager' | 'employee';

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  job: string;
  service: string;
  weeklyHours: number;
  active: boolean;
};

export type Shift = {
  id: string;
  employeeId: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
};

export type Absence = {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Punch = {
  id: string;
  employeeId: string;
  date: string;
  arrival?: string;
  breakStart?: string;
  breakEnd?: string;
  departure?: string;
};

export const employeesSeed: Employee[] = [
  { id: 'e1', firstName: 'Emma', lastName: 'Leroy', email: 'emma.leroy@hotel.fr', role: 'admin', job: 'Direction', service: 'Administration', weeklyHours: 39, active: true },
  { id: 'e2', firstName: 'Lucas', lastName: 'Bernard', email: 'lucas.bernard@hotel.fr', role: 'manager', job: 'Responsable réception', service: 'Réception', weeklyHours: 39, active: true },
  { id: 'e3', firstName: 'Chloé', lastName: 'Martin', email: 'chloe.martin@hotel.fr', role: 'employee', job: 'Réceptionniste', service: 'Réception', weeklyHours: 35, active: true },
  { id: 'e4', firstName: 'Nina', lastName: 'Petit', email: 'nina.petit@hotel.fr', role: 'employee', job: 'Équipière étage', service: 'Étages', weeklyHours: 30, active: true }
];

export const today = new Date();
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const monday = new Date(today);
monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

export const shiftsSeed: Shift[] = employeesSeed.flatMap((employee, index) =>
  [0, 1, 2, 3, 4].map(day => ({
    id: `shift-${employee.id}-${day}`,
    employeeId: employee.id,
    date: iso(addDays(monday, day)),
    start: index % 2 === 0 ? '08:00' : '14:00',
    end: index % 2 === 0 ? '16:00' : '22:00',
    breakMinutes: 30
  }))
);

export const absencesSeed: Absence[] = [
  { id: 'absence-1', employeeId: 'e4', type: 'Congé payé', startDate: iso(addDays(monday, 2)), endDate: iso(addDays(monday, 3)), status: 'approved' }
];

export const punchesSeed: Punch[] = [];
