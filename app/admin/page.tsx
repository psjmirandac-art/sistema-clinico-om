'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, Trash2, Search, 
  X, Loader2, Printer, Lock, DoorOpen, UserPlus, Minus, Check, 
  MapPin, Wallet, TrendingUp, CreditCard, AlertCircle
} from 'lucide-react';
import { useTenant } from '@/providers/TenantProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type TabType = 'inicio' | 'agenda' | 'pacientes' | 'equipo' | 'servicios' | 'finanzas' | 'resenas';

export default function AdminSuitePage() {
  const { center } = useTenant();

  // --- ESTADOS DE AUTENTICACIÓN Y PERFIL ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // --- NAVEGACIÓN Y MODALES ---
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);

  // --- DATOS CLÍNICOS ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [boxesCount, setBoxesCount] = useState<number>(3);

  // --- ESTADOS DE FORMULARIOS (Simplificados para brevedad) ---
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [aiStructuredNotes, setAiStructuredNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Estado Nueva Cita
  const [apptPatientName, setApptPatientName] = useState('');
  const [apptPatientEmail, setApptPatientEmail] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [apptModality, setApptModality] = useState<'online' | 'presencial'>('presencial');
  const [apptTherapist, setApptTherapist] = useState('');
  const [apptBox, setApptBox] = useState<number>(1);
  const [apptPaymentStatus, setApptPaymentStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [savingAppt, setSavingAppt] = useState(false);

  useEffect(() => {
    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      if (activeSession?.user) await fetchDoctorProfile(activeSession.user);
      setAuthLoading(false);
    }
    initAuth();
  }, []);

  async function fetchDoctorProfile(user: any) {
    const { data: prof } = await supabase.from('professionals').select('*').eq('email', user.email).maybeSingle();
    const activeCenterId = prof?.center_id || center?.id;
    setProfile({ ...prof, name: prof?.name || user.email?.split('@')[0], center_id: activeCenterId });
    await fetchClinicalData(activeCenterId);
  }

  async function fetchClinicalData(centerId?: string) {
    let apptQuery = supabase.from('appointments').select('*').order('date', { ascending: true });
    let profQuery = supabase.from('professionals').select('*').order('name', { ascending: true });
    
    if (centerId) {
      apptQuery = apptQuery.eq('center_id', centerId);
      profQuery = profQuery.eq('center_id', centerId);
    }

    const [{ data: appts }, { data: profs }] = await Promise.all([apptQuery, profQuery]);
    if (appts) setAppointments(appts);
    if (profs) setTherapists(profs);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
    if (error) setAuthError('Credenciales inválidas.');
    setAuthLoading(false);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);
    const payload = {
      patient_name: apptPatientName,
      patient_email: apptPatientEmail,
      date: apptDate,
      time: apptTime,
      modality: apptModality,
      professional_name: apptTherapist || profile?.name,
      box_number: apptModality === 'presencial' ? apptBox : null,
      status: apptPaymentStatus, // Pagado o Pendiente
      center_id: profile?.center_id
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    if (!error && data) {
      setAppointments(prev => [...prev, data]);
      setIsNewApptModalOpen(false);
    }
    setSavingAppt(false);
  };

  if (authLoading) return <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center"><Loader2 className="animate-spin text-kairos-primary" size={32} /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100">
           <h1 className="font-bold text-xl mb-6 text-stone-900">Acceso Clínico</h1>
           <form onSubmit={handleLogin} className="space-y-4">
             <input type="email" placeholder="Correo" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full p-3 rounded-xl border bg-stone-50" />
             <input type="password" placeholder="Clave" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-3 rounded-xl border bg-stone-50" />
             <button type="submit" className="w-full bg-[#2C4A3B] text-white py-3 rounded-xl font-bold">Entrar</button>
           </form>
        </div>
      </div>
    );
  }

  // MOCK DATA PARA PAQUETES (Hasta conectarlo a la DB real)
  const mockPackages = [
    { patient: 'Camila Rojas', service: 'Psicoterapia (Pack 4)', used: 2, total: 4, expires: '2023-11-15' },
    { patient: 'Diego M.', service: 'Evaluación (Pack 3)', used: 3, total: 3, expires: '2023-10-30' },
  ];

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col z-20 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-stone-100">
          <ShieldCheck size={24} className="text-kairos-primary mr-3" />
          <div>
            <h1 className="font-bold text-stone-900 text-sm">{center?.name || 'Kairós Clínico'}</h1>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Portal Maestro</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Operación</h2>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'inicio' ? 'bg-stone-100 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}><Home size={18} /> Inicio</button>
              <button onClick={() => setActiveTab('agenda')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'agenda' ? 'bg-stone-100 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}><Calendar size={18} /> Agenda</button>
            </nav>
          </div>
          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Gestión y Negocio</h2>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('pacientes')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'pacientes' ? 'bg-stone-100 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}><Users size={18} /> Fichas IA</button>
              <button onClick={() => setActiveTab('equipo')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'equipo' ? 'bg-stone-100 font-semibold' : 'text-stone-500 hover:bg-stone-50'}`}><DoorOpen size={18} /> Terapeutas y Boxes</button>
              <button onClick={() => setActiveTab('finanzas')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'finanzas' ? 'bg-[#2C4A3B] text-white font-semibold shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}><Wallet size={18} /> Finanzas y Paquetes</button>
            </nav>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-8 shrink-0">
          <div className="bg-stone-100 border border-stone-200/80 text-stone-600 text-xs font-semibold px-3.5 py-1.5 rounded-xl">Sede: {center?.name || 'Kairós'}</div>
          <button onClick={() => setIsNewApptModalOpen(true)} className="bg-kairos-primary text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-90"><Plus size={16} /> Nueva Cita</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            
            {/* TABS (Inicio, Agenda, Pacientes, Equipo omitidos por brevedad visual, asume que están ahí) */}

            {/* TAB AGENDA (Con estado de pago) */}
            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Agenda Clínica</h2>
                <div className="grid gap-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="bg-white border border-stone-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center font-bold text-xs text-kairos-primary">
                          <span>{appt.time || '10:00'}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 flex items-center gap-2">
                            {appt.patient_name || 'Paciente'}
                            {appt.status === 'pendiente' ? (
                              <span className="text-[9px] uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle size={10}/> Pendiente</span>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1"><Check size={10}/> Pagado</span>
                            )}
                          </h4>
                          <p className="text-xs text-stone-500">{appt.date} • Box {appt.box_number || 1} • {appt.professional_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB NUEVO: FINANZAS Y PAQUETES */}
            {activeTab === 'finanzas' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Finanzas Personales y Paquetes</h2>
                  <p className="text-sm text-stone-500">Métricas claras de tus ingresos brutos vs netos, y control de sesiones prepagadas.</p>
                </div>

                {/* Tarjetas Financieras */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={80} /></div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Ingresos Brutos (Mes)</p>
                    <h3 className="text-3xl font-bold text-stone-900">$1.250.000</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1"><TrendingUp size={14}/> +12% vs mes anterior</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><CreditCard size={80} /></div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Ingresos Netos</p>
                    <h3 className="text-3xl font-bold text-kairos-primary">$1.100.000</h3>
                    <p className="text-xs text-stone-500 font-medium mt-2">Descontando comisiones e IVA</p>
                  </div>
                  <div className="bg-kairos-primary p-6 rounded-3xl border border-kairos-primary shadow-sm text-white relative overflow-hidden">
                    <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1">Recuperación (Anulación Auto)</p>
                    <h3 className="text-3xl font-bold">$135.000</h3>
                    <p className="text-xs text-emerald-100 font-medium mt-2">Horas liberadas y re-agendadas</p>
                  </div>
                </div>

                {/* Gestión de Paquetes de Sesiones */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Paquetes de Sesiones Activos</h3>
                      <p className="text-xs text-stone-500">Haz seguimiento al progreso de los pacientes que compraron bonos.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mockPackages.map((pkg, idx) => {
                      const percentage = (pkg.used / pkg.total) * 100;
                      const isComplete = pkg.used === pkg.total;
                      
                      return (
                        <div key={idx} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="w-full md:w-1/3">
                            <h4 className="font-bold text-sm text-stone-900">{pkg.patient}</h4>
                            <p className="text-xs text-stone-500">{pkg.service}</p>
                          </div>
                          
                          <div className="w-full md:w-1/3">
                            <div className="flex justify-between text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                              <span>Progreso</span>
                              <span>{pkg.used} de {pkg.total} sesiones</span>
                            </div>
                            <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${isComplete ? 'bg-orange-400' : 'bg-kairos-primary'}`} 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="w-full md:w-1/4 text-right">
                            {isComplete ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">Completado</span>
                            ) : (
                              <p className="text-xs text-stone-500 font-medium">Vence: {pkg.expires}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODAL NUEVA CITA ACTUALIZADO CON ESTADO DE PAGO */}
      <AnimatePresence>
        {isNewApptModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-stone-100 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-stone-900">Agendar Cita</h3>
                <button onClick={() => setIsNewApptModalOpen(false)}><X size={20} className="text-stone-400" /></button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required placeholder="Nombre" value={apptPatientName} onChange={e => setApptPatientName(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                  <input type="email" required placeholder="Correo" value={apptPatientEmail} onChange={e => setApptPatientEmail(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required value={apptDate} onChange={e => setApptDate(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                  <input type="time" required value={apptTime} onChange={e => setApptTime(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Estado del Pago</label>
                  <select value={apptPaymentStatus} onChange={e => setApptPaymentStatus(e.target.value as any)} className="w-full p-3 rounded-xl border border-stone-200 text-sm bg-stone-50 outline-none">
                    <option value="pagado">Pagado (Confirmada)</option>
                    <option value="pendiente">Pendiente (En riesgo de anulación)</option>
                  </select>
                </div>

                <button type="submit" disabled={savingAppt} className="w-full bg-kairos-primary text-white font-semibold py-3.5 rounded-xl">Guardar Cita</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}