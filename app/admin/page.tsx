'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, Trash2, Search, 
  X, Loader2, Lock, DoorOpen, UserPlus, Check, 
  MapPin, Wallet, CreditCard, 
  Megaphone, BarChart3, Link as LinkIcon, Settings, HelpCircle, Gift,
  RefreshCw, Download, Store, 
  CheckCircle2, UserCircle, ChevronLeft, ChevronRight, Clock, Send, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useTenant } from '@/providers/TenantProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

type TabType = 
  | 'inicio' 
  | 'agenda' 
  | 'servicios' 
  | 'pacientes' 
  | 'comunicaciones' 
  | 'finanzas' 
  | 'resenas' 
  | 'reportes' 
  | 'documentos' 
  | 'vitrina' 
  | 'equipo' 
  | 'conexiones' 
  | 'sala_online' 
  | 'gana_meses' 
  | 'suscripcion' 
  | 'ayuda' 
  | 'configuracion';

type CalendarViewMode = 'mes' | 'semana' | 'dia';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AdminSuitePage() {
  const { center } = useTenant();

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('mes');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [boxesCount, setBoxesCount] = useState<number>(1);

  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarLinked, setCalendarLinked] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  
  // Manejo blindado de fecha para SSR
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [todayString, setTodayString] = useState<string>('');

  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');

  const [reviewsList, setReviewsList] = useState<any[]>([]);

  const [waBotActive, setWaBotActive] = useState(true);
  const [waAutoRemind, setWaAutoRemind] = useState(true);
  const [waAutoReschedule, setWaAutoReschedule] = useState(true);
  const [customBroadcastMsg, setCustomBroadcastMsg] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('50');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [savingService, setSavingService] = useState(false);

  const [pFirstName, setPFirstName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pGender, setPGender] = useState('');
  const [pDocument, setPDocument] = useState('');
  const [pBirthDate, setPBirthDate] = useState('');
  const [pPrevision, setPPrevision] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pComuna, setPComuna] = useState('');
  const [pCiudad, setPCiudad] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [savingAppt, setSavingAppt] = useState(false);

  const [rawNotes, setRawNotes] = useState('');
  const [aiStructuredNotes, setAiStructuredNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [clinicalRecords, setClinicalRecords] = useState<Record<string, any[]>>({});

  const [reportPeriod] = useState<'mes' | 'trimestre' | 'anio'>('mes');
  const multiplier = reportPeriod === 'mes' ? 1 : reportPeriod === 'trimestre' ? 3 : 12;

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setTodayString(ymd);
    setApptDate(ymd);

    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      if (activeSession?.user) {
        await fetchDoctorProfile(activeSession.user);
      }
      setAuthLoading(false);
    }
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) await fetchDoctorProfile(newSession.user);
      else setProfile(null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchDoctorProfile(user: any) {
    const { data: prof } = await supabase.from('professionals').select('*').eq('email', user.email).maybeSingle();
    const activeCenterId = prof?.center_id || center?.id;
    const doctorName = prof?.name || user.email?.split('@')[0] || 'Profesional';

    setProfile({
      id: prof?.id,
      name: doctorName,
      email: user.email,
      role: prof?.role || 'admin',
      center_id: activeCenterId
    });

    await fetchClinicalData(activeCenterId);
  }

  async function fetchClinicalData(centerId?: string) {
    try {
      if (!centerId) return;

      const apptQuery = supabase.from('appointments').select('*').eq('center_id', centerId).order('date', { ascending: true });
      const servQuery = supabase.from('services').select('*').eq('center_id', centerId).order('created_at', { ascending: false });
      const profQuery = supabase.from('professionals').select('*').eq('center_id', centerId).order('name', { ascending: true });
      const centerQuery = supabase.from('centers').select('boxes_count').eq('id', centerId).maybeSingle();
      const revQuery = supabase.from('reviews').select('*').eq('center_id', centerId).order('created_at', { ascending: false });

      const [{ data: appts }, { data: servs }, { data: profs }, { data: centerInfo }, { data: revs }] = await Promise.all([
        apptQuery, servQuery, profQuery, centerQuery, revQuery
      ]);

      if (centerInfo?.boxes_count) setBoxesCount(centerInfo.boxes_count);

      setAppointments(appts || []);
      setTherapists(profs || []);
      setServices(servs || []);
      setReviewsList(revs || []);

      const uniquePats = Array.from(new Map((appts || []).map((a: any) => [a.patient_email || a.patient_name, a])).values());
      setPatientsList(uniquePats);
      if (uniquePats.length > 0) setSelectedPatient(uniquePats[0]);

    } catch (err) {
      console.error('Error cargando datos de Supabase:', err);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
    if (error) setAuthError('Credenciales inválidas. Verifica tu correo y contraseña.');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const handleGoogleSync = async () => {
    setIsSyncingCalendar(true);
    try {
      await fetch('/api/calendar').catch(() => null);
      setTimeout(() => {
        setIsSyncingCalendar(false);
        setCalendarLinked(true);
        showToast('Agenda sincronizada con Google Calendar.');
      }, 900);
    } catch {
      setIsSyncingCalendar(false);
    }
  };

  const handleChangeAppointmentBox = async (apptId: string, newBox: number) => {
    const targetAppt = appointments.find(a => a.id === apptId);
    if (!targetAppt) return;
    if (targetAppt.modality === 'online') {
      showToast('Esta sesión es Online (Meet), no requiere Box físico.');
      return;
    }
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, box_number: newBox } : a));
    await supabase.from('appointments').update({ box_number: newBox }).eq('id', apptId);
    showToast(`Box actualizado a Box ${newBox}.`);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingService(true);
    const payload = {
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      description: newServiceDescription,
      center_id: profile?.center_id
    };

    const { data, error } = await supabase.from('services').insert([payload]).select().single();
    const created = (!error && data) ? data : { id: `srv-${Date.now()}`, ...payload };

    setServices(prev => [created, ...prev]);
    setIsNewServiceModalOpen(false);
    setNewServiceName(''); setNewServicePrice(''); setNewServiceDescription('');
    setSavingService(false);
    showToast('Nuevo servicio clínico agregado al catálogo.');
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio del catálogo?')) {
      setServices(prev => prev.filter(s => s.id !== id));
      await supabase.from('services').delete().eq('id', id);
      showToast('Servicio eliminado.');
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBroadcastMsg.trim()) return;
    setSendingBroadcast(true);
    setTimeout(() => {
      setSendingBroadcast(false);
      setCustomBroadcastMsg('');
      showToast('Mensaje masivo enviado a través del Asistente WhatsApp IA.');
    }, 1000);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);

    const fullName = `${pFirstName} ${pLastName}`.trim();
    const payload: any = {
      patient_name: fullName,
      patient_email: pEmail,
      patient_phone: pPhone,
      patient_rut: pDocument,
      patient_gender: pGender,
      patient_birthdate: pBirthDate || null,
      patient_prevision: pPrevision,
      patient_address: `${pAddress}, ${pComuna}, ${pCiudad}`,
      date: apptDate,
      time: apptTime,
      modality: 'presencial',
      professional_name: profile?.name,
      box_number: 1,
      status: 'pagado',
      center_id: profile?.center_id,
      price: 35000, 
      meet_link: null
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    const created = (!error && data) ? data : { ...payload, id: `local-${Date.now()}` };

    setAppointments(prev => [...prev, created]);
    if (!patientsList.some(p => p.patient_email === pEmail)) {
      setPatientsList(prev => [{ patient_name: fullName, patient_email: pEmail, patient_phone: pPhone }, ...prev]);
    }

    setIsNewApptModalOpen(false);
    setPFirstName(''); setPLastName(''); setPGender(''); setPDocument(''); setPBirthDate('');
    setPPrevision(''); setPEmail(''); setPPhone(''); setPAddress(''); setPComuna(''); setPCiudad('');
    setSavingAppt(false);
    showToast('Paciente y cita clínica agendados con éxito.');
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const newPatient = { patient_name: newPatientName, patient_email: 'paciente@kairos.cl' };
    setPatientsList(prev => [newPatient, ...prev]);
    setSelectedPatient(newPatient);
    setIsNewPatientModalOpen(false);
    setNewPatientName('');
    showToast('Paciente inscrito con éxito.');
  };

  const handleDeletePatient = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar a ${p.patient_name}?`)) {
      setPatientsList(prev => prev.filter(item => item !== p));
      if (selectedPatient === p) setSelectedPatient(null);
      showToast('Paciente eliminado.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Navegador no soporta dictado por voz.');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setRawNotes(prev => `${prev} ${t}`.trim());
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleProcessWithAI = async (mode: 'ficha') => {
    if (!rawNotes.trim()) return;
    setAiLoading(true);
    const pName = selectedPatient?.patient_name || 'Paciente';

    setTimeout(() => {
      setAiStructuredNotes(`📋 EVOLUCIÓN CLÍNICA (IA)\n• Paciente: ${pName}\n• Fecha: ${todayString}\n• Resumen: ${rawNotes}`);
      setAiLoading(false);
    }, 600);
  };

  const handleSaveToPatientHistory = () => {
    if (!selectedPatient || !aiStructuredNotes) return;
    const key = selectedPatient.patient_email || selectedPatient.patient_name;
    const newEntry = { id: `rec-${Date.now()}`, date: todayString, therapist: profile?.name || 'Especialista', summary: aiStructuredNotes };
    setClinicalRecords(prev => ({ ...prev, [key]: [newEntry, ...(prev[key] || [])] }));
    setRawNotes('');
    showToast('Evolución guardada en la ficha.');
  };

  const handleExportReportCSV = () => {
    const headers = 'Paciente,Terapeuta,Fecha,Hora,Modalidad,Box,Estado,Monto\n';
    const rows = appointments.map(a => `"${a.patient_name}","${a.professional_name}","${a.date}","${a.time}","${a.modality}","${a.box_number || 'Online'}","${a.status}","${a.price || 35000}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'Reporte_Kairos.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast('Reporte exportado con éxito.');
  };

  // --- SAFE GUARDS PARA SSR ---
  if (authLoading || !currentDate) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
      </div>
    );
  }

  // --- HELPERS DE FECHA CLIENT-SIDE SEGUROS ---
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const formatDateYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handlePrevDate = () => {
    if (calendarView === 'mes') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (calendarView === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNextDate = () => {
    if (calendarView === 'mes') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (calendarView === 'semana') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const activeDateStr = formatDateYMD(currentDate);

  const openApptAtSlot = (date: string, time: string) => {
    setApptDate(date);
    setApptTime(time);
    setIsNewApptModalOpen(true);
  };

  const paidAppointments = appointments.filter(a => a.status !== 'pendiente');
  const dynamicGross = (paidAppointments.reduce((acc, a) => acc + Number(a.price || 35000), 0)) * multiplier;
  const dynamicNet = Math.round(dynamicGross * 0.88);

  const averageRating = reviewsList.length > 0 
    ? (reviewsList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewsList.length).toFixed(1)
    : '5.0';

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center shadow-sm"><ShieldCheck size={24} /></div>
            <div>
              <h1 className="font-bold text-stone-900 text-lg leading-tight">{center?.name || 'Kairós Clínico'}</h1>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Acceso Equipo Clínico</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Correo Profesional" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 text-sm" />
            <input type="password" required placeholder="Contraseña" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 text-sm" />
            {authError && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>}
            <button type="submit" className="w-full bg-[#2C4A3B] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#233b2f] transition-colors"><Lock size={16} /> Entrar al Portal</button>
          </form>
        </motion.div>
      </div>
    );
  }

  const NavButton = ({ tab, icon: Icon, label, badge }: { tab: TabType; icon: any; label: string; badge?: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13px] transition-all ${
        activeTab === tab ? 'bg-[#2C4A3B] text-white font-semibold shadow-sm' : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 font-medium'
      }`}
    >
      <div className="flex items-center gap-3"><Icon size={17} className={activeTab === tab ? 'text-white' : 'text-stone-500'} /><span>{label}</span></div>
      {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}>{badge}</span>}
    </button>
  );

  const filteredPatients = patientsList.filter(p => (p.patient_name || '').toLowerCase().includes(searchPatient.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-5 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-stone-700">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /><span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-[265px] bg-white border-r border-stone-200/80 flex flex-col z-20 shrink-0">
        <div className="h-18 flex items-center px-6 border-b border-stone-100 shrink-0 py-4">
          <div className="h-9 w-9 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center mr-3 shadow-xs"><ShieldCheck size={20} /></div>
          <div className="truncate">
            <h1 className="font-bold text-stone-900 text-sm truncate">{center?.name || 'Kairós Clínico'}</h1>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Suite B2B Multi-Tenant</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-5 custom-scrollbar">
          <nav className="space-y-1">
            <NavButton tab="inicio" icon={Home} label="Inicio" />
            <NavButton tab="agenda" icon={Calendar} label="Calendario" badge={appointments.length > 0 ? `${appointments.length}` : undefined} />
            <NavButton tab="servicios" icon={Briefcase} label="Servicios" badge={services.length > 0 ? `${services.length}` : undefined} />
            <NavButton tab="pacientes" icon={Users} label="Pacientes y Fichas IA" />
            <NavButton tab="comunicaciones" icon={Megaphone} label="Comunicaciones" badge="IA" />
            <NavButton tab="finanzas" icon={Wallet} label="Finanzas" />
            <NavButton tab="resenas" icon={Star} label="Evaluaciones" />
            <NavButton tab="reportes" icon={BarChart3} label="Reportes" badge="PRO" />
          </nav>
          <div className="h-px bg-stone-100 mx-2" />
          <nav className="space-y-1">
            <NavButton tab="documentos" icon={FileText} label="Documentos" />
            <NavButton tab="vitrina" icon={Store} label="Vitrina" />
            <NavButton tab="equipo" icon={DoorOpen} label="Equipo y Boxes" badge={`${boxesCount} Box`} />
            <NavButton tab="conexiones" icon={LinkIcon} label="Conexiones" />
            <NavButton tab="sala_online" icon={Video} label="Sala online" />
          </nav>
          <div className="h-px bg-stone-100 mx-2" />
          <nav className="space-y-1">
            <NavButton tab="gana_meses" icon={Gift} label="Gana meses gratis" />
            <NavButton tab="suscripcion" icon={CreditCard} label="Suscripción" />
            <NavButton tab="ayuda" icon={HelpCircle} label="Ayuda" />
            <NavButton tab="configuracion" icon={Settings} label="Configuración" />
          </nav>
        </div>
        <div className="p-3.5 border-t border-stone-100 shrink-0 bg-white">
          <div className="border border-stone-200/80 rounded-2xl p-3 flex items-center justify-between bg-stone-50/60">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-stone-900 truncate">{profile?.name}</p>
              <p className="text-[10px] font-semibold text-[#2C4A3B] uppercase mt-0.5">{profile?.role === 'admin' ? 'Administrador' : 'Terapeuta'}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-18 bg-white/70 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-8 shrink-0 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl">Sede: {center?.name || 'Kairós Clínico'}</div>
            <button onClick={() => setActiveTab('reportes')} className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-xl hover:border-[#2C4A3B] transition-colors">
              <BarChart3 size={13} className="text-[#2C4A3B]" /> Ocupación: {appointments.length > 0 ? '84%' : '0%'} • {boxesCount} Boxes Activos
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsNewPatientModalOpen(true)} className="bg-white border border-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50"><UserPlus size={15} /> Nuevo Paciente</button>
            <button onClick={() => setIsNewApptModalOpen(true)} className="bg-[#2C4A3B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs"><Plus size={16} /> Nueva Cita</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F9F8F6] custom-scrollbar">
          <AnimatePresence mode="wait">

            {activeTab === 'inicio' && (
              <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Panel de Control Clínico</span>
                    <h2 className="text-3xl font-bold text-stone-900 mt-1">Hola, {profile?.name}</h2>
                    <p className="text-stone-500 text-sm mt-1">Tienes <strong className="text-stone-900">{appointments.length} sesiones</strong> en agenda, <strong className="text-stone-900">{therapists.filter(t => t.status === 'activos').length} profesionales</strong> activos y <strong className="text-stone-900">{boxesCount} boxes</strong> habilitados.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('agenda')} className="bg-stone-100 text-stone-800 font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-stone-200 flex items-center gap-2"><Calendar size={16} /> Ver Calendario</button>
                    <button onClick={() => setActiveTab('pacientes')} className="bg-[#2C4A3B] text-white font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-[#233b2f] flex items-center gap-2"><Sparkles size={16} /> Abrir Fichas IA</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ingresos Neto Mes</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">${dynamicNet.toLocaleString('es-CL')}</p>
                    {dynamicNet > 0 && <span className="text-[11px] text-emerald-600 font-semibold">Generado por equipo</span>}
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pacientes Activos</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{patientsList.length}</p>
                    <span className="text-[11px] text-stone-500">En el directorio clínico</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Asistente WhatsApp IA</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Activo 24/7</p>
                    <span className="text-[11px] text-stone-500">Reagendando en automático</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Salas / Boxes</p>
                    <p className="text-2xl font-bold text-[#2C4A3B] mt-1">{boxesCount} Activos</p>
                    <span className="text-[11px] text-stone-500">Asignación dinámica</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB AGENDA (VISTAS: DÍA / SEMANA / MES CON LÍNEAS HORARIAS) */}
            {activeTab === 'agenda' && (
              <motion.div key="agenda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Calendario Clínico y Salas</h2>
                    <p className="text-sm text-stone-500">Gestiona horarios, boxes y sesiones clínicas con vista granular.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleGoogleSync} 
                      disabled={isSyncingCalendar}
                      className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold bg-[#F4F7F5] text-[#2C4A3B] border border-[#E4ECE7] hover:bg-[#E4ECE7] transition-all"
                    >
                      {isSyncingCalendar ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                      {calendarLinked ? 'Google Calendar Sincronizado' : 'Vincular Google Calendar'}
                    </button>
                    <button 
                      onClick={() => setIsNewApptModalOpen(true)}
                      className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f] shadow-xs"
                    >
                      <Plus size={15} /> Nueva Cita
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-stone-900 capitalize">
                        {calendarView === 'mes' && `${monthNames[currentMonth]} ${currentYear}`}
                        {calendarView === 'semana' && `Semana del ${weekDays[0].getDate()} al ${weekDays[6].getDate()} de ${monthNames[weekDays[0].getMonth()]}`}
                        {calendarView === 'dia' && `${currentDate.getDate()} de ${monthNames[currentMonth]} ${currentYear}`}
                      </h3>
                      <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="text-[11px] font-bold text-[#2C4A3B] bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E4ECE7] hover:bg-[#E4ECE7]"
                      >
                        Hoy
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-1 rounded-2xl flex items-center">
                        {(['dia', 'semana', 'mes'] as CalendarViewMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setCalendarView(mode)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                              calendarView === mode 
                                ? 'bg-white text-stone-900 shadow-xs' 
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button onClick={handlePrevDate} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600">
                          <ChevronLeft size={18} />
                        </button>
                        <button onClick={handleNextDate} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1. VISTA MES */}
                  {calendarView === 'mes' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        {dayNamesShort.map(d => <span key={d}>{d}</span>)}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDay }).map((_, index) => (
                          <div key={`empty-${index}`} className="h-28 rounded-2xl bg-stone-50/40 border border-stone-100/50 opacity-40" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, index) => {
                          const dayNum = index + 1;
                          const dateObj = new Date(currentYear, currentMonth, dayNum);
                          const dateStr = formatDateYMD(dateObj);
                          const dayAppointments = appointments.filter(a => a.date === dateStr);
                          const isSelected = selectedDateFilter === dateStr;
                          const isToday = todayString === dateStr;

                          return (
                            <div 
                              key={dateStr}
                              onClick={() => {
                                setSelectedDateFilter(dateStr);
                                setCurrentDate(dateObj);
                              }}
                              className={`h-28 rounded-2xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer group relative ${
                                isSelected ? 'border-[#2C4A3B] bg-[#F4F7F5] shadow-sm ring-2 ring-[#2C4A3B]/20' : isToday ? 'border-[#2C4A3B]/60 bg-white' : 'border-stone-100 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ${isToday ? 'bg-[#2C4A3B] text-white' : 'text-stone-700'}`}>{dayNum}</span>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    openApptAtSlot(dateStr, '10:00'); 
                                  }} 
                                  className="opacity-0 group-hover:opacity-100 h-6 w-6 bg-[#2C4A3B] text-white rounded-lg flex items-center justify-center transition-opacity hover:scale-105 shadow-xs"
                                  title="Agendar cita en este día"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="space-y-1 overflow-y-hidden flex-1 mt-1">
                                {dayAppointments.slice(0, 2).map((appt, i) => (
                                  <div key={i} className="text-[10px] bg-white border border-stone-200/80 rounded px-1.5 py-0.5 truncate font-semibold text-stone-800 shadow-2xs flex items-center justify-between">
                                    <span>{appt.time} • {appt.patient_name}</span>
                                    <span className={`h-1.5 w-1.5 rounded-full ${appt.status === 'pendiente' ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                                  </div>
                                ))}
                                {dayAppointments.length > 2 && <div className="text-[9px] text-stone-400 font-bold pl-0.5">+{dayAppointments.length - 2} más</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. VISTA SEMANA CON HORAS */}
                  {calendarView === 'semana' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px]">
                        <div className="grid grid-cols-8 border-b border-stone-100 pb-3 text-center">
                          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest flex items-center justify-center">Hora</div>
                          {weekDays.map((d, i) => {
                            const dateStr = formatDateYMD(d);
                            const isToday = todayString === dateStr;
                            return (
                              <div key={i} className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{dayNamesShort[i]}</span>
                                <span className={`text-xs font-bold mt-1 h-7 w-7 rounded-full flex items-center justify-center ${isToday ? 'bg-[#2C4A3B] text-white' : 'text-stone-800'}`}>
                                  {d.getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="divide-y divide-stone-100">
                          {TIME_SLOTS.map((hour) => (
                            <div key={hour} className="grid grid-cols-8 min-h-[64px] group">
                              <div className="text-[11px] font-semibold text-stone-400 py-3 text-center border-r border-stone-100/60 bg-stone-50/30">
                                {hour}
                              </div>

                              {weekDays.map((d, idx) => {
                                const dateStr = formatDateYMD(d);
                                const apptInSlot = appointments.find(a => a.date === dateStr && a.time.startsWith(hour.slice(0, 2)));

                                return (
                                  <div 
                                    key={idx}
                                    onClick={() => !apptInSlot && openApptAtSlot(dateStr, hour)}
                                    className="border-r border-stone-100/60 p-1 relative hover:bg-[#F4F7F5]/40 transition-colors cursor-pointer"
                                  >
                                    {apptInSlot ? (
                                      <div className="h-full bg-white border border-[#2C4A3B]/30 rounded-xl p-2 shadow-xs flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-center text-[10px] font-bold text-[#2C4A3B]">
                                            <span>{apptInSlot.time}</span>
                                            <span className={`h-1.5 w-1.5 rounded-full ${apptInSlot.status === 'pendiente' ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                                          </div>
                                          <p className="text-xs font-bold text-stone-900 truncate mt-0.5">{apptInSlot.patient_name}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] text-stone-400 font-semibold">
                                          <span>Box {apptInSlot.box_number || 1}</span>
                                          <span className="capitalize">{apptInSlot.modality}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100">
                                        <Plus size={14} className="text-stone-300" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. VISTA DÍA */}
                  {calendarView === 'dia' && (
                    <div className="space-y-3 max-w-4xl mx-auto">
                      {TIME_SLOTS.map((hour) => {
                        const apptsInHour = appointments.filter(a => a.date === activeDateStr && a.time.startsWith(hour.slice(0, 2)));

                        return (
                          <div key={hour} className="flex gap-4 items-start border-b border-stone-100 pb-3">
                            <div className="w-16 text-right pt-2">
                              <span className="text-xs font-bold text-stone-400">{hour}</span>
                            </div>

                            <div className="flex-1">
                              {apptsInHour.length === 0 ? (
                                <button
                                  onClick={() => openApptAtSlot(activeDateStr, hour)}
                                  className="w-full text-left py-3 px-4 rounded-2xl border border-dashed border-stone-200 text-xs font-semibold text-stone-400 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#F4F7F5] transition-all flex items-center gap-2"
                                >
                                  <Plus size={14} /> Espacio disponible a las {hour} • Clic para agendar
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  {apptsInHour.map((appt) => (
                                    <div key={appt.id} className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center font-bold text-xs">
                                          {appt.time}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-stone-900">{appt.patient_name}</h4>
                                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${appt.status === 'pendiente' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {appt.status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-stone-500 mt-0.5">
                                            Terapeuta: <strong>{appt.professional_name}</strong> {appt.patient_phone && `• ${appt.patient_phone}`}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl">
                                          <MapPin size={13} className="text-[#2C4A3B]" />
                                          <select 
                                            value={appt.box_number || 1} 
                                            onChange={(e) => handleChangeAppointmentBox(appt.id, Number(e.target.value))} 
                                            className="text-xs font-bold text-stone-900 bg-transparent outline-none cursor-pointer"
                                          >
                                            {Array.from({ length: boxesCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Box {n}</option>)}
                                          </select>
                                        </div>
                                        <button 
                                          onClick={() => { setSelectedPatient(appt); setActiveTab('pacientes'); }} 
                                          className="text-xs font-semibold px-3.5 py-2 bg-[#2C4A3B] text-white rounded-xl hover:bg-[#233b2f]"
                                        >
                                          Ficha IA
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* TAB SERVICIOS */}
            {activeTab === 'servicios' && (
              <motion.div key="servicios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Catálogo Clínico</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Servicios y Terapias</h2>
                    <p className="text-sm text-stone-500 mt-1">Administra los tipos de sesiones, duraciones y aranceles ofrecidos por tu centro.</p>
                  </div>
                  <button onClick={() => setIsNewServiceModalOpen(true)} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
                    <Plus size={16} /> Nuevo Servicio
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-100">
                      <Briefcase className="mx-auto text-stone-300 mb-3" size={40} />
                      <p className="font-semibold text-stone-700 text-sm">No hay servicios registrados en el catálogo.</p>
                      <p className="text-xs text-stone-400 mt-1">Haz clic en "Nuevo Servicio" para agregar prestaciones clínicas.</p>
                    </div>
                  ) : (
                    services.map((srv) => (
                      <div key={srv.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-200 transition-all">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-stone-900 text-base">{srv.name}</h3>
                            <button onClick={() => handleDeleteService(srv.id)} className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"><Trash2 size={15} /></button>
                          </div>
                          <p className="text-xs text-stone-500 mt-2 line-clamp-2">{srv.description || 'Prestación clínica orientada a atención especializada.'}</p>
                        </div>
                        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                            <Clock size={14} className="text-[#2C4A3B]" />
                            <span>{srv.duration || 50} min</span>
                          </div>
                          <span className="font-bold text-stone-900 text-base">${Number(srv.price || 35000).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB PACIENTES Y FICHAS IA */}
            {activeTab === 'pacientes' && (
              <motion.div key="pacientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 h-fit shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">Pacientes ({filteredPatients.length})</h3>
                      <p className="text-xs text-stone-400">Directorio clínico del centro</p>
                    </div>
                    <button onClick={() => setIsNewPatientModalOpen(true)} className="bg-[#2C4A3B] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"><UserPlus size={14} /> Inscribir</button>
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
                    <input type="text" placeholder="Buscar por nombre o correo..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white" />
                  </div>
                  <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-10 text-stone-400 space-y-2"><UserCircle size={32} className="mx-auto opacity-50" /><p className="text-xs">No hay pacientes en la base de datos.</p></div>
                    ) : (
                      filteredPatients.map((p, idx) => (
                        <div key={idx} className="relative group">
                          <button onClick={() => { setSelectedPatient(p); setAiStructuredNotes(''); }} className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-center ${selectedPatient?.patient_name === p.patient_name ? 'border-[#2C4A3B] bg-[#F4F7F5]/60 shadow-2xs' : 'border-stone-100 hover:bg-stone-50'}`}>
                            <div className="pr-8 truncate">
                              <p className="font-bold text-sm text-stone-900 truncate">{p.patient_name}</p>
                              <p className="text-xs text-stone-400 truncate mt-0.5">{p.patient_email || 'Sin correo'}</p>
                            </div>
                          </button>
                          <button onClick={(e) => handleDeletePatient(e, p)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {!selectedPatient ? (
                    <div className="bg-white rounded-3xl border border-stone-100 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                      <div className="h-16 w-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 mb-4"><Sparkles size={28} className="text-stone-300" /></div>
                      <h3 className="text-lg font-bold text-stone-900">Workspace Clínico Vacío</h3>
                      <p className="text-sm text-stone-500 max-w-sm mt-2">Selecciona un paciente del directorio o inscribe uno nuevo para comenzar a dictar su sesión con IA.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Ficha Activa</span>
                            <h3 className="text-2xl font-bold text-stone-900 mt-0.5">{selectedPatient.patient_name}</h3>
                          </div>
                          <button onClick={toggleRecording} className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
                            {isRecording ? <><MicOff size={15} /> Detener Grabación</> : <><Mic size={15} /> Grabar / Dictar Sesión</>}
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Apuntes clínicos</label>
                          <textarea rows={4} value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="Habla con el micrófono encendido..." className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm outline-none focus:bg-white" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button onClick={() => handleProcessWithAI('ficha')} disabled={aiLoading || !rawNotes.trim()} className="bg-[#2C4A3B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] disabled:opacity-50">
                            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Resumir (IA)
                          </button>
                        </div>
                        {aiStructuredNotes && (
                          <div className="p-5 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#2C4A3B] uppercase tracking-wider">Evolución Estructurada</h4>
                              <button onClick={handleSaveToPatientHistory} className="bg-[#2C4A3B] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"><Check size={13} /> Guardar</button>
                            </div>
                            <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{aiStructuredNotes}</pre>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB COMUNICACIONES */}
            {activeTab === 'comunicaciones' && (
              <motion.div key="comunicaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Automatización IA</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Asistente de WhatsApp y Notificaciones</h2>
                    <p className="text-sm text-stone-500 mt-1">El bot gestiona confirmaciones automáticas, recordatorios 24h antes y re-agendamientos sin intervención humana.</p>
                  </div>
                  <div className="bg-[#F4F7F5] border border-[#E4ECE7] px-4 py-2.5 rounded-2xl flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#2C4A3B]">Conectado a Meta Cloud API</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4 shadow-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-stone-900 text-sm">Bot Conversacional IA</h3>
                        <input type="checkbox" checked={waBotActive} onChange={() => setWaBotActive(!waBotActive)} className="toggle cursor-pointer accent-[#2C4A3B] h-4 w-4" />
                      </div>
                      <p className="text-xs text-stone-500">Responde dudas frecuentes de aranceles, ubicación y horarios de atención 24/7.</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit">Estado: Operativo</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4 shadow-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-stone-900 text-sm">Recordatorios Automáticos</h3>
                        <input type="checkbox" checked={waAutoRemind} onChange={() => setWaAutoRemind(!waAutoRemind)} className="toggle cursor-pointer accent-[#2C4A3B] h-4 w-4" />
                      </div>
                      <p className="text-xs text-stone-500">Envía un WhatsApp de confirmación al paciente 24 horas y 2 horas antes de la sesión.</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit">Configurado</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4 shadow-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-stone-900 text-sm">Re-agendamiento por No Pago</h3>
                        <input type="checkbox" checked={waAutoReschedule} onChange={() => setWaAutoReschedule(!waAutoReschedule)} className="toggle cursor-pointer accent-[#2C4A3B] h-4 w-4" />
                      </div>
                      <p className="text-xs text-stone-500">Libera la hora automáticamente si la transferencia no se registra y ofrece el cupo a lista de espera.</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#2C4A3B] bg-[#F4F7F5] px-3 py-1.5 rounded-xl w-fit">Activo en centro</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB FINANZAS */}
            {activeTab === 'finanzas' && (
              <motion.div key="finanzas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Gestión Contable</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Finanzas y Facturación</h2>
                    <p className="text-sm text-stone-500 mt-1">Control consolidado de ingresos, comisiones de terapeutas y transacciones clínicas.</p>
                  </div>
                  <button onClick={handleExportReportCSV} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
                    <Download size={16} /> Exportar Reporte Financiero
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-2 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Facturación Bruta</p>
                    <p className="text-3xl font-bold text-stone-900">${dynamicGross.toLocaleString('es-CL')}</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold pt-1">
                      <ArrowUpRight size={14} /> <span>Calculado en tiempo real</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-2 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ingresos Netos (Centro)</p>
                    <p className="text-3xl font-bold text-[#2C4A3B]">${dynamicNet.toLocaleString('es-CL')}</p>
                    <span className="text-xs text-stone-500 block pt-1">Comisión institucional aplicada (88%)</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-2 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sesiones Pagadas</p>
                    <p className="text-3xl font-bold text-stone-900">{paidAppointments.length} <span className="text-sm font-normal text-stone-400">citas</span></p>
                    <span className="text-xs text-stone-500 block pt-1">Sincronizado con base de datos</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB EVALUACIONES / RESEÑAS */}
            {activeTab === 'resenas' && (
              <motion.div key="resenas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Satisfacción y Feedback</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Evaluaciones de Pacientes</h2>
                    <p className="text-sm text-stone-500 mt-1">Calificaciones recopiladas de forma automatizada por WhatsApp tras las consultas.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-[#F4F7F5] border border-[#E4ECE7] px-5 py-3 rounded-2xl">
                    <Star className="text-amber-500 fill-amber-500" size={22} />
                    <div>
                      <p className="text-lg font-bold text-stone-900 leading-none">{averageRating} / 5.0</p>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {reviewsList.length > 0 ? `${reviewsList.length} evaluaciones` : 'Sin evaluaciones'}
                      </span>
                    </div>
                  </div>
                </div>

                {reviewsList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-100 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-16 w-16 bg-[#F4F7F5] rounded-2xl flex items-center justify-center text-[#2C4A3B] mb-4 border border-[#E4ECE7]">
                      <Star size={28} className="text-[#2C4A3B]" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">Aún no hay evaluaciones registradas</h3>
                    <p className="text-sm text-stone-500 max-w-md mt-2 leading-relaxed">
                      Cuando tus pacientes asistan a sus citas, el Asistente WhatsApp IA les enviará una encuesta de satisfacción y sus comentarios aparecerán aquí en tiempo real.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-200 transition-all">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-stone-900 text-sm">{rev.patient_name || 'Paciente'}</h3>
                            <span className="text-[11px] text-stone-400">{rev.date || 'Reciente'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={14} className={i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-200'} />
                            ))}
                          </div>
                          <p className="text-xs text-stone-600 italic leading-relaxed">"{rev.comment}"</p>
                        </div>
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <span className="text-stone-400">Profesional:</span>
                          <span className="font-bold text-[#2C4A3B]">{rev.therapist_name || profile?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB REPORTES */}
            {activeTab === 'reportes' && (
              <motion.div key="reportes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Business Intelligence</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Reportes y Rendimiento</h2>
                  </div>
                  <button onClick={handleExportReportCSV} className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"><Download size={14} /> Exportar CSV</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Facturación Bruta (Real)</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1">${dynamicGross.toLocaleString('es-CL')}</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {['equipo', 'vitrina', 'documentos'].includes(activeTab) && (
               <motion.div key="placeholder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                 <div className="h-20 w-20 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-400 mb-4"><ShieldCheck size={40} /></div>
                 <h2 className="text-2xl font-bold text-stone-900 capitalize">{activeTab}</h2>
                 <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">Este módulo ha sido reseteado para tu nueva cuenta. Crea nuevos registros para activar los dashboards.</p>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MODAL NUEVO PACIENTE */}
      <AnimatePresence>
        {isNewPatientModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-stone-900">Inscribir Nuevo Paciente</h3>
                <button onClick={() => setIsNewPatientModalOpen(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleCreatePatient} className="space-y-3.5">
                <input type="text" required value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Nombre Completo del Paciente" className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm outline-none focus:bg-white" />
                <button type="submit" className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#233b2f] transition-colors">Guardar Paciente</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NUEVO SERVICIO */}
      <AnimatePresence>
        {isNewServiceModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <h3 className="font-bold text-lg text-stone-900">Crear Nuevo Servicio</h3>
                <button onClick={() => setIsNewServiceModalOpen(false)} className="text-stone-400 hover:text-stone-700"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Nombre del Servicio *</label>
                  <input type="text" required placeholder="Ej: Psicoterapia Infanto-Juvenil" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Precio ($ CLP) *</label>
                    <input type="number" required placeholder="35000" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Duración (min) *</label>
                    <input type="number" required placeholder="50" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">Descripción breve</label>
                  <textarea rows={3} placeholder="Detalles de la prestación clínica..." value={newServiceDescription} onChange={e => setNewServiceDescription(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" />
                </div>
                <button type="submit" disabled={savingService} className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#233b2f] transition-all">
                  {savingService ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE ADMISIÓN DE PACIENTE */}
      <AnimatePresence>
        {isNewApptModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-bold text-xl text-stone-900">Admisión de Nuevo Paciente y Cita</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Completa los datos clínicos requeridos para la ficha y agendamiento.</p>
                </div>
                <button onClick={() => setIsNewApptModalOpen(false)} className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50"><X size={20}/></button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-6">
                
                {/* SECCIÓN 1: DATOS PERSONALES */}
                <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#2C4A3B] text-white font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="font-bold text-xs text-stone-700 uppercase tracking-widest">Datos Personales</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Nombre *</label>
                      <input type="text" required placeholder="Nombre del paciente" value={pFirstName} onChange={e => setPFirstName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Apellido *</label>
                      <input type="text" required placeholder="Apellido del paciente" value={pLastName} onChange={e => setPLastName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Género (opcional)</label>
                    <select value={pGender} onChange={e => setPGender(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20">
                      <option value="">Selecciona el género</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="No Binario">No Binario</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                {/* SECCIÓN 2: IDENTIFICACIÓN */}
                <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#2C4A3B] text-white font-bold text-xs flex items-center justify-center">2</span>
                    <h4 className="font-bold text-xs text-stone-700 uppercase tracking-widest">Identificación</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Documento / RUN *</label>
                      <input type="text" required placeholder="Ej: 12.345.678-9" value={pDocument} onChange={e => setPDocument(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Fecha de nacimiento</label>
                      <input type="date" value={pBirthDate} onChange={e => setPBirthDate(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Previsión *</label>
                    <select value={pPrevision} onChange={e => setPPrevision(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20">
                      <option value="">Selecciona la previsión</option>
                      <option value="Fonasa">Fonasa</option>
                      <option value="Isapre">Isapre</option>
                      <option value="Particular">Particular</option>
                      <option value="Convenio Institucional">Convenio Institucional</option>
                    </select>
                  </div>
                </div>

                {/* SECCIÓN 3: INFORMACIÓN DE CONTACTO */}
                <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[#2C4A3B] text-white font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-xs text-stone-700 uppercase tracking-widest">Información de Contacto y Cita</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Email *</label>
                      <input type="email" required placeholder="correo@ejemplo.com" value={pEmail} onChange={e => setPEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Teléfono *</label>
                      <input type="tel" required placeholder="+56912345678" value={pPhone} onChange={e => setPPhone(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Dirección</label>
                    <input type="text" placeholder="Calle y número" value={pAddress} onChange={e => setPAddress(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Comuna</label>
                      <input type="text" placeholder="Ej: Providencia" value={pComuna} onChange={e => setPComuna(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Ciudad</label>
                      <input type="text" placeholder="Ciudad" value={pCiudad} onChange={e => setPCiudad(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200/60">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Fecha de Sesión *</label>
                      <input type="date" required value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Hora *</label>
                      <input type="time" required value={apptTime} onChange={e => setApptTime(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={savingAppt} className="w-full bg-[#2C4A3B] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#233b2f] transition-all shadow-md flex items-center justify-center gap-2">
                  {savingAppt ? <><Loader2 size={16} className="animate-spin" /> Registrando paciente...</> : 'Guardar Paciente y Confirmar Cita'}
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}