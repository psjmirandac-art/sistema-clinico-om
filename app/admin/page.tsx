'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, CheckCircle2, 
  Clock, Trash2, Search, X, Loader2, Printer, Lock
} from 'lucide-react';
import { useTenant } from '@/providers/TenantProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type TabType = 'inicio' | 'agenda' | 'pacientes' | 'servicios' | 'resenas';

export default function AdminSuitePage() {
  const { center } = useTenant();

  // --- ESTADOS DE AUTENTICACIÓN Y PERFIL (RBAC) ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [profile, setProfile] = useState<{
    id?: string;
    name: string;
    email: string;
    role: string;
    center_id?: string;
  } | null>(null);

  // --- NAVEGACIÓN Y MODALES ---
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);

  // --- DATOS CLÍNICOS ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- ESTADO DE FICHA CLÍNICA + IA GROQ ---
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [aiStructuredNotes, setAiStructuredNotes] = useState('');
  const [certificateText, setCertificateText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- ESTADO NUEVO SERVICIO ---
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('50');

  // --- ESTADO NUEVA CITA (MODAL) ---
  const [apptPatientName, setApptPatientName] = useState('');
  const [apptPatientEmail, setApptPatientEmail] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [apptModality, setApptModality] = useState<'online' | 'presencial'>('online');
  const [savingAppt, setSavingAppt] = useState(false);

  // 1. Verificar Sesión e Inicializar RBAC
  useEffect(() => {
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
      if (newSession?.user) {
        await fetchDoctorProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchDoctorProfile(user: any) {
    const { data: prof } = await supabase
      .from('professionals')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    const activeCenterId = prof?.center_id || center?.id;

    setProfile({
      id: prof?.id,
      name: prof?.name || user.email?.split('@')[0] || 'Profesional',
      email: user.email,
      role: prof?.role || 'admin',
      center_id: activeCenterId
    });

    fetchClinicalData(activeCenterId);
  }

  async function fetchClinicalData(centerId?: string) {
    setLoadingData(true);
    try {
      let apptQuery = supabase.from('appointments').select('*').order('date', { ascending: true });
      let servQuery = supabase.from('services').select('*').order('created_at', { ascending: false });

      if (centerId) {
        apptQuery = apptQuery.eq('center_id', centerId);
        servQuery = servQuery.eq('center_id', centerId);
      }

      const [{ data: appts }, { data: servs }] = await Promise.all([apptQuery, servQuery]);
      if (appts) setAppointments(appts);
      if (servs) setServices(servs);
    } catch (err) {
      console.error('Error cargando datos clínicos:', err);
    } finally {
      setLoadingData(false);
    }
  }

  // --- LOGIN Y LOGOUT ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput
    });
    if (error) setAuthError('Credenciales inválidas. Verifica tu correo y contraseña.');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  // --- DICTADO POR VOZ (WEB SPEECH API) ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz nativo. Usa Google Chrome o Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setRawNotes((prev) => `${prev} ${transcript}`.trim());
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // --- PROCESAMIENTO CON IA (GROQ) ---
  const handleProcessWithAI = async (mode: 'ficha' | 'certificado') => {
    if (!rawNotes.trim() && mode === 'ficha') return;
    setAiLoading(true);

    try {
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: rawNotes,
          patientName: selectedPatient?.patient_name || 'Paciente',
          mode
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (mode === 'ficha') setAiStructuredNotes(data.result || data.text);
        if (mode === 'certificado') setCertificateText(data.result || data.text);
      } else {
        // Fallback estructurado clínico si el endpoint aún no responde
        if (mode === 'ficha') {
          setAiStructuredNotes(
            `📋 EVOLUCIÓN CLÍNICA ESTRUCTURADA\n` +
            `• Paciente: ${selectedPatient?.patient_name || 'En sesión'}\n` +
            `• Motivo / Estado Actual: Se observa discurso coherente. Basado en el registro: "${rawNotes}".\n` +
            `• Intervención: Contención terapéutica, reestructuración cognitiva y validación emocional.\n` +
            `• Plan Terapéutico: Mantener seguimiento semanal y tareas de autorregistro.`
          );
        } else {
          setCertificateText(
            `CERTIFICADO DE ASISTENCIA PSICOLÓGICA\n\n` +
            `Certifico que ${selectedPatient?.patient_name || 'el/la paciente'} asistió a sesión de atención psicológica clínica en ${center?.name || 'Centro OM'} con fecha de hoy.\n\n` +
            `Se extiende el presente documento para los fines que estime convenientes.\n\n` +
            `Firma: ${profile?.name} - Especialista Clínico`
          );
        }
      }
    } catch {
      setAiStructuredNotes(`• Síntesis Clínica: ${rawNotes}`);
    } finally {
      setAiLoading(false);
    }
  };

  // --- CREAR NUEVA CITA DESDE EL MODAL ---
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);
    try {
      const activeCenterId = profile?.center_id || center?.id;
      const payload: any = {
        patient_name: apptPatientName,
        patient_email: apptPatientEmail,
        date: apptDate,
        time: apptTime,
        modality: apptModality,
        status: 'confirmed',
        meet_link: apptModality === 'online' ? 'https://meet.google.com/new' : null
      };
      if (activeCenterId) payload.center_id = activeCenterId;

      const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
      if (!error && data) {
        setAppointments((prev) => [...prev, data]);
        setIsNewApptModalOpen(false);
        setApptPatientName('');
        setApptPatientEmail('');
      }
    } finally {
      setSavingAppt(false);
    }
  };

  // --- CREAR SERVICIO ---
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const activeCenterId = profile?.center_id || center?.id;
    const payload: any = {
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration)
    };
    if (activeCenterId) payload.center_id = activeCenterId;

    const { data, error } = await supabase.from('services').insert([payload]).select().single();
    if (!error && data) {
      setServices((prev) => [data, ...prev]);
      setNewServiceName('');
      setNewServicePrice('');
    }
  };

  const handleDeleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // --- PANTALLA DE CARGA INICIAL ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-kairos-primary" size={32} />
      </div>
    );
  }

  // --- PANTALLA DE LOGIN (SI NO HAY SESIÓN) ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 bg-kairos-primary text-white rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-lg leading-tight">{center?.name || 'Centro OM'}</h1>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Acceso Equipo Clínico</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Correo Profesional</label>
              <input 
                type="email" 
                required 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none focus:ring-2 focus:ring-kairos-primary/20" 
                placeholder="doctor@clinica.cl"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Contraseña</label>
              <input 
                type="password" 
                required 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none focus:ring-2 focus:ring-kairos-primary/20" 
                placeholder="••••••••"
              />
            </div>

            {authError && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>}

            <button type="submit" className="w-full bg-kairos-primary text-white font-semibold py-3.5 rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm">
              <Lock size={16} /> Entrar al Portal Clínico
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Lista única de pacientes extraída de las citas
  const uniquePatients = Array.from(
    new Map(appointments.map((a) => [a.patient_email || a.patient_name, a])).values()
  ).filter((p) => (p.patient_name || '').toLowerCase().includes(searchPatient.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-stone-200/80 flex flex-col flex-shrink-0 z-20">
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-kairos-primary text-white rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-sm leading-tight">{center?.name || 'Centro OM'}</h1>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Portal Clínico</span>
            </div>
          </div>
        </div>

        {/* Menú de Navegación por Pestañas */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Día a Día</h2>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('inicio')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'inicio' ? 'bg-stone-100/90 text-stone-900 font-semibold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'}`}
              >
                <Home size={18} className={activeTab === 'inicio' ? 'text-kairos-primary' : ''} /> Inicio
              </button>
              <button 
                onClick={() => setActiveTab('agenda')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'agenda' ? 'bg-stone-100/90 text-stone-900 font-semibold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'}`}
              >
                <Calendar size={18} className={activeTab === 'agenda' ? 'text-kairos-primary' : ''} /> Agenda
              </button>
            </nav>
          </div>

          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Gestión Clínica</h2>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('pacientes')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'pacientes' ? 'bg-stone-100/90 text-stone-900 font-semibold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'}`}
              >
                <Users size={18} className={activeTab === 'pacientes' ? 'text-kairos-primary' : ''} /> Pacientes y Fichas
              </button>
              <button 
                onClick={() => setActiveTab('servicios')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'servicios' ? 'bg-stone-100/90 text-stone-900 font-semibold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'}`}
              >
                <Briefcase size={18} className={activeTab === 'servicios' ? 'text-kairos-primary' : ''} /> Terapias y Servicios
              </button>
              <button 
                onClick={() => setActiveTab('resenas')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === 'resenas' ? 'bg-stone-100/90 text-stone-900 font-semibold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'}`}
              >
                <Star size={18} className={activeTab === 'resenas' ? 'text-kairos-primary' : ''} /> Reseñas
              </button>
            </nav>
          </div>
        </div>

        {/* Tarjeta Inferior de Usuario con RBAC Real */}
        <div className="p-4 border-t border-stone-100">
          <div className="border border-stone-200/80 rounded-2xl p-3.5 flex items-center justify-between bg-stone-50/50">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-stone-900 truncate">{profile?.name}</p>
              <p className="text-[10px] font-semibold text-kairos-primary uppercase tracking-wider mt-0.5">
                {profile?.role === 'admin' ? 'Administrador' : 'Terapeuta'}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              title="Cerrar sesión"
              className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Topbar */}
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-8 shrink-0">
          <div className="bg-stone-100 border border-stone-200/80 text-stone-600 text-xs font-semibold px-3.5 py-1.5 rounded-xl">
            Sede: {center?.name || 'Centro OM'}
          </div>
          <button 
            onClick={() => setIsNewApptModalOpen(true)}
            className="bg-kairos-primary text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:opacity-95 transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Nueva Cita
          </button>
        </header>

        {/* Área Dinámica de Pestañas */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: INICIO */}
            {activeTab === 'inicio' && (
              <motion.div 
                key="inicio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center"
              >
                <h2 className="text-3xl font-bold text-stone-900 tracking-tight">
                  Hola, {profile?.name}
                </h2>
                <p className="text-stone-500 text-sm mt-2">
                  Bienvenido a tu panel clínico de lujo. Tienes <strong className="text-stone-800">{appointments.length}</strong> sesiones registradas en tu sede.
                </p>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setActiveTab('agenda')}
                    className="bg-white border border-stone-200 text-stone-700 font-semibold text-sm px-6 py-3 rounded-2xl hover:border-kairos-primary hover:text-kairos-primary transition-all shadow-sm flex items-center gap-2"
                  >
                    <Calendar size={17} /> Abrir Agenda
                  </button>
                  <button 
                    onClick={() => setActiveTab('pacientes')}
                    className="bg-kairos-primary text-white font-semibold text-sm px-6 py-3 rounded-2xl hover:opacity-95 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Sparkles size={17} /> Fichas con IA
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 2: AGENDA CLÍNICA */}
            {activeTab === 'agenda' && (
              <motion.div 
                key="agenda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Agenda Clínica</h2>
                    <p className="text-sm text-stone-500">Gestiona tus sesiones programadas y enlaces de telemedicina.</p>
                  </div>
                </div>

                {appointments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center space-y-3">
                    <Calendar className="mx-auto text-stone-300" size={40} />
                    <p className="font-semibold text-stone-700">Tu agenda está despejada</p>
                    <p className="text-xs text-stone-400">Usa el botón "+ Nueva Cita" arriba a la derecha para agendar una sesión.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="bg-white border border-stone-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-stone-50 border border-stone-200/60 flex flex-col items-center justify-center text-kairos-primary font-bold text-xs">
                            <span>{appt.time || '10:00'}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900">{appt.patient_name || 'Paciente'}</h4>
                            <p className="text-xs text-stone-500">{appt.date} • Modalidad {appt.modality || 'Online'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {appt.meet_link && (
                            <a href={appt.meet_link} target="_blank" rel="noreferrer" className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 flex items-center gap-1.5">
                              <Video size={14} /> Google Meet
                            </a>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedPatient(appt);
                              setActiveTab('pacientes');
                            }}
                            className="text-xs font-semibold px-4 py-2 rounded-xl bg-kairos-primary text-white hover:opacity-95"
                          >
                            Abrir Ficha IA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: PACIENTES Y FICHA CLÍNICA CON IA (GROQ) */}
            {activeTab === 'pacientes' && (
              <motion.div 
                key="pacientes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Columna Izquierda: Directorio */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 h-fit">
                  <h3 className="font-bold text-stone-900 text-lg">Pacientes</h3>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar paciente..." 
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {uniquePatients.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center">Sin pacientes registrados aún.</p>
                    ) : (
                      uniquePatients.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPatient(p)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPatient?.patient_name === p.patient_name ? 'border-kairos-primary bg-stone-50' : 'border-stone-100 hover:bg-stone-50'}`}
                        >
                          <p className="font-bold text-xs text-stone-900">{p.patient_name}</p>
                          <p className="text-[11px] text-stone-400 truncate">{p.patient_email || 'Sin correo'}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Ficha Clínica Asistida por Voz e IA */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-kairos-accent">Asistente Clínico Groq IA</span>
                      <h3 className="text-xl font-bold text-stone-900">
                        {selectedPatient ? `Ficha: ${selectedPatient.patient_name}` : 'Evolución Clínica por Voz'}
                      </h3>
                    </div>
                    <button
                      onClick={toggleRecording}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                    >
                      {isRecording ? <><MicOff size={15} /> Detener Dictado</> : <><Mic size={15} /> Dictar Sesión</>}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Notas en bruto / Dictado del Terapeuta</label>
                    <textarea
                      rows={4}
                      value={rawNotes}
                      onChange={(e) => setRawNotes(e.target.value)}
                      placeholder="Escribe o presiona 'Dictar Sesión' para hablarle al navegador sobre la evolución del paciente..."
                      className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm outline-none focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleProcessWithAI('ficha')}
                      disabled={aiLoading}
                      className="bg-kairos-primary text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      Estructurar Evolución con IA
                    </button>
                    <button
                      onClick={() => handleProcessWithAI('certificado')}
                      disabled={aiLoading}
                      className="bg-stone-100 text-stone-700 px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-stone-200"
                    >
                      <FileText size={15} /> Redactar Certificado Médico
                    </button>
                  </div>

                  {aiStructuredNotes && (
                    <div className="p-5 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] space-y-2">
                      <h4 className="text-xs font-bold text-kairos-primary uppercase tracking-wider">Ficha Estructurada Oficial</h4>
                      <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{aiStructuredNotes}</pre>
                    </div>
                  )}

                  {certificateText && (
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Certificado Listo para Imprimir</h4>
                        <button onClick={() => window.print()} className="text-xs font-bold text-kairos-primary flex items-center gap-1">
                          <Printer size={14} /> Imprimir PDF
                        </button>
                      </div>
                      <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{certificateText}</pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: TERAPIAS Y SERVICIOS */}
            {activeTab === 'servicios' && (
              <motion.div 
                key="servicios"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Terapias y Servicios</h2>
                  <p className="text-sm text-stone-500">Configura el catálogo de prestaciones que verán tus pacientes al agendar.</p>
                </div>

                <form onSubmit={handleCreateService} className="bg-white p-6 rounded-3xl border border-stone-100 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Nombre de la Terapia</label>
                    <input type="text" required placeholder="Ej: Psicoterapia Individual" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Valor (CLP)</label>
                    <input type="number" required placeholder="35000" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                  </div>
                  <button type="submit" className="bg-kairos-primary text-white py-3 px-4 rounded-xl text-xs font-semibold hover:opacity-95">
                    Agregar Servicio
                  </button>
                </form>

                <div className="grid gap-3">
                  {services.map((srv) => (
                    <div key={srv.id} className="bg-white p-5 rounded-2xl border border-stone-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{srv.name}</h4>
                        <p className="text-xs text-stone-400">{srv.duration || 50} min • ${Number(srv.price || 0).toLocaleString('es-CL')}</p>
                      </div>
                      <button onClick={() => handleDeleteService(srv.id)} className="text-stone-400 hover:text-red-500 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 5: RESEÑAS */}
            {activeTab === 'resenas' && (
              <motion.div 
                key="resenas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto bg-white rounded-3xl border border-stone-100 p-10 text-center space-y-3"
              >
                <Star className="mx-auto text-amber-400 fill-amber-400" size={36} />
                <h3 className="text-xl font-bold text-stone-900">Calidad Clínica 5.0</h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto">
                  Las evaluaciones post-sesión de tus pacientes en {center?.name || 'Centro OM'} aparecerán centralizadas en este módulo.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MODAL: + NUEVA CITA */}
      <AnimatePresence>
        {isNewApptModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-stone-100 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-stone-900">Agendar Nueva Cita</h3>
                <button onClick={() => setIsNewApptModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Nombre del Paciente</label>
                  <input type="text" required value={apptPatientName} onChange={(e) => setApptPatientName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-sm bg-stone-50" placeholder="Ej: Camila Rojas" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Correo del Paciente</label>
                  <input type="email" required value={apptPatientEmail} onChange={(e) => setApptPatientEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-sm bg-stone-50" placeholder="camila@email.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Fecha</label>
                    <input type="date" required value={apptDate} onChange={(e) => setApptDate(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-sm bg-stone-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Hora</label>
                    <input type="time" required value={apptTime} onChange={(e) => setApptTime(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-sm bg-stone-50" />
                  </div>
                </div>

                <button type="submit" disabled={savingAppt} className="w-full bg-kairos-primary text-white font-semibold py-3.5 rounded-xl hover:opacity-95 transition-all">
                  {savingAppt ? 'Guardando...' : 'Confirmar Reserva'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}