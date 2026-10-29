'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Users, Briefcase, DollarSign, Star, Bookmark, 
  Home, LogOut, Plus, X, ShieldCheck, Eye, EyeOff, Loader2, Mic, 
  CheckCircle, AlertCircle, FileText, Trash2, Edit, Check, Clock, Phone, Mail,
  ChevronLeft, ChevronRight, Save, Copy
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);
const ENV_CENTER_ID = process.env.NEXT_PUBLIC_CENTER_ID || '';

// --- TOAST PREMIUM ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success'|'error'|'info', onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border ${type === 'success' ? 'bg-[#F4F7F5] border-[#E4ECE7] text-[#2C4A3B]' : type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-stone-200 text-stone-700'}`}>
    {type === 'success' && <CheckCircle size={20} className="text-[#5F8575]" />}
    {type === 'error' && <AlertCircle size={20} className="text-red-500" />}
    <p className="text-sm font-medium pr-4">{message}</p>
    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={16} /></button>
  </motion.div>
);

export default function AdminPanel() {
  // --- ESTADOS CORE ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error'|'info' } | null>(null);
  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };
  
  const [activeTab, setActiveTab] = useState('inicio'); 
  const [userRole, setUserRole] = useState<'admin' | 'profesional'>('admin');
  const [currentProfId, setCurrentProfId] = useState<string>('');
  const [adminCenterId, setAdminCenterId] = useState<string>(ENV_CENTER_ID);
  
  // --- DATOS ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // --- AGENDA & PACIENTES ---
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilterTab, setPatientFilterTab] = useState('Todos');
  
  // --- MODALES AGENDA Y CERTIFICADOS ---
  const [showApptModal, setShowApptModal] = useState(false);
  const [adminAppt, setAdminAppt] = useState({ id: '', patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '', modality: 'Presencial' });
  const [apptActionModal, setApptActionModal] = useState<any>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certPrompt, setCertPrompt] = useState('');
  const [certContent, setCertContent] = useState('');
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  
  // --- FICHA CLINICA E IA ---
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [noteMotivo, setNoteMotivo] = useState('');
  const [noteDesarrollo, setNoteDesarrollo] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // --- CREACIÓN (TERAPIAS & EQUIPO) ---
  const [newName, setNewName] = useState(''); const [newPrice, setNewPrice] = useState(''); const [newProfId, setNewProfId] = useState(''); const [isCreating, setIsCreating] = useState(false);
  const [newProfName, setNewProfName] = useState(''); const [newProfEmail, setNewProfEmail] = useState(''); const [newProfBoxId, setNewProfBoxId] = useState(''); const [isCreatingProf, setIsCreatingProf] = useState(false);

  // --- INIT ---
  useEffect(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) loadData(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) loadData(session); });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(currentSession = session) {
    const [profs, servs, cents, boxs, apps, revs] = await Promise.all([
      supabase.from('professionals').select('*').order('name'),
      supabase.from('services').select('*').order('created_at', { ascending: false }),
      supabase.from('centers').select('*').order('name'),
      supabase.from('boxes').select('*'),
      supabase.from('appointments').select('*').order('start_time', { ascending: true }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false })
    ]);
    const profList = profs.data || [];
    setProfessionals(profList);
    if (currentSession?.user?.email) {
      const me = profList.find(p => p.email.toLowerCase() === currentSession.user.email.toLowerCase());
      if (me) { setUserRole('profesional'); setCurrentProfId(me.id); } else { setUserRole('admin'); setCurrentProfId(''); }
    }
    if (servs.data) setServices(servs.data);
    if (cents.data) { setCenters(cents.data); if (!ENV_CENTER_ID && cents.data.length > 0) setAdminCenterId(cents.data[0].id); }
    if (boxs.data) setBoxes(boxs.data);
    if (apps.data) setAppointments(apps.data);
    if (revs.data) setReviews(revs.data);
  }

  // --- FILTROS ---
  const visibleProfessionals = professionals.filter(p => p.center_id === adminCenterId && (userRole === 'admin' || p.id === currentProfId));
  const visibleAppointments = appointments.filter(a => a.center_id === adminCenterId && (userRole === 'admin' || a.professional_id === currentProfId));
  const activeAppointments = visibleAppointments.filter(a => a.consent_accepted !== false);
  const visibleServices = services.filter(s => visibleProfessionals.some(vp => vp.id === s.professional_id));
  const visibleBoxes = boxes.filter(b => b.center_id === adminCenterId);
  const visibleReviews = reviews.filter(r => visibleProfessionals.some(vp => vp.id === r.professional_id));
  
  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconocido';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;
  const getBoxName = (id: string) => boxes.find(b => b.id === id)?.name || 'Sin Box';

  // Finanzas
  const currentMonthAppointments = activeAppointments.filter(app => { const d = new Date(app.start_time); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const totalIncome = currentMonthAppointments.reduce((sum, app) => sum + getServicePrice(app.service_id), 0);
  const gananciaCentro = totalIncome * 0.3; const gananciaProfesionales = totalIncome * 0.7;

  // Pacientes Map
  const patientsMap = new Map();
  visibleAppointments.forEach(app => {
    if (app.patient_name?.startsWith('[BLOQUEO]')) return; 
    const key = app.patient_rut || app.patient_name;
    if (!patientsMap.has(key)) { patientsMap.set(key, { id: key, name: app.patient_name, rut: app.patient_rut, phone: app.patient_phone, email: app.patient_email, appointments: [] }); }
    patientsMap.get(key).appointments.push(app);
  });
  const filteredPatients = Array.from(patientsMap.values()).map(p => {
    const now = new Date();
    const future = p.appointments.filter((a:any) => a.consent_accepted !== false && new Date(a.start_time) >= now);
    return { ...p, status: future.length > 0 ? 'Activo' : 'Inactivo' };
  }).filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) && (patientFilterTab === 'Todos' || p.status === (patientFilterTab === 'Activos' ? 'Activo' : 'Inactivo')));

  const getWeekDays = () => currentWeekStart ? Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i)) : [];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  // --- HANDLERS CLINICOS & IA ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop(); setIsListening(false); processAI(transcript);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return showToast("Tu navegador no soporta dictado.", "error");
      const recognition = new SpeechRecognition();
      recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'es-CL';
      recognition.onresult = (e: any) => { let current = ''; for (let i = 0; i < e.results.length; i++) current += e.results[i][0].transcript; setTranscript(current); };
      recognition.start(); recognitionRef.current = recognition; setIsListening(true); setTranscript('');
    }
  };
  
  const processAI = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: text }) });
      const data = await res.json();
      if (data.error) showToast("Error IA: " + data.error, "error");
      else { if(data.motivo) setNoteMotivo(data.motivo); if(data.desarrollo) setNoteDesarrollo(data.desarrollo); if(data.plan) setNotePlan(data.plan); showToast("Análisis completado", "success"); }
    } catch (e) { showToast("Error de conexión IA", "error"); }
    setIsAnalyzing(false); setTranscript('');
  };

  const handleGenerateCertAI = async () => {
    if (!certPrompt.trim()) return;
    setIsGeneratingCert(true);
    try {
      const res = await fetch('/api/generate-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: certPrompt,
          patient_name: activePatient.name,
          patient_rut: activePatient.rut || 'No especificado',
          date: format(new Date(), 'dd/MM/yyyy')
        })
      });
      const data = await res.json();
      if (data.certificate) {
        setCertContent(data.certificate);
        showToast('Certificado redactado', 'success');
      } else {
        showToast("Error de IA: " + (data.error || 'Desconocido'), "error");
      }
    } catch (e) {
      showToast("Error de conexión IA", "error");
    }
    setIsGeneratingCert(false);
  };

  const handleSaveNote = async () => {
    if (!noteDesarrollo || !activePatient) return;
    const combinedNote = `MOTIVO DE CONSULTA:\n${noteMotivo}\n\nDESARROLLO:\n${noteDesarrollo}\n\nPLAN:\n${notePlan}`;
    const { error } = await supabase.from('clinical_notes').insert([{ patient_name: activePatient.name, notes: combinedNote, center_id: adminCenterId, author_email: session?.user?.email }]);
    if (!error) { setNoteMotivo(''); setNoteDesarrollo(''); setNotePlan(''); openFicha(activePatient); showToast('Ficha guardada', 'success'); }
  };

  const openFicha = async (patient: any) => {
    setApptActionModal(null); setActivePatient(patient); setActiveTab('pacientes');
    const { data } = await supabase.from('clinical_notes').select('*').eq('patient_name', patient.name).eq('center_id', adminCenterId).order('created_at', { ascending: false });
    if (data) setPatientNotes(data);
  };

  // --- HANDLERS AGENDA ---
  const handleAdminSchedule = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const [yyyy, mm, dd] = adminAppt.date.split('-'); const [hh, min] = adminAppt.time.split(':');
    const finalProfId = userRole === 'profesional' ? currentProfId : adminAppt.professional_id;
    const d = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min), 0);
    const endD = new Date(d.getTime() + 60 * 60 * 1000);
    
    const payload = { center_id: adminCenterId, box_id: adminAppt.modality==='Online'?null:adminAppt.box_id, professional_id: finalProfId, service_id: adminAppt.service_id, patient_name: adminAppt.patient_name, patient_rut: adminAppt.patient_rut, patient_email: adminAppt.patient_email, patient_phone: adminAppt.patient_phone, start_time: d.toISOString(), end_time: endD.toISOString(), consent_accepted: true, modality: adminAppt.modality };
    
    const { error } = adminAppt.id ? await supabase.from('appointments').update(payload).eq('id', adminAppt.id) : await supabase.from('appointments').insert([payload]);
    
    if (!error) { setShowApptModal(false); loadData(); showToast('Cita guardada exitosamente.', 'success'); } else showToast('Error al agendar', 'error');
    setLoading(false);
  };

  // --- HANDLERS TERAPIAS & EQUIPO ---
  const handleCreateService = async (e: React.FormEvent) => { 
    e.preventDefault(); setIsCreating(true); 
    await supabase.from('services').insert([{ name: newName, price: Number(newPrice), professional_id: userRole === 'profesional' ? currentProfId : newProfId }]); 
    setNewName(''); setNewPrice(''); loadData(); showToast('Servicio creado', 'success'); setIsCreating(false); 
  };
  const handleDeleteService = async (id: string) => { if(confirm('¿Eliminar?')) { await supabase.from('services').delete().eq('id', id); loadData(); showToast('Servicio eliminado', 'info'); } };
  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault(); setIsCreatingProf(true);
    await supabase.from('professionals').insert([{ name: newProfName, email: newProfEmail, center_id: adminCenterId, default_box_id: newProfBoxId || null }]);
    setNewProfName(''); setNewProfEmail(''); loadData(); showToast('Profesional agregado', 'success'); setIsCreatingProf(false);
  };
  
  // --- AUTH ---
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('Credenciales incorrectas'); setLoading(false); };
  
  const fadeIn: Variants = { hidden: { opacity: 0 }, show: { opacity: 1 } };

  // ==========================================
  // RENDER PANTALLA PRINCIPAL
  // ==========================================
  if (session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] font-sans text-stone-800 flex selection:bg-[#E4ECE7]">
        <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
        
        {/* SIDEBAR */}
        <aside className="w-[260px] bg-white border-r border-stone-100 hidden md:flex flex-col justify-between sticky top-0 h-screen shadow-sm">
          <div>
            <div className="p-6 border-b border-stone-50 flex items-center gap-3">
              <div className="h-10 w-10 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center shadow-md"><ShieldCheck size={22} /></div>
              <div><h1 className="font-bold text-stone-900 text-sm">Centro OM</h1><span className="text-[10px] text-stone-400 uppercase tracking-widest">Portal Clínico</span></div>
            </div>
            <nav className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase px-3 mb-2 tracking-wider mt-2">Día a Día</p>
              <button onClick={() => {setActiveTab('inicio'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='inicio'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><Home size={18}/> Inicio</button>
              <button onClick={() => {setActiveTab('agenda'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='agenda'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><CalendarIcon size={18}/> Agenda</button>
              <p className="text-[10px] font-bold text-stone-400 uppercase px-3 mt-8 mb-2 tracking-wider">Gestión Clínica</p>
              <button onClick={() => {setActiveTab('pacientes'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='pacientes'||activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><Users size={18}/> Pacientes y Fichas</button>
              <button onClick={() => {setActiveTab('terapias'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='terapias'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><Briefcase size={18}/> Terapias y Servicios</button>
              {userRole === 'admin' && <button onClick={() => {setActiveTab('equipo'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='equipo'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><Bookmark size={18}/> Equipo y Boxes</button>}
              {userRole === 'admin' && <button onClick={() => {setActiveTab('finanzas'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='finanzas'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><DollarSign size={18}/> Finanzas</button>}
              <button onClick={() => {setActiveTab('resenas'); setActivePatient(null);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab==='resenas'&&!activePatient?'bg-[#F4F7F5] text-[#2C4A3B] font-semibold':'text-stone-500 hover:bg-stone-50'}`}><Star size={18}/> Reseñas</button>
            </nav>
          </div>
          <div className="p-4 border-t border-stone-100">
            <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between group">
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-stone-800 truncate">{session.user.email.split('@')[0]}</p>
                <p className="text-[10px] text-stone-500">{userRole === 'admin' ? 'Director(a)' : 'Terapeuta'}</p>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-xl"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 h-16 px-6 flex items-center justify-between sticky top-0 z-10">
            <span className="bg-stone-50 border border-stone-100 rounded-lg py-1.5 px-3 text-xs font-semibold text-stone-600">Sede: {centers.find(c => c.id === adminCenterId)?.name}</span>
            <button onClick={() => { setAdminAppt({ id:'', patient_name:'', patient_rut:'', patient_email:'', patient_phone:'', professional_id:currentProfId, service_id:'', box_id:'', date:'', time:'', modality:'Presencial' }); setShowApptModal(true); }} className="bg-[#5F8575] hover:bg-[#4A6B5D] text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-2 transition-all"><Plus size={16}/> Nueva Cita</button>
          </header>

          <main className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            
            {/* 1. INICIO */}
            {!activePatient && activeTab === 'inicio' && (
               <div className="flex flex-col items-center pt-8 pb-20 px-4">
                 <h2 className="text-3xl font-medium text-stone-900 mb-2">Hola, {session.user.email.split('@')[0]}</h2>
                 <p className="text-stone-500 mb-8 text-sm">Bienvenido a tu panel clínico de lujo.</p>
                 <button onClick={() => setActiveTab('agenda')} className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-[#F4F7F5] shadow-sm"><CalendarIcon size={16}/> Abrir Agenda</button>
               </div>
            )}

            {/* 2. AGENDA (CALENDARIO COMPLETO) */}
            {!activePatient && activeTab === 'agenda' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-4">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-2xl font-semibold text-stone-900">Agenda Semanal</h2>
                  <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
                    <button onClick={() => setCurrentWeekStart(prev => addDays(prev!, -7))} className="p-2 hover:bg-stone-50 rounded-lg"><ChevronLeft size={18}/></button>
                    <span className="text-sm font-semibold text-stone-700 px-2 capitalize">{currentWeekStart && format(currentWeekStart, "MMMM yyyy", {locale:es})}</span>
                    <button onClick={() => setCurrentWeekStart(prev => addDays(prev!, 7))} className="p-2 hover:bg-stone-50 rounded-lg"><ChevronRight size={18}/></button>
                  </div>
                </div>
                <div className="bg-white border border-stone-100 rounded-[2rem] shadow-sm overflow-x-auto p-4">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="text-center font-bold text-stone-400 text-xs py-2 uppercase tracking-widest">Hora</div>
                      {getWeekDays().map((day, i) => (
                        <div key={i} className={`text-center py-2 rounded-xl ${isSameDay(day, new Date()) ? 'bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B]' : 'text-stone-500'}`}>
                          <div className="text-[10px] uppercase font-bold tracking-widest">{format(day, 'EEE', {locale:es})}</div>
                          <div className="text-xl font-semibold">{format(day, 'd')}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 gap-2 min-h-[70px]">
                          <div className="text-center text-xs font-semibold text-stone-400 py-2 border-r border-stone-100 pr-2">{hour}:00</div>
                          {getWeekDays().map((day, i) => {
                            const apps = activeAppointments.filter(a => { const d = new Date(a.start_time); return isSameDay(d, day) && d.getHours() === hour; });
                            return (
                              <div key={i} className="relative bg-stone-50/50 border border-stone-100 rounded-xl p-1 hover:bg-stone-100 transition-colors group cursor-pointer" onClick={() => { setAdminAppt({ ...adminAppt, date: format(day, 'yyyy-MM-dd'), time: `${hour.toString().padStart(2,'0')}:00` }); setShowApptModal(true); }}>
                                {apps.map(app => (
                                  <div key={app.id} onClick={e=>{e.stopPropagation(); setApptActionModal(app);}} className={`absolute inset-1 rounded-lg p-2 text-xs border cursor-pointer hover:shadow-md transition-all z-10 overflow-hidden ${app.patient_name.startsWith('[BLOQUEO]') ? 'bg-stone-200 border-stone-300 text-stone-600' : 'bg-[#F4F7F5] border-[#E4ECE7] text-[#2C4A3B]'}`}>
                                    <div className="font-bold truncate">{app.patient_name.replace('[BLOQUEO] ', '')}</div>
                                    <div className="text-[10px] opacity-80 truncate">{getProfName(app.professional_id)}</div>
                                  </div>
                                ))}
                                <div className="hidden group-hover:flex absolute inset-0 items-center justify-center opacity-30"><Plus size={20}/></div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. PACIENTES LISTA */}
            {!activePatient && activeTab === 'pacientes' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Directorio de Pacientes</h2>
                <div className="flex gap-4 mb-6">
                  <input type="text" placeholder="Buscar por nombre o RUT..." className="w-full max-w-md border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-[#5F8575]/20 outline-none" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                </div>
                <div className="bg-white border border-stone-100 rounded-[2rem] shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-[#F9F8F6] border-b border-stone-100 text-stone-400 text-[11px] uppercase tracking-wider font-bold">
                      <tr><th className="px-6 py-5">Paciente</th><th className="px-6 py-5">Contacto</th><th className="px-6 py-5 text-center">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredPatients.map(p => (
                        <tr key={p.id} className="hover:bg-stone-50/50">
                          <td className="px-6 py-4 font-semibold text-stone-900">{p.name}<div className="text-xs font-normal text-stone-400">{p.rut}</div></td>
                          <td className="px-6 py-4">{p.phone || p.email}</td>
                          <td className="px-6 py-4 text-center"><button onClick={() => openFicha(p)} className="text-[#5F8575] bg-[#F4F7F5] hover:bg-[#E4ECE7] text-xs font-semibold px-4 py-2 rounded-xl transition-colors">Abrir Ficha</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 4. FICHA CLINICA ACTIVA (CON BOTÓN DE CERTIFICADO) */}
            {activePatient && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <button onClick={() => setActivePatient(null)} className="text-stone-400 hover:text-stone-800 flex items-center gap-2 text-sm font-medium mb-2"><ChevronLeft size={16}/> Volver a la lista</button>
                
                <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* Info del Paciente + Botón Certificado */}
                  <div className="w-full md:w-1/3 space-y-4">
                    <div className="h-20 w-20 bg-[#F4F7F5] text-[#2C4A3B] rounded-[1.5rem] flex items-center justify-center font-bold text-3xl border border-[#E4ECE7]">{activePatient.name.charAt(0)}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-stone-900">{activePatient.name}</h2>
                      <p className="text-stone-500 font-medium">RUT: {activePatient.rut || 'No registrado'}</p>
                    </div>
                    <div className="pt-4 border-t border-stone-100 space-y-2 text-sm text-stone-600">
                      <p className="flex items-center gap-2"><Phone size={14} className="text-stone-400"/> {activePatient.phone}</p>
                      <p className="flex items-center gap-2"><Mail size={14} className="text-stone-400"/> {activePatient.email || 'Sin correo'}</p>
                    </div>
                    
                    {/* BOTÓN NUEVO: GENERAR CERTIFICADO */}
                    <button onClick={() => { setCertPrompt(''); setCertContent(''); setShowCertModal(true); }} className="mt-6 w-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-[#2C4A3B] hover:border-stone-300 transition-all py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
                      <FileText size={16} /> Redactar Certificado
                    </button>

                  </div>
                  
                  {/* Evolución Actual */}
                  <div className="w-full md:w-2/3 bg-[#F9F8F6] p-6 rounded-[1.5rem] border border-stone-100">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Evolución Sesión Actual</h3>
                    <div className="space-y-4">
                      {isListening && <div className="text-xs text-red-500 animate-pulse font-semibold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> Escuchando...</div>}
                      {isAnalyzing && <div className="text-xs text-[#5F8575] animate-pulse font-semibold flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> IA Estructurando notas...</div>}
                      
                      <div className="relative">
                        <textarea placeholder="Dicta o escribe el resumen de la sesión de hoy..." className="w-full h-32 border border-stone-200 rounded-xl p-4 text-sm bg-white focus:ring-2 focus:ring-[#5F8575]/20 outline-none resize-none" value={transcript || noteDesarrollo} onChange={e => setNoteDesarrollo(e.target.value)} />
                        <button type="button" onClick={toggleListening} className={`absolute bottom-3 right-3 p-3 rounded-xl shadow-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2C4A3B] text-white hover:bg-[#233b2f]'}`}>
                          <Mic size={18} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Motivo de Consulta (Opcional)" className="w-full border border-stone-200 rounded-xl p-3 text-sm bg-white" value={noteMotivo} onChange={e => setNoteMotivo(e.target.value)} />
                        <input type="text" placeholder="Plan a seguir (Opcional)" className="w-full border border-stone-200 rounded-xl p-3 text-sm bg-white" value={notePlan} onChange={e => setNotePlan(e.target.value)} />
                      </div>
                      <button onClick={handleSaveNote} className="w-full bg-[#5F8575] hover:bg-[#4A6B5D] text-white font-medium py-3 rounded-xl flex justify-center gap-2"><Save size={18}/> Firmar y Guardar Evolución</button>
                    </div>
                  </div>
                </div>

                {/* Historial de Notas */}
                <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-6">Historial Clínico</h3>
                  {patientNotes.length === 0 ? <p className="text-stone-400 text-sm">Sin registros previos.</p> : (
                    <div className="space-y-4">
                      {patientNotes.map(note => (
                        <div key={note.id} className="p-4 border border-stone-100 rounded-2xl bg-stone-50/50">
                          <p className="text-xs font-bold text-[#5F8575] mb-2">{format(new Date(note.created_at), 'dd MMM yyyy, HH:mm', {locale:es})}</p>
                          <p className="text-sm text-stone-700 whitespace-pre-wrap">{note.notes}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-4 text-right">Firmado por: {note.author_email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 5. TERAPIAS */}
            {!activePatient && activeTab === 'terapias' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900">Gestión de Terapias</h2>
                <div className="bg-white border border-stone-100 p-6 rounded-[2rem] shadow-sm">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Nuevo Servicio</h3>
                  <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50" value={newProfId} onChange={e=>setNewProfId(e.target.value)} required><option value="">Profesional...</option>{visibleProfessionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="text" placeholder="Nombre (Ej: Terapia Pareja)" className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50 md:col-span-2" value={newName} onChange={e=>setNewName(e.target.value)} required/>
                    <input type="number" placeholder="Valor $" className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50" value={newPrice} onChange={e=>setNewPrice(e.target.value)} required/>
                    <button type="submit" className="md:col-span-4 bg-[#2C4A3B] text-white py-3 rounded-xl font-medium flex justify-center"><Plus size={18}/></button>
                  </form>
                </div>
                <div className="bg-white border border-stone-100 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-[#F9F8F6] border-b text-[11px] uppercase font-bold text-stone-400">
                      <tr><th className="px-6 py-4">Servicio</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4 text-center">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {visibleServices.map(s => <tr key={s.id}>
                        <td className="px-6 py-4 font-semibold text-stone-800">{s.name} <span className="block text-xs font-normal text-stone-400">{getProfName(s.professional_id)}</span></td>
                        <td className="px-6 py-4 font-bold text-[#5F8575]">${s.price.toLocaleString('es-CL')}</td>
                        <td className="px-6 py-4 text-center"><button onClick={()=>handleDeleteService(s.id)} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold">Eliminar</button></td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 6. EQUIPO */}
            {!activePatient && activeTab === 'equipo' && userRole === 'admin' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900">Equipo Clínico</h2>
                <div className="bg-white border border-stone-100 p-6 rounded-[2rem] shadow-sm">
                  <form onSubmit={handleCreateProf} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Nombre Dr/a" className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50" value={newProfName} onChange={e=>setNewProfName(e.target.value)} required/>
                    <input type="email" placeholder="Correo" className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50" value={newProfEmail} onChange={e=>setNewProfEmail(e.target.value)} required/>
                    <select className="border border-stone-200 rounded-xl p-3 text-sm bg-stone-50" value={newProfBoxId} onChange={e=>setNewProfBoxId(e.target.value)}><option value="">Sin Box Fijo</option>{visibleBoxes.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    <button type="submit" className="bg-[#2C4A3B] text-white py-3 rounded-xl font-medium"><Plus size={18} className="mx-auto"/></button>
                  </form>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visibleProfessionals.map(p => (
                    <div key={p.id} className="bg-white border border-stone-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-[#F4F7F5] rounded-full text-[#2C4A3B] font-bold flex items-center justify-center text-xl">{p.name.charAt(0)}</div>
                      <div><h4 className="font-semibold">{p.name}</h4><p className="text-xs text-stone-400">{p.email}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 7. FINANZAS */}
            {!activePatient && activeTab === 'finanzas' && userRole === 'admin' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900">Finanzas del Mes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#2C4A3B] text-white rounded-[2rem] p-8 shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Ingreso Bruto</p>
                    <h3 className="text-3xl font-bold">${totalIncome.toLocaleString('es-CL')}</h3>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Margen Centro</p>
                    <h3 className="text-3xl font-bold text-[#5F8575]">${gananciaCentro.toLocaleString('es-CL')}</h3>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Pago Terapeutas</p>
                    <h3 className="text-3xl font-bold text-stone-800">${gananciaProfesionales.toLocaleString('es-CL')}</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. RESEÑAS */}
            {!activePatient && activeTab === 'resenas' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900">Feedback Pacientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visibleReviews.map(r => (
                    <div key={r.id} className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
                      <div className="flex gap-1 mb-3">{[...Array(5)].map((_,i)=><Star key={i} size={14} className={i<r.rating?"text-amber-400 fill-amber-400":"text-stone-200"}/>)}</div>
                      <p className="text-sm text-stone-600 italic">"{r.comment}"</p>
                      <p className="text-xs text-stone-400 mt-4 font-semibold">{r.patient_name} a Dr/a. {getProfName(r.professional_id)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </main>
        </div>
        
        {/* MODAL CITA SIMPLE */}
        <AnimatePresence>
          {showApptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-xl relative">
                <h3 className="text-xl font-bold mb-6 text-stone-900">Agendar Cita</h3>
                <form onSubmit={handleAdminSchedule} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Nombre Paciente" required className="border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.patient_name} onChange={e=>setAdminAppt({...adminAppt, patient_name: e.target.value})} />
                    <input type="text" placeholder="RUT" required className="border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.patient_rut} onChange={e=>setAdminAppt({...adminAppt, patient_rut: e.target.value})} />
                  </div>
                  <select required className="w-full border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.service_id} onChange={e=>setAdminAppt({...adminAppt, service_id: e.target.value})}><option value="">Servicio...</option>{visibleServices.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  {userRole === 'admin' && <select required className="w-full border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.professional_id} onChange={e=>setAdminAppt({...adminAppt, professional_id: e.target.value})}><option value="">Profesional...</option>{visibleProfessionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" required className="border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.date} onChange={e=>setAdminAppt({...adminAppt, date: e.target.value})} />
                    <input type="time" required className="border p-3 rounded-xl bg-stone-50 text-sm" value={adminAppt.time} onChange={e=>setAdminAppt({...adminAppt, time: e.target.value})} />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={()=>setShowApptModal(false)} className="w-1/2 py-3 rounded-xl font-semibold text-stone-500 hover:bg-stone-50">Cancelar</button>
                    <button type="submit" disabled={loading} className="w-1/2 bg-[#2C4A3B] text-white py-3 rounded-xl font-semibold">{loading?'...':'Guardar'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL CERTIFICADOS (IA) */}
        <AnimatePresence>
          {showCertModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setShowCertModal(false)} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"><X size={18} /></button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-[#F4F7F5] text-[#2C4A3B] rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Certificado Médico / Psicológico</h3>
                    <p className="text-xs text-stone-500">Asistente de Redacción Legal IA</p>
                  </div>
                </div>

                {!certContent ? (
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Instrucciones para la IA</label>
                    <textarea 
                      placeholder="Ej: Emitir certificado para justificar inasistencia laboral el día de hoy por cuadro de ansiedad aguda. Recomendar contención familiar." 
                      className="w-full h-32 border border-stone-200 rounded-xl p-4 text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#5F8575]/20 outline-none resize-none"
                      value={certPrompt} onChange={e => setCertPrompt(e.target.value)}
                    />
                    <button onClick={handleGenerateCertAI} disabled={isGeneratingCert || !certPrompt.trim()} className="w-full bg-[#2C4A3B] text-white font-medium py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-[#233b2f] transition-all disabled:opacity-70">
                      {isGeneratingCert ? <Loader2 size={18} className="animate-spin" /> : 'Generar Certificado Formal'}
                    </button>
                    <p className="text-[10px] text-stone-400 text-center px-4">La IA estructurará el texto en un formato legal adecuado para Chile, bloqueando la emisión de días de reposo si eres psicólogo.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-stone-50 border border-stone-200 p-6 rounded-2xl">
                      <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-serif">{certContent}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => { setCertPrompt(''); setCertContent(''); }} className="w-1/3 py-3 rounded-xl font-semibold text-stone-500 hover:bg-stone-50 border border-stone-200 text-sm transition-all">Redactar otro</button>
                      <button onClick={() => { navigator.clipboard.writeText(certContent); showToast('Copiado al portapapeles', 'success'); }} className="w-2/3 bg-[#5F8575] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4A6B5D] transition-all text-sm shadow-sm">
                        <Copy size={16} /> Copiar Documento
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // ==========================================
  // LOGIN (Mantenido intacto)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm bg-white rounded-[2rem] p-10 shadow-sm border border-stone-100 text-center">
        <ShieldCheck size={40} className="mx-auto text-[#2C4A3B] mb-4" />
        <h1 className="text-2xl font-bold mb-6 text-stone-900">Acceso Clínico</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" required placeholder="Correo" className="w-full border p-3.5 rounded-xl bg-stone-50 text-sm" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" required placeholder="Contraseña" className="w-full border p-3.5 rounded-xl bg-stone-50 text-sm" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl">Ingresar</button>
        </form>
      </motion.div>
    </div>
  );
}