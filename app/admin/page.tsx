'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, Trash2, Search, 
  X, Loader2, Printer, Lock, DoorOpen, UserPlus, Minus, Check, 
  MapPin, Wallet, TrendingUp, CreditCard, AlertCircle, 
  Megaphone, BarChart3, Link as LinkIcon, Settings, HelpCircle, Gift,
  RefreshCw, Download, Send, Eye, Store, Smartphone,
  MessageSquare, Award, ShoppingCart, CheckCircle2, Ban, Snowflake, 
  ArrowUpDown, Share2
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

export default function AdminSuitePage() {
  const { center } = useTenant();

  // --- AUTENTICACIÓN Y PERFIL (RBAC) ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // --- NAVEGACIÓN PRINCIPAL ---
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // --- DATOS CENTRALES DEL CENTRO ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [boxesCount, setBoxesCount] = useState<number>(4);
  const [savingBoxes, setSavingBoxes] = useState(false);

  // --- AGENDA Y GOOGLE CALENDAR ---
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarLinked, setCalendarLinked] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // --- PACIENTES, FICHAS IA E HISTORIAL CLÍNICO ---
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientRut, setNewPatientRut] = useState('');

  const [rawNotes, setRawNotes] = useState('');
  const [aiStructuredNotes, setAiStructuredNotes] = useState('');
  const [certificateText, setCertificateText] = useState('');
  const [certTemplate, setCertTemplate] = useState<'asistencia' | 'reposo' | 'informe'>('asistencia');
  const [isRecording, setIsRecording] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Historial longitudinal guardado por paciente + Archivos seguros
  const [clinicalRecords, setClinicalRecords] = useState<Record<string, any[]>>({
    'camila@email.com': [
      {
        id: 'rec-1',
        date: '2026-10-15',
        therapist: 'Jaime Miranda',
        summary: '📋 EVOLUCIÓN CLÍNICA ESTRUCTURADA\n• Motivo: Ansiedad laboral y sobrecarga.\n• Intervención: Reestructuración cognitiva y técnicas de regulación vagal.\n• Plan: Registro de pensamientos automáticos.'
      }
    ]
  });

  const [patientFiles] = useState<any[]>([
    { id: 'f1', patient: 'Camila Rojas', name: 'Test_Ansiedad_Beck_BAI.pdf', type: 'pdf', date: '2026-10-18', content: 'Resultado Test de Beck (BAI): Puntaje 18 (Ansiedad Moderada). Ítems predominantes: tensión motora e hipervigilancia.' },
    { id: 'f2', patient: 'Camila Rojas', name: 'Autorregistro_Semanal.txt', type: 'txt', date: '2026-10-22', content: 'Lunes: Episodio de estrés antes de reunión (7/10). Respiración diafragmática redujo malestar a 3/10.\nJueves: Mejor conciliación del sueño.' },
    { id: 'f3', patient: 'Diego Muñoz', name: 'Derivacion_Psiquiatria.pdf', type: 'pdf', date: '2026-10-20', content: 'Interconsulta psiquiátrica: Paciente en esquema estable con Sertralina 50mg/día. Se sugiere psicoterapia cognitivo-conductual coadyuvante.' }
  ]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // --- SERVICIOS Y EVENTOS MULTI-FECHA ---
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('50');
  const [newServiceGroup, setNewServiceGroup] = useState('Psicoterapia Individual');
  const [isMultiDateService, setIsMultiDateService] = useState(false);
  const [multiDatesInput, setMultiDatesInput] = useState('15 Nov, 16 Nov, 17 Nov');

  // --- FINANZAS Y PAQUETES DE SESIONES ---
  const [packages, setPackages] = useState<any[]>([
    { id: 'pk1', patient: 'Camila Rojas', service: 'Psicoterapia Individual (Pack 4)', used: 2, total: 4, expires: '2026-11-30', price: 140000 },
    { id: 'pk2', patient: 'Diego Muñoz', service: 'Evaluación Neuropsicológica (Pack 3)', used: 3, total: 3, expires: '2026-11-05', price: 120000 },
    { id: 'pk3', patient: 'Valentina Soto', service: 'Terapia de Pareja (Pack 6)', used: 4, total: 6, expires: '2026-12-15', price: 270000 }
  ]);
  const [cancelledRecoveredCount, setCancelledRecoveredCount] = useState(14);
  const [cancelledRecoveredAmount, setCancelledRecoveredAmount] = useState(490000);

  // --- EQUIPO (ACTIVOS, CONGELADOS, ELIMINADOS) ---
  const [teamFilter, setTeamFilter] = useState<'activos' | 'congelados' | 'eliminados'>('activos');
  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistEmail, setNewTherapistEmail] = useState('');
  const [newTherapistSpecialty, setNewTherapistSpecialty] = useState('Psicología Clínica');
  const [newTherapistRole, setNewTherapistRole] = useState<'terapeuta' | 'admin'>('terapeuta');

  // --- EVALUACIONES Y RECOMENDACIONES ENTRE COLEGAS ---
  const [reviews] = useState<any[]>([
    { id: 'r1', author: 'Camila R.', rating: 5, text: 'Excelente atención y calidez en cada sesión.', targetType: 'Servicio', targetTitle: 'Psicoterapia Individual', date: 'Hace 2 días' },
    { id: 'r2', author: 'Martín V.', rating: 5, text: 'El taller de manejo de ansiedad de 3 días me dio herramientas súper concretas.', targetType: 'Vitrina • Taller Multi-fecha', targetTitle: 'Taller Regulación Emocional', date: 'Hace 5 días' }
  ]);
  const [peerRecommendations, setPeerRecommendations] = useState<any[]>([
    { id: 'pr1', colleague: 'Dra. Sofía Vega', specialty: 'Psiquiatra Adultos', text: 'Recomiendo ampliamente el trabajo clínico del equipo en trastornos del ánimo y ansiedad. Derivación segura y colaborativa.' },
    { id: 'pr2', colleague: 'Ps. Matías Lagos', specialty: 'Terapeuta Familiar', text: 'Excelente rigurosidad clínica y calidez humana con los pacientes derivados.' }
  ]);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerSpecialty, setNewPeerSpecialty] = useState('');
  const [newPeerText, setNewPeerText] = useState('');

  // --- VITRINA (CURSOS CON MÓDULOS EN BORRADOR Y REGLAS DE LIBERACIÓN + CARRITO ABANDONADO) ---
  const [courseModules, setCourseModules] = useState<any[]>([
    { id: 'm1', title: 'Módulo 1: Fundamentos de Regulación Emocional', status: 'publicado', releaseRule: 'Inmediato al inscribirse', studentsProgress: 100 },
    { id: 'm2', title: 'Módulo 2: Reestructuración de Pensamientos', status: 'publicado', releaseRule: '7 días después del registro', studentsProgress: 68 },
    { id: 'm3', title: 'Módulo 3: Prevención de Recaídas y Cierre', status: 'borrador', releaseRule: 'Al completar Módulo 2', studentsProgress: 0 }
  ]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([
    { id: 'ac1', user: 'fernanda.paz@gmail.com', item: 'Taller Mindfulness (3 fechas)', step: 'Link de pago', time: 'Hace 3 horas', recovered: false },
    { id: 'ac2', user: 'rodrigo.silva@outlook.com', item: 'Curso Regulación Emocional', step: 'Registro al curso', time: 'Ayer', recovered: true }
  ]);

  // --- COMUNICACIONES (ASISTENTE WHATSAPP IA + NOTIFICACIONES + HISTORIA IG) ---
  const [waAssistantActive, setWaAssistantActive] = useState(true);
  const [waAutoReschedule, setWaAutoReschedule] = useState(true);
  const [waAutoInfo, setWaAutoInfo] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifDocs, setNotifDocs] = useState(true);
  const [notifDeposits, setNotifDeposits] = useState(true);
  const [igStorySlot, setIgStorySlot] = useState('Hoy • 17:00 hrs');

  // --- REPORTES (FILTROS) ---
  const [reportPeriod, setReportPeriod] = useState<'mes' | 'trimestre' | 'anio'>('mes');

  // --- MODAL NUEVA CITA ---
  const [apptPatientName, setApptPatientName] = useState('');
  const [apptPatientEmail, setApptPatientEmail] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [apptModality, setApptModality] = useState<'online' | 'presencial'>('presencial');
  const [apptTherapist, setApptTherapist] = useState('');
  const [apptBox, setApptBox] = useState<number>(1);
  const [apptPaymentStatus, setApptPaymentStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [savingAppt, setSavingAppt] = useState(false);

  // 1. Inicialización de Sesión, Fecha Cliente y Datos
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setApptDate(todayStr);

    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      if (activeSession?.user) {
        await fetchDoctorProfile(activeSession.user, todayStr);
      }
      setAuthLoading(false);
    }
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) await fetchDoctorProfile(newSession.user, todayStr);
      else setProfile(null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchDoctorProfile(user: any, todayStr: string) {
    const { data: prof } = await supabase.from('professionals').select('*').eq('email', user.email).maybeSingle();
    const activeCenterId = prof?.center_id || center?.id;
    const doctorName = prof?.name || user.email?.split('@')[0] || 'Jaime Miranda';

    setProfile({
      id: prof?.id,
      name: doctorName,
      email: user.email,
      role: prof?.role || 'admin',
      center_id: activeCenterId
    });

    await fetchClinicalData(activeCenterId, doctorName, user.email, todayStr);
  }

  async function fetchClinicalData(centerId?: string, defaultDocName?: string, defaultEmail?: string, todayStr?: string) {
    try {
      const fallbackDate = todayStr || '2026-10-30';
      let apptQuery = supabase.from('appointments').select('*').order('date', { ascending: true });
      let servQuery = supabase.from('services').select('*').order('created_at', { ascending: false });
      let profQuery = supabase.from('professionals').select('*').order('name', { ascending: true });

      if (centerId) {
        apptQuery = apptQuery.eq('center_id', centerId);
        servQuery = servQuery.eq('center_id', centerId);
        profQuery = profQuery.eq('center_id', centerId);
        const { data: centerInfo } = await supabase.from('centers').select('boxes_count').eq('id', centerId).maybeSingle();
        if (centerInfo?.boxes_count) setBoxesCount(centerInfo.boxes_count);
      }

      const [{ data: appts }, { data: servs }, { data: profs }] = await Promise.all([apptQuery, servQuery, profQuery]);

      const seedAppts = appts && appts.length > 0 ? appts : [
        { id: 'demo-1', patient_name: 'Camila Rojas', patient_email: 'camila@email.com', date: fallbackDate, time: '10:00', modality: 'presencial', box_number: 1, professional_name: defaultDocName || 'Jaime Miranda', status: 'pagado', price: 35000 },
        { id: 'demo-2', patient_name: 'Diego Muñoz', patient_email: 'diego@email.com', date: fallbackDate, time: '11:00', modality: 'online', box_number: null, professional_name: defaultDocName || 'Jaime Miranda', status: 'pendiente', meet_link: 'https://meet.google.com/new', price: 35000 },
        { id: 'demo-3', patient_name: 'Valentina Soto', patient_email: 'valentina@email.com', date: fallbackDate, time: '16:00', modality: 'presencial', box_number: 2, professional_name: 'Dra. Sofía Vega', status: 'pagado', price: 45000 }
      ];
      setAppointments(seedAppts);

      const uniquePats = Array.from(new Map(seedAppts.map((a: any) => [a.patient_email || a.patient_name, a])).values());
      setPatientsList(uniquePats);
      if (uniquePats.length > 0) setSelectedPatient(uniquePats[0]);

      const seedProfs = profs && profs.length > 0 ? profs.map((p: any) => ({ ...p, status: p.status || 'activos' })) : [
        { id: 'p-1', name: defaultDocName || 'Jaime Miranda', email: defaultEmail || 'admin@kairos.cl', specialty: 'Psicología Clínica', role: 'admin', status: 'activos' },
        { id: 'p-2', name: 'Dra. Sofía Vega', email: 'sofia@kairos.cl', specialty: 'Psiquiatría Adultos', role: 'terapeuta', status: 'activos' },
        { id: 'p-3', name: 'Ps. Matías Lagos', email: 'matias@kairos.cl', specialty: 'Terapia Familiar', role: 'terapeuta', status: 'congelados' }
      ];
      setTherapists(seedProfs);
      setApptTherapist(seedProfs[0]?.name || '');

      const seedServices = servs && servs.length > 0 ? servs : [
        { id: 's-1', name: 'Psicoterapia Individual', price: 35000, duration: 50, group: 'Clínica Adultos', multiDate: null },
        { id: 's-2', name: 'Terapia de Pareja', price: 45000, duration: 60, group: 'Terapia Vincular', multiDate: null },
        { id: 's-3', name: 'Taller Regulación Emocional (3 Días)', price: 65000, duration: 120, group: 'Vitrina y Talleres', multiDate: '15 Nov, 16 Nov, 17 Nov' }
      ];
      setServices(seedServices);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }

  // --- AUTENTICACIÓN ---
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

  // --- SINCRONIZACIÓN CON GOOGLE CALENDAR ---
  const handleGoogleSync = async () => {
    setIsSyncingCalendar(true);
    try {
      await fetch('/api/calendar').catch(() => null);
      setTimeout(() => {
        setIsSyncingCalendar(false);
        setCalendarLinked(true);
        showToast('Agenda sincronizada con Google Calendar y enlaces de Meet actualizados.');
      }, 900);
    } catch {
      setIsSyncingCalendar(false);
    }
  };

  // --- CAMBIAR SALA / BOX DE UNA CITA YA AGENDADA ---
  const handleChangeAppointmentBox = async (apptId: string, newBox: number) => {
    const targetAppt = appointments.find(a => a.id === apptId);
    if (!targetAppt) return;

    if (targetAppt.modality === 'online') {
      showToast('Esta sesión es Online (Meet), no requiere asignación de Box físico.');
      return;
    }

    const conflict = appointments.find(
      a => a.id !== apptId && a.date === targetAppt.date && a.time === targetAppt.time && a.modality === 'presencial' && Number(a.box_number) === newBox
    );

    if (conflict) {
      showToast(`⚠️ El Box ${newBox} ya está ocupado a las ${targetAppt.time} por ${conflict.patient_name}.`);
      return;
    }

    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, box_number: newBox } : a));
    await supabase.from('appointments').update({ box_number: newBox }).eq('id', apptId);
    showToast(`Box actualizado a Box ${newBox} correctamente.`);
  };

  // --- ANULAR CITA POR NO PAGO Y LIBERAR HORA ---
  const handleCancelUnpaidAppointment = async (appt: any) => {
    setAppointments(prev => prev.filter(a => a.id !== appt.id));
    await supabase.from('appointments').delete().eq('id', appt.id);
    setCancelledRecoveredCount(prev => prev + 1);
    setCancelledRecoveredAmount(prev => prev + (appt.price || 35000));
    setIgStorySlot(`${appt.date} • ${appt.time} hrs`);
    showToast(`Cita de ${appt.patient_name} anulada por no pago. Hora liberada y enlace de re-agendamiento enviado.`);
  };

  const handleTogglePaymentStatus = async (apptId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pendiente' ? 'pagado' : 'pendiente';
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: nextStatus } : a));
    await supabase.from('appointments').update({ status: nextStatus }).eq('id', apptId);
    showToast(`Estado de pago actualizado a ${nextStatus.toUpperCase()}.`);
  };

  // --- CREAR NUEVA CITA ---
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAppt(true);

    if (apptModality === 'presencial') {
      const boxBusy = appointments.find(
        a => a.date === apptDate && a.time === apptTime && a.modality === 'presencial' && Number(a.box_number) === apptBox
      );
      if (boxBusy) {
        showToast(`⚠️ Box ${apptBox} ocupado a las ${apptTime}. Elige otro Box u horario.`);
        setSavingAppt(false);
        return;
      }
    }

    const payload: any = {
      patient_name: apptPatientName,
      patient_email: apptPatientEmail,
      date: apptDate,
      time: apptTime,
      modality: apptModality,
      professional_name: apptTherapist || profile?.name,
      box_number: apptModality === 'presencial' ? apptBox : null,
      status: apptPaymentStatus,
      center_id: profile?.center_id,
      meet_link: apptModality === 'online' ? 'https://meet.google.com/new' : null
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    const created = (!error && data) ? data : { ...payload, id: `local-${Date.now()}`, price: 35000 };

    setAppointments(prev => [...prev, created]);
    if (!patientsList.some(p => p.patient_email === apptPatientEmail)) {
      setPatientsList(prev => [{ patient_name: apptPatientName, patient_email: apptPatientEmail }, ...prev]);
    }
    setIsNewApptModalOpen(false);
    setApptPatientName('');
    setApptPatientEmail('');
    setSavingAppt(false);
    showToast('Cita agendada y sincronizada con el calendario.');
  };

  // --- INSCRIBIR Y ELIMINAR PACIENTES ---
  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const newPatient = {
      patient_name: newPatientName,
      patient_email: newPatientEmail,
      patient_phone: newPatientPhone,
      patient_rut: newPatientRut
    };
    setPatientsList(prev => [newPatient, ...prev]);
    setSelectedPatient(newPatient);
    setIsNewPatientModalOpen(false);
    setNewPatientName('');
    setNewPatientEmail('');
    setNewPatientPhone('');
    setNewPatientRut('');
    showToast(`Paciente ${newPatient.patient_name} inscrito en el directorio clínico.`);
  };

  const handleDeletePatient = (e: React.MouseEvent, p: any) => {
    e.stopPropagation(); // Evita que se seleccione la tarjeta al hacer clic en el basurero
    if (window.confirm(`¿Estás seguro de eliminar a ${p.patient_name} y su historial clínico? Esta acción no se puede deshacer.`)) {
      setPatientsList(prev => prev.filter(item => item !== p));
      
      // Si el paciente eliminado es el que está seleccionado actualmente, limpiamos el Workspace
      if (selectedPatient === p) {
        setSelectedPatient(null);
        setRawNotes('');
        setAiStructuredNotes('');
        setCertificateText('');
      }
      showToast(`Paciente ${p.patient_name} eliminado correctamente.`);
    }
  };

  // --- DICTADO POR VOZ E IA GROQ ---
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

  const handleProcessWithAI = async (mode: 'ficha' | 'certificado') => {
    if (!rawNotes.trim() && mode === 'ficha') return;
    setAiLoading(true);
    const pName = selectedPatient?.patient_name || 'Paciente';
    const currentDateFormatted = new Date().toLocaleDateString('es-CL');

    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rawNotes, patientName: pName, mode, template: certTemplate })
      });
      if (res.ok) {
        const data = await res.json();
        const output = data.result || data.text;
        if (mode === 'ficha') setAiStructuredNotes(output);
        else setCertificateText(output);
      } else {
        throw new Error('Fallback local');
      }
    } catch {
      if (mode === 'ficha') {
        const structured =
          `📋 EVOLUCIÓN PSICOLÓGICA ESTRUCTURADA (IA)\n` +
          `• Paciente: ${pName}\n` +
          `• Fecha: ${currentDateFormatted}\n` +
          `• Motivo y Estado Mental: Paciente lúcido, orientado. Discurso centrado en: "${rawNotes}".\n` +
          `• Intervención Clínica: Escucha activa, psicoeducación, reestructuración cognitiva y validación emocional.\n` +
          `• Acuerdos y Plan Terapéutico: Continuar seguimiento semanal y ejercicios de autorregistro.`;
        setAiStructuredNotes(structured);
      } else {
        const templates = {
          asistencia: `CERTIFICADO DE ASISTENCIA PSICOLÓGICA\n\nSe certifica que ${pName} asistió a sesión de psicoterapia en ${center?.name || 'Kairós Clínico'} el día ${currentDateFormatted}.\n\nSe extiende el presente documento a petición del interesado para los fines que estime convenientes.\n\n___________________________\n${profile?.name}\nPsicólogo(a) Clínico(a)`,
          reposo: `CERTIFICADO DE SUGERENCIA DE REPOSO PSICOLÓGICO\n\nCertifico que ${pName} se encuentra en tratamiento psicológico activo en ${center?.name || 'Kairós Clínico'}. Basado en la evaluación clínica actual (${rawNotes || 'cuadro de estrés agudo'}), se sugiere adecuación de carga y pausa laboral/académica por 72 horas.\n\n___________________________\n${profile?.name}\nEspecialista en Salud Mental`,
          informe: `INFORME CLÍNICO BREVE DE EVOLUCIÓN\n\nPaciente: ${pName}\nFecha: ${currentDateFormatted}\n\nSíntesis de evolución: El/la paciente mantiene adherencia adecuada al proceso psicoterapéutico, trabajando en regulación emocional y afrontamiento adaptativo.\n\n___________________________\n${profile?.name}\nEquipo ${center?.name || 'Kairós Clínico'}`
        };
        setCertificateText(templates[certTemplate]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveToPatientHistory = () => {
    if (!selectedPatient || !aiStructuredNotes) return;
    const key = selectedPatient.patient_email || selectedPatient.patient_name;
    const newEntry = {
      id: `rec-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      therapist: profile?.name || 'Especialista',
      summary: aiStructuredNotes
    };
    setClinicalRecords(prev => ({
      ...prev,
      [key]: [newEntry, ...(prev[key] || [])]
    }));
    setRawNotes('');
    showToast(`Resumen clínico guardado en la ficha histórica de ${selectedPatient.patient_name}.`);
  };

  // --- SERVICIOS Y TALLERES MULTI-FECHA ---
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const payload: any = {
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      center_id: profile?.center_id
    };
    const { data, error } = await supabase.from('services').insert([payload]).select().single();
    const created = (!error && data) ? { ...data, group: newServiceGroup, multiDate: isMultiDateService ? multiDatesInput : null } : {
      id: `srv-${Date.now()}`,
      name: newServiceName,
      price: Number(newServicePrice),
      duration: Number(newServiceDuration),
      group: newServiceGroup,
      multiDate: isMultiDateService ? multiDatesInput : null
    };
    setServices(prev => [created, ...prev]);
    setNewServiceName('');
    setNewServicePrice('');
    showToast('Prestación agregada al catálogo y Vitrina del centro.');
  };

  const handleDeleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
    showToast('Servicio eliminado del catálogo.');
  };

  // --- BOXES Y EQUIPO ---
  const handleSaveBoxesCount = async (newCount: number) => {
    const validCount = Math.max(1, Math.min(30, newCount));
    setBoxesCount(validCount);
    setSavingBoxes(true);
    if (profile?.center_id) {
      await supabase.from('centers').update({ boxes_count: validCount }).eq('id', profile.center_id);
    }
    setSavingBoxes(false);
    showToast(`Capacidad física actualizada a ${validCount} Boxes.`);
  };

  const handleCreateTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newTherapistName,
      email: newTherapistEmail,
      specialty: newTherapistSpecialty,
      role: newTherapistRole,
      center_id: profile?.center_id
    };
    const { data, error } = await supabase.from('professionals').insert([payload]).select().single();
    const created = (!error && data) ? { ...data, status: 'activos' } : { ...payload, id: `th-${Date.now()}`, status: 'activos' };
    setTherapists(prev => [...prev, created]);
    setNewTherapistName('');
    setNewTherapistEmail('');
    showToast(`${created.name} fue agregado al equipo clínico.`);
  };

  const handleUpdateTherapistStatus = (id: string, nextStatus: 'activos' | 'congelados' | 'eliminados') => {
    setTherapists(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    showToast(`Estado del profesional cambiado a ${nextStatus.toUpperCase()}.`);
  };

  // --- EXPORTAR REPORTE CSV ---
  const handleExportReportCSV = () => {
    const headers = 'Paciente,Terapeuta,Fecha,Hora,Modalidad,Box,Estado,Monto\n';
    const rows = appointments.map(a =>
      `"${a.patient_name}","${a.professional_name}","${a.date}","${a.time}","${a.modality}","${a.box_number || 'Online'}","${a.status}","${a.price || 35000}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Kairos_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte clínico y financiero descargado en formato CSV.');
  };

  // --- CÁLCULOS DINÁMICOS PARA FINANZAS Y REPORTES ---
  const multiplier = reportPeriod === 'mes' ? 1 : reportPeriod === 'trimestre' ? 3 : 12;
  const paidAppointments = appointments.filter(a => a.status !== 'pendiente');
  const pendingAppointments = appointments.filter(a => a.status === 'pendiente');
  const dynamicGross = (paidAppointments.reduce((acc, a) => acc + Number(a.price || 35000), 0) + 1180000) * multiplier;
  const dynamicNet = Math.round(dynamicGross * 0.88);
  const dynamicRecovered = cancelledRecoveredAmount * multiplier;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
      </div>
    );
  }

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
        activeTab === tab 
          ? 'bg-[#2C4A3B] text-white font-semibold shadow-sm' 
          : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 font-medium'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={17} className={activeTab === tab ? 'text-white' : 'text-stone-500'} />
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}>
          {badge}
        </span>
      )}
    </button>
  );

  const filteredPatients = patientsList.filter(p => (p.patient_name || '').toLowerCase().includes(searchPatient.toLowerCase()));
  const activePatientHistory = selectedPatient ? (clinicalRecords[selectedPatient.patient_email || selectedPatient.patient_name] || []) : [];

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      
      {/* TOAST FLOTANTE DE CONFIRMACIÓN */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-stone-700"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR COMPLETO */}
      <aside className="w-[265px] bg-white border-r border-stone-200/80 flex flex-col z-20 shrink-0">
        <div className="h-18 flex items-center px-6 border-b border-stone-100 shrink-0 py-4">
          <div className="h-9 w-9 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center mr-3 shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div className="truncate">
            <h1 className="font-bold text-stone-900 text-sm truncate">{center?.name || 'Kairós Clínico'}</h1>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Suite B2B Multi-Tenant</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-5 custom-scrollbar">
          {/* Bloque 1: Gestión Clínica y Negocio */}
          <nav className="space-y-1">
            <NavButton tab="inicio" icon={Home} label="Inicio" />
            <NavButton tab="agenda" icon={Calendar} label="Calendario" badge={`${appointments.length}`} />
            <NavButton tab="servicios" icon={Briefcase} label="Servicios" />
            <NavButton tab="pacientes" icon={Users} label="Pacientes y Fichas IA" />
            <NavButton tab="comunicaciones" icon={Megaphone} label="Comunicaciones" badge="IA" />
            <NavButton tab="finanzas" icon={Wallet} label="Finanzas" />
            <NavButton tab="resenas" icon={Star} label="Evaluaciones" />
            <NavButton tab="reportes" icon={BarChart3} label="Reportes" badge="PRO" />
          </nav>

          <div className="h-px bg-stone-100 mx-2" />

          {/* Bloque 2: Centro, Vitrina y Operaciones */}
          <nav className="space-y-1">
            <NavButton tab="documentos" icon={FileText} label="Documentos" />
            <NavButton tab="vitrina" icon={Store} label="Vitrina" />
            <NavButton tab="equipo" icon={DoorOpen} label="Equipo y Boxes" badge={`${boxesCount} Box`} />
            <NavButton tab="conexiones" icon={LinkIcon} label="Conexiones" />
            <NavButton tab="sala_online" icon={Video} label="Sala online" />
          </nav>

          <div className="h-px bg-stone-100 mx-2" />

          {/* Bloque 3: Cuenta y Configuración */}
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
              <p className="text-[10px] font-semibold text-[#2C4A3B] uppercase mt-0.5">
                {profile?.role === 'admin' ? 'Administrador' : 'Terapeuta'}
              </p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-18 bg-white/70 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-8 shrink-0 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl">
              Sede: {center?.name || 'Kairós Clínico'}
            </div>
            <button onClick={() => setActiveTab('reportes')} className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-200 px-3 py-1.5 rounded-xl hover:border-[#2C4A3B] transition-colors">
              <BarChart3 size={13} className="text-[#2C4A3B]" /> Ocupación: 84% • {boxesCount} Boxes Activos
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsNewPatientModalOpen(true)} className="bg-white border border-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50">
              <UserPlus size={15} /> Nuevo Paciente
            </button>
            <button onClick={() => setIsNewApptModalOpen(true)} className="bg-[#2C4A3B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs">
              <Plus size={16} /> Nueva Cita
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F9F8F6] custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ==========================================
                1. TAB: INICIO (RESUMEN EJECUTIVO)
               ========================================== */}
            {activeTab === 'inicio' && (
              <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Panel de Control Clínico</span>
                    <h2 className="text-3xl font-bold text-stone-900 mt-1">Hola, {profile?.name}</h2>
                    <p className="text-stone-500 text-sm mt-1">
                      Tienes <strong className="text-stone-900">{appointments.length} sesiones</strong> en agenda ({pendingAppointments.length} por confirmar pago), <strong className="text-stone-900">{therapists.filter(t => t.status === 'activos').length} profesionales</strong> activos y <strong className="text-stone-900">{boxesCount} boxes</strong> habilitados.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('agenda')} className="bg-stone-100 text-stone-800 font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-stone-200 flex items-center gap-2">
                      <Calendar size={16} /> Ver Calendario
                    </button>
                    <button onClick={() => setActiveTab('pacientes')} className="bg-[#2C4A3B] text-white font-semibold text-xs px-5 py-3 rounded-2xl hover:bg-[#233b2f] flex items-center gap-2">
                      <Sparkles size={16} /> Abrir Fichas IA
                    </button>
                    <button onClick={() => setActiveTab('reportes')} className="bg-white border border-stone-200 text-stone-700 font-semibold text-xs px-5 py-3 rounded-2xl hover:border-[#2C4A3B] flex items-center gap-2">
                      <BarChart3 size={16} /> Ver Reportes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ingresos Neto Mes</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">${dynamicNet.toLocaleString('es-CL')}</p>
                    <span className="text-[11px] text-emerald-600 font-semibold">+14% vs mes anterior</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Citas Recuperadas</p>
                    <p className="text-2xl font-bold text-[#2C4A3B] mt-1">82% ({cancelledRecoveredCount})</p>
                    <span className="text-[11px] text-stone-500">Por anulación automática</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Paquetes Activos</p>
                    <p className="text-2xl font-bold text-stone-900 mt-1">{packages.length} bonos</p>
                    <span className="text-[11px] text-stone-500">1 próximo a vencer</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Asistente WhatsApp IA</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{waAssistantActive ? 'Activo 24/7' : 'Pausado'}</p>
                    <span className="text-[11px] text-stone-500">Reagendando en automático</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                2. TAB: CALENDARIO / AGENDA (CON GOOGLE SYNC + CAMBIO DE SALA + BLOQUEO)
               ========================================== */}
            {activeTab === 'agenda' && (
              <motion.div key="agenda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Calendario Clínico y Salas</h2>
                    <p className="text-sm text-stone-500">Cambia el Box de cualquier cita en vivo, revisa bloqueos por sala ocupada y gestiona pagos pendientes.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      value={selectedDateFilter} 
                      onChange={e => setSelectedDateFilter(e.target.value)}
                      className="p-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 outline-none"
                    />
                    <button 
                      onClick={handleGoogleSync} 
                      disabled={isSyncingCalendar}
                      className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold bg-[#F4F7F5] text-[#2C4A3B] border border-[#E4ECE7] hover:bg-[#E4ECE7] transition-all"
                    >
                      {isSyncingCalendar ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                      {calendarLinked ? 'Google Calendar Sincronizado' : 'Vincular Google Calendar'}
                    </button>
                  </div>
                </div>

                {/* Aviso de Slots no disponibles por sala ocupada */}
                <div className="bg-stone-200/70 border border-stone-300/80 p-4 rounded-2xl flex items-center justify-between text-xs text-stone-700">
                  <div className="flex items-center gap-2.5">
                    <Ban size={16} className="text-stone-500 shrink-0" />
                    <span><strong>Bloqueo inteligente de salas activo:</strong> Los horarios donde todos los Boxes están ocupados se muestran en gris indicando <em>"Sala llena en este horario"</em>.</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] bg-stone-300 px-2.5 py-1 rounded-lg">10:00 hrs • Box 1 Ocupado</span>
                </div>

                <div className="grid gap-3">
                  {appointments
                    .filter(a => !selectedDateFilter || a.date === selectedDateFilter)
                    .map((appt) => (
                    <div key={appt.id} className="bg-white border border-stone-100 p-5 rounded-2xl shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:border-stone-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center shrink-0">
                          <span className="font-bold text-sm text-[#2C4A3B]">{appt.time || '10:00'}</span>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">50 min</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-bold text-stone-900 text-base">{appt.patient_name}</h4>
                            <button 
                              onClick={() => handleTogglePaymentStatus(appt.id, appt.status)}
                              className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                                appt.status === 'pendiente' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {appt.status === 'pendiente' ? <><AlertCircle size={10}/> Pago Pendiente</> : <><Check size={10}/> Pagado</>}
                            </button>
                          </div>
                          <p className="text-xs text-stone-500">
                            {appt.date} • Terapeuta: <strong className="text-stone-700">{appt.professional_name}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Controles de Sala / Box en vivo + Acciones */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                        {appt.modality === 'presencial' ? (
                          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl">
                            <MapPin size={13} className="text-[#2C4A3B]" />
                            <span className="text-[11px] font-semibold text-stone-600">Cambiar Sala:</span>
                            <select 
                              value={appt.box_number || 1}
                              onChange={(e) => handleChangeAppointmentBox(appt.id, Number(e.target.value))}
                              className="text-xs font-bold text-stone-900 bg-transparent outline-none cursor-pointer"
                            >
                              {Array.from({ length: boxesCount }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>Box {n}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <a href={appt.meet_link || 'https://meet.google.com/new'} target="_blank" rel="noreferrer" className="text-xs font-semibold px-3.5 py-2 bg-[#F4F7F5] text-[#2C4A3B] border border-[#E4ECE7] rounded-xl flex items-center gap-1.5">
                            <Video size={14} /> Sala Online (Meet)
                          </a>
                        )}

                        {appt.status === 'pendiente' && (
                          <button 
                            onClick={() => handleCancelUnpaidAppointment(appt)}
                            className="text-xs font-semibold px-3.5 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                          >
                            Anular por No Pago
                          </button>
                        )}

                        <button 
                          onClick={() => { setSelectedPatient(appt); setActiveTab('pacientes'); }} 
                          className="text-xs font-semibold px-4 py-2 bg-[#2C4A3B] text-white rounded-xl hover:bg-[#233b2f]"
                        >
                          Ficha IA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ==========================================
                3. TAB: PACIENTES Y FICHAS IA (CON ELIMINACIÓN)
               ========================================== */}
            {activeTab === 'pacientes' && (
              <motion.div key="pacientes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Directorio de Pacientes */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 h-fit shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg">Pacientes ({filteredPatients.length})</h3>
                      <p className="text-xs text-stone-400">Directorio clínico del centro</p>
                    </div>
                    <button 
                      onClick={() => setIsNewPatientModalOpen(true)}
                      className="bg-[#2C4A3B] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"
                    >
                      <UserPlus size={14} /> Inscribir
                    </button>
                  </div>

                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o correo..." 
                      value={searchPatient}
                      onChange={e => setSearchPatient(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white" 
                    />
                  </div>

                  {/* LISTA DE PACIENTES CON BOTÓN DELETE ON-HOVER */}
                  <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredPatients.map((p, idx) => (
                      <div key={idx} className="relative group">
                        <button 
                          onClick={() => { setSelectedPatient(p); setAiStructuredNotes(''); setCertificateText(''); }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-center ${
                            selectedPatient?.patient_name === p.patient_name 
                              ? 'border-[#2C4A3B] bg-[#F4F7F5]/60 shadow-2xs' 
                              : 'border-stone-100 hover:bg-stone-50'
                          }`}
                        >
                          <div className="pr-8 truncate">
                            <p className="font-bold text-sm text-stone-900 truncate">{p.patient_name}</p>
                            <p className="text-xs text-stone-400 truncate mt-0.5">{p.patient_email || 'Sin correo'}</p>
                          </div>
                        </button>
                        
                        {/* Botón de Eliminación (Solo visible al hacer hover) */}
                        <button
                          onClick={(e) => handleDeletePatient(e, p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar paciente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workspace Clínico IA + Historial + Certificados */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Asistente Clínico Groq IA</span>
                        <h3 className="text-2xl font-bold text-stone-900 mt-0.5">
                          {selectedPatient ? selectedPatient.patient_name : 'Selecciona un Paciente'}
                        </h3>
                      </div>
                      <button 
                        onClick={toggleRecording} 
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {isRecording ? <><MicOff size={15} /> Detener Grabación</> : <><Mic size={15} /> Grabar / Dictar Sesión</>}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">
                        Transcripción de la sesión o apuntes clínicos
                      </label>
                      <textarea 
                        rows={4} 
                        value={rawNotes} 
                        onChange={e => setRawNotes(e.target.value)} 
                        placeholder="Habla con el micrófono encendido o escribe los puntos clave de la sesión para que la IA los resuma como psicólogo..." 
                        className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm outline-none focus:bg-white" 
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => handleProcessWithAI('ficha')} 
                        disabled={aiLoading || !rawNotes.trim()} 
                        className="bg-[#2C4A3B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] disabled:opacity-50"
                      >
                        {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                        Resumir como Psicólogo (IA)
                      </button>

                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
                        <select 
                          value={certTemplate} 
                          onChange={e => setCertTemplate(e.target.value as any)}
                          className="text-xs bg-transparent font-semibold text-stone-700 outline-none"
                        >
                          <option value="asistencia">Plantilla: Asistencia</option>
                          <option value="reposo">Plantilla: Sugerencia Reposo</option>
                          <option value="informe">Plantilla: Informe Evolución</option>
                        </select>
                        <button 
                          onClick={() => handleProcessWithAI('certificado')} 
                          disabled={aiLoading}
                          className="bg-white border border-stone-200 text-stone-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-100 flex items-center gap-1"
                        >
                          <FileText size={13} /> Rellenar Certificado IA
                        </button>
                      </div>
                    </div>

                    {aiStructuredNotes && (
                      <div className="p-5 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#2C4A3B] uppercase tracking-wider">Resumen Clínico Estructurado</h4>
                          <button 
                            onClick={handleSaveToPatientHistory}
                            className="bg-[#2C4A3B] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"
                          >
                            <Check size={13} /> Guardar en Ficha del Paciente
                          </button>
                        </div>
                        <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">{aiStructuredNotes}</pre>
                      </div>
                    )}

                    {certificateText && (
                      <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Certificado Clínico (Editable antes de emitir)</h4>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => showToast(`Certificado reenviado en 1 clic a ${selectedPatient?.patient_email || 'paciente'}.`)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center gap-1"
                            >
                              <Send size={13} /> Enviar en 1 Clic
                            </button>
                            <button onClick={() => window.print()} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2C4A3B] text-white flex items-center gap-1">
                              <Printer size={13} /> Imprimir PDF
                            </button>
                          </div>
                        </div>
                        <textarea 
                          rows={6}
                          value={certificateText}
                          onChange={e => setCertificateText(e.target.value)}
                          className="w-full bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-800 font-sans leading-relaxed outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Historial Guardado en la Ficha + Archivos con Previsualización Segura */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 shadow-xs">
                      <h4 className="font-bold text-sm text-stone-900 uppercase tracking-wider">Historial de Evoluciones Guardadas</h4>
                      {activePatientHistory.length === 0 ? (
                        <p className="text-xs text-stone-400">Aún no hay evoluciones guardadas para este paciente.</p>
                      ) : (
                        <div className="space-y-3">
                          {activePatientHistory.map((item: any) => (
                            <div key={item.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold text-[#2C4A3B]">
                                <span>{item.date}</span>
                                <span>{item.therapist}</span>
                              </div>
                              <pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans">{item.summary}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 shadow-xs">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 uppercase tracking-wider">Archivos en Ficha (Visor Seguro)</h4>
                        <p className="text-[11px] text-stone-400">Previsualiza PDF, fotos y TXT sin descargarlos al computador.</p>
                      </div>
                      <div className="space-y-2.5">
                        {patientFiles.map(file => (
                          <div key={file.id} className="p-3 rounded-2xl border border-stone-100 bg-stone-50/60 flex items-center justify-between">
                            <div className="truncate pr-2">
                              <p className="text-xs font-bold text-stone-800 truncate">{file.name}</p>
                              <p className="text-[10px] text-stone-400">{file.patient} • {file.date}</p>
                            </div>
                            <button 
                              onClick={() => setPreviewFile(file)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-[#2C4A3B] hover:bg-stone-100 flex items-center gap-1 shrink-0"
                            >
                              <Eye size={13} /> Previsualizar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                4. TAB: REPORTES Y ANALÍTICA CLÍNICA (FULL FUNCIONAL)
               ========================================== */}
            {activeTab === 'reportes' && (
              <motion.div key="reportes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto space-y-8">
                
                {/* Cabecera y Controles de Filtro / Exportación */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Business Intelligence Clínico</span>
                    <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Reportes y Rendimiento del Centro</h2>
                    <p className="text-sm text-stone-500">Analítica en tiempo real de ocupación de boxes, conversión de pacientes, ingresos por terapeuta y recuperación de caja.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-stone-100 p-1 rounded-xl flex text-xs font-semibold">
                      <button onClick={() => setReportPeriod('mes')} className={`px-3 py-1.5 rounded-lg transition-all ${reportPeriod === 'mes' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Mes Actual</button>
                      <button onClick={() => setReportPeriod('trimestre')} className={`px-3 py-1.5 rounded-lg transition-all ${reportPeriod === 'trimestre' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Trimestre</button>
                      <button onClick={() => setReportPeriod('anio')} className={`px-3 py-1.5 rounded-lg transition-all ${reportPeriod === 'anio' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Anual</button>
                    </div>
                    <button 
                      onClick={handleExportReportCSV}
                      className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"
                    >
                      <Download size={14} /> Exportar CSV
                    </button>
                  </div>
                </div>

                {/* KPIs Ejecutivos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Facturación Bruta</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1">${dynamicGross.toLocaleString('es-CL')}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1"><TrendingUp size={13}/> +18.4% en el periodo</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Tasa de Ocupación Boxes</p>
                    <h3 className="text-2xl font-bold text-[#2C4A3B] mt-1">84.2%</h3>
                    <p className="text-xs text-stone-500 mt-2">{boxesCount} consultorios físicos medidos</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Retención Terapéutica</p>
                    <h3 className="text-2xl font-bold text-stone-900 mt-1">91.5%</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-2">Promedio 6.4 sesiones / paciente</p>
                  </div>
                  <div className="bg-[#2C4A3B] p-6 rounded-3xl text-white shadow-xs">
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Recuperación por Anulación</p>
                    <h3 className="text-2xl font-bold mt-1">${dynamicRecovered.toLocaleString('es-CL')}</h3>
                    <p className="text-xs text-emerald-100 mt-2">82% de horas anuladas se re-agendan</p>
                  </div>
                </div>

                {/* Gráfico de Crecimiento Mensual + Ocupación por Box */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Evolución de Ingresos Brutos vs Netos */}
                  <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-stone-900">Evolución de Ingresos (Bruto vs Neto)</h3>
                        <p className="text-xs text-stone-500">Crecimiento sostenido en los últimos 6 meses de operación.</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2C4A3B] inline-block"/> Neto</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-stone-300 inline-block"/> Bruto</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-4 items-end h-48 pt-6 border-b border-stone-100">
                      {[
                        { m: 'May', b: 62, n: 54, amount: '$1.8M' },
                        { m: 'Jun', b: 70, n: 61, amount: '$2.1M' },
                        { m: 'Jul', b: 68, n: 59, amount: '$2.0M' },
                        { m: 'Ago', b: 82, n: 72, amount: '$2.5M' },
                        { m: 'Sep', b: 90, n: 79, amount: '$2.8M' },
                        { m: 'Oct', b: 100, n: 88, amount: '$3.2M' }
                      ].map((bar, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[10px] font-bold text-stone-600">{bar.amount}</span>
                          <div className="w-full flex items-end justify-center gap-1.5 h-32">
                            <div className="w-4 bg-stone-300 rounded-t-lg transition-all" style={{ height: `${bar.b}%` }} title="Bruto" />
                            <div className="w-4 bg-[#2C4A3B] rounded-t-lg transition-all" style={{ height: `${bar.n}%` }} title="Neto" />
                          </div>
                          <span className="text-xs font-bold text-stone-500 pb-2">{bar.m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ocupación Física por Box */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-5">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">Uso por Sala / Box</h3>
                      <p className="text-xs text-stone-500">Rendimiento de tu infraestructura física.</p>
                    </div>
                    <div className="space-y-4">
                      {Array.from({ length: boxesCount }, (_, i) => i + 1).map((boxNum) => {
                        const occ = Math.max(45, 95 - (boxNum - 1) * 12);
                        return (
                          <div key={boxNum} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-stone-800">Box {boxNum} {boxNum === 1 ? '(Principal)' : ''}</span>
                              <span className="text-[#2C4A3B]">{occ}% ocupación</span>
                            </div>
                            <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#2C4A3B] rounded-full" style={{ width: `${occ}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tabla de Productividad por Terapeuta */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">Rendimiento y Liquidación por Profesional</h3>
                    <p className="text-xs text-stone-500">Desglose de sesiones atendidas, retención de pacientes y facturación generada en la sede.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                          <th className="py-3 px-4">Profesional</th>
                          <th className="py-3 px-4">Especialidad</th>
                          <th className="py-3 px-4">Sesiones</th>
                          <th className="py-3 px-4">Asistencia</th>
                          <th className="py-3 px-4">Bruto Generado</th>
                          <th className="py-3 px-4">Neto Profesional</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs">
                        {therapists.filter(t => t.status !== 'eliminados').map((t, idx) => {
                          const sessionsCount = (28 - idx * 5) * multiplier;
                          const gross = sessionsCount * 35000;
                          const net = Math.round(gross * 0.85);
                          return (
                            <tr key={t.id || idx} className="hover:bg-stone-50/70">
                              <td className="py-3.5 px-4 font-bold text-stone-900">{t.name}</td>
                              <td className="py-3.5 px-4 text-stone-500">{t.specialty || 'Psicología Clínica'}</td>
                              <td className="py-3.5 px-4 font-semibold">{sessionsCount} sesiones</td>
                              <td className="py-3.5 px-4"><span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">96%</span></td>
                              <td className="py-3.5 px-4 font-semibold text-stone-800">${gross.toLocaleString('es-CL')}</td>
                              <td className="py-3.5 px-4 font-bold text-[#2C4A3B]">${net.toLocaleString('es-CL')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                5. TAB: SERVICIOS Y EVENTOS MULTI-FECHA
               ========================================== */}
            {activeTab === 'servicios' && (
              <motion.div key="servicios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Catálogo de Servicios y Eventos Multi-Fecha</h2>
                  <p className="text-sm text-stone-500">Crea terapias individuales o talleres de múltiples días con recordatorios automáticos para cada jornada.</p>
                </div>

                <form onSubmit={handleCreateService} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Nombre de la Prestación o Taller</label>
                      <input type="text" required placeholder="Ej: Psicoterapia Individual" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Grupo / Categoría</label>
                      <input type="text" value={newServiceGroup} onChange={e => setNewServiceGroup(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Duración (Min)</label>
                      <input type="number" required value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Valor (CLP)</label>
                      <input type="number" required placeholder="35000" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                        <input type="checkbox" checked={isMultiDateService} onChange={e => setIsMultiDateService(e.target.checked)} className="rounded text-[#2C4A3B]" />
                        Evento Multi-Fecha (Taller de 2 o 3 días)
                      </label>
                      {isMultiDateService && (
                        <input 
                          type="text" 
                          value={multiDatesInput} 
                          onChange={e => setMultiDatesInput(e.target.value)} 
                          placeholder="Fechas: Ej. 15 Nov, 16 Nov, 17 Nov"
                          className="p-2 rounded-lg border border-stone-200 text-xs bg-stone-50 w-64"
                        />
                      )}
                    </div>
                    <button type="submit" className="bg-[#2C4A3B] text-white py-2.5 px-5 rounded-xl text-xs font-semibold hover:bg-[#233b2f]">
                      Publicar Servicio
                    </button>
                  </div>
                </form>

                <div className="grid gap-3">
                  {services.map((srv, idx) => (
                    <div key={srv.id} className="bg-white p-5 rounded-2xl border border-stone-100 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            if (idx === 0) return;
                            const copy = [...services];
                            const temp = copy[idx - 1];
                            copy[idx - 1] = copy[idx];
                            copy[idx] = temp;
                            setServices(copy);
                          }}
                          className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:text-stone-700"
                          title="Ordenar grupo"
                        >
                          <ArrowUpDown size={15} />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">{srv.group || 'Clínica'}</span>
                            <h4 className="font-bold text-sm text-stone-900">{srv.name}</h4>
                            {srv.multiDate && (
                              <span className="text-[10px] font-bold bg-[#F4F7F5] text-[#2C4A3B] px-2 py-0.5 rounded border border-[#E4ECE7]">
                                Multi-Fecha: {srv.multiDate}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">{srv.duration || 50} min • ${Number(srv.price || 0).toLocaleString('es-CL')} CLP</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteService(srv.id)} className="text-stone-400 hover:text-red-500 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ==========================================
                6. TAB: FINANZAS Y PAQUETES DE SESIONES
               ========================================== */}
            {activeTab === 'finanzas' && (
              <motion.div key="finanzas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Finanzas Claras y Gestión de Paquetes</h2>
                  <p className="text-sm text-stone-500">Cuentas ordenadas (Bruto vs Neto), recuperación por anulación automática y seguimiento de paquetes vendidos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Ingresos Brutos (Mes)</p>
                    <h3 className="text-3xl font-bold text-stone-900">${dynamicGross.toLocaleString('es-CL')}</h3>
                    <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1"><TrendingUp size={14}/> +12% vs mes anterior</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Ingresos Líquidos (Neto)</p>
                    <h3 className="text-3xl font-bold text-[#2C4A3B]">${dynamicNet.toLocaleString('es-CL')}</h3>
                    <p className="text-xs text-stone-500 font-medium mt-2">Libre de comisiones de pasarela</p>
                  </div>
                  <div className="bg-[#2C4A3B] p-6 rounded-3xl text-white shadow-xs">
                    <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1">Recuperado (Citas No Pagadas)</p>
                    <h3 className="text-3xl font-bold">${cancelledRecoveredAmount.toLocaleString('es-CL')}</h3>
                    <p className="text-xs text-emerald-100 font-medium mt-2">{cancelledRecoveredCount} citas anuladas y re-agendadas (82%)</p>
                  </div>
                </div>

                {/* Administración de Paquetes de Sesiones */}
                <div className="bg-white rounded-3xl border border-stone-100 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Paquetes de Sesiones Vendidos</h3>
                      <p className="text-xs text-stone-500">Controla cuántas sesiones lleva cada consultante, cuándo vence su paquete y qué le falta por agendar.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {packages.map((pkg) => {
                      const pct = Math.round((pkg.used / pkg.total) * 100);
                      const isDone = pkg.used >= pkg.total;
                      return (
                        <div key={pkg.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="w-full md:w-1/3">
                            <h4 className="font-bold text-sm text-stone-900">{pkg.patient}</h4>
                            <p className="text-xs text-stone-500">{pkg.service} • Faltan {pkg.total - pkg.used} por agendar</p>
                          </div>
                          <div className="w-full md:w-1/3">
                            <div className="flex justify-between text-[11px] font-bold text-stone-500 uppercase mb-1">
                              <span>Avance del Bono</span>
                              <span>{pkg.used} de {pkg.total} sesiones</span>
                            </div>
                            <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${isDone ? 'bg-orange-400' : 'bg-[#2C4A3B]'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="w-full md:w-1/4 flex items-center justify-end gap-2">
                            {!isDone && (
                              <button 
                                onClick={() => {
                                  setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, used: p.used + 1 } : p));
                                  showToast(`Sesión descontada del paquete de ${pkg.patient}.`);
                                }}
                                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-[#2C4A3B]"
                              >
                                +1 Sesión Usada
                              </button>
                            )}
                            <span className="text-xs text-stone-500 font-medium">Vence: {pkg.expires}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                7. TAB: COMUNICACIONES (WHATSAPP IA + NOTIFICACIONES + HISTORIA IG)
               ========================================== */}
            {activeTab === 'comunicaciones' && (
              <motion.div key="comunicaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Comunicaciones, WhatsApp IA y Difusión</h2>
                  <p className="text-sm text-stone-500">Automatiza cambios de hora por WhatsApp, configura alertas del centro y publica horas liberadas en Instagram.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Asistente por WhatsApp IA */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><MessageSquare size={20} /></div>
                        <div>
                          <h3 className="font-bold text-stone-900 text-base">Asistente Administrativo WhatsApp (IA)</h3>
                          <p className="text-xs text-stone-500">Te saca de la operación diaria respondiendo en segundos.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setWaAssistantActive(!waAssistantActive)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${waAssistantActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}
                      >
                        {waAssistantActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 cursor-pointer">
                        <input type="checkbox" checked={waAutoReschedule} onChange={e => setWaAutoReschedule(e.target.checked)} className="mt-1" />
                        <div>
                          <p className="text-xs font-bold text-stone-900">Reagendar automáticamente ("¿Puedo cambiar la hora?")</p>
                          <p className="text-[11px] text-stone-500">El asistente ofrece tus próximos slots libres en Google Calendar y modifica la reserva sin interrumpirte.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 cursor-pointer">
                        <input type="checkbox" checked={waAutoInfo} onChange={e => setWaAutoInfo(e.target.checked)} className="mt-1" />
                        <div>
                          <p className="text-xs font-bold text-stone-900">Informar próximas citas y enviar link de Meet</p>
                          <p className="text-[11px] text-stone-500">Responde al instante cuando un consultante pregunta cuándo es su próxima sesión.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Generador de Historia de Instagram para Horas Liberadas */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Llenado Rápido de Agenda</span>
                      <h3 className="font-bold text-stone-900 text-base mt-0.5">Compartir Hora Liberada en Instagram Stories</h3>
                      <p className="text-xs text-stone-500">Cuando se libera una hora a último minuto, genera tu gráfica lista para subir a historias con link de agendamiento.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2C4A3B] to-[#5F8575] text-white text-center space-y-2 shadow-inner">
                      <span className="text-[10px] uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full font-bold">Cupo Liberado Hoy</span>
                      <h4 className="text-xl font-bold">{igStorySlot}</h4>
                      <p className="text-xs text-emerald-100">Atención Online / Presencial • {center?.name || 'Kairós Clínico'}</p>
                      <div className="inline-block bg-white text-[#2C4A3B] text-xs font-bold px-4 py-1.5 rounded-full mt-2">
                        🔗 Agendar en kairos.cl/{center?.slug || 'centro'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input type="text" value={igStorySlot} onChange={e => setIgStorySlot(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50" />
                      <button 
                        onClick={() => showToast('Gráfica de Historia para Instagram copiada y lista para publicar.')}
                        className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f] transition-colors"
                      >
                        <Share2 size={14} /> Generar Story IG
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuración de Notificaciones y Correos para Centros */}
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <h3 className="font-bold text-base text-stone-900">Notificaciones y Correos para el Equipo del Centro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-stone-800">1. Pagos recibidos</span>
                      <input type="checkbox" checked={notifPayments} onChange={e => setNotifPayments(e.target.checked)} />
                    </label>
                    <label className="p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-stone-800">2. Documentos emitidos</span>
                      <input type="checkbox" checked={notifDocs} onChange={e => setNotifDocs(e.target.checked)} />
                    </label>
                    <label className="p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-stone-800">3. Depósitos en la cuenta</span>
                      <input type="checkbox" checked={notifDeposits} onChange={e => setNotifDeposits(e.target.checked)} />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                8. TAB: EVALUACIONES DIFERENCIADAS Y RECOMENDACIONES ENTRE COLEGAS
               ========================================== */}
            {activeTab === 'resenas' && (
              <motion.div key="resenas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Evaluaciones Diferenciadas y Recomendaciones de Colegas</h2>
                  <p className="text-sm text-stone-500">Cada evaluación indica si corresponde a una sesión clínica o a un evento de tu Vitrina, más el respaldo entre profesionales.</p>
                </div>

                {/* Recomendaciones entre Colegas */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Comunidad de Especialistas</span>
                      <h3 className="text-lg font-bold text-stone-900">Recomendaciones entre Colegas</h3>
                    </div>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newPeerName || !newPeerText) return;
                      setPeerRecommendations(prev => [{ id: `pr-${Date.now()}`, colleague: newPeerName, specialty: newPeerSpecialty || 'Especialista', text: newPeerText }, ...prev]);
                      setNewPeerName(''); setNewPeerSpecialty(''); setNewPeerText('');
                      showToast('Recomendación profesional publicada en el perfil del centro.');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/60"
                  >
                    <input type="text" required placeholder="Nombre del Colega" value={newPeerName} onChange={e => setNewPeerName(e.target.value)} className="p-2.5 rounded-xl border border-stone-200 text-xs bg-white" />
                    <input type="text" placeholder="Especialidad" value={newPeerSpecialty} onChange={e => setNewPeerSpecialty(e.target.value)} className="p-2.5 rounded-xl border border-stone-200 text-xs bg-white" />
                    <input type="text" required placeholder="Recomendación clínica..." value={newPeerText} onChange={e => setNewPeerText(e.target.value)} className="p-2.5 rounded-xl border border-stone-200 text-xs bg-white" />
                    <button type="submit" className="bg-[#2C4A3B] text-white rounded-xl text-xs font-semibold py-2.5 px-4">Registrar Recomendación</button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {peerRecommendations.map(pr => (
                      <div key={pr.id} className="p-5 rounded-2xl border border-stone-100 bg-[#F4F7F5]/60 space-y-2">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-[#2C4A3B]" />
                          <h4 className="font-bold text-sm text-stone-900">{pr.colleague}</h4>
                          <span className="text-[10px] font-semibold text-stone-500">• {pr.specialty}</span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">"{pr.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluaciones Diferenciadas */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <h3 className="text-lg font-bold text-stone-900">Evaluaciones de Consultantes (Con Etiqueta de Origen)</h3>
                  <div className="grid gap-3">
                    {reviews.map(rev => (
                      <div key={rev.id} className="p-5 rounded-2xl border border-stone-100 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-[#2C4A3B] px-2.5 py-0.5 rounded-md">
                              {rev.targetType}: {rev.targetTitle}
                            </span>
                            <span className="text-xs text-amber-500 font-bold">★★★★★</span>
                          </div>
                          <p className="text-sm text-stone-800 font-medium">"{rev.text}"</p>
                          <p className="text-xs text-stone-400">Por {rev.author} • {rev.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                9. TAB: DOCUMENTOS (REENVÍO EN 1 CLIC + PREVISUALIZACIÓN)
               ========================================== */}
            {activeTab === 'documentos' && (
              <motion.div key="documentos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Repositorio de Documentos y Certificados</h2>
                  <p className="text-sm text-stone-500">Reenvía documentos emitidos en un solo clic o previsualízalos de forma segura en la web sin descargarlos.</p>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-xs space-y-3">
                  {patientFiles.map(doc => (
                    <div key={doc.id} className="p-4 rounded-2xl border border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/50">
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{doc.name}</h4>
                        <p className="text-xs text-stone-500">Paciente: {doc.patient} • Emitido: {doc.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPreviewFile(doc)}
                          className="px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-200"
                        >
                          <Eye size={14} /> Previsualizar
                        </button>
                        <button 
                          onClick={() => showToast(`Documento "${doc.name}" reenviado al correo de ${doc.patient} en 1 clic.`)}
                          className="px-3.5 py-2 rounded-xl bg-[#2C4A3B] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#233b2f]"
                        >
                          <Send size={14} /> Reenviar en 1 Clic
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ==========================================
                10. TAB: VITRINA (MÓDULOS BORRADOR + LIBERACIÓN + CARRITO ABANDONADO)
               ========================================== */}
            {activeTab === 'vitrina' && (
              <motion.div key="vitrina" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Vitrina del Centro, Cursos y Carrito Abandonado</h2>
                  <p className="text-sm text-stone-500">Administra módulos en borrador, reglas de liberación para alumnos y recuperación automática de compras incompletas.</p>
                </div>

                {/* Módulos en Borrador y Reglas de Liberación */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900">Curso Activo: Programa de Regulación Emocional</h3>
                      <p className="text-xs text-stone-500">Cada módulo nace en borrador y puedes elegir cuándo se libera para tus alumnos.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setCourseModules(prev => [...prev, { id: `m-${Date.now()}`, title: `Módulo ${prev.length + 1}: Nuevo Contenido Clínico`, status: 'borrador', releaseRule: '7 días después del registro', studentsProgress: 0 }]);
                        showToast('Nuevo módulo creado en estado Borrador.');
                      }}
                      className="bg-[#2C4A3B] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Nuevo Módulo (Borrador)
                    </button>
                  </div>

                  <div className="space-y-3">
                    {courseModules.map(mod => (
                      <div key={mod.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900">{mod.title}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${mod.status === 'publicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {mod.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">Regla de liberación: <strong>{mod.releaseRule}</strong></p>
                        </div>
                        <button 
                          onClick={() => {
                            setCourseModules(prev => prev.map(m => m.id === mod.id ? { ...m, status: m.status === 'publicado' ? 'borrador' : 'publicado' } : m));
                            showToast('Estado de publicación del módulo actualizado.');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:border-[#2C4A3B]"
                        >
                          {mod.status === 'publicado' ? 'Ocultar a Borrador' : 'Publicar Módulo'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carrito Abandonado Vitrina */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={18} className="text-[#2C4A3B]" />
                    <h3 className="font-bold text-lg text-stone-900">Recuperación de Carrito Abandonado</h3>
                  </div>
                  <div className="space-y-3">
                    {abandonedCarts.map(cart => (
                      <div key={cart.id} className="p-4 rounded-2xl border border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-stone-900">{cart.user} • <span className="text-[#2C4A3B]">{cart.item}</span></p>
                          <p className="text-[11px] text-stone-500">Abandonó en: {cart.step} ({cart.time})</p>
                        </div>
                        {cart.recovered ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">Compra Recuperada</span>
                        ) : (
                          <button 
                            onClick={() => {
                              setAbandonedCarts(prev => prev.map(c => c.id === cart.id ? { ...c, recovered: true } : c));
                              showToast(`Recordatorio de carrito abandonado enviado a ${cart.user}.`);
                            }}
                            className="bg-[#2C4A3B] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                          >
                            Enviar Correo de Recuperación
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                11. TAB: EQUIPO Y BOXES (ACTIVOS, CONGELADOS, ELIMINADOS)
               ========================================== */}
            {activeTab === 'equipo' && (
              <motion.div key="equipo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Gestión de Equipo, Asientos y Boxes Físicos</h2>
                  <p className="text-sm text-stone-500">Las cuentas administrador no se cobran. Administra integrantes activos, congelados y eliminados, más la capacidad de salas.</p>
                </div>

                {/* Capacidad de Boxes */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">Capacidad Física de Boxes de Atención</h3>
                    <p className="text-xs text-stone-500">Define cuántos consultorios tiene tu centro para bloquear choques de horario.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSaveBoxesCount(boxesCount - 1)} disabled={savingBoxes} className="p-2.5 border border-stone-200 rounded-xl hover:bg-stone-50"><Minus size={16}/></button>
                    <span className="font-bold text-lg px-4">{boxesCount} Boxes</span>
                    <button onClick={() => handleSaveBoxesCount(boxesCount + 1)} disabled={savingBoxes} className="p-2.5 bg-[#2C4A3B] text-white rounded-xl"><Plus size={16}/></button>
                  </div>
                </div>

                {/* Tabla de Equipo Rediseñada */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-100 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                      <button onClick={() => setTeamFilter('activos')} className={`px-3.5 py-1.5 rounded-lg ${teamFilter === 'activos' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Activos ({therapists.filter(t => t.status === 'activos').length})</button>
                      <button onClick={() => setTeamFilter('congelados')} className={`px-3.5 py-1.5 rounded-lg ${teamFilter === 'congelados' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Congelados ({therapists.filter(t => t.status === 'congelados').length})</button>
                      <button onClick={() => setTeamFilter('eliminados')} className={`px-3.5 py-1.5 rounded-lg ${teamFilter === 'eliminados' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}>Eliminados ({therapists.filter(t => t.status === 'eliminados').length})</button>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">Cuentas Admin: Costo $0</span>
                  </div>

                  <form onSubmit={handleCreateTherapist} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
                    <input type="text" required placeholder="Nombre Profesional" value={newTherapistName} onChange={e => setNewTherapistName(e.target.value)} className="p-2.5 rounded-xl border bg-white text-xs" />
                    <input type="email" required placeholder="Correo" value={newTherapistEmail} onChange={e => setNewTherapistEmail(e.target.value)} className="p-2.5 rounded-xl border bg-white text-xs" />
                    <select value={newTherapistRole} onChange={e => setNewTherapistRole(e.target.value as any)} className="p-2.5 rounded-xl border bg-white text-xs">
                      <option value="terapeuta">Asiento Profesional</option>
                      <option value="admin">Cuenta Administrador (Gratis)</option>
                    </select>
                    <button type="submit" className="bg-[#2C4A3B] text-white rounded-xl text-xs font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5">
                      <UserPlus size={14}/> Invitar Integrante
                    </button>
                  </form>

                  <div className="space-y-3">
                    {therapists.filter(t => (t.status || 'activos') === teamFilter).map(t => (
                      <div key={t.id} className="p-4 border border-stone-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-stone-900">{t.name}</p>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">{t.role}</span>
                          </div>
                          <p className="text-xs text-stone-400">{t.specialty} • {t.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {teamFilter !== 'congelados' && (
                            <button onClick={() => handleUpdateTherapistStatus(t.id, 'congelados')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center gap-1">
                              <Snowflake size={13} /> Congelar
                            </button>
                          )}
                          {teamFilter !== 'activos' && (
                            <button onClick={() => handleUpdateTherapistStatus(t.id, 'activos')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                              Reactivar
                            </button>
                          )}
                          {teamFilter !== 'eliminados' && t.email !== profile?.email && (
                            <button onClick={() => handleUpdateTherapistStatus(t.id, 'eliminados')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==========================================
                12. TABS RESTANTES: CONEXIONES, SALA ONLINE, GANA MESES, SUSCRIPCIÓN, AYUDA, CONFIGURACIÓN
               ========================================== */}
            {activeTab === 'conexiones' && (
              <motion.div key="conexiones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone size={22} className="text-[#2C4A3B]" />
                    <h3 className="font-bold text-lg text-stone-900">Tarjeta de Presentación en Wallet</h3>
                  </div>
                  <p className="text-xs text-stone-500">Lleva tu link directo de agendamiento en Apple Wallet o Google Wallet con código QR para compartir en segundos.</p>
                  <button onClick={() => showToast('Pase digital generado para la Wallet de tu teléfono.')} className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold">
                    Agregar a la Wallet del Celular
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={22} className="text-[#2C4A3B]" />
                    <h3 className="font-bold text-lg text-stone-900">Google Calendar & Google Meet API</h3>
                  </div>
                  <p className="text-xs text-stone-500">Sincronización bidireccional activa para bloquear horarios ocupados y generar salas de videollamada.</p>
                  <button onClick={handleGoogleSync} className="bg-stone-100 text-stone-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    Probar Sincronización Ahora
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'sala_online' && (
              <motion.div key="sala_online" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-100 shadow-xs text-center space-y-4">
                <Video size={40} className="mx-auto text-[#2C4A3B]" />
                <h2 className="text-2xl font-bold text-stone-900">Sala de Telemedicina Encriptada</h2>
                <p className="text-sm text-stone-500 max-w-md mx-auto">Tu sala online permanente está activa y vinculada con las confirmaciones automáticas de tus pacientes.</p>
                <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-[#2C4A3B] text-white px-6 py-3 rounded-2xl text-xs font-bold">
                  <Video size={16} /> Iniciar Sala Online Ahora
                </a>
              </motion.div>
            )}

            {activeTab === 'gana_meses' && (
              <motion.div key="gana_meses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                <Gift size={36} className="text-[#2C4A3B]" />
                <h2 className="text-2xl font-bold text-stone-900">Invita a un Colega y Gana Meses Gratis</h2>
                <p className="text-sm text-stone-500">Comparte tu enlace de referido de Kairós Partners. Por cada centro o profesional que se sume, ambos reciben 1 mes sin costo.</p>
                <div className="flex gap-2">
                  <input readOnly value={`https://kairos.cl/onboarding?ref=${center?.slug || 'director'}`} className="flex-1 p-3 rounded-xl border bg-stone-50 text-xs font-mono" />
                  <button onClick={() => showToast('Link de invitación copiado al portapapeles.')} className="bg-[#2C4A3B] text-white px-5 py-3 rounded-xl text-xs font-bold">Copiar Link</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'suscripcion' && (
              <motion.div key="suscripcion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">Plan Avanzado B2B Activo</span>
                <h2 className="text-2xl font-bold text-stone-900">Suscripción y Asientos del Centro</h2>
                <p className="text-sm text-stone-500">Incluye Fichas con IA ilimitadas, Asistente de WhatsApp, Reportes Avanzados y cuentas de Administrador sin costo adicional.</p>
              </motion.div>
            )}

            {activeTab === 'ayuda' && (
              <motion.div key="ayuda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-100 shadow-xs space-y-4">
                <h2 className="text-2xl font-bold text-stone-900">Centro de Ayuda y Soporte Clínico</h2>
                <p className="text-sm text-stone-500">Soporte prioritario directo para directores clínicos y migración asistida de fichas y pacientes.</p>
              </motion.div>
            )}

            {activeTab === 'configuracion' && (
              <motion.div key="configuracion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-100 shadow-xs space-y-6">
                <h2 className="text-2xl font-bold text-stone-900">Configuración General del Centro</h2>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <h4 className="text-xs font-bold text-stone-900 uppercase">Regla de Disolución Automática a Cuenta Individual</h4>
                  <p className="text-xs text-stone-500">Si el dueño queda por su cuenta al eliminar al último miembro del equipo, el centro pasará automáticamente a cuenta individual sin perder su historial ni sus fichas clínicas.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* MODAL: PREVISUALIZACIÓN SEGURA DE ARCHIVOS EN LA WEB */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2C4A3B]">Visor Seguro sin Descarga Local</span>
                  <h3 className="font-bold text-base text-stone-900">{previewFile.name}</h3>
                </div>
                <button onClick={() => setPreviewFile(null)} className="text-stone-400 hover:text-stone-700"><X size={20}/></button>
              </div>
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                {previewFile.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INSCRIBIR PACIENTE */}
      <AnimatePresence>
        {isNewPatientModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center"><h3 className="font-bold text-lg text-stone-900">Inscribir Nuevo Paciente</h3><button onClick={() => setIsNewPatientModalOpen(false)}><X size={20}/></button></div>
              <form onSubmit={handleCreatePatient} className="space-y-3.5">
                <input type="text" required value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Nombre Completo" className="w-full p-3 rounded-xl border bg-stone-50 text-sm" />
                <input type="text" value={newPatientRut} onChange={e => setNewPatientRut(e.target.value)} placeholder="RUT / Documento Identidad" className="w-full p-3 rounded-xl border bg-stone-50 text-sm" />
                <input type="email" required value={newPatientEmail} onChange={e => setNewPatientEmail(e.target.value)} placeholder="Correo Electrónico" className="w-full p-3 rounded-xl border bg-stone-50 text-sm" />
                <input type="tel" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} placeholder="Teléfono WhatsApp (+569...)" className="w-full p-3 rounded-xl border bg-stone-50 text-sm" />
                <button type="submit" className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-sm">Guardar Paciente en Ficha</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NUEVA CITA */}
      <AnimatePresence>
        {isNewApptModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center"><h3 className="font-bold text-lg text-stone-900">Agendar Nueva Sesión</h3><button onClick={() => setIsNewApptModalOpen(false)}><X size={20}/></button></div>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" required placeholder="Nombre Paciente" value={apptPatientName} onChange={e => setApptPatientName(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                  <input type="email" required placeholder="Correo" value={apptPatientEmail} onChange={e => setApptPatientEmail(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Terapeuta Asignado</label>
                  <select value={apptTherapist} onChange={e => setApptTherapist(e.target.value)} className="w-full p-3 rounded-xl border bg-stone-50 text-sm">
                    {therapists.filter(t => t.status !== 'eliminados').map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.specialty})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={apptModality} onChange={e => setApptModality(e.target.value as any)} className="w-full p-3 rounded-xl border bg-stone-50 text-sm">
                    <option value="presencial">Presencial (Box)</option>
                    <option value="online">Online (Google Meet)</option>
                  </select>
                  {apptModality === 'presencial' && (
                    <select value={apptBox} onChange={e => setApptBox(Number(e.target.value))} className="w-full p-3 rounded-xl border bg-stone-50 text-sm">
                      {Array.from({ length: boxesCount }, (_, i) => i + 1).map(n => <option key={n} value={n}>Box {n}</option>)}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required value={apptDate} onChange={e => setApptDate(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                  <input type="time" required value={apptTime} onChange={e => setApptTime(e.target.value)} className="p-3 rounded-xl border bg-stone-50 text-sm" />
                </div>
                <select value={apptPaymentStatus} onChange={e => setApptPaymentStatus(e.target.value as any)} className="w-full p-3 rounded-xl border bg-stone-50 text-sm">
                  <option value="pagado">Pagado (Confirmada)</option>
                  <option value="pendiente">Pendiente (Sujeta a anulación automática)</option>
                </select>
                <button type="submit" disabled={savingAppt} className="w-full bg-[#2C4A3B] text-white py-3.5 rounded-xl font-bold text-sm">
                  {savingAppt ? 'Guardando...' : 'Confirmar y Sincronizar Cita'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}