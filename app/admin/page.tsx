'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, Trash2, Search, 
  X, Loader2, DoorOpen, Check, MapPin, Wallet, CreditCard, 
  Megaphone, BarChart3, Link as LinkIcon, Settings, HelpCircle, Gift,
  RefreshCw, Download, Store, CheckCircle2, UserCircle, ChevronLeft, 
  ChevronRight, Clock, Building2, ChevronDown, ArrowUpRight, UserCheck, Minus, UserPlus
} from 'lucide-react';

import DocumentosTab from '@/components/admin/DocumentosTab';
import ComunicacionesTab from '@/components/admin/ComunicacionesTab'; // <-- IMPORT NUEVO

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

type TabType = 
  | 'inicio' | 'agenda' | 'servicios' | 'pacientes' | 'comunicaciones' 
  | 'finanzas' | 'resenas' | 'reportes' | 'documentos' | 'vitrina' 
  | 'equipo' | 'conexiones' | 'sala_online' | 'gana_meses' | 'suscripcion' 
  | 'ayuda' | 'configuracion';

type CalendarViewMode = 'mes' | 'semana' | 'dia';

interface Center {
  id: string;
  name: string;
  slug: string;
  boxes_count: number;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AdminSuitePage() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [centersList, setCentersList] = useState<Center[]>([]);
  const [activeCenter, setActiveCenter] = useState<Center | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('mes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isNewTherapistModalOpen, setIsNewTherapistModalOpen] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [boxesCount, setBoxesCount] = useState<number>(2);

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [todayString, setTodayString] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [newPatientName, setNewPatientName] = useState('');

  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistEmail, setNewTherapistEmail] = useState('');
  const [newTherapistSpecialty, setNewTherapistSpecialty] = useState('Psicología Clínica Adultos');
  const [newTherapistPhone, setNewTherapistPhone] = useState('+569');
  const [newTherapistRole, setNewTherapistRole] = useState('terapeuta');
  const [savingTherapist, setSavingTherapist] = useState(false);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('50');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [savingService, setSavingService] = useState(false);

  const [pFirstName, setPFirstName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pDocument, setPDocument] = useState('');
  const [pPrevision, setPPrevision] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [savingAppt, setSavingAppt] = useState(false);

  const [rawNotes, setRawNotes] = useState('');
  const [aiStructuredNotes, setAiStructuredNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [clinicalRecords, setClinicalRecords] = useState<Record<string, any[]>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const closeAllModals = useCallback(() => {
    setIsNewApptModalOpen(false);
    setIsNewPatientModalOpen(false);
    setIsNewServiceModalOpen(false);
    setIsNewTherapistModalOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAllModals(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAllModals]);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setTodayString(ymd);
    setApptDate(ymd);

    async function initAuthAndCenters() {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        setSession(activeSession);
        
        if (!activeSession?.user) {
          router.push('/login');
          return;
        }

        const email = activeSession.user.email?.trim().toLowerCase();
        
        const { data: profs, error } = await supabase
          .from('professionals')
          .select(`id, name, email, role, center_id, centers (id, name, slug, boxes_count)`)
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!profs || profs.length === 0) {
          router.push('/onboarding');
          return;
        }

        const validCenters: Center[] = profs.map((p: any) => p.centers).filter(Boolean);
        const uniqueCenters = Array.from(new Map(validCenters.map(item => [item.id, item])).values());

        setCentersList(uniqueCenters);
        const savedCenterId = localStorage.getItem('kairos_active_center_id');
        const defaultCenter = uniqueCenters.find(c => c.id === savedCenterId) || uniqueCenters[0];
        
        setActiveCenter(defaultCenter);
        if (defaultCenter) {
          localStorage.setItem('kairos_active_center_id', defaultCenter.id);
        }

        const currentProf = profs.find(p => p.center_id === defaultCenter?.id) || profs[0];
        setProfile({
          id: currentProf.id,
          name: currentProf.name,
          email: currentProf.email,
          role: currentProf.role,
          center_id: defaultCenter?.id
        });

      } catch (err) {
        console.error('Error inicializando suite admin:', err);
      } finally {
        setAuthLoading(false);
      }
    }

    initAuthAndCenters();
  }, [router]);

  useEffect(() => {
    async function fetchClinicalData(centerId: string) {
      try {
        const apptQuery = supabase.from('appointments').select('*').eq('center_id', centerId).order('date', { ascending: true });
        const servQuery = supabase.from('services').select('*').eq('center_id', centerId).order('created_at', { ascending: false });
        const profQuery = supabase.from('professionals').select('*').eq('center_id', centerId).order('name', { ascending: true });
        const revQuery = supabase.from('reviews').select('*').eq('center_id', centerId).order('created_at', { ascending: false });

        const [{ data: appts }, { data: servs }, { data: profs }, { data: revs }] = await Promise.all([
          apptQuery, servQuery, profQuery, revQuery
        ]);

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

    if (activeCenter?.id) {
      setBoxesCount(activeCenter.boxes_count || 1);
      fetchClinicalData(activeCenter.id);
    }
  }, [activeCenter]);

  const handleSelectCenter = (center: Center) => {
    setActiveCenter(center);
    localStorage.setItem('kairos_active_center_id', center.id);
    setIsSwitcherOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('kairos_active_center_id');
    router.push('/login');
  };

  const handleGoogleSync = async () => {
    showToast('Agenda sincronizada con Google Calendar.');
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

  const handleUpdateBoxesCount = async (delta: number) => {
    if (!activeCenter?.id) return;
    const updatedCount = Math.max(1, boxesCount + delta);
    setBoxesCount(updatedCount);
    setActiveCenter(prev => prev ? { ...prev, boxes_count: updatedCount } : prev);
    await supabase.from('centers').update({ boxes_count: updatedCount }).eq('id', activeCenter.id);
    showToast(`Dotación actualizada a ${updatedCount} Boxes activos.`);
  };

  const handleCreateTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenter?.id) return;
    setSavingTherapist(true);

    const payload = {
      name: newTherapistName,
      email: newTherapistEmail.toLowerCase(),
      specialty: newTherapistSpecialty,
      phone: newTherapistPhone,
      role: newTherapistRole,
      status: 'activo',
      center_id: activeCenter.id
    };

    const { data, error } = await supabase.from('professionals').insert([payload]).select().single();
    const created = (!error && data) ? data : { id: `prof-${Date.now()}`, ...payload };

    setTherapists(prev => [...prev, created]);
    setIsNewTherapistModalOpen(false);
    setNewTherapistName(''); setNewTherapistEmail(''); setNewTherapistPhone('+569');
    setSavingTherapist(false);
    showToast('Profesional incorporado al equipo clínico.');
  };

  const handleDeleteTherapist = async (id: string, name: string) => {
    if (window.confirm(`¿Desvincular a ${name} del equipo?`)) {
      setTherapists(prev => prev.filter(t => t.id !== id));
      await supabase.from('professionals').delete().eq('id', id);
      showToast('Profesional desvinculado.');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenter?.id) return;
    setSavingService(true);
    const payload = {
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      description: newServiceDescription,
      center_id: activeCenter.id
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
    if (window.confirm('¿Eliminar este servicio del catálogo?')) {
      setServices(prev => prev.filter(s => s.id !== id));
      await supabase.from('services').delete().eq('id', id);
      showToast('Servicio eliminado.');
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenter?.id) return;
    setSavingAppt(true);

    const fullName = `${pFirstName} ${pLastName}`.trim();
    const payload: any = {
      patient_name: fullName,
      patient_email: pEmail,
      patient_phone: pPhone,
      patient_rut: pDocument,
      date: apptDate,
      time: apptTime,
      modality: 'presencial',
      professional_name: profile?.name,
      box_number: 1,
      status: 'confirmada',
      center_id: activeCenter.id,
      price: 35000, 
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    const created = (!error && data) ? data : { ...payload, id: `local-${Date.now()}` };

    setAppointments(prev => [...prev, created]);
    if (!patientsList.some(p => p.patient_email === pEmail)) {
      setPatientsList(prev => [{ patient_name: fullName, patient_email: pEmail, patient_phone: pPhone }, ...prev]);
    }

    setIsNewApptModalOpen(false);
    setPFirstName(''); setPLastName(''); setPDocument(''); setPEmail(''); setPPhone('');
    setSavingAppt(false);
    showToast('Paciente y cita agendados con éxito.');
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
    if (window.confirm(`¿Eliminar a ${p.patient_name}?`)) {
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

  const handleProcessWithAI = async () => {
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

  const handleNextDate = () => {
    if (!currentDate) return;
    const d = new Date(currentDate);
    if (calendarView === 'mes') d.setMonth(d.getMonth() + 1);
    else if (calendarView === 'semana') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };
  const handlePrevDate = () => {
    if (!currentDate) return;
    const d = new Date(currentDate);
    if (calendarView === 'mes') d.setMonth(d.getMonth() - 1);
    else if (calendarView === 'semana') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  
  if (authLoading || !currentDate) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
      </div>
    );
  }

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNamesShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const formatDateYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => { let day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const activeDateStr = formatDateYMD(currentDate);
  const openApptAtSlot = (date: string, time: string) => { setApptDate(date); setApptTime(time); setIsNewApptModalOpen(true); };

  const paidAppointments = appointments.filter(a => a.status !== 'pendiente');
  const dynamicGross = paidAppointments.reduce((acc, a) => acc + Number(a.price || 35000), 0);
  const dynamicNet = Math.round(dynamicGross * 0.88);
  const averageRating = reviewsList.length > 0 ? (reviewsList.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviewsList.length).toFixed(1) : '5.0';

  const NavButton = ({ tab, icon: Icon, label, badge }: { tab: TabType; icon: any; label: string; badge?: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[13px] transition-all ${activeTab === tab ? 'bg-[#2C4A3B] text-white font-semibold shadow-sm' : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 font-medium'}`}
    >
      <div className="flex items-center gap-3"><Icon size={17} className={activeTab === tab ? 'text-white' : 'text-stone-500'} /><span>{label}</span></div>
      {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}>{badge}</span>}
    </button>
  );

  const filteredPatients = patientsList.filter(p => (p.patient_name || '').toLowerCase().includes(searchPatient.toLowerCase()));
  const activePatientHistory = selectedPatient ? (clinicalRecords[selectedPatient.patient_email || selectedPatient.patient_name] || []) : [];
  const todayAppts = appointments.filter(a => a.date === todayString && a.modality !== 'online');

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-5 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-stone-700">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /><span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-[265px] bg-white border-r border-stone-200/80 flex flex-col z-20 shrink-0 hidden md:flex">
        <div className="h-18 flex items-center px-6 border-b border-stone-100 shrink-0 py-4">
          <div className="h-9 w-9 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center mr-3 shadow-xs"><ShieldCheck size={20} /></div>
          <div className="truncate">
            <h1 className="font-bold text-stone-900 text-sm truncate">Kairós Clínico</h1>
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
            <NavButton tab="equipo" icon={DoorOpen} label="Equipo y Boxes" badge={`${boxesCount} Box`} />
            <NavButton tab="documentos" icon={FileText} label="Documentos" />
            <NavButton tab="vitrina" icon={Store} label="Vitrina" />
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
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-stone-100/80 hover:bg-stone-200/60 border border-stone-200 text-stone-900 transition-all text-xs font-bold shadow-2xs"
              >
                <Building2 size={15} className="text-[#2C4A3B]" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {activeCenter?.name || 'Seleccionar Sede'}
                </span>
                <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">Tus Sedes Clínicas</div>
                    {centersList.map((center) => (
                      <button
                        key={center.id}
                        type="button"
                        onClick={() => handleSelectCenter(center)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          activeCenter?.id === center.id ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate"><Building2 size={14} className="shrink-0 text-stone-400" /><span className="truncate">{center.name}</span></div>
                        {activeCenter?.id === center.id && <Check size={14} className="text-[#2C4A3B] shrink-0" />}
                      </button>
                    ))}
                    <div className="pt-1.5 border-t border-stone-100">
                      <button onClick={() => router.push('/onboarding')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#2C4A3B] hover:bg-[#F4F7F5] transition-colors">
                        <Plus size={14} /> Registrar Nueva Sede
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={() => setActiveTab('reportes')} className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-xl hover:border-[#2C4A3B] transition-colors">
              <BarChart3 size={13} className="text-[#2C4A3B]" /> Ocupación: {appointments.length > 0 ? '84%' : '0%'} • {boxesCount} Boxes Activos
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsNewPatientModalOpen(true)} className="hidden md:flex bg-white border border-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold items-center gap-1.5 hover:bg-stone-50"><UserPlus size={15} /> Paciente</button>
            <button onClick={() => setIsNewApptModalOpen(true)} className="bg-[#2C4A3B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs"><Plus size={16} /> Nueva Cita</button>
            <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block" />
            <div className="hidden md:block text-right pr-2">
              <p className="text-xs font-bold text-stone-900 truncate max-w-[120px]">{profile?.name}</p>
              <p className="text-[9px] font-bold text-[#2C4A3B] uppercase">{profile?.role === 'admin' ? 'Administrador' : 'Terapeuta'}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="text-stone-400 hover:text-red-600 p-2 rounded-xl border border-transparent hover:border-red-100 hover:bg-red-50 transition-colors"><LogOut size={16} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F9F8F6] custom-scrollbar">
          <AnimatePresence mode="wait">

            {activeTab === 'inicio' && (
              <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Panel de Control Clínico</span>
                    <h2 className="text-3xl font-bold text-stone-900 mt-1">Hola, {profile?.name}</h2>
                    <p className="text-stone-500 text-sm mt-1">Tienes <strong className="text-stone-900">{appointments.length} sesiones</strong> en agenda, <strong className="text-stone-900">{therapists.length} profesionales</strong> activos y <strong className="text-stone-900">{boxesCount} boxes</strong> habilitados.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('agenda')} className="bg-stone-100 text-stone-800 font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-stone-200 flex items-center gap-2"><Calendar size={16} /> Ver Calendario</button>
                    <button onClick={() => setActiveTab('pacientes')} className="bg-[#2C4A3B] text-white font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-[#233b2f] flex items-center gap-2"><Sparkles size={16} /> Abrir Fichas IA</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ingresos Neto Mes</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">${dynamicNet.toLocaleString('es-CL')}</p>
                    {dynamicNet > 0 && <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1"><ArrowUpRight size={12}/> Generado en {activeCenter?.name}</span>}
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pacientes Activos</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{patientsList.length}</p>
                    <span className="text-[11px] text-stone-500 mt-1 block">En el directorio clínico</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Asistente WhatsApp IA</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Activo 24/7</p>
                    <span className="text-[11px] text-stone-500 mt-1 block">Reagendando en automático</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Salas / Boxes</p>
                    <p className="text-2xl font-bold text-[#2C4A3B] mt-1">{boxesCount} Activos</p>
                    <span className="text-[11px] text-stone-500 mt-1 block">Asignación dinámica</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div key="agenda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Calendario Clínico y Salas</h2>
                    <p className="text-sm text-stone-500">Gestiona horarios, boxes y sesiones clínicas con vista granular.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleGoogleSync} className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold bg-[#F4F7F5] text-[#2C4A3B] border border-[#E4ECE7] hover:bg-[#E4ECE7] transition-all">
                      <RefreshCw size={15} /> Sincronizar Google Calendar
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
                      <button onClick={() => setCurrentDate(new Date())} className="text-[11px] font-bold text-[#2C4A3B] bg-[#F4F7F5] px-3 py-1.5 rounded-xl border border-[#E4ECE7] hover:bg-[#E4ECE7]">Hoy</button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-1 rounded-2xl flex items-center">
                        {(['dia', 'semana', 'mes'] as CalendarViewMode[]).map((mode) => (
                          <button key={mode} onClick={() => setCalendarView(mode)} className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${calendarView === mode ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}>{mode}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={handlePrevDate} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"><ChevronLeft size={18} /></button>
                        <button onClick={handleNextDate} className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"><ChevronRight size={18} /></button>
                      </div>
                    </div>
                  </div>

                  {calendarView === 'mes' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        {dayNamesShort.map(d => <span key={d}>{d}</span>)}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className="h-28 rounded-2xl bg-stone-50/40 border border-stone-100/50 opacity-40" />)}
                        {Array.from({ length: daysInMonth }).map((_, index) => {
                          const dayNum = index + 1;
                          const dateObj = new Date(currentYear, currentMonth, dayNum);
                          const dateStr = formatDateYMD(dateObj);
                          const dayAppointments = appointments.filter(a => a.date === dateStr);
                          const isSelected = selectedDateFilter === dateStr;
                          const isToday = todayString === dateStr;

                          return (
                            <div key={dateStr} onClick={() => { setSelectedDateFilter(dateStr); setCurrentDate(dateObj); }} className={`h-28 rounded-2xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer group relative ${isSelected ? 'border-[#2C4A3B] bg-[#F4F7F5] shadow-sm ring-2 ring-[#2C4A3B]/20' : isToday ? 'border-[#2C4A3B]/60 bg-white' : 'border-stone-100 bg-white hover:border-stone-300 hover:bg-stone-50/50'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ${isToday ? 'bg-[#2C4A3B] text-white' : 'text-stone-700'}`}>{dayNum}</span>
                                <button onClick={(e) => { e.stopPropagation(); openApptAtSlot(dateStr, '10:00'); }} className="opacity-0 group-hover:opacity-100 h-6 w-6 bg-[#2C4A3B] text-white rounded-lg flex items-center justify-center transition-opacity hover:scale-105 shadow-xs"><Plus size={14} /></button>
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
                                <span className={`text-xs font-bold mt-1 h-7 w-7 rounded-full flex items-center justify-center ${isToday ? 'bg-[#2C4A3B] text-white' : 'text-stone-800'}`}>{d.getDate()}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="divide-y divide-stone-100">
                          {TIME_SLOTS.map((hour) => (
                            <div key={hour} className="grid grid-cols-8 min-h-[64px] group">
                              <div className="text-[11px] font-semibold text-stone-400 py-3 text-center border-r border-stone-100/60 bg-stone-50/30">{hour}</div>
                              {weekDays.map((d, idx) => {
                                const dateStr = formatDateYMD(d);
                                const apptInSlot = appointments.find(a => a.date === dateStr && a.time.startsWith(hour.slice(0, 2)));
                                return (
                                  <div key={idx} onClick={() => !apptInSlot && openApptAtSlot(dateStr, hour)} className="border-r border-stone-100/60 p-1 relative hover:bg-[#F4F7F5]/40 transition-colors cursor-pointer">
                                    {apptInSlot ? (
                                      <div className="h-full bg-white border border-[#2C4A3B]/30 rounded-xl p-2 shadow-xs flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-center text-[10px] font-bold text-[#2C4A3B]">
                                            <span>{apptInSlot.time}</span><span className={`h-1.5 w-1.5 rounded-full ${apptInSlot.status === 'pendiente' ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                                          </div>
                                          <p className="text-xs font-bold text-stone-900 truncate mt-0.5">{apptInSlot.patient_name}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] text-stone-400 font-semibold">
                                          <span>Box {apptInSlot.box_number || 1}</span><span className="capitalize">{apptInSlot.modality}</span>
                                        </div>
                                      </div>
                                    ) : <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100"><Plus size={14} className="text-stone-300" /></div>}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {calendarView === 'dia' && (
                    <div className="space-y-3 max-w-4xl mx-auto">
                      {TIME_SLOTS.map((hour) => {
                        const apptsInHour = appointments.filter(a => a.date === activeDateStr && a.time.startsWith(hour.slice(0, 2)));
                        return (
                          <div key={hour} className="flex gap-4 items-start border-b border-stone-100 pb-3">
                            <div className="w-16 text-right pt-2"><span className="text-xs font-bold text-stone-400">{hour}</span></div>
                            <div className="flex-1">
                              {apptsInHour.length === 0 ? (
                                <button onClick={() => openApptAtSlot(activeDateStr, hour)} className="w-full text-left py-3 px-4 rounded-2xl border border-dashed border-stone-200 text-xs font-semibold text-stone-400 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#F4F7F5] transition-all flex items-center gap-2">
                                  <Plus size={14} /> Espacio disponible a las {hour} • Clic para agendar
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  {apptsInHour.map((appt) => (
                                    <div key={appt.id} className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center font-bold text-xs">{appt.time}</div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-stone-900">{appt.patient_name}</h4>
                                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${appt.status === 'pendiente' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{appt.status}</span>
                                          </div>
                                          <p className="text-xs text-stone-500 mt-0.5">Terapeuta: <strong>{appt.professional_name}</strong> {appt.patient_phone && `• ${appt.patient_phone}`}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl">
                                          <MapPin size={13} className="text-[#2C4A3B]" />
                                          <select value={appt.box_number || 1} onChange={(e) => handleChangeAppointmentBox(appt.id, Number(e.target.value))} className="text-xs font-bold text-stone-900 bg-transparent outline-none cursor-pointer">
                                            {Array.from({ length: boxesCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Box {n}</option>)}
                                          </select>
                                        </div>
                                        <button onClick={() => { setSelectedPatient(appt); setActiveTab('pacientes'); }} className="text-xs font-semibold px-3.5 py-2 bg-[#2C4A3B] text-white rounded-xl hover:bg-[#233b2f]">Ficha IA</button>
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

            {activeTab === 'equipo' && (
              <motion.div key="equipo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-8">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Gestión de Infraestructura y Especialistas</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Equipo Clínico y Salas</h2>
                    <p className="text-sm text-stone-500 mt-1">Control de boxes de atención, terapeutas activos y asignación de espacios.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setIsNewTherapistModalOpen(true)} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
                      <UserPlus size={16} /> Incorporar Profesional
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">Salas de Consulta (Boxes Activos)</h3>
                      <p className="text-xs text-stone-400">Espacios físicos disponibles para sesiones presenciales.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-stone-200/80 p-1.5 rounded-2xl shadow-2xs">
                      <button onClick={() => handleUpdateBoxesCount(-1)} disabled={boxesCount <= 1} className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed" title="Reducir Box"><Minus size={15} /></button>
                      <span className="text-xs font-bold px-2 text-stone-800">{boxesCount} Boxes</span>
                      <button onClick={() => handleUpdateBoxesCount(1)} className="p-1.5 rounded-xl hover:bg-stone-100 text-[#2C4A3B]" title="Añadir Box"><Plus size={15} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: boxesCount }, (_, i) => {
                      const boxNum = i + 1;
                      const apptsInBox = todayAppts.filter(a => Number(a.box_number || 1) === boxNum);
                      const isOccupied = apptsInBox.length > 0;

                      return (
                        <div key={boxNum} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center font-bold text-sm">B{boxNum}</div>
                              <div>
                                <h4 className="font-bold text-sm text-stone-900">Box de Consulta {boxNum}</h4>
                                <span className="text-[11px] text-stone-400">Atención Presencial</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${isOccupied ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
                              {isOccupied ? `${apptsInBox.length} Cita(s) Hoy` : 'Disponible'}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-stone-100 text-xs">
                            {isOccupied ? (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Sesiones agendadas hoy:</span>
                                {apptsInBox.slice(0, 2).map((a, idx) => (
                                  <div key={idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-[11px]">
                                    <span className="font-bold text-stone-900 block">{a.time} hrs • {a.patient_name}</span>
                                    <span className="text-stone-500">Terapeuta: {a.professional_name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-stone-400 italic text-[11px] py-1">Sin sesiones asignadas en este box para hoy.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">Profesionales Acreditados ({therapists.length})</h3>
                      <p className="text-xs text-stone-400">Terapeutas y especialistas con agenda activa en el centro.</p>
                    </div>
                  </div>
                  {therapists.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center shadow-xs space-y-3">
                      <div className="h-16 w-16 bg-[#F4F7F5] rounded-2xl flex items-center justify-center text-[#2C4A3B] mx-auto border border-[#E4ECE7]"><UserCheck size={28} /></div>
                      <h4 className="font-bold text-stone-900 text-base">Directorio Vacío</h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">Aún no hay terapeutas registrados. Haz clic en "Incorporar Profesional".</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {therapists.map((therapist) => (
                        <div key={therapist.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-200 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center font-bold text-sm">{therapist.name.charAt(0)}</div>
                              <div>
                                <h4 className="font-bold text-sm text-stone-900">{therapist.name}</h4>
                                <span className="text-[11px] font-semibold text-[#2C4A3B] block">{therapist.specialty || 'Psicoterapia'}</span>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteTherapist(therapist.id, therapist.name)} className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"><Trash2 size={15} /></button>
                          </div>
                          <div className="space-y-1.5 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                            <p className="truncate">📧 {therapist.email}</p>
                            {therapist.phone && <p>📱 {therapist.phone}</p>}
                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Rol:</span>
                              <span className="font-bold text-stone-800 capitalize">{therapist.role || 'Terapeuta'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'servicios' && (
              <motion.div key="servicios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Catálogo Clínico</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Servicios y Terapias</h2>
                    <p className="text-sm text-stone-500 mt-1">Administra los tipos de sesiones, duraciones y aranceles ofrecidos por tu centro.</p>
                  </div>
                  <button onClick={() => setIsNewServiceModalOpen(true)} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
                    <Plus size={16} /> Nuevo Servicio
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {services.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-stone-100">
                      <Briefcase className="mx-auto text-stone-300 mb-3" size={40} />
                      <p className="font-semibold text-stone-700 text-sm">No hay servicios registrados.</p>
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
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium"><Clock size={14} className="text-[#2C4A3B]" /><span>{srv.duration || 50} min</span></div>
                          <span className="font-bold text-stone-900 text-base">${Number(srv.price || 35000).toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'pacientes' && (
              <motion.div key="pacientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 h-fit shadow-xs xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">Pacientes ({filteredPatients.length})</h3>
                      <p className="text-xs text-stone-400">Directorio clínico del centro</p>
                    </div>
                    <button onClick={() => setIsNewPatientModalOpen(true)} className="bg-[#2C4A3B] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"><UserPlus size={14} /> Inscribir</button>
                  </div>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
                    <input type="text" placeholder="Buscar por nombre..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white" />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-10 text-stone-400 space-y-2"><UserCircle size={32} className="mx-auto opacity-50" /><p className="text-xs">No hay pacientes.</p></div>
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

                <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                  {!selectedPatient ? (
                    <div className="bg-white rounded-3xl border border-stone-100 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                      <div className="h-16 w-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 mb-4"><Sparkles size={28} className="text-stone-300" /></div>
                      <h3 className="text-lg font-bold text-stone-900">Workspace Clínico Vacío</h3>
                      <p className="text-sm text-stone-500 max-w-sm mt-2">Selecciona un paciente del directorio para comenzar a dictar su sesión con IA.</p>
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
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Apuntes clínicos crudos</label>
                          <textarea rows={4} value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="Habla con el micrófono encendido para que la IA escuche..." className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm outline-none focus:bg-white transition-colors" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button onClick={handleProcessWithAI} disabled={aiLoading || !rawNotes.trim()} className="bg-[#2C4A3B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] disabled:opacity-50">
                            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Estructurar con IA
                          </button>
                        </div>
                        {aiStructuredNotes && (
                          <div className="p-5 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#2C4A3B] uppercase tracking-wider">Evolución Estructurada</h4>
                              <button onClick={handleSaveToPatientHistory} className="bg-[#2C4A3B] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"><Check size={13} /> Guardar Ficha</button>
                            </div>
                            <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{aiStructuredNotes}</pre>
                          </div>
                        )}
                      </div>
                      
                      {activePatientHistory.length > 0 && (
                        <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-xs">
                          <h4 className="font-bold text-stone-900 mb-4">Historial de Sesiones Anteriores</h4>
                          <div className="space-y-4">
                            {activePatientHistory.map((hist: any, index: number) => (
                              <div key={index} className="p-4 rounded-2xl border border-stone-100 bg-stone-50">
                                <div className="flex justify-between text-xs text-stone-500 font-bold mb-2">
                                  <span>{hist.date}</span>
                                  <span>Terapeuta: {hist.therapist}</span>
                                </div>
                                <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans">{hist.summary}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'finanzas' && (
              <motion.div key="finanzas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Gestión Contable</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Finanzas y Facturación</h2>
                    <p className="text-sm text-stone-500 mt-1">Control consolidado de ingresos, comisiones de terapeutas y transacciones clínicas de la sede.</p>
                  </div>
                  <button onClick={handleExportReportCSV} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
                    <Download size={16} /> Exportar Reporte Financiero
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-2 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Facturación Bruta</p>
                    <p className="text-3xl font-bold text-stone-900">${dynamicGross.toLocaleString('es-CL')}</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold pt-1"><ArrowUpRight size={14} /> <span>Calculado en tiempo real</span></div>
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

            {activeTab === 'resenas' && (
              <motion.div key="resenas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Satisfacción y Feedback</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Evaluaciones de Pacientes</h2>
                    <p className="text-sm text-stone-500 mt-1">Calificaciones recopiladas automatizadamente tras las consultas en esta sede.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-[#F4F7F5] border border-[#E4ECE7] px-5 py-3 rounded-2xl">
                    <Star className="text-amber-500 fill-amber-500" size={22} />
                    <div>
                      <p className="text-lg font-bold text-stone-900 leading-none">{averageRating} / 5.0</p>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{reviewsList.length > 0 ? `${reviewsList.length} evaluaciones` : 'Sin evaluaciones'}</span>
                    </div>
                  </div>
                </div>
                {reviewsList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-100 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                    <div className="h-16 w-16 bg-[#F4F7F5] rounded-2xl flex items-center justify-center text-[#2C4A3B] mb-4 border border-[#E4ECE7]"><Star size={28} className="text-[#2C4A3B]" /></div>
                    <h3 className="text-lg font-bold text-stone-900">Aún no hay evaluaciones registradas</h3>
                    <p className="text-sm text-stone-500 max-w-md mt-2 leading-relaxed">Cuando los pacientes asistan a sus citas, el Asistente WhatsApp les enviará una encuesta y aparecerá aquí.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs space-y-4 flex flex-col justify-between hover:border-stone-200 transition-all">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="font-bold text-stone-900 text-sm">{rev.patient_name || 'Paciente'}</h3><span className="text-[11px] text-stone-400">{rev.date || 'Reciente'}</span></div>
                          <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-200'} />)}</div>
                          <p className="text-xs text-stone-600 italic leading-relaxed">"{rev.comment}"</p>
                        </div>
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <span className="text-stone-400">Profesional:</span><span className="font-bold text-[#2C4A3B]">{rev.therapist_name || profile?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reportes' && (
              <motion.div key="reportes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-8">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Business Intelligence</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Reportes y Rendimiento</h2>
                  </div>
                  <button onClick={handleExportReportCSV} className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"><Download size={14} /> Exportar CSV</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Facturación Sede</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1">${dynamicGross.toLocaleString('es-CL')}</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB DOCUMENTOS */}
            {activeTab === 'documentos' && (
              <DocumentosTab 
                centerName={activeCenter?.name || 'la sede'} 
                centerId={activeCenter?.id} 
              />
            )}

            {/* TAB COMUNICACIONES (NUEVO MOTOR) */}
            {activeTab === 'comunicaciones' && (
              <ComunicacionesTab centerId={activeCenter?.id} />
            )}

            {/* OTRAS PESTAÑAS (PLACEHOLDERS DE CONFIGURACIÓN) */}
            {['vitrina', 'conexiones', 'sala_online', 'gana_meses', 'suscripcion', 'ayuda', 'configuracion'].includes(activeTab) && (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col items-center justify-center text-center max-w-[90rem] mx-auto py-20">
                <div className="h-20 w-20 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-400 mb-4 shadow-sm border border-stone-200/50"><Settings size={40} /></div>
                <h2 className="text-2xl font-bold text-stone-900 capitalize">{activeTab.replace('_', ' ')}</h2>
                <p className="text-stone-500 text-sm mt-2 max-w-sm mx-auto">Este módulo está enlazado dinámicamente a tu nueva cuenta Multi-Tenant en la sede {activeCenter?.name}.</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* --- INICIO DE MODALES --- */}
      <AnimatePresence>
        {isNewApptModalOpen && (
          <div onClick={() => setIsNewApptModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-bold text-xl text-stone-900">Admisión de Nuevo Paciente y Cita</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Asignando a sede: <strong>{activeCenter?.name}</strong></p>
                </div>
                <button onClick={() => setIsNewApptModalOpen(false)} className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateAppointment} className="space-y-6">
                <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-[#2C4A3B] text-white font-bold text-xs flex items-center justify-center">1</span><h4 className="font-bold text-xs text-stone-700 uppercase tracking-widest">Datos Personales</h4></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Nombre *</label><input type="text" required placeholder="Nombre del paciente" value={pFirstName} onChange={e => setPFirstName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                    <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Apellido *</label><input type="text" required placeholder="Apellido del paciente" value={pLastName} onChange={e => setPLastName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Documento / RUN *</label><input type="text" required placeholder="Ej: 12.345.678-9" value={pDocument} onChange={e => setPDocument(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 block mb-1">Previsión *</label>
                      <select value={pPrevision} onChange={e => setPPrevision(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20"><option value="">Selecciona la previsión</option><option value="Fonasa">Fonasa</option><option value="Isapre">Isapre</option><option value="Particular">Particular</option></select>
                    </div>
                  </div>
                </div>
                <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-100 space-y-4">
                  <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-[#2C4A3B] text-white font-bold text-xs flex items-center justify-center">2</span><h4 className="font-bold text-xs text-stone-700 uppercase tracking-widest">Contacto y Cita</h4></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Email *</label><input type="email" required placeholder="correo@ejemplo.com" value={pEmail} onChange={e => setPEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                    <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Teléfono *</label><input type="tel" required placeholder="+56912345678" value={pPhone} onChange={e => setPPhone(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200/60">
                    <div><label className="text-[11px] font-bold text-stone-700 block mb-1">Fecha de Sesión *</label><input type="date" required value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                    <div><label className="text-[11px] font-bold text-stone-700 block mb-1">Hora *</label><input type="time" required value={apptTime} onChange={e => setApptTime(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                  </div>
                </div>
                <button type="submit" disabled={savingAppt} className="w-full bg-[#2C4A3B] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#233b2f] transition-all shadow-md flex items-center justify-center gap-2">{savingAppt ? <><Loader2 size={16} className="animate-spin" /> Registrando paciente...</> : 'Guardar Paciente y Confirmar Cita'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewPatientModalOpen && (
          <div onClick={() => setIsNewPatientModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center"><h3 className="font-bold text-lg text-stone-900">Inscribir Nuevo Paciente</h3><button onClick={() => setIsNewPatientModalOpen(false)}><X size={20}/></button></div>
              <form onSubmit={handleCreatePatient} className="space-y-3.5">
                <input type="text" required value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Nombre Completo del Paciente" className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm outline-none focus:bg-white" />
                <button type="submit" className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#233b2f] transition-colors">Guardar Paciente</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewServiceModalOpen && (
          <div onClick={() => setIsNewServiceModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4"><h3 className="font-bold text-lg text-stone-900">Crear Nuevo Servicio</h3><button onClick={() => setIsNewServiceModalOpen(false)} className="text-stone-400 hover:text-stone-700"><X size={20}/></button></div>
              <form onSubmit={handleCreateService} className="space-y-4">
                <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Nombre del Servicio *</label><input type="text" required placeholder="Ej: Psicoterapia Infanto-Juvenil" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Precio ($ CLP) *</label><input type="number" required placeholder="35000" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                  <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Duración (min) *</label><input type="number" required placeholder="50" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                </div>
                <div><label className="text-[11px] font-bold text-stone-500 block mb-1">Descripción breve</label><textarea rows={3} placeholder="Detalles de la prestación clínica..." value={newServiceDescription} onChange={e => setNewServiceDescription(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                <button type="submit" disabled={savingService} className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#233b2f] transition-all">{savingService ? 'Guardando...' : 'Guardar Servicio'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewTherapistModalOpen && (
          <div onClick={() => setIsNewTherapistModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                <div><h3 className="font-bold text-lg text-stone-900">Incorporar Profesional</h3><p className="text-xs text-stone-400">Vincular a {activeCenter?.name}</p></div>
                <button onClick={() => setIsNewTherapistModalOpen(false)} className="text-stone-400 hover:text-stone-700"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateTherapist} className="space-y-4">
                <div><label className="text-[11px] font-bold text-stone-600 block mb-1">Nombre Completo *</label><input type="text" required placeholder="Ej: Dra. Sofía Valdés" value={newTherapistName} onChange={e => setNewTherapistName(e.target.value)} className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" /></div>
                <div><label className="text-[11px] font-bold text-stone-600 block mb-1">Especialidad Clínica *</label><select value={newTherapistSpecialty} onChange={e => setNewTherapistSpecialty(e.target.value)} className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"><option value="Psicología Clínica Adultos">Psicología Clínica Adultos</option><option value="Psiquiatría Adultos">Psiquiatría Adultos</option></select></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="text-[11px] font-bold text-stone-600 block mb-1">Email Profesional *</label><input type="email" required placeholder="terapeuta@kairos.cl" value={newTherapistEmail} onChange={e => setNewTherapistEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                  <div><label className="text-[11px] font-bold text-stone-600 block mb-1">Teléfono</label><input type="tel" placeholder="+56912345678" value={newTherapistPhone} onChange={e => setNewTherapistPhone(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white" /></div>
                </div>
                <div><label className="text-[11px] font-bold text-stone-600 block mb-1">Rol de Acceso</label><select value={newTherapistRole} onChange={e => setNewTherapistRole(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white"><option value="therapist">Terapeuta (Agenda y Fichas)</option><option value="admin">Administrador Clínico</option></select></div>
                <button type="submit" disabled={savingTherapist} className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#233b2f] transition-all flex items-center justify-center gap-2">{savingTherapist ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : 'Vincular al Centro'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}