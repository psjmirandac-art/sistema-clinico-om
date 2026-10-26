'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Obtenemos el ID del centro directamente desde las variables de entorno
const ENV_CENTER_ID = process.env.NEXT_PUBLIC_CENTER_ID || '';

export default function AdminPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('inicio'); 
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // El centro queda fijo y aislado según la variable de entorno
  const [adminCenterId, setAdminCenterId] = useState<string>(ENV_CENTER_ID);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2024-01-01T00:00:00'));
  
  const [showApptModal, setShowApptModal] = useState(false);
  const [adminAppt, setAdminAppt] = useState({ patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '' });

  // Estados Ficha Clínica
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [noteMotivo, setNoteMotivo] = useState('');
  const [noteDesarrollo, setNoteDesarrollo] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // --- MOTOR DE INTELIGENCIA ARTIFICIAL ---
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      processAI(transcript);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tu navegador no soporta voz. Usa Chrome o Edge.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CL';

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setTranscript('');
    }
  };

  const processAI = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });
      const data = await res.json();
      if (data.error) {
        alert("Error IA: " + data.error);
      } else {
        if (data.motivo) setNoteMotivo(data.motivo);
        if (data.desarrollo) setNoteDesarrollo(data.desarrollo);
        if (data.plan) setNotePlan(data.plan);
      }
    } catch (error) {
      alert("Error conectando con la IA.");
    }
    setIsAnalyzing(false);
    setTranscript('');
  };
  // ------------------------------------------

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newProfId, setNewProfId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProfName, setNewProfName] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');
  const [newProfPassword, setNewProfPassword] = useState('');
  const [newProfBoxId, setNewProfBoxId] = useState('');
  const [isCreatingProf, setIsCreatingProf] = useState(false);

  const [wsTitle, setWsTitle] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsPrice, setWsPrice] = useState('');
  const [wsCapacity, setWsCapacity] = useState('10');
  const [wsProfId, setWsProfId] = useState('');
  const [wsBoxId, setWsBoxId] = useState('');
  const [wsDate, setWsDate] = useState('');
  const [wsTime, setWsTime] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  function getStartOfWeek(date: Date) {
    const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff); d.setHours(0, 0, 0, 0); return d;
  }

  useEffect(() => {
    setCurrentWeekStart(getStartOfWeek(new Date()));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadData();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData() {
    const [profs, servs, cents, boxs, apps, ws, regs] = await Promise.all([
      supabase.from('professionals').select('*').order('name'),
      supabase.from('services').select('*').order('created_at', { ascending: false }),
      supabase.from('centers').select('*').order('name'),
      supabase.from('boxes').select('*'),
      supabase.from('appointments').select('*').order('start_time', { ascending: true }),
      supabase.from('workshops').select('*').order('start_time', { ascending: true }),
      supabase.from('workshop_registrations').select('*')
    ]);

    const { data: revsData, error: revsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (profs.data) setProfessionals(profs.data);
    if (servs.data) setServices(servs.data);
    if (cents.data) {
      setCenters(cents.data);
      if (!ENV_CENTER_ID && cents.data.length > 0) {
        setAdminCenterId(cents.data[0].id);
      }
    }
    if (boxs.data) setBoxes(boxs.data);
    if (apps.data) setAppointments(apps.data);
    if (ws.data) setWorkshops(ws.data);
    if (regs.data) setRegistrations(regs.data);
    if (!revsError && revsData) setReviews(revsData);
  }

  const visibleProfessionals = professionals.filter(p => p.center_id === adminCenterId);
  const visibleAppointments = appointments.filter(a => a.center_id === adminCenterId);
  const visibleServices = services.filter(s => visibleProfessionals.some(vp => vp.id === s.professional_id));
  const visibleBoxes = boxes.filter(b => b.center_id === adminCenterId);
  const visibleWorkshops = workshops.filter(w => w.center_id === adminCenterId);
  
  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconocido';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Terapia';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;
  const getBoxName = (id: string) => boxes.find(b => b.id === id)?.name || 'Box No Asignado';

  const currentMonthAppointments = visibleAppointments.filter(app => {
    const appDate = new Date(app.start_time); const now = new Date();
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
  });
  const totalIncome = currentMonthAppointments.reduce((sum, app) => sum + getServicePrice(app.service_id), 0);
  const averageTicket = currentMonthAppointments.length > 0 ? Math.round(totalIncome / currentMonthAppointments.length) : 0;

  const prevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const nextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };
  const getWeekDays = () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d; });
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const handleAdminSchedule = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const startDateTime = new Date(`${adminAppt.date}T${adminAppt.time}:00-03:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
    
    // 1. Guardar en Supabase
    const { error } = await supabase.from('appointments').insert([{
      center_id: adminCenterId, box_id: adminAppt.box_id, professional_id: adminAppt.professional_id, service_id: adminAppt.service_id,
      patient_name: adminAppt.patient_name, patient_rut: adminAppt.patient_rut, patient_email: adminAppt.patient_email, patient_phone: adminAppt.patient_phone,
      start_time: startDateTime, end_time: endDateTime, consent_accepted: true 
    }]);

    if (!error) {
      // 2. Enviar correo automático mediante Resend si el paciente tiene email
      if (adminAppt.patient_email) {
        const profName = professionals.find(p => p.id === adminAppt.professional_id)?.name || 'Profesional';
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_email: adminAppt.patient_email,
              patient_name: adminAppt.patient_name,
              professional_name: profName,
              start_time: startDateTime,
            }),
          });
        } catch (mailError) {
          console.error('Error enviando el correo:', mailError);
        }
      }

      setShowApptModal(false); 
      setAdminAppt({ patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '' });
      loadData(); 
      alert('Cita agendada y correo de confirmación enviado exitosamente.');
    } else { 
      alert('Error al agendar cita.'); 
    }
    setLoading(false);
  };

  const handleDeleteAppt = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar y eliminar esta cita de la agenda?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) { loadData(); alert('Cita cancelada correctamente.'); } else { alert('Error al cancelar la cita.'); }
  };

  const openFicha = async (app: any) => {
    setActivePatient(app);
    setActiveTab('agenda');
    const { data } = await supabase.from('clinical_notes').select('*').eq('patient_name', app.patient_name).eq('center_id', adminCenterId).order('created_at', { ascending: false });
    if (data) setPatientNotes(data);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDesarrollo || !activePatient || !adminCenterId) return;
    setSavingNote(true);
    const combinedNote = `MOTIVO DE CONSULTA:\n${noteMotivo || 'No especificado'}\n\nDESARROLLO DE LA SESIÓN:\n${noteDesarrollo}\n\nPLAN E INDICACIONES:\n${notePlan || 'No especificado'}`;
    const { error } = await supabase.from('clinical_notes').insert([{ patient_name: activePatient.patient_name, notes: combinedNote, center_id: adminCenterId, author_email: session?.user?.email }]);
    if (!error) { setNoteMotivo(''); setNoteDesarrollo(''); setNotePlan(''); openFicha(activePatient); }
    setSavingNote(false);
  };

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsCreatingProf(true);

    const tempSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error: authError } = await tempSupabase.auth.signUp({
      email: newProfEmail.toLowerCase(),
      password: newProfPassword,
    });

    if (authError) {
      alert('Error al crear credenciales de acceso: ' + authError.message);
      setIsCreatingProf(false);
      return;
    }

    const { error: dbError } = await supabase.from('professionals').insert([{ 
      name: newProfName, 
      email: newProfEmail.toLowerCase(), 
      center_id: adminCenterId, 
      default_box_id: newProfBoxId || null 
    }]);
    
    if (!dbError) { 
      setNewProfName(''); 
      setNewProfEmail(''); 
      setNewProfPassword('');
      setNewProfBoxId(''); 
      loadData(); 
      alert(`Profesional registrado exitosamente. Su clave temporal es: ${newProfPassword}`);
    } else {
      alert('Error al guardar datos del profesional: ' + dbError.message);
    }
    setIsCreatingProf(false);
  };

  const handleDeleteProfessional = async (id: string) => { if (!confirm('¿Eliminar profesional?')) return; const { error } = await supabase.from('professionals').delete().eq('id', id); if (!error) loadData(); };
  const handleCreateService = async (e: React.FormEvent) => { e.preventDefault(); setIsCreating(true); const { error } = await supabase.from('services').insert([{ name: newName, price: Number(newPrice), professional_id: newProfId }]); if (!error) { setNewName(''); setNewPrice(''); setNewProfId(''); loadData(); } setIsCreating(false); };
  const handleDeleteService = async (id: string) => { if (!confirm('¿Eliminar servicio?')) return; const { error } = await supabase.from('services').delete().eq('id', id); if (!error) loadData(); };

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault(); setIsCreatingWs(true);
    const startDateTime = new Date(`${wsDate}T${wsTime}:00-03:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('workshops').insert([{ center_id: adminCenterId, box_id: wsBoxId, professional_id: wsProfId, title: wsTitle, description: wsDesc, price: Number(wsPrice), max_capacity: Number(wsCapacity), start_time: startDateTime, end_time: endDateTime }]);
    if (!error) { setWsTitle(''); setWsDesc(''); setWsPrice(''); setWsCapacity('10'); setWsProfId(''); setWsBoxId(''); setWsDate(''); setWsTime(''); loadData(); } 
    setIsCreatingWs(false);
  };
  const handleDeleteWorkshop = async (id: string) => { if (!confirm('¿Eliminar taller?')) return; const { error } = await supabase.from('workshops').delete().eq('id', id); if (!error) loadData(); };
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('Credenciales incorrectas'); setLoading(false); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if (session) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
        
        {/* BARRA LATERAL IZQUIERDA */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between sticky top-0 h-screen z-20">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">SC</div>
              <div>
                <h1 className="font-bold text-slate-900 text-base leading-none">Sistema Clínico</h1>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestión Profesional</span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-wider">Hoy</p>
              <button onClick={() => { setActiveTab('inicio'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'inicio' && !activePatient ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                🏠 Inicio
              </button>
              <button onClick={() => { setActiveTab('agenda'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'agenda' && !activePatient ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                📅 Calendario
              </button>

              <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mt-6 mb-2 tracking-wider">Práctica</p>
              <button onClick={() => { setActiveTab('pacientes'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'pacientes' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                👥 Pacientes <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{visibleAppointments.length}</span>
              </button>
              <button onClick={() => { setActiveTab('terapias'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'terapias' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                💼 Terapias y Servicios
              </button>
              <button onClick={() => { setActiveTab('finanzas'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'finanzas' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                💰 Boletas y Pagos
              </button>
              <button onClick={() => { setActiveTab('resenas'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'resenas' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                ⭐ Reseñas
              </button>
              <button onClick={() => { setActiveTab('equipo'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'equipo' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                🏥 Equipo y Boxes
              </button>
              <button onClick={() => { setActiveTab('talleres'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'talleres' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                🏷️ Talleres
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{session.user.email.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Administrador</p>
              </div>
              <button onClick={handleLogout} className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors">Salir</button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* HEADER SUPERIOR */}
          <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <span className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-sm font-bold text-slate-700">
                {centers.find(c => c.id === adminCenterId)?.name || 'Cargando Centro...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowApptModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">+ Nueva Cita</button>
            </div>
          </header>

          {showApptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white">
                  <h2 className="text-xl font-bold text-slate-900">Agendar Nueva Cita</h2>
                  <button onClick={() => setShowApptModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleAdminSchedule} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><h3 className="text-xs font-bold text-slate-400 uppercase">Detalles Médicos</h3></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Profesional</label><select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.professional_id} onChange={e => { const prof = professionals.find(p=>p.id===e.target.value); setAdminAppt({...adminAppt, professional_id: e.target.value, service_id: '', box_id: prof?.default_box_id || ''}); }}><option value="" disabled>Seleccionar...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Servicio</label><select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.service_id} onChange={e => setAdminAppt({...adminAppt, service_id: e.target.value})}><option value="" disabled>Seleccionar...</option>{services.filter(s => s.professional_id === adminAppt.professional_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Box / Sala</label><select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.box_id} onChange={e => setAdminAppt({...adminAppt, box_id: e.target.value})}><option value="" disabled>Seleccionar...</option>{visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label><input type="date" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.date} onChange={e => setAdminAppt({...adminAppt, date: e.target.value})} /></div><div><label className="block text-xs font-semibold text-slate-700 mb-1">Hora</label><input type="time" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.time} onChange={e => setAdminAppt({...adminAppt, time: e.target.value})} /></div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><h3 className="text-xs font-bold text-slate-400 uppercase mt-2">Datos del Paciente</h3></div>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label><input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.patient_name} onChange={e => setAdminAppt({...adminAppt, patient_name: e.target.value})} /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">RUT</label><input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.patient_rut} onChange={e => setAdminAppt({...adminAppt, patient_rut: e.target.value})} /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label><input type="tel" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.patient_phone} onChange={e => setAdminAppt({...adminAppt, patient_phone: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label><input type="email" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={adminAppt.patient_email} onChange={e => setAdminAppt({...adminAppt, patient_email: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setShowApptModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl">Cancelar</button><button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl">{loading ? 'Agendando...' : 'Confirmar Cita'}</button></div>
                </form>
              </div>
            </div>
          )}

          <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
            
            {/* VISTA DE FICHA CLÍNICA ACTIVA */}
            {activePatient && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4"><button onClick={() => {setActivePatient(null); setNoteMotivo(''); setNoteDesarrollo(''); setNotePlan('');}} className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-50">← Volver</button><h2 className="text-2xl font-bold text-slate-900">Ficha Clínica</h2></div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                  <div className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">{activePatient.patient_name.charAt(0).toUpperCase()}</div>
                  <div><h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">{activePatient.patient_name} <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">ACTIVO</span></h3><p className="text-sm text-slate-500 mt-1">RUT: {activePatient.patient_rut} | Tel: {activePatient.patient_phone}</p></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl">
                      <h3 className="font-bold text-slate-800 text-sm">Nueva Evolución con IA</h3>
                      <button type="button" onClick={toggleListening} disabled={isAnalyzing} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isListening ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-900 text-white border border-slate-900'}`}>
                        {isListening ? '⏹ Detener' : isAnalyzing ? '⏳ Procesando...' : '✨ Asistente IA (Dictar)'}
                      </button>
                    </div>

                    {isListening && (
                      <div className="px-6 pt-4"><div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs font-mono h-24 overflow-y-auto">{transcript || 'Escuchando...'}</div></div>
                    )}
                    
                    <form onSubmit={handleSaveNote} className="p-6 flex flex-col gap-4">
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motivo</label><input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={noteMotivo} onChange={(e) => setNoteMotivo(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Desarrollo</label><textarea required className="w-full h-36 border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none" value={noteDesarrollo} onChange={(e) => setNoteDesarrollo(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Plan</label><input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={notePlan} onChange={(e) => setNotePlan(e.target.value)} /></div>
                      <button type="submit" disabled={savingNote || isListening || isAnalyzing} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 shadow-md">🔒 Firmar y Guardar</button>
                    </form>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[700px] overflow-y-auto">
                    <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider">Historial de Sesiones</h3>
                    <div className="space-y-6">
                      {patientNotes.map((note) => (
                        <div key={note.id} className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                            <span>Firmado por {note.author_email}</span>
                            <span className="font-bold text-slate-900">{new Date(note.created_at).toLocaleDateString('es-CL')}</span>
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA INICIO */}
            {!activePatient && activeTab === 'inicio' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Buenas tardes, {session.user.email.split('@')[0]}.</h2>
                  <p className="text-slate-500 text-sm mt-1">Resumen general de tu práctica clínica y rendimiento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pacientes Activos</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{visibleAppointments.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sesiones esta semana</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{currentMonthAppointments.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reseñas Promedio</p>
                    <p className="text-3xl font-black text-amber-500 mt-2">
                      {reviews.length > 0 ? `⭐ ${(reviews.reduce((acc, rev) => acc + (rev.rating || 5), 0) / reviews.length).toFixed(1)}` : 'Sin reseñas'}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos del Mes</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">${totalIncome.toLocaleString('es-CL')}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-900 text-base mb-4">Agenda de hoy y próximas sesiones</h3>
                  <div className="space-y-3">
                    {visibleAppointments.length === 0 ? <p className="text-slate-400 text-sm py-4 text-center">No hay sesiones programadas.</p> :
                      visibleAppointments.slice(0, 5).map(app => (
                        <div key={app.id} onClick={() => openFicha(app)} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center">{app.patient_name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{app.patient_name}</p>
                              <p className="text-xs text-slate-500">{new Date(app.start_time).toLocaleString('es-CL', {dateStyle: 'short', timeStyle: 'short'})} con {getProfName(app.professional_id)}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-full">Ver Ficha →</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA CALENDARIO */}
            {!activePatient && activeTab === 'agenda' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 text-xs font-bold rounded-lg ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cuadrícula</button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-xs font-bold rounded-lg ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Lista</button>
                  </div>
                  <button onClick={() => setShowApptModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Nueva Cita</button>
                </div>

                {viewMode === 'calendar' && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                    <div className="min-w-[900px]">
                      <div className="flex justify-between p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                        <button onClick={prevWeek} className="hover:text-slate-900">← Semana Anterior</button>
                        <span>Semana {currentWeekStart.toLocaleDateString('es-CL')}</span>
                        <button onClick={nextWeek} className="hover:text-slate-900">Semana Siguiente →</button>
                      </div>
                      <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 py-3">
                        <div>Hora</div>
                        {getWeekDays().map(d => <div key={d.toISOString()}>{d.toLocaleDateString('es-CL', {weekday: 'short'})} {d.getDate()}</div>)}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {hours.map(hour => (
                          <div key={hour} className="grid grid-cols-8 min-h-[80px]">
                            <div className="p-2 text-right text-xs font-medium text-slate-400 bg-slate-50/50">{hour}:00</div>
                            {getWeekDays().map(day => {
                              const cellAppts = visibleAppointments.filter(app => {
                                const appD = new Date(app.start_time);
                                return appD.getDate() === day.getDate() && appD.getMonth() === day.getMonth() && appD.getHours() === hour;
                              });

                              const handleCellClick = () => {
                                const year = day.getFullYear();
                                const month = String(day.getMonth() + 1).padStart(2, '0');
                                const d = String(day.getDate()).padStart(2, '0');
                                const h = String(hour).padStart(2, '0');
                                
                                setAdminAppt(prev => ({
                                  ...prev,
                                  date: `${year}-${month}-${d}`,
                                  time: `${h}:00`
                                }));
                                setShowApptModal(true);
                              };

                              return (
                                <div 
                                  key={day.toISOString()} 
                                  onClick={handleCellClick}
                                  className="p-1 border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors relative min-h-[80px]"
                                  title="Hacer clic para agendar en este horario"
                                >
                                  {cellAppts.map(app => (
                                    <div 
                                      key={app.id} 
                                      onClick={(e) => { e.stopPropagation(); openFicha(app); }} 
                                      className="bg-slate-100 border-l-4 border-slate-500 text-slate-900 text-[10px] p-2 rounded-lg cursor-pointer shadow-sm font-bold mb-1 hover:bg-slate-200"
                                    >
                                      {app.patient_name}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {visibleAppointments.map(app => (
                        <div key={app.id} className="p-5 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{app.patient_name}</p>
                            <p className="text-xs text-slate-500">{new Date(app.start_time).toLocaleString('es-CL')} | Box: {getBoxName(app.box_id)}</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => openFicha(app)} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">Ficha</button>
                            <button onClick={() => handleDeleteAppt(app.id)} className="text-red-600 text-xs font-bold">Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA PACIENTES */}
            {!activePatient && activeTab === 'pacientes' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Listado de Pacientes</h2>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {visibleAppointments.map(app => (
                      <div key={app.id} className="p-5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center">{app.patient_name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{app.patient_name}</p>
                            <p className="text-xs text-slate-500">RUT: {app.patient_rut} | Tel: {app.patient_phone}</p>
                          </div>
                        </div>
                        <button onClick={() => openFicha(app)} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl">Ver Expediente</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA FINANZAS Y BOLETAS */}
            {!activePatient && activeTab === 'finanzas' && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Boletas, Pagos y Rendimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Ingresos Brutos</p>
                    <p className="text-3xl font-black text-emerald-600 mt-2">${totalIncome.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Citas Atendidas</p>
                    <p className="text-3xl font-black text-indigo-600 mt-2">{currentMonthAppointments.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase">Ticket Promedio</p>
                    <p className="text-3xl font-black text-slate-800 mt-2">${averageTicket.toLocaleString('es-CL')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Ingresos por Profesional</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visibleProfessionals.map(p => ({name: p.name.split(' ')[0], ingresos: currentMonthAppointments.filter(a => a.professional_id === p.id).reduce((s, a) => s + getServicePrice(a.service_id), 0)}))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip formatter={(v:any) => [`$${v.toLocaleString('es-CL')}`, 'Ingresos']} />
                          <Bar dataKey="ingresos" fill="#10b981" radius={[8,8,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Distribución de Citas</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={visibleProfessionals.map(p => ({name: p.name.split(' ')[0], value: currentMonthAppointments.filter(a => a.professional_id === p.id).length}))} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={5}>
                            {visibleProfessionals.map((_, i) => <Cell key={i} fill={['#10b981', '#4f46e5', '#f59e0b', '#ef4444'][i%4]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA RESEÑAS DINÁMICAS */}
            {!activePatient && activeTab === 'resenas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reseñas y Evaluaciones</h2>
                    <p className="text-slate-500 text-sm mt-1">Valoraciones verificadas dejadas por tus pacientes tras las sesiones.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl font-bold text-sm">
                    {reviews.length > 0 
                      ? `⭐ ${(reviews.reduce((acc, rev) => acc + (rev.rating || 5), 0) / reviews.length).toFixed(1)} Promedio público (${reviews.length} visibles)` 
                      : '⭐ Sin valoraciones aún'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6 text-center">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Tras cada sesión</p>
                      <p className="text-xs text-slate-600 mt-1">Enviamos automáticamente una invitación de reseña respetuosa.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Un recordatorio</p>
                      <p className="text-xs text-slate-600 mt-1">Si no responden, enviamos solo una alerta adicional.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Siempre verificadas</p>
                      <p className="text-xs text-slate-600 mt-1">Solo pacientes con sesiones reales pueden evaluar.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {reviews.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-8">Aún no tienes reseñas registradas. Aparecerán aquí cuando un paciente te evalúe.</p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev.id} className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{rev.patient_name || 'Paciente verificado'}</span>
                              <span className="text-amber-500 text-xs">
                                {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString('es-CL')}</span>
                          </div>
                          <p className="text-sm text-slate-700">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA EQUIPO */}
            {!activePatient && activeTab === 'equipo' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Equipo y Boxes</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Registrar Nuevo Profesional</h3>
                  <form onSubmit={handleCreateProfessional} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required type="text" placeholder="Nombre completo" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newProfName} onChange={e => setNewProfName(e.target.value)} />
                    <input required type="email" placeholder="Correo electrónico" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} />
                    <input required type="text" placeholder="Clave temporal (mín 6)" minLength={6} className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newProfPassword} onChange={e => setNewProfPassword(e.target.value)} />
                    <button type="submit" disabled={isCreatingProf} className="bg-slate-900 text-white font-bold py-3 rounded-xl">Registrar</button>
                  </form>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {visibleProfessionals.map(p => (
                      <div key={p.id} className="p-5 flex justify-between items-center">
                        <div><p className="font-bold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.email}</p></div>
                        <button onClick={() => handleDeleteProfessional(p.id)} className="text-red-600 text-xs font-bold">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA TERAPIAS */}
            {!activePatient && activeTab === 'terapias' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Servicios y Terapias</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Profesional</label><select required className="w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newProfId} onChange={e => setNewProfId(e.target.value)}><option value="" disabled>Seleccionar...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Servicio</label><input required type="text" className="w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio ($)</label><input required type="number" className="w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></div>
                    <button type="submit" className="bg-slate-900 text-white font-bold py-3 rounded-xl">Crear Servicio</button>
                  </form>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {services.map(s => (
                      <div key={s.id} className="p-5 flex justify-between items-center">
                        <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-xs text-slate-500">Precio: ${s.price?.toLocaleString('es-CL')}</p></div>
                        <button onClick={() => handleDeleteService(s.id)} className="text-red-600 text-xs font-bold">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA TALLERES */}
            {!activePatient && activeTab === 'talleres' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Talleres Grupales</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <form onSubmit={handleCreateWorkshop} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required type="text" placeholder="Título del taller" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all md:col-span-2" value={wsTitle} onChange={e => setWsTitle(e.target.value)} />
                    <select required className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsProfId} onChange={e => setWsProfId(e.target.value)}><option value="" disabled>Facilitador...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select required className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsBoxId} onChange={e => setWsBoxId(e.target.value)}><option value="" disabled>Box / Sala...</option>{visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    <input required type="number" placeholder="Precio ($)" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsPrice} onChange={e => setWsPrice(e.target.value)} />
                    <input required type="number" placeholder="Cupos" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsCapacity} onChange={e => setWsCapacity(e.target.value)} />
                    <input required type="date" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsDate} onChange={e => setWsDate(e.target.value)} />
                    <input required type="time" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" value={wsTime} onChange={e => setWsTime(e.target.value)} />
                    <button type="submit" className="bg-slate-900 text-white font-bold py-3 rounded-xl md:col-span-4">Programar Taller</button>
                  </form>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-3">SC</div>
          <h1 className="text-xl font-bold text-slate-900">Acceso Clínico</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo</label>
            <input 
              type="email" 
              required 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 mt-2">
            Iniciar Sesión
          </button>
          
          <div className="text-center pt-2">
            <Link href="/recuperar" className="text-xs font-bold text-slate-500 hover:text-slate-900">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}