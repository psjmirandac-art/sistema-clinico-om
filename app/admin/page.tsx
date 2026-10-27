'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);
const ENV_CENTER_ID = process.env.NEXT_PUBLIC_CENTER_ID || '';

export default function AdminPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inicio'); 
  
  const [userRole, setUserRole] = useState<'admin' | 'profesional'>('admin');
  const [currentProfId, setCurrentProfId] = useState<string>('');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [adminCenterId, setAdminCenterId] = useState<string>(ENV_CENTER_ID);
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2024-01-01T00:00:00'));
  
  const [showApptModal, setShowApptModal] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [adminAppt, setAdminAppt] = useState({ id: '', patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '' });
  
  const [recurrence, setRecurrence] = useState('none'); 
  const [recurrenceCount, setRecurrenceCount] = useState(4);

  const [slotActionModal, setSlotActionModal] = useState<{date: string, time: string} | null>(null);
  const [apptActionModal, setApptActionModal] = useState<any>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [noteMotivo, setNoteMotivo] = useState('');
  const [noteDesarrollo, setNoteDesarrollo] = useState('');
  const [notePlan, setNotePlan] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilterTab, setPatientFilterTab] = useState('Todos');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [scheduleModalProf, setScheduleModalProf] = useState<any | null>(null);
  const [localSchedules, setLocalSchedules] = useState<any>({});

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
      if (!SpeechRecognition) { alert("Tu navegador no soporta voz. Usa Chrome o Edge."); return; }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CL';
      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) { current += event.results[i][0].transcript; }
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
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: text }) });
      const data = await res.json();
      if (data.error) { alert("Error IA: " + data.error); } else {
        if (data.motivo) setNoteMotivo(data.motivo);
        if (data.desarrollo) setNoteDesarrollo(data.desarrollo);
        if (data.plan) setNotePlan(data.plan);
      }
    } catch (error) { alert("Error conectando con la IA."); }
    setIsAnalyzing(false);
    setTranscript('');
  };

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
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) loadData(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) loadData(session); });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(currentSession = session) {
    const [profs, servs, cents, boxs, apps, ws, regs] = await Promise.all([
      supabase.from('professionals').select('*').order('name'),
      supabase.from('services').select('*').order('created_at', { ascending: false }),
      supabase.from('centers').select('*').order('name'),
      supabase.from('boxes').select('*'),
      supabase.from('appointments').select('*').order('start_time', { ascending: true }),
      supabase.from('workshops').select('*').order('start_time', { ascending: true }),
      supabase.from('workshop_registrations').select('*')
    ]);
    const { data: revsData, error: revsError } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

    const profList = profs.data || [];
    setProfessionals(profList);
    
    if (currentSession?.user?.email) {
      const me = profList.find(p => p.email.toLowerCase() === currentSession.user.email.toLowerCase());
      if (me) { setUserRole('profesional'); setCurrentProfId(me.id); } else { setUserRole('admin'); setCurrentProfId(''); }
    }

    if (servs.data) setServices(servs.data);
    if (cents.data) { setCenters(cents.data); if (!ENV_CENTER_ID && cents.data.length > 0) { setAdminCenterId(cents.data[0].id); } }
    if (boxs.data) setBoxes(boxs.data);
    if (apps.data) setAppointments(apps.data);
    if (ws.data) setWorkshops(ws.data);
    if (regs.data) setRegistrations(regs.data);
    if (!revsError && revsData) setReviews(revsData);
  }

  const visibleProfessionals = professionals.filter(p => p.center_id === adminCenterId && (userRole === 'admin' || p.id === currentProfId));
  const visibleAppointmentsRaw = appointments.filter(a => a.center_id === adminCenterId);
  const visibleAppointments = userRole === 'admin' ? visibleAppointmentsRaw : visibleAppointmentsRaw.filter(a => a.professional_id === currentProfId);
  const activeAppointments = visibleAppointments.filter(a => a.consent_accepted !== false);
  const visibleServices = services.filter(s => visibleProfessionals.some(vp => vp.id === s.professional_id));
  const visibleBoxes = boxes.filter(b => b.center_id === adminCenterId);
  
  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconocido';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;
  const getBoxName = (id: string) => boxes.find(b => b.id === id)?.name || 'Box No Asignado';

  const currentMonthAppointments = activeAppointments.filter(app => {
    const appDate = new Date(app.start_time); const now = new Date();
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
  });
  const totalIncome = currentMonthAppointments.reduce((sum, app) => sum + getServicePrice(app.service_id), 0);
  const averageTicket = currentMonthAppointments.length > 0 ? Math.round(totalIncome / currentMonthAppointments.length) : 0;

  const prevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const nextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };
  const getWeekDays = () => Array.from({ length: 7 }).map((_, i) => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d; });
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const patientsMap = new Map();
  visibleAppointments.forEach(app => {
    if (app.patient_name?.startsWith('[BLOQUEO]')) return; 
    const key = app.patient_rut || app.patient_name;
    if (!patientsMap.has(key)) { patientsMap.set(key, { id: key, name: app.patient_name, rut: app.patient_rut, phone: app.patient_phone, email: app.patient_email, appointments: [] }); }
    patientsMap.get(key).appointments.push(app);
  });

  const processedPatients = Array.from(patientsMap.values()).map(p => {
    const now = new Date();
    const past = p.appointments.filter((a:any) => a.consent_accepted !== false && new Date(a.start_time) < now).sort((a:any, b:any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    const future = p.appointments.filter((a:any) => a.consent_accepted !== false && new Date(a.start_time) >= now).sort((a:any, b:any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return {
      ...p,
      ultimaSesion: past.length > 0 ? past[0].start_time : null,
      proximaSesion: future.length > 0 ? future[0].start_time : null,
      status: future.length > 0 ? 'Activo' : 'Inactivo',
    };
  });

  const filteredPatients = processedPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(patientSearch.toLowerCase()) || (p.rut && p.rut.includes(patientSearch)) || (p.phone && p.phone.includes(patientSearch));
    const matchesFilter = patientFilterTab === 'Todos' || p.status === (patientFilterTab === 'Activos' ? 'Activo' : 'Inactivo');
    return matchesSearch && matchesFilter;
  });

  const openNewApptModal = () => {
    if (userRole === 'profesional') {
      const me = professionals.find(p => p.id === currentProfId);
      setAdminAppt({ id: '', patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: currentProfId, service_id: '', box_id: me?.default_box_id || '', date: '', time: '' });
    } else {
      setAdminAppt({ id: '', patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '' });
    }
    setRecurrence('none');
    setRecurrenceCount(4);
    setShowApptModal(true);
  }

  const handleDragStart = (e: any, appId: string) => { e.dataTransfer.setData('appId', appId); };
  const handleDrop = async (e: any, day: Date, hour: number) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('appId');
    if (!appId) return;
    const targetObj = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
    const newStart = targetObj.toISOString();
    const newEnd = new Date(targetObj.getTime() + 60 * 60 * 1000).toISOString();
    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, start_time: newStart, end_time: newEnd } : a));
    const { error } = await supabase.from('appointments').update({ start_time: newStart, end_time: newEnd }).eq('id', appId);
    if (error) { alert('Error al mover la cita: ' + error.message); loadData(); }
  };

  const handleBlockSlot = async () => {
    if (!slotActionModal) return;
    setLoading(true);
    const [yyyy, mm, dd] = slotActionModal.date.split('-');
    const [hh, min] = slotActionModal.time.split(':');
    const startObj = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min), 0);
    const startDateTime = startObj.toISOString();
    const endDateTime = new Date(startObj.getTime() + 60 * 60 * 1000).toISOString();
    const profToBlock = userRole === 'profesional' ? currentProfId : null; 
    const { error } = await supabase.from('appointments').insert([{ center_id: adminCenterId, professional_id: profToBlock, patient_name: `[BLOQUEO] ${blockReason || 'Horario bloqueado'}`, start_time: startDateTime, end_time: endDateTime, consent_accepted: true }]);
    if (error) alert("Error al bloquear: " + error.message);
    setSlotActionModal(null); setIsBlocking(false); setBlockReason(''); loadData(); setLoading(false);
  };

  const handleQuickSchedule = (p: any, apptIdToEdit?: string) => {
    let targetId = apptIdToEdit;
    let targetDate = '';
    let targetTime = '';
    if (!targetId && p.appointments) {
      const futureAppts = p.appointments.filter((a:any) => a.consent_accepted !== false && new Date(a.start_time) >= new Date()).sort((a:any, b:any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      if (futureAppts.length > 0) {
        targetId = futureAppts[0].id;
        const d = new Date(futureAppts[0].start_time);
        targetDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        targetTime = d.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'});
      }
    }
    setAdminAppt({ 
       ...adminAppt, id: targetId || '', patient_name: p.name || p.patient_name, patient_rut: p.rut || p.patient_rut, 
       patient_phone: p.phone || p.patient_phone, patient_email: p.email || p.patient_email, date: targetDate, time: targetTime,
       professional_id: userRole === 'profesional' ? currentProfId : adminAppt.professional_id
    });
    setRecurrence('none'); setRecurrenceCount(4);
    setShowApptModal(true);
  };

  const handleAdminSchedule = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const [yyyy, mm, dd] = adminAppt.date.split('-');
    const [hh, min] = adminAppt.time.split(':');
    const finalProfId = userRole === 'profesional' ? currentProfId : adminAppt.professional_id;
    let error = null;
    
    if (adminAppt.id) { 
      const startObj = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min), 0);
      const startDateTime = startObj.toISOString();
      const endDateTime = new Date(startObj.getTime() + 60 * 60 * 1000).toISOString();
      
      const { error: updateErr } = await supabase.from('appointments').update({
        professional_id: finalProfId, service_id: adminAppt.service_id, box_id: adminAppt.box_id,
        patient_name: adminAppt.patient_name, patient_rut: adminAppt.patient_rut, patient_email: adminAppt.patient_email, patient_phone: adminAppt.patient_phone,
        start_time: startDateTime, end_time: endDateTime
      }).eq('id', adminAppt.id);
      error = updateErr;
      if (!error) setAppointments(prev => prev.map(a => a.id === adminAppt.id ? { ...a, professional_id: finalProfId, start_time: startDateTime, end_time: endDateTime } : a));
    } else { 
      const inserts = [];
      const totalSessions = recurrence === 'none' ? 1 : recurrenceCount;
      
      for (let i = 0; i < totalSessions; i++) {
         const d = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min), 0);
         if (recurrence === 'weekly') d.setDate(d.getDate() + 7 * i);
         if (recurrence === 'biweekly') d.setDate(d.getDate() + 14 * i);
         if (recurrence === 'monthly') d.setMonth(d.getMonth() + i);
         
         inserts.push({
          center_id: adminCenterId, box_id: adminAppt.box_id, professional_id: finalProfId, service_id: adminAppt.service_id,
          patient_name: adminAppt.patient_name, patient_rut: adminAppt.patient_rut, patient_email: adminAppt.patient_email, patient_phone: adminAppt.patient_phone,
          start_time: d.toISOString(), end_time: new Date(d.getTime() + 60 * 60 * 1000).toISOString(), consent_accepted: true 
         });
      }
      const { error: insertErr } = await supabase.from('appointments').insert(inserts);
      error = insertErr;
    }

    if (!error) {
      if (adminAppt.patient_email) {
        const profName = professionals.find(p => p.id === finalProfId)?.name || 'Profesional';
        try {
          const firstStartDateTime = new Date(Number(yyyy), Number(mm)-1, Number(dd), Number(hh), Number(min), 0).toISOString();
          await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_email: adminAppt.patient_email, patient_name: adminAppt.patient_name, professional_name: profName, start_time: firstStartDateTime }) });
        } catch (mailError) { console.error('Error enviando correo:', mailError); }
      }
      setShowApptModal(false); 
      setAdminAppt({ id: '', patient_name: '', patient_rut: '', patient_email: '', patient_phone: '', professional_id: '', service_id: '', box_id: '', date: '', time: '' });
      setRecurrence('none'); setRecurrenceCount(4);
      loadData(); 
      alert(adminAppt.id ? 'Cita reagendada exitosamente.' : 'Citas agendadas exitosamente.');
    } else { alert('Error al guardar cita: ' + error.message); }
    setLoading(false);
  };

  const handleDeleteAppt = async (id: string, isBlock = false) => {
    if (!confirm(isBlock ? '¿Desbloquear este horario?' : '¿Seguro que deseas eliminar esta cita? (El paciente seguirá registrado históricamente)')) return;
    if (isBlock) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (!error) { setAppointments(prev => prev.filter(a => a.id !== id)); loadData(); setApptActionModal(null); }
    } else {
      const { error } = await supabase.from('appointments').update({ consent_accepted: false }).eq('id', id);
      if (!error) { 
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, consent_accepted: false } : a));
        loadData(); setApptActionModal(null); 
      }
    }
  };

  const openFicha = async (appOrPatient: any, autoTranscribe = false) => {
    setApptActionModal(null);
    const pName = appOrPatient.patient_name || appOrPatient.name;
    const pRut = appOrPatient.patient_rut || appOrPatient.rut;
    const pPhone = appOrPatient.patient_phone || appOrPatient.phone;
    setActivePatient({ patient_name: pName, patient_rut: pRut, patient_phone: pPhone });
    setActiveTab('agenda');
    const { data } = await supabase.from('clinical_notes').select('*').eq('patient_name', pName).eq('center_id', adminCenterId).order('created_at', { ascending: false });
    if (data) setPatientNotes(data);
    if (autoTranscribe) { setTimeout(() => { toggleListening(); }, 500); }
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
    e.preventDefault(); setIsCreatingProf(true);
    const tempSupabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: authError } = await tempSupabase.auth.signUp({ email: newProfEmail.toLowerCase(), password: newProfPassword });
    if (authError) { alert('Error: ' + authError.message); setIsCreatingProf(false); return; }
    const { error: dbError } = await supabase.from('professionals').insert([{ name: newProfName, email: newProfEmail.toLowerCase(), center_id: adminCenterId, default_box_id: newProfBoxId || null }]);
    if (!dbError) { setNewProfName(''); setNewProfEmail(''); setNewProfPassword(''); setNewProfBoxId(''); loadData(); alert(`Profesional registrado. Clave temporal: ${newProfPassword}`); }
    setIsCreatingProf(false);
  };

  const handleDeleteProfessional = async (id: string) => { if (!confirm('¿Eliminar profesional?')) return; const { error } = await supabase.from('professionals').delete().eq('id', id); if (!error) loadData(); };
  
  const handleCreateService = async (e: React.FormEvent) => { 
    e.preventDefault(); setIsCreating(true); 
    const finalProfIdForService = userRole === 'profesional' ? currentProfId : newProfId;
    const { error } = await supabase.from('services').insert([{ name: newName, price: Number(newPrice), professional_id: finalProfIdForService }]); 
    if (!error) { setNewName(''); setNewPrice(''); setNewProfId(''); loadData(); } 
    setIsCreating(false); 
  };
  
  const handleDeleteService = async (id: string) => { if (!confirm('¿Eliminar servicio?')) return; const { error } = await supabase.from('services').delete().eq('id', id); if (!error) loadData(); };
  
  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault(); setIsCreatingWs(true);
    const [wYear, wMonth, wDay] = wsDate.split('-');
    const [wHour, wMin] = wsTime.split(':');
    const wStartObj = new Date(Number(wYear), Number(wMonth)-1, Number(wDay), Number(wHour), Number(wMin), 0);
    const startDateTime = wStartObj.toISOString();
    const endDateTime = new Date(wStartObj.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('workshops').insert([{ center_id: adminCenterId, box_id: wsBoxId, professional_id: wsProfId, title: wsTitle, description: wsDesc, price: Number(wsPrice), max_capacity: Number(wsCapacity), start_time: startDateTime, end_time: endDateTime }]);
    if (!error) { setWsTitle(''); setWsDesc(''); setWsPrice(''); setWsCapacity('10'); setWsProfId(''); setWsBoxId(''); setWsDate(''); setWsTime(''); loadData(); } 
    setIsCreatingWs(false);
  };
  const handleDeleteWorkshop = async (id: string) => { if (!confirm('¿Eliminar taller?')) return; const { error } = await supabase.from('workshops').delete().eq('id', id); if (!error) loadData(); };
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); setError(''); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError('Credenciales incorrectas'); setLoading(false); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
  };

  const initScheduleLocal = (profId: string) => {
    if (!localSchedules[profId]) {
      setLocalSchedules({ ...localSchedules, [profId]: { lun: {active:true, start:'09:00', end:'18:00'}, mar: {active:true, start:'09:00', end:'18:00'}, mie: {active:true, start:'09:00', end:'18:00'}, jue: {active:true, start:'09:00', end:'18:00'}, vie: {active:true, start:'09:00', end:'18:00'}, sab: {active:false, start:'10:00', end:'14:00'}, dom: {active:false, start:'10:00', end:'14:00'} }});
    }
    setScheduleModalProf(profId);
  };

  if (session) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
        
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between sticky top-0 h-screen z-20">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="h-9 w-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">SC</div>
              <div>
                <h1 className="font-bold text-slate-900 text-base leading-none">Sistema Clínico</h1>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gestión Profesional</span>
              </div>
            </div>
            <div className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mb-2 tracking-wider">Hoy</p>
              <button onClick={() => { setActiveTab('inicio'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'inicio' && !activePatient ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>🏠 Inicio</button>
              <button onClick={() => { setActiveTab('agenda'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'agenda' && !activePatient ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>📅 Calendario</button>
              <p className="text-[10px] font-bold text-slate-400 uppercase px-3 mt-6 mb-2 tracking-wider">Práctica</p>
              <button onClick={() => { setActiveTab('pacientes'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'pacientes' && !activePatient ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>👥 Pacientes</button>
              
              <button onClick={() => { setActiveTab('terapias'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'terapias' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>💼 Terapias y Servicios</button>
              {userRole === 'admin' && (
                <button onClick={() => { setActiveTab('equipo'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'equipo' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>🏥 Equipo y Boxes</button>
              )}

              <button onClick={() => { setActiveTab('finanzas'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'finanzas' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>💰 Boletas y Pagos</button>
              <button onClick={() => { setActiveTab('resenas'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'resenas' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>⭐ Reseñas</button>
              <button onClick={() => { setActiveTab('talleres'); setActivePatient(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'talleres' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>🏷️ Talleres</button>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{session.user.email.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{userRole === 'admin' ? 'Administrador' : 'Profesional'}</p>
              </div>
              <button onClick={handleLogout} className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors">Salir</button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <span className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-sm font-bold text-slate-700">
                {centers.find(c => c.id === adminCenterId)?.name || 'Cargando Centro...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openNewApptModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">+ Nueva Cita</button>
            </div>
          </header>

          {slotActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
                 <h3 className="font-bold text-lg text-slate-900 mb-1">Horario Seleccionado</h3>
                 <p className="text-slate-500 text-sm mb-6">{slotActionModal.date} a las {slotActionModal.time}</p>
                 <div className="flex flex-col gap-3">
                    {!isBlocking && (
                      <button onClick={() => { setAdminAppt(prev => ({...prev, id: '', patient_name: '', date: slotActionModal.date, time: slotActionModal.time, professional_id: userRole === 'profesional' ? currentProfId : prev.professional_id })); setSlotActionModal(null); setShowApptModal(true); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">📅 Agendar Paciente</button>
                    )}
                    {!isBlocking ? (
                      <button onClick={() => setIsBlocking(true)} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">🚫 Bloquear Horario</button>
                    ) : (
                      <div className="mt-2 text-left animate-fade-in">
                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motivo del Bloqueo</label>
                         <input type="text" placeholder="Ej: Almuerzo, Reunión..." className="w-full border border-slate-200 p-3 rounded-xl mb-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={blockReason} onChange={e=>setBlockReason(e.target.value)} />
                         <button onClick={handleBlockSlot} disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">{loading ? 'Guardando...' : 'Confirmar Bloqueo'}</button>
                      </div>
                    )}
                    <button onClick={() => {setSlotActionModal(null); setIsBlocking(false);}} className="mt-2 text-slate-400 hover:text-slate-600 text-sm font-medium">Cancelar</button>
                 </div>
              </div>
            </div>
          )}

          {apptActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
                {apptActionModal.patient_name.startsWith('[BLOQUEO]') ? (
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">🚫</div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">Horario Bloqueado</h3>
                    <p className="text-slate-500 text-sm mb-6">{apptActionModal.patient_name.replace('[BLOQUEO]', '')}</p>
                    <button onClick={() => handleDeleteAppt(apptActionModal.id, true)} className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 transition-colors mb-2">Desbloquear Horario</button>
                    <button onClick={() => setApptActionModal(null)} className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{apptActionModal.patient_name}</h3>
                        <p className="text-slate-500 text-xs">Agendado para las {new Date(apptActionModal.start_time).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</p>
                      </div>
                      <button onClick={() => setApptActionModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openFicha(apptActionModal)} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-medium text-slate-700 flex items-center gap-3 transition-colors"><span className="text-lg">📁</span> Entrar a la ficha clínica</button>
                      <button onClick={() => { alert('Pago registrado exitosamente en el sistema.'); setApptActionModal(null); }} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-medium text-slate-700 flex items-center gap-3 transition-colors"><span className="text-lg">💰</span> Registrar el pago</button>
                      <button onClick={() => openFicha(apptActionModal, true)} className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl font-medium text-blue-700 flex items-center gap-3 transition-colors"><span className="text-lg">🎙️</span> Transcribir sesión con IA</button>
                      <button onClick={() => { 
                        setApptActionModal(null); 
                        const appD = new Date(apptActionModal.start_time); 
                        handleQuickSchedule(apptActionModal, apptActionModal.id); 
                        setAdminAppt(prev => ({...prev, date: `${appD.getFullYear()}-${String(appD.getMonth()+1).padStart(2,'0')}-${String(appD.getDate()).padStart(2,'0')}`, time: appD.toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})})); 
                      }} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-medium text-slate-700 flex items-center gap-3 transition-colors"><span className="text-lg">🔄</span> Reagendar cita</button>
                      <button onClick={() => handleDeleteAppt(apptActionModal.id)} className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl font-medium text-red-600 flex items-center gap-3 transition-colors"><span className="text-lg">🗑️</span> Eliminar de la agenda</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {showApptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-20">
                  <h2 className="text-xl font-bold text-slate-900">{adminAppt.id ? 'Reagendar Cita' : 'Agendar Nueva Cita'}</h2>
                  <button onClick={() => {setShowApptModal(false); setRecurrence('none'); setRecurrenceCount(4);}} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleAdminSchedule} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><h3 className="text-xs font-bold text-slate-400 uppercase">Detalles Médicos</h3></div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Profesional</label>
                      <select required disabled={userRole === 'profesional'} className={`w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${userRole === 'profesional' ? 'opacity-75 cursor-not-allowed' : ''}`} value={userRole === 'profesional' ? currentProfId : adminAppt.professional_id} onChange={e => { const prof = professionals.find(p=>p.id===e.target.value); setAdminAppt({...adminAppt, professional_id: e.target.value, service_id: '', box_id: prof?.default_box_id || ''}); }}>
                        {userRole === 'profesional' ? <option value={currentProfId}>{getProfName(currentProfId)}</option> : <><option value="" disabled>Seleccionar...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</>}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio</label>
                      <select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.service_id} onChange={e => setAdminAppt({...adminAppt, service_id: e.target.value})}>
                        <option value="" disabled>Seleccionar...</option>
                        {services.filter(s => s.professional_id === (userRole === 'profesional' ? currentProfId : adminAppt.professional_id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Box / Sala</label><select required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.box_id} onChange={e => setAdminAppt({...adminAppt, box_id: e.target.value})}><option value="" disabled>Seleccionar...</option>{visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                    
                    <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-700 mb-1">Fecha {(!adminAppt.id && recurrence !== 'none') ? 'de inicio' : ''}</label><input type="date" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.date} onChange={e => setAdminAppt({...adminAppt, date: e.target.value})} /></div><div><label className="block text-xs font-semibold text-slate-700 mb-1">Hora</label><input type="time" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.time} onChange={e => setAdminAppt({...adminAppt, time: e.target.value})} /></div></div>
                    
                    {!adminAppt.id && (
                      <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Repetición de la cita</label>
                          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="none">Sesión única</option>
                            <option value="weekly">Semanal</option>
                            <option value="biweekly">Quincenal</option>
                            <option value="monthly">Mensual</option>
                          </select>
                        </div>
                        {recurrence !== 'none' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad de sesiones</label>
                            <input type="number" min="2" max="52" value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><h3 className="text-xs font-bold text-slate-400 uppercase mt-2">Datos del Paciente</h3></div>
                    
                    <div className="md:col-span-2 relative">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Paciente (Buscar o Crear Nuevo)</label>
                      <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input 
                          type="text" required placeholder="Escribe para buscar o registra uno nuevo..."
                          className="w-full border border-blue-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-bold text-slate-900 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" 
                          value={adminAppt.patient_name} 
                          onChange={e => { setAdminAppt({...adminAppt, patient_name: e.target.value}); setPatientDropdownOpen(true); }}
                          onFocus={() => setPatientDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setPatientDropdownOpen(false), 200)}
                        />
                      </div>
                      
                      {patientDropdownOpen && adminAppt.patient_name.length > 0 && processedPatients.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {processedPatients.filter(p => p.name.toLowerCase().includes(adminAppt.patient_name.toLowerCase()) || (p.rut && p.rut.includes(adminAppt.patient_name))).length > 0 ? (
                            <>
                              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 sticky top-0">Pacientes Registrados</div>
                              {processedPatients.filter(p => p.name.toLowerCase().includes(adminAppt.patient_name.toLowerCase()) || (p.rut && p.rut.includes(adminAppt.patient_name))).map(p => (
                                <div key={p.id} className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                                  onClick={() => { setAdminAppt({ ...adminAppt, patient_name: p.name || '', patient_rut: p.rut || '', patient_phone: p.phone || '', patient_email: p.email || '' }); setPatientDropdownOpen(false); }} >
                                  <span className="font-bold text-slate-900">{p.name}</span> {p.rut && <span className="text-slate-400 text-xs font-medium">{p.rut}</span>}
                                </div>
                              ))}
                            </>
                          ) : (
                             <div className="px-4 py-3 text-sm text-slate-500 text-center font-medium">No hay coincidencias. Se creará como <span className="font-bold text-slate-900">nuevo paciente</span>.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">RUT</label><input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.patient_rut} onChange={e => setAdminAppt({...adminAppt, patient_rut: e.target.value})} /></div>
                    <div><label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label><input type="tel" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.patient_phone} onChange={e => setAdminAppt({...adminAppt, patient_phone: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label><input type="email" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={adminAppt.patient_email} onChange={e => setAdminAppt({...adminAppt, patient_email: e.target.value})} /></div>
                    
                    {/* CASILLA DE CONSENTIMIENTO INFORMADO (NUEVA) */}
                    <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                      <input type="checkbox" required id="consent" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" defaultChecked />
                      <label htmlFor="consent" className="text-xs font-medium text-slate-700 cursor-pointer leading-tight">
                        Confirmo que el paciente acepta el <span className="font-bold text-blue-600 underline">Consentimiento Informado</span>.<br/>
                        <span className="text-slate-400 font-normal">Los términos se incluirán automáticamente en el correo de confirmación de la cita.</span>
                      </label>
                    </div>

                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => {setShowApptModal(false); setRecurrence('none'); setRecurrenceCount(4);}} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">{loading ? 'Procesando...' : (adminAppt.id ? 'Guardar Cambios' : (recurrence === 'none' ? 'Confirmar Cita' : `Agendar ${recurrenceCount} Citas`))}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
            
            {activePatient && (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4"><button onClick={() => {setActivePatient(null); setNoteMotivo(''); setNoteDesarrollo(''); setNotePlan('');}} className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-50">← Volver</button><h2 className="text-2xl font-bold text-slate-900">Ficha Clínica</h2></div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                  <div className="h-16 w-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">{activePatient.patient_name.charAt(0).toUpperCase()}</div>
                  <div><h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">{activePatient.patient_name} <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">ACTIVO</span></h3><p className="text-sm text-slate-500 mt-1">RUT: {activePatient.patient_rut} | Tel: {activePatient.patient_phone}</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl">
                      <h3 className="font-bold text-slate-800 text-sm">Nueva Evolución con IA</h3>
                      <button type="button" onClick={toggleListening} disabled={isAnalyzing} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isListening ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-600 text-white border border-blue-600'}`}>{isListening ? '⏹ Detener' : isAnalyzing ? '⏳ Procesando...' : '✨ Asistente IA (Dictar)'}</button>
                    </div>
                    {isListening && <div className="px-6 pt-4"><div className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs font-mono h-24 overflow-y-auto">{transcript || 'Escuchando...'}</div></div>}
                    <form onSubmit={handleSaveNote} className="p-6 flex flex-col gap-4">
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motivo</label><input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={noteMotivo} onChange={(e) => setNoteMotivo(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Desarrollo</label><textarea required className="w-full h-36 border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" value={noteDesarrollo} onChange={(e) => setNoteDesarrollo(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Plan</label><input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={notePlan} onChange={(e) => setNotePlan(e.target.value)} /></div>
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

            {!activePatient && activeTab === 'inicio' && (
              <div className="animate-fade-in flex flex-col items-center pt-12 pb-20 px-4 w-full max-w-4xl mx-auto">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
                <h2 className="text-3xl font-medium text-slate-900 mb-8">¿Cómo puedo ayudarte hoy, {session.user.email.split('@')[0]}?</h2>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <button onClick={() => setActiveTab('agenda')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>¿Cuál es mi agenda de hoy?</button>
                  <button onClick={openNewApptModal} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>Crear un paciente</button>
                  <button onClick={() => setActiveTab('finanzas')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Ver pagos pendientes</button>
                </div>
                <div className="w-full bg-white border border-blue-200 rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <input type="text" placeholder="Escribe tu consulta o elige un paciente para empezar" className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 mb-4 px-2" />
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                    <div className="relative w-48">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <select onChange={(e) => { const appt = activeAppointments.find(a => a.id === e.target.value); if (appt) openFicha(appt); }} className="appearance-none w-full bg-transparent border border-slate-200 text-slate-600 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-400 cursor-pointer">
                        <option value="">Elegir paciente</option>
                        {activeAppointments.filter(app => !app.patient_name.startsWith('[BLOQUEO]')).map(app => <option key={app.id} value={app.id}>{app.patient_name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-slate-600 transition-colors" title="Dictar por voz"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
                      <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors shadow-sm"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 transform -rotate-45 -mt-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Enviar</button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-12 px-4">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-5">Próximas Citas</h3>
                    <div className="space-y-4">
                      {activeAppointments.filter(a => !a.patient_name.startsWith('[BLOQUEO]')).length === 0 && (
                        <p className="text-sm text-slate-500">No tienes citas próximas.</p>
                      )}
                      {activeAppointments.filter(a => !a.patient_name.startsWith('[BLOQUEO]')).length > 0 && 
                        activeAppointments.filter(a => !a.patient_name.startsWith('[BLOQUEO]') && new Date(a.start_time) >= new Date()).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).slice(0, 4).map(app => (
                          <div key={app.id} onClick={() => openFicha(app)} className="flex items-start gap-3 cursor-pointer group">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 group-hover:scale-125 transition-transform"></div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{app.patient_name}</p>
                              <p className="text-xs text-slate-400">{new Date(app.start_time).toLocaleString('es-CL', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-5">Accesos Rápidos</h3>
                    <div className="space-y-4">
                      <button onClick={() => setActiveTab('finanzas')} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Revisar mis boletas y rendimiento</button>
                      <button onClick={() => setActiveTab('agenda')} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Ver mi agenda interactiva completa</button>
                      {userRole === 'admin' && (
                        <button onClick={() => setActiveTab('equipo')} className="block w-full text-left text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">Asignar y gestionar boxes clínicos</button>
                      )}
                      <button onClick={() => setActiveTab('pacientes')} className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mt-6 pt-4">Ver todos mis pacientes <span className="text-lg leading-none">›</span></button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'agenda' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 text-xs font-bold rounded-lg ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cuadrícula</button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-xs font-bold rounded-lg ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Lista</button>
                  </div>
                  <button onClick={openNewApptModal} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Nueva Cita</button>
                </div>
                {viewMode === 'calendar' && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                    <div className="min-w-[900px]">
                      <div className="flex justify-between p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                        <button onClick={prevWeek} className="hover:text-blue-600">← Semana Anterior</button>
                        <span>Semana {currentWeekStart.toLocaleDateString('es-CL')}</span>
                        <button onClick={nextWeek} className="hover:text-blue-600">Semana Siguiente →</button>
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
                              const cellAppts = activeAppointments.filter(app => {
                                const appD = new Date(app.start_time);
                                return appD.getDate() === day.getDate() && appD.getMonth() === day.getMonth() && appD.getHours() === hour;
                              });

                              const handleSlotClick = () => {
                                const year = day.getFullYear(); const month = String(day.getMonth() + 1).padStart(2, '0'); const d = String(day.getDate()).padStart(2, '0'); const h = String(hour).padStart(2, '0');
                                setSlotActionModal({ date: `${year}-${month}-${d}`, time: `${h}:00` });
                              };

                              return (
                                <div 
                                  key={day.toISOString()} 
                                  onClick={handleSlotClick} 
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, day, hour)}
                                  className="p-1 border-r border-slate-100 cursor-pointer hover:bg-slate-50/80 transition-colors relative min-h-[80px]" 
                                  title="Clic para Agendar o Bloquear. Arrastra una cita para moverla."
                                >
                                  {cellAppts.map(app => {
                                    const isBlocked = app.patient_name.startsWith('[BLOQUEO]');
                                    return (
                                      <div 
                                        key={app.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, app.id)}
                                        onClick={(e) => { e.stopPropagation(); setApptActionModal(app); }} 
                                        className={`p-2 rounded-lg shadow-sm font-bold mb-1 text-[10px] cursor-move transition-transform hover:scale-[1.02] ${isBlocked ? 'bg-slate-100 border-l-4 border-slate-400 text-slate-500' : 'bg-blue-50 border-l-4 border-blue-500 text-blue-900 hover:bg-blue-100'}`}
                                      >
                                        {isBlocked ? app.patient_name.replace('[BLOQUEO]', '🚫') : app.patient_name}
                                      </div>
                                    )
                                  })}
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
                      {activeAppointments.filter(app => !app.patient_name.startsWith('[BLOQUEO]')).map(app => (
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

            {!activePatient && activeTab === 'pacientes' && (
              <div className="space-y-4 animate-fade-in font-sans">
                <h2 className="text-2xl font-medium text-slate-900 mb-6">Pacientes</h2>
                <div className="flex gap-2 mb-4">
                  {['Todos', 'Activos', 'Inactivos', 'Eliminados'].map(tab => (
                    <button key={tab} onClick={() => setPatientFilterTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${patientFilterTab === tab ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                      {tab} {tab === 'Todos' && `(${processedPatients.length})`}
                      {tab === 'Activos' && `(${processedPatients.filter(p=>p.status==='Activo').length})`}
                      {tab === 'Inactivos' && `(${processedPatients.filter(p=>p.status==='Inactivo').length})`}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="relative w-full md:w-[400px]">
                    <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Buscar por nombre, RUT, teléfono o correo" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"/>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Interesados</button>
                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">Plantillas <span className="text-[10px]">▼</span></button>
                    <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Importar <span className="text-[10px]">▼</span></button>
                    <button onClick={openNewApptModal} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 ml-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Añadir nuevo</button>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-white border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="px-6 py-4 font-medium flex items-center gap-1">Nombre <span className="text-[10px]">▲</span></th>
                          <th className="px-6 py-4 font-medium">Última sesión <span className="text-[10px]">↕</span></th>
                          <th className="px-6 py-4 font-medium">Próxima sesión <span className="text-[10px]">↕</span></th>
                          <th className="px-6 py-4 font-medium">Pagos <span className="text-[10px]">↕</span></th>
                          <th className="px-6 py-4 font-medium">Total por cobrar <span className="text-[10px]">↕</span></th>
                          <th className="px-6 py-4 font-medium text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPatients.length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No se encontraron pacientes</td></tr>
                        )}
                        {filteredPatients.length > 0 && filteredPatients.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4"><span onClick={() => openFicha(p)} className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer">{p.name}</span></td>
                              <td className="px-6 py-4 text-slate-500">{formatShortDate(p.ultimaSesion)}</td>
                              <td className="px-6 py-4 text-slate-500">{formatShortDate(p.proximaSesion)}</td>
                              <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Al día</span></td>
                              <td className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-center items-center gap-2 relative">
                                  <button onClick={() => handleQuickSchedule(p)} title="Reagendar nueva cita" className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                                  <button onClick={() => p.phone ? window.open(`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`, '_blank') : alert('Paciente sin teléfono')} title="Contactar por WhatsApp" className="p-1.5 text-slate-400 hover:text-green-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></button>
                                  <button onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)} className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
                                  {activeDropdown === p.id && (
                                    <div className="absolute right-0 top-10 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 text-left">
                                      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Derivar</button>
                                      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Fusionar</button>
                                      <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Dar de alta</button>
                                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50">Eliminar</button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'finanzas' && (
              <div className="space-y-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Boletas, Pagos y Rendimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Ingresos Brutos</p><p className="text-3xl font-black text-emerald-600 mt-2">${totalIncome.toLocaleString('es-CL')}</p></div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Citas Atendidas</p><p className="text-3xl font-black text-indigo-600 mt-2">{currentMonthAppointments.length}</p></div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"><p className="text-xs font-bold text-slate-400 uppercase">Ticket Promedio</p><p className="text-3xl font-black text-slate-800 mt-2">${averageTicket.toLocaleString('es-CL')}</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Ingresos por Profesional</h3><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={visibleProfessionals.map(p => ({name: p.name.split(' ')[0], ingresos: currentMonthAppointments.filter(a => a.professional_id === p.id).reduce((s, a) => s + getServicePrice(a.service_id), 0)}))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 12}} /><YAxis tick={{fontSize: 12}} /><Tooltip formatter={(v:any) => [`$${v.toLocaleString('es-CL')}`, 'Ingresos']} /><Bar dataKey="ingresos" fill="#3b82f6" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></div>
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"><h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Distribución de Citas</h3><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={visibleProfessionals.map(p => ({name: p.name.split(' ')[0], value: currentMonthAppointments.filter(a => a.professional_id === p.id).length}))} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={5}>{visibleProfessionals.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i%4]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'resenas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-bold text-slate-900">Reseñas y Evaluaciones</h2><p className="text-slate-500 text-sm mt-1">Valoraciones verificadas dejadas por tus pacientes tras las sesiones.</p></div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl font-bold text-sm">{reviews.length > 0 ? `⭐ ${(reviews.reduce((acc, rev) => acc + (rev.rating || 5), 0) / reviews.length).toFixed(1)} Promedio público (${reviews.length} visibles)` : '⭐ Sin valoraciones aún'}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6 text-center">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Tras cada sesión</p><p className="text-xs text-slate-600 mt-1">Enviamos automáticamente una invitación de reseña respetuosa.</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Un recordatorio</p><p className="text-xs text-slate-600 mt-1">Si no responden, enviamos solo una alerta adicional.</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Siempre verificadas</p><p className="text-xs text-slate-600 mt-1">Solo pacientes con sesiones reales pueden evaluar.</p></div>
                  </div>
                  <div className="space-y-4 pt-2">
                    {reviews.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-8">Aún no tienes reseñas registradas. Aparecerán aquí cuando un paciente te evalúe.</p>
                    )}
                    {reviews.length > 0 && reviews.map((rev) => (
                        <div key={rev.id} className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><span className="font-bold text-slate-900 text-sm">{rev.patient_name || 'Paciente verificado'}</span><span className="text-amber-500 text-xs">{'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}</span></div>
                            <span className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString('es-CL')}</span>
                          </div>
                          <p className="text-sm text-slate-700">{rev.comment}</p>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'equipo' && userRole === 'admin' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Equipo y Boxes</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Registrar Nuevo Profesional</h3>
                  <form onSubmit={handleCreateProfessional} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input required type="text" placeholder="Nombre completo" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newProfName} onChange={e => setNewProfName(e.target.value)} />
                    <input required type="email" placeholder="Correo electrónico" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} />
                    <input required type="text" placeholder="Clave temporal (mín 6)" minLength={6} className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newProfPassword} onChange={e => setNewProfPassword(e.target.value)} />
                    <select className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newProfBoxId} onChange={e => setNewProfBoxId(e.target.value)}><option value="">Sin Box (Opcional)</option>{visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    <button type="submit" disabled={isCreatingProf} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">Registrar</button>
                  </form>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {visibleProfessionals.map(p => (
                      <div key={p.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div><p className="font-bold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.email} {p.default_box_id ? `• ${getBoxName(p.default_box_id)}` : ''}</p></div>
                        <div className="flex gap-4">
                          <button onClick={() => initScheduleLocal(p.id)} className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Horarios</button>
                          <button onClick={() => handleDeleteProfessional(p.id)} className="text-red-600 text-xs font-bold hover:text-red-800 transition-colors px-2 py-1.5">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'terapias' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Servicios y Terapias</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Profesional</label>
                      <select required disabled={userRole === 'profesional'} className={`w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${userRole === 'profesional' ? 'opacity-75 cursor-not-allowed' : ''}`} value={userRole === 'profesional' ? currentProfId : newProfId} onChange={e => setNewProfId(e.target.value)}>
                        {userRole === 'profesional' ? <option value={currentProfId}>{getProfName(currentProfId)}</option> : <><option value="" disabled>Seleccionar...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</>}
                      </select>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Servicio</label><input required type="text" className="w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio ($)</label><input required type="number" className="w-full border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">Crear Servicio</button>
                  </form>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {visibleServices.map(s => (
                      <div key={s.id} className="p-5 flex justify-between items-center">
                        <div>
                           <p className="font-bold text-slate-900">{s.name}</p>
                           <p className="text-xs text-slate-500">Precio: ${s.price?.toLocaleString('es-CL')} {userRole === 'admin' ? `| Prof: ${getProfName(s.professional_id)}` : ''}</p>
                        </div>
                        <button onClick={() => handleDeleteService(s.id)} className="text-red-600 text-xs font-bold hover:text-red-800 transition-colors">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!activePatient && activeTab === 'talleres' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900">Talleres Grupales</h2>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <form onSubmit={handleCreateWorkshop} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input required type="text" placeholder="Título del taller" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all md:col-span-2" value={wsTitle} onChange={e => setWsTitle(e.target.value)} />
                    <select required className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsProfId} onChange={e => setWsProfId(e.target.value)}><option value="" disabled>Facilitador...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <select required className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsBoxId} onChange={e => setWsBoxId(e.target.value)}><option value="" disabled>Box / Sala...</option>{visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    <input required type="number" placeholder="Precio ($)" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsPrice} onChange={e => setWsPrice(e.target.value)} />
                    <input required type="number" placeholder="Cupos" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsCapacity} onChange={e => setWsCapacity(e.target.value)} />
                    <input required type="date" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsDate} onChange={e => setWsDate(e.target.value)} />
                    <input required type="time" className="border p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={wsTime} onChange={e => setWsTime(e.target.value)} />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl md:col-span-4 transition-colors">Programar Taller</button>
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
          <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-3">SC</div>
          <h1 className="text-xl font-bold text-slate-900">Acceso Clínico</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo</label>
            <input type="email" required className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
            <input type="password" required className="w-full border border-slate-200 p-3 rounded-xl text-sm font-medium text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2">Iniciar Sesión</button>
          <div className="text-center pt-2"><Link href="/recuperar" className="text-xs font-bold text-slate-500 hover:text-slate-900">¿Olvidaste tu contraseña?</Link></div>
        </form>
      </div>
    </div>
  );
}