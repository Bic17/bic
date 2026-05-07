import { useState } from 'react';
import { CalendarDays, Clock, FileDown, LogOut, Users } from 'lucide-react';
import { absencesSeed, addDays, employeesSeed, iso, monday, punchesSeed, shiftsSeed, today, type Absence, type Employee, type Punch, type Shift } from './data';
import { duration, formatHours, load, roleLabel, save } from './utils';
import './styles.css';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(() => load('tt-employees', employeesSeed));
  const [shifts, setShifts] = useState<Shift[]>(() => load('tt-shifts', shiftsSeed));
  const [absences, setAbsences] = useState<Absence[]>(() => load('tt-absences', absencesSeed));
  const [punches, setPunches] = useState<Punch[]>(() => load('tt-punches', punchesSeed));
  const [user, setUser] = useState<Employee | null>(() => load('tt-user', null));
  const [page, setPage] = useState('dashboard');
  const weekDays = Array.from({ length: 7 }, (_, index) => iso(addDays(monday, index)));
  const visibleEmployees = user?.role === 'employee' ? employees.filter(e => e.id === user.id) : employees;

  const persistShifts = (value: Shift[]) => { setShifts(value); save('tt-shifts', value); };
  const persistAbsences = (value: Absence[]) => { setAbsences(value); save('tt-absences', value); };
  const persistPunches = (value: Punch[]) => { setPunches(value); save('tt-punches', value); };
  const persistEmployees = (value: Employee[]) => { setEmployees(value); save('tt-employees', value); };

  if (!user) {
    return <div className="login"><section><h1>TempTrack</h1><p>Choisis un compte de démonstration pour tester l’application.</p>{employees.map(employee => <button key={employee.id} onClick={() => { setUser(employee); save('tt-user', employee); }}>{employee.firstName} {employee.lastName} — {roleLabel(employee.role)}</button>)}</section></div>;
  }

  const logout = () => { setUser(null); localStorage.removeItem('tt-user'); };
  const addShift = (employeeId: string, date: string) => {
    const start = prompt('Heure de début', '08:00') || '08:00';
    const end = prompt('Heure de fin', '16:00') || '16:00';
    const breakMinutes = Number(prompt('Pause en minutes', '30') || 0);
    persistShifts([...shifts, { id: crypto.randomUUID(), employeeId, date, start, end, breakMinutes }]);
  };
  const deleteShift = (id: string) => { if (confirm('Supprimer ce créneau ?')) persistShifts(shifts.filter(shift => shift.id !== id)); };
  const addAbsence = () => {
    const employeeId = user.role === 'employee' ? user.id : prompt('ID salarié', visibleEmployees[0]?.id || user.id) || user.id;
    const type = prompt('Type d’absence', 'Congé payé') || 'Congé payé';
    const startDate = prompt('Date de début AAAA-MM-JJ', iso(today)) || iso(today);
    const endDate = prompt('Date de fin AAAA-MM-JJ', startDate) || startDate;
    persistAbsences([...absences, { id: crypto.randomUUID(), employeeId, type, startDate, endDate, status: user.role === 'employee' ? 'pending' : 'approved' }]);
  };
  const punch = (field: keyof Punch) => {
    const now = new Date().toTimeString().slice(0, 5);
    const current = punches.find(p => p.employeeId === user.id && p.date === iso(today));
    if (!current) {
      persistPunches([...punches, { id: crypto.randomUUID(), employeeId: user.id, date: iso(today), arrival: now }]);
      return;
    }
    persistPunches(punches.map(p => p.id === current.id ? { ...p, [field]: now } : p));
  };
  const exportCsv = () => {
    const rows = [['Salarié', 'Date', 'Début', 'Fin', 'Pause', 'Total']];
    shifts.forEach(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      rows.push([`${employee?.firstName} ${employee?.lastName}`, shift.date, shift.start, shift.end, String(shift.breakMinutes), formatHours(duration(shift.start, shift.end, shift.breakMinutes))]);
    });
    const blob = new Blob([rows.map(row => row.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'temptrack-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="app"><aside><h1>TempTrack</h1><p>Gestion du temps</p><button onClick={() => setPage('dashboard')}><Clock size={18}/>Tableau de bord</button><button onClick={() => setPage('planning')}><CalendarDays size={18}/>Planning</button><button onClick={() => setPage('punch')}>Pointage</button><button onClick={() => setPage('absences')}>Absences</button>{user.role !== 'employee' && <button onClick={() => setPage('employees')}><Users size={18}/>Salariés</button>}<button onClick={() => setPage('exports')}><FileDown size={18}/>Exports</button></aside><main><header><div><strong>{user.firstName} {user.lastName}</strong><span>{roleLabel(user.role)}</span></div><button onClick={logout}><LogOut size={16}/>Déconnexion</button></header>{page === 'dashboard' && <Dashboard employees={employees} shifts={shifts} punches={punches} absences={absences} />}{page === 'planning' && <Planning employees={visibleEmployees} shifts={shifts} absences={absences} weekDays={weekDays} addShift={addShift} deleteShift={deleteShift} />}{page === 'punch' && <PunchPage user={user} shifts={shifts} punches={punches} punch={punch} />}{page === 'absences' && <Absences employees={employees} visibleEmployees={visibleEmployees} absences={absences} addAbsence={addAbsence} persistAbsences={persistAbsences} />}{page === 'employees' && <Employees employees={employees} persistEmployees={persistEmployees} />}{page === 'exports' && <section><h2>Exports</h2><div className="panel"><button onClick={exportCsv}>Exporter CSV</button><button onClick={() => window.print()}>Imprimer / PDF</button></div></section>}</main></div>;
}

function Dashboard({ employees, shifts, punches, absences }: { employees: Employee[]; shifts: Shift[]; punches: Punch[]; absences: Absence[] }) { return <section><h2>Tableau de bord</h2><div className="cards"><Card title="Salariés actifs" value={employees.filter(e => e.active).length}/><Card title="Créneaux" value={shifts.length}/><Card title="Pointages" value={punches.length}/><Card title="Absences" value={absences.length}/></div></section>; }
function Card({ title, value }: { title: string; value: number }) { return <div className="card"><span>{title}</span><strong>{value}</strong></div>; }
function Planning({ employees, shifts, absences, weekDays, addShift, deleteShift }: any) { return <section><h2>Planning hebdomadaire</h2><div className="planning"><div className="row head"><b>Salarié</b>{weekDays.map((day: string) => <b key={day}>{new Date(day).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })}</b>)}<b>Total</b></div>{employees.map((employee: Employee) => { const total = shifts.filter((s: Shift) => s.employeeId === employee.id && weekDays.includes(s.date)).reduce((sum: number, s: Shift) => sum + duration(s.start, s.end, s.breakMinutes), 0); return <div className="row" key={employee.id}><div><b>{employee.firstName}</b><br/><small>{employee.job}</small></div>{weekDays.map((day: string) => { const shift = shifts.find((s: Shift) => s.employeeId === employee.id && s.date === day); const absence = absences.find((a: Absence) => a.employeeId === employee.id && a.status === 'approved' && day >= a.startDate && day <= a.endDate); return <div className={absence ? 'cell absent' : 'cell'} key={day} onClick={() => !shift && addShift(employee.id, day)}>{absence ? absence.type : shift ? <button className="shift" onClick={(event) => { event.stopPropagation(); deleteShift(shift.id); }}>{shift.start}-{shift.end}<br/><small>pause {shift.breakMinutes} min</small></button> : <span>+ créneau</span>}</div>; })}<div><b>{formatHours(total)}</b><br/><small>/ {employee.weeklyHours}h</small></div></div>; })}</div></section>; }
function PunchPage({ user, shifts, punches, punch }: any) { const punchDay = punches.find((p: Punch) => p.employeeId === user.id && p.date === iso(today)); const shift = shifts.find((s: Shift) => s.employeeId === user.id && s.date === iso(today)); return <section><h2>Pointage</h2><div className="panel"><h3>Bonjour {user.firstName}</h3><p>Planning prévu : {shift ? `${shift.start} - ${shift.end}` : 'aucun créneau prévu'}</p><div className="actions"><button onClick={() => punch('arrival')}>Pointer mon arrivée</button><button onClick={() => punch('breakStart')}>Début de pause</button><button onClick={() => punch('breakEnd')}>Fin de pause</button><button onClick={() => punch('departure')}>Pointer mon départ</button></div><p>Arrivée : {punchDay?.arrival || '-'} | Pause : {punchDay?.breakStart || '-'} / {punchDay?.breakEnd || '-'} | Départ : {punchDay?.departure || '-'}</p></div></section>; }
function Absences({ employees, visibleEmployees, absences, addAbsence, persistAbsences }: any) { return <section><h2>Absences</h2><button onClick={addAbsence}>Nouvelle absence</button><table><tbody>{absences.filter((a: Absence) => visibleEmployees.some((e: Employee) => e.id === a.employeeId)).map((a: Absence) => { const employee = employees.find((e: Employee) => e.id === a.employeeId); return <tr key={a.id}><td>{employee?.firstName} {employee?.lastName}</td><td>{a.type}</td><td>{a.startDate} → {a.endDate}</td><td>{a.status}</td><td>{a.status === 'pending' && <button onClick={() => persistAbsences(absences.map((x: Absence) => x.id === a.id ? { ...x, status: 'approved' } : x))}>Valider</button>}</td></tr>; })}</tbody></table></section>; }
function Employees({ employees, persistEmployees }: any) { return <section><h2>Salariés</h2><table><tbody>{employees.map((e: Employee) => <tr key={e.id}><td>{e.firstName} {e.lastName}</td><td>{e.email}</td><td>{roleLabel(e.role)}</td><td>{e.job}</td><td><button onClick={() => persistEmployees(employees.map((x: Employee) => x.id === e.id ? { ...x, active: !x.active } : x))}>{e.active ? 'Actif' : 'Inactif'}</button></td></tr>)}</tbody></table></section>; }
