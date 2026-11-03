'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Stethoscope,
  FileText,
  MessageSquare,
  Wallet,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  CreditCard,
  Ban,
  Plus,
  Send,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  Building2,
  GripVertical,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  UserPlus,
  Filter,
} from 'lucide-react';

// Importación de tus módulos existentes en components/admin
import DocumentosTabRaw from '@/components/admin/DocumentosTab';
import ComunicacionesTabRaw from '@/components/admin/ComunicacionesTab';

const DocumentosTab = DocumentosTabRaw as React.ComponentType<any>;
const ComunicacionesTab = ComunicacionesTabRaw as React.ComponentType<any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID || 'kairos-main';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type AdminModule =
  | 'dashboard'
  | 'agenda'
  | 'pacientes'
  | 'profesionales'
  | 'documentos'
  | 'comunicaciones'
  | 'finanzas';

type ModalityType = 'Online' | 'Presencial';
type PaymentStatus = 'Pagado' | 'Pendiente';
type ClinicalStatus = 'Confirmada' | 'En Espera' | 'En Consulta' | 'Atendida' | 'No Asistió';

interface ProfessionalConfig {
  id: string;
  name: string;
  specialty: string;
  rut: string;
  email: string;
  avatar: string;
  workingDays: number[]; // 1 = Lun ... 6 = Sáb
  startHour: string;
  endHour: string;
  modalityMode: 'Ambas (Híbrido)' | 'Solo Online' | 'Solo Presencial';
  presencialAddress: string;
  onlineRoomUrl: string;
  basePrice: number;
}

interface AppointmentItem {
  id: string;
  patientName: string;
  patientRUT: string;
  patientEmail: string;
  patientPhone: string;
  professionalId: string;
  serviceName: string;
  modality: ModalityType;
  dayIndex: number; // 1 = Lun ... 6 = Sáb
  isoDate: string;
  time: string;
  price: number;
  paymentStatus: PaymentStatus;
  clinicalStatus: ClinicalStatus;
  notes?: string;
}

interface BlockedSlot {
  id: string;
  professionalId: string;
  dayIndex: number;
  time: string;
  reason: string;
}

const CLINICAL_SERVICES = [
  { name: 'Psicoterapia Individual', price: 45000, duration: '50 min' },
  { name: 'Terapia de Pareja / Familiar', price: 60000, duration: '60 min' },
  { name: 'Evaluación Psicodiagnóstica', price: 55000, duration: '60 min' },
  { name: 'Consulta Psiquiátrica', price: 75000, duration: '45 min' },
  { name: 'Psicoterapia Infanto-Juvenil', price: 48000, duration: '50 min' },
];

const WEEK_DAYS = [
  { index: 1, short: 'Lun', label: 'Lunes', dateNum: '09', iso: '2026-11-09' },
  { index: 2, short: 'Mar', label: 'Martes', dateNum: '10', iso: '2026-11-10' },
  { index: 3, short: 'Mié', label: 'Miércoles', dateNum: '11', iso: '2026-11-11' },
  { index: 4, short: 'Jue', label: 'Jueves', dateNum: '12', iso: '2026-11-12' },
  { index: 5, short: 'Vie', label: 'Viernes', dateNum: '13', iso: '2026-11-13' },
  { index: 6, short: 'Sáb', label: 'Sábado', dateNum: '14', iso: '2026-11-14' },
];

const ALL_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

const INITIAL_PROFESSIONALS: ProfessionalConfig[] = [
  {
    id: 'prof-1',
    name: 'Dr. Alejandro Kairós',
    specialty: 'Psicoterapia Clínica & Ansiedad',
    rut: '15.432.890-K',
    email: 'alejandro@kairosclinico.cl',
    avatar: 'AK',
    workingDays: [1, 2, 3, 4, 5],
    startHour: '09:00',
    endHour: '18:00',
    modalityMode: 'Ambas (Híbrido)',
    presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
    onlineRoomUrl: 'https://meet.google.com/kairos-alejandro',
    basePrice: 45000,
  },
  {
    id: 'prof-2',
    name: 'Ps. Valentina Montt',
    specialty: 'Terapia Cognitivo-Conductual',
    rut: '17.890.123-4',
    email: 'valentina@kairosclinico.cl',
    avatar: 'VM',
    workingDays: [1, 2, 3, 4, 5, 6],
    startHour: '10:00',
    endHour: '19:00',
    modalityMode: 'Ambas (Híbrido)',
    presencialAddress: 'Av. Alonso de Córdova 5870, Of. 702, Las Condes',
    onlineRoomUrl: 'https://meet.google.com/kairos-valentina',
    basePrice: 40000,
  },
  {
    id: 'prof-3',
    name: 'Ps. Martín Arriagada',
    specialty: 'Terapia Sistémica & Parejas',
    rut: '16.221.450-8',
    email: 'martin@kairosclinico.cl',
    avatar: 'MA',
    workingDays: [2, 3, 4, 5],
    startHour: '09:00',
    endHour: '18:00',
    modalityMode: 'Solo Online',
    presencialAddress: 'Atención Exclusiva Online',
    onlineRoomUrl: 'https://meet.google.com/kairos-martin',
    basePrice: 50000,
  },
];

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-101',
    patientName: 'Camila Vergara',
    patientRUT: '18.456.789-2',
    patientEmail: 'camila@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-1',
    serviceName: 'Psicoterapia Individual',
    modality: 'Presencial',
    dayIndex: 1,
    isoDate: '2026-11-09',
    time: '10:00',
    price: 45000,
    paymentStatus: 'Pagado',
    clinicalStatus: 'Confirmada',
    notes: 'Primera sesión presencial en box 1204.',
  },
  {
    id: 'apt-102',
    patientName: 'Matías Errázuriz',
    patientRUT: '16.789.234-5',
    patientEmail: 'matias@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-1',
    serviceName: 'Terapia de Pareja / Familiar',
    modality: 'Online',
    dayIndex: 2,
    isoDate: '2026-11-10',
    time: '11:00',
    price: 60000,
    paymentStatus: 'Pendiente',
    clinicalStatus: 'Confirmada',
    notes: 'Enviar link de Google Meet 15 min antes.',
  },
  {
    id: 'apt-103',
    patientName: 'Sofía Domínguez',
    patientRUT: '19.321.654-8',
    patientEmail: 'sofia@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-1',
    serviceName: 'Evaluación Psicodiagnóstica',
    modality: 'Presencial',
    dayIndex: 4,
    isoDate: '2026-11-12',
    time: '16:00',
    price: 55000,
    paymentStatus: 'Pendiente',
    clinicalStatus: 'En Espera',
    notes: 'Aplicación de batería diagnóstica.',
  },
];

export default function AdminDashboardPage() {
  // Navegación de la Barra Lateral
  const [activeModule, setActiveModule] = useState<AdminModule>('agenda');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalityFilter, setPatientModalityFilter] = useState<'Todas' | ModalityType>('Todas');

  // Datos principales
  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(INITIAL_PROFESSIONALS);
  const [selectedProfId, setSelectedProfId] = useState<string>(INITIAL_PROFESSIONALS[0].id);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([
    {
      id: 'blk-1',
      professionalId: 'prof-1',
      dayIndex: 3,
      time: '13:00',
      reason: 'Almuerzo / Supervisión Clínica',
    },
  ]);

  // Estado Drag & Drop
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Estado Menú Contextual (Clic Derecho en el Calendario)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    apt: AppointmentItem;
  } | null>(null);

  // Modal de Celda Vacía (Agendar Paciente o Bloquear Horario)
  const [slotModal, setSlotModal] = useState<{
    dayIndex: number;
    isoDate: string;
    dayLabel: string;
    time: string;
  } | null>(null);
  const [slotActionMode, setSlotActionMode] = useState<'book' | 'block'>('book');
  const [blockReasonInput, setBlockReasonInput] = useState('Bloqueo Personal / Almuerzo');

  // Modal de Nuevo Profesional
  const [showNewProfModal, setShowNewProfModal] = useState(false);
  const [newProfForm, setNewProfForm] = useState({
    name: '',
    specialty: 'Psicoterapia Clínica',
    rut: '',
    email: '',
    modalityMode: 'Ambas (Híbrido)' as ProfessionalConfig['modalityMode'],
    presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
    onlineRoomUrl: 'https://meet.google.com/kairos-sala',
    basePrice: 45000,
  });

  const [newBookingForm, setNewBookingForm] = useState({
    patientName: '',
    patientRUT: '',
    patientEmail: '',
    patientPhone: '56961699991',
    serviceName: CLINICAL_SERVICES[0].name,
    modality: 'Online' as ModalityType,
    paymentStatus: 'Pendiente' as PaymentStatus,
    notes: '',
  });

  // Notificación Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    detail?: string;
    type: 'success' | 'warn';
  } | null>(null);

  const showToast = (title: string, detail?: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ title, detail, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Carga y sincronización local + Supabase
  useEffect(() => {
    const savedProfs = localStorage.getItem('kairos_profs_v3');
    const savedApts = localStorage.getItem('kairos_apts_v3');
    const savedBlocks = localStorage.getItem('kairos_blocks_v3');
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedApts) setAppointments(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_profs_v3', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kairos_apts_v3', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('kairos_blocks_v3', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const currentProf = useMemo(
    () => professionals.find((p) => p.id === selectedProfId) || professionals[0],
    [professionals, selectedProfId]
  );

  const visibleHours = useMemo(() => {
    return ALL_HOURS.filter((h) => h >= currentProf.startHour && h <= currentProf.endHour);
  }, [currentProf]);

  // Filtro de pacientes para el directorio
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.patientEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModality =
        patientModalityFilter === 'Todas' || a.modality === patientModalityFilter;
      return matchesSearch && matchesModality;
    });
  }, [appointments, searchQuery, patientModalityFilter]);

  // Métricas financieras y operativas
  const metrics = useMemo(() => {
    const totalPagado = appointments
      .filter((a) => a.paymentStatus === 'Pagado')
      .reduce((acc, cur) => acc + cur.price, 0);
    const totalPendiente = appointments
      .filter((a) => a.paymentStatus === 'Pendiente')
      .reduce((acc, cur) => acc + cur.price, 0);
    const onlineCount = appointments.filter((a) => a.modality === 'Online').length;
    const presencialCount = appointments.filter((a) => a.modality === 'Presencial').length;
    return { totalPagado, totalPendiente, onlineCount, presencialCount };
  }, [appointments]);

  // Disparador de confirmación transaccional (Email + WhatsApp API v25.0)
  const triggerNotificationForApt = async (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) || currentProf;
    const locationAddress =
      apt.modality === 'Presencial' ? prof.presencialAddress : prof.onlineRoomUrl;

    showToast(
      'Despachando confirmación omnicanal...',
      `Enviando correo y WhatsApp a ${apt.patientName}`
    );

    try {
      const res = await fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: apt.patientName,
          patientEmail: apt.patientEmail,
          patientPhone: apt.patientPhone,
          date: `${WEEK_DAYS.find((d) => d.index === apt.dayIndex)?.label || ''} ${apt.isoDate}`,
          isoDate: apt.isoDate,
          time: apt.time,
          serviceName: apt.serviceName,
          modality:
            apt.modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Videollamada)',
          locationAddress,
          professionalName: prof.name,
          centerName: 'Kairós Clínico',
        }),
      });

      const data = await res.json();
      if (data.diagnostics) {
        const { emailSent, emailError, whatsappSent, whatsappError } = data.diagnostics;
        if (emailSent && whatsappSent) {
          showToast(
            'WhatsApp y Correo entregados',
            `Ubicación enviada: ${locationAddress}`,
            'success'
          );
        } else if (emailSent && !whatsappSent) {
          showToast(
            'Correo entregado · Revisar Token WhatsApp',
            `Meta API: ${whatsappError}. Usa "WhatsApp Directo" en el menú contextual.`,
            'warn'
          );
        } else if (!emailSent && whatsappSent) {
          showToast('WhatsApp entregado · Alerta en Resend', `${emailError}`, 'warn');
        } else {
          showToast(
            'Atención en credenciales API',
            `Email: ${emailError || 'Error'} | Meta: ${whatsappError || 'Renovar token'}`,
            'warn'
          );
        }
      }
    } catch (error) {
      showToast('Error de conexión con el endpoint', 'Verifica las variables en Vercel', 'warn');
    }
  };

  // Envío por WhatsApp Web con mensaje clínico y dirección presencial / link
  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) || currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección Presencial: ${prof.presencialAddress}`
        : `💻 Link Videollamada: ${prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *Kairós Clínico* para confirmar tu cita de *${apt.serviceName}* (${apt.modality}) con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}\n\n¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Funciones Drag & Drop para mover citas en el calendario
  const handleDragStart = (e: React.DragEvent, aptId: string) => {
    setDraggedAptId(aptId);
    e.dataTransfer.setData('text/plain', aptId);
  };

  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;

    if (!currentProf.workingDays.includes(dayIndex)) {
      showToast('Día inactivo', `${currentProf.name} no tiene agenda abierta ese día.`, 'warn');
      setDraggedAptId(null);
      return;
    }

    const isBlocked = blockedSlots.some(
      (b) => b.professionalId === selectedProfId && b.dayIndex === dayIndex && b.time === time
    );
    const isOccupied = appointments.some(
      (a) =>
        a.professionalId === selectedProfId &&
        a.dayIndex === dayIndex &&
        a.time === time &&
        a.id !== draggedAptId
    );

    if (isBlocked || isOccupied) {
      showToast('Bloque ocupado', 'No puedes soltar una cita sobre un horario bloqueado u ocupado.', 'warn');
      setDraggedAptId(null);
      return;
    }

    const movedApt = appointments.find((a) => a.id === draggedAptId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === draggedAptId ? { ...a, dayIndex, isoDate, time } : a))
    );
    setDraggedAptId(null);

    if (movedApt) {
      showToast(
        'Cita reagendada en el calendario',
        `${movedApt.patientName} movido al ${isoDate} a las ${time} hrs.`
      );
      if (supabase) {
        await supabase.from('appointments').update({ date: isoDate, time }).eq('id', movedApt.id);
      }
    }
  };

  // Acciones rápidas de clic derecho
  const togglePaymentStatus = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextStatus: PaymentStatus = a.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
        showToast(`Pago marcado como ${nextStatus}`, `Paciente: ${a.patientName}`);
        return { ...a, paymentStatus: nextStatus };
      })
    );
  };

  const toggleModality = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextMod: ModalityType = a.modality === 'Online' ? 'Presencial' : 'Online';
        showToast(`Modalidad actualizada a ${nextMod}`, `Paciente: ${a.patientName}`);
        return { ...a, modality: nextMod };
      })
    );
  };

  const updateClinicalStatus = (aptId: string, status: ClinicalStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, clinicalStatus: status } : a))
    );
    showToast(`Estado clínico actualizado a ${status}`);
  };

  const deleteAppointment = (aptId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    showToast('Horario liberado correctamente');
  };

  // Guardar nueva cita o bloqueo desde celda vacía
  const handleCreateSlotAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    if (slotActionMode === 'block') {
      const newBlock: BlockedSlot = {
        id: `blk-${Date.now()}`,
        professionalId: selectedProfId,
        dayIndex: slotModal.dayIndex,
        time: slotModal.time,
        reason: blockReasonInput.trim() || 'Bloqueo de Agenda',
      };
      setBlockedSlots((prev) => [...prev, newBlock]);
      showToast('Horario bloqueado en agenda', `${slotModal.dayLabel} · ${slotModal.time} hrs`);
      setSlotModal(null);
      return;
    }

    const svcObj =
      CLINICAL_SERVICES.find((s) => s.name === newBookingForm.serviceName) || CLINICAL_SERVICES[0];

    const createdApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName: newBookingForm.patientName.trim(),
      patientRUT: newBookingForm.patientRUT.trim() || 'Sin RUT',
      patientEmail: newBookingForm.patientEmail.trim(),
      patientPhone: newBookingForm.patientPhone.replace(/\D/g, ''),
      professionalId: selectedProfId,
      serviceName: newBookingForm.serviceName,
      modality: newBookingForm.modality,
      dayIndex: slotModal.dayIndex,
      isoDate: slotModal.isoDate,
      time: slotModal.time,
      price: svcObj.price,
      paymentStatus: newBookingForm.paymentStatus,
      clinicalStatus: 'Confirmada',
      notes: newBookingForm.notes.trim(),
    };

    setAppointments((prev) => [...prev, createdApt]);
    setSlotModal(null);

    if (supabase) {
      await supabase.from('appointments').insert([
        {
          center_id: defaultCenterId,
          patient_name: createdApt.patientName,
          patient_email: createdApt.patientEmail,
          patient_phone: createdApt.patientPhone,
          professional_name: currentProf.name,
          modality: createdApt.modality,
          date: createdApt.isoDate,
          time: createdApt.time,
          status: 'confirmed',
        },
      ]);
    }

    await triggerNotificationForApt(createdApt);
    setNewBookingForm({
      patientName: '',
      patientRUT: '',
      patientEmail: '',
      patientPhone: '56961699991',
      serviceName: CLINICAL_SERVICES[0].name,
      modality: 'Online',
      paymentStatus: 'Pendiente',
      notes: '',
    });
  };

  // Agregar nuevo profesional al centro
  const handleAddProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = newProfForm.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');

    const createdProf: ProfessionalConfig = {
      id: `prof-${Date.now()}`,
      name: newProfForm.name.trim(),
      specialty: newProfForm.specialty.trim(),
      rut: newProfForm.rut.trim(),
      email: newProfForm.email.trim(),
      avatar: initials || 'PR',
      workingDays: [1, 2, 3, 4, 5],
      startHour: '09:00',
      endHour: '18:00',
      modalityMode: newProfForm.modalityMode,
      presencialAddress: newProfForm.presencialAddress.trim(),
      onlineRoomUrl: newProfForm.onlineRoomUrl.trim(),
      basePrice: Number(newProfForm.basePrice) || 45000,
    };

    setProfessionals((prev) => [...prev, createdProf]);
    setSelectedProfId(createdProf.id);
    setShowNewProfModal(false);
    showToast('Profesional incorporado al equipo', createdProf.name);
  };

  const toggleProfWorkingDay = (profId: string, dayIdx: number) => {
    setProfessionals((prev) =>
      prev.map((p) => {
        if (p.id !== profId) return p;
        const exists = p.workingDays.includes(dayIdx);
        const updatedDays = exists
          ? p.workingDays.filter((d) => d !== dayIdx)
          : [...p.workingDays, dayIdx].sort();
        return { ...p, workingDays: updatedDays };
      })
    );
  };

  const SIDEBAR_ITEMS: {
    id: AdminModule;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Resumen Clínico', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda Interactiva', badge: 'Vivo', icon: CalendarIcon },
    { id: 'pacientes', label: 'Pacientes & Servicios', badge: String(appointments.length), icon: Users },
    { id: 'profesionales', label: 'Profesionales & Horarios', icon: Stethoscope },
    { id: 'documentos', label: 'Documentos Clínicos', icon: FileText },
    { id: 'comunicaciones', label: 'Comunicaciones (API)', icon: MessageSquare },
    { id: 'finanzas', label: 'Caja & Finanzas', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 flex font-sans selection:bg-[#2C4A3B]/15 selection:text-[#2C4A3B]">
      {/* Toast Flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 ${
              toastMessage.type === 'warn'
                ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                : 'bg-[#2C4A3B]/95 border-[#2C4A3B] text-white'
            }`}
          >
            {toastMessage.type === 'warn' ? (
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
            ) : (
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-300" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-sm">{toastMessage.title}</p>
              {toastMessage.detail && <p className="opacity-90 mt-0.5">{toastMessage.detail}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          BARRA LATERAL (SIDEBAR DE LUJO RESTAURADA)
         ========================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } shrink-0 bg-[#1E3329] text-stone-100 flex flex-col justify-between transition-all duration-300 border-r border-[#2C4A3B]/40 sticky top-0 h-screen z-30 select-none`}
      >
        {/* Logo y Cabecera de Sede */}
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-[#C87D65] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md">
                K
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80 font-bold block">
                    Kairós Clínico
                  </span>
                  <h1 className="text-sm font-bold text-white truncate">Sede Central · Multi-Tenant</h1>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-white/10 text-stone-300 transition-colors"
              title={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Menú de Módulos */}
          <nav className="p-3 space-y-1.5 mt-2">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2C4A3B] text-white shadow-sm ring-1 ring-emerald-400/30'
                      : 'text-stone-300/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      size={18}
                      className={isActive ? 'text-emerald-300 shrink-0' : 'text-stone-400 shrink-0'}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-400/20 text-emerald-200'
                          : 'bg-white/10 text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Estado del Motor Transaccional y Portal Público */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {!sidebarCollapsed && (
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Meta API v25.0 + Resend
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <a
                href="/centro/kairos-central"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-[#C87D65] hover:bg-[#b56d56] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <span>Ver Portal Pacientes</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          ÁREA PRINCIPAL DE TRABAJO
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior Contextual */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
              Panel Administrativo · Kairós Clínico
            </span>
            <h2 className="text-xl font-bold text-stone-900">
              {SIDEBAR_ITEMS.find((i) => i.id === activeModule)?.label}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Buscador Global Rápido */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente o servicio..."
                className="pl-9 pr-4 py-2 bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl text-xs focus:outline-none focus:border-[#2C4A3B] w-56"
              />
            </div>

            {/* Indicadores de Caja en Vivo */}
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 mr-1.5">
                  Pagado:
                </span>
                <span className="font-bold text-emerald-900">
                  ${metrics.totalPagado.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 mr-1.5">
                  Pendiente:
                </span>
                <span className="font-bold text-amber-900">
                  ${metrics.totalPendiente.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveModule('agenda');
                setSlotActionMode('book');
                setSlotModal({
                  dayIndex: 1,
                  isoDate: '2026-11-09',
                  dayLabel: 'Lunes 09 Nov',
                  time: '09:00',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus size={15} />
              <span>Nueva Cita / Bloqueo</span>
            </button>
          </div>
        </header>

        {/* Contenido Dinámico según Módulo de la Barra Lateral */}
        <main className="p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* ---------------------------------------------------------
              1. MÓDULO: RESUMEN / DASHBOARD EJECUTIVO
             --------------------------------------------------------- */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Ingresos Confirmados
                  </span>
                  <p className="text-2xl font-bold text-[#2C4A3B] mt-2">
                    ${metrics.totalPagado.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                    Sincronizado con agenda
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Por Cobrar
                  </span>
                  <p className="text-2xl font-bold text-[#C87D65] mt-2">
                    ${metrics.totalPendiente.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Clic derecho en agenda para cobrar
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Sesiones Online vs Presencial
                  </span>
                  <p className="text-2xl font-bold text-stone-900 mt-2">
                    {metrics.onlineCount} Online · {metrics.presencialCount} Presencial
                  </p>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Dirección y links activos
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Especialistas Activos
                  </span>
                  <p className="text-2xl font-bold text-stone-900 mt-2">
                    {professionals.length} Profesionales
                  </p>
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Horarios personalizados
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Accesos Rápidos de Operación Clínica
                  </h3>
                  <p className="text-xs text-stone-500">
                     salta directamente al módulo que necesites gestionar hoy.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveModule('agenda')}
                    className="px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                  >
                    Abrir Agenda Interactiva
                  </button>
                  <button
                    onClick={() => setActiveModule('profesionales')}
                    className="px-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-700 rounded-xl text-xs font-bold"
                  >
                    Configurar Horarios y Direcciones
                  </button>
                  <button
                    onClick={() => setActiveModule('documentos')}
                    className="px-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-700 rounded-xl text-xs font-bold"
                  >
                    Ver Documentos Clínicos
                  </button>
                  <button
                    onClick={() => setActiveModule('comunicaciones')}
                    className="px-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-700 rounded-xl text-xs font-bold"
                  >
                    Motor de Comunicaciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              2. MÓDULO: AGENDA INTERACTIVA (DRAG & DROP + CLIC DERECHO)
             --------------------------------------------------------- */}
          {activeModule === 'agenda' && (
            <div className="space-y-5">
              {/* Selector de Profesional e Instrucciones */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-1">
                    Profesional:
                  </span>
                  {professionals.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfId(prof.id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                        selectedProfId === prof.id
                          ? 'bg-[#EBF3EE] border-[#2C4A3B] text-[#2C4A3B] shadow-xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#2C4A3B] text-white flex items-center justify-center text-[10px] font-bold">
                        {prof.avatar}
                      </span>
                      <div className="text-left">
                        <p className="font-bold leading-none">{prof.name}</p>
                        <p className="text-[10px] opacity-75 mt-0.5">
                          {prof.startHour} - {prof.endHour} · {prof.modalityMode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-600 bg-[#F9F8F6] px-4 py-2.5 rounded-2xl border border-[#E4ECE7]">
                  <span className="flex items-center gap-1">
                    <GripVertical size={13} className="text-[#2C4A3B]" />
                    <strong>Arrastrar:</strong> Reagendar
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={13} className="text-[#C87D65]" />
                    <strong>Clic Derecho:</strong> Marcar Pagado / Modalidad / WhatsApp
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Ban size={13} className="text-stone-500" />
                    <strong>Celda vacía:</strong> Agendar o Bloquear
                  </span>
                </div>
              </div>

              {/* Barra informativa de Dirección Presencial y Sala Online del Terapeuta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl px-4 py-3 border border-[#E4ECE7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-700 truncate">
                    <MapPin size={15} className="text-[#C87D65] shrink-0" />
                    <span className="truncate">
                      <strong>Dirección Presencial:</strong> {currentProf.presencialAddress}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveModule('profesionales')}
                    className="text-[#2C4A3B] font-bold hover:underline ml-2 shrink-0"
                  >
                    Cambiar dirección
                  </button>
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 border border-[#E4ECE7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-700 truncate">
                    <Video size={15} className="text-[#2C4A3B] shrink-0" />
                    <span className="truncate">
                      <strong>Sala Online:</strong> {currentProf.onlineRoomUrl}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveModule('profesionales')}
                    className="text-[#2C4A3B] font-bold hover:underline ml-2 shrink-0"
                  >
                    Editar días/horario
                  </button>
                </div>
              </div>

              {/* Calendario Interactivo */}
              <div className="bg-white rounded-[2rem] border border-[#E4ECE7] shadow-[0_12px_40px_rgb(44,74,59,0.04)] overflow-x-auto">
                <div className="min-w-[960px]">
                  <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F9F8F6]/70">
                    <div className="p-3.5 text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-center border-r border-[#E4ECE7]">
                      Hora
                    </div>
                    {WEEK_DAYS.map((day) => {
                      const isWorkingDay = currentProf.workingDays.includes(day.index);
                      return (
                        <div
                          key={day.index}
                          className={`p-3.5 text-center border-r last:border-r-0 border-[#E4ECE7] ${
                            !isWorkingDay ? 'bg-stone-100/70 opacity-60' : ''
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
                            {day.label}
                          </span>
                          <span className="text-lg font-bold text-stone-900 mt-0.5 inline-block">
                            {day.dateNum} Nov
                          </span>
                          {!isWorkingDay && (
                            <span className="block text-[10px] font-semibold text-rose-500">
                              No atiende
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {visibleHours.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-7 border-b last:border-b-0 border-[#E4ECE7] min-h-[104px]"
                    >
                      <div className="p-3 border-r border-[#E4ECE7] bg-[#F9F8F6]/40 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-stone-700">{hour}</span>
                        <span className="text-[10px] text-stone-400">hrs</span>
                      </div>

                      {WEEK_DAYS.map((day) => {
                        const cellKey = `${day.index}-${hour}`;
                        const isWorkingDay = currentProf.workingDays.includes(day.index);
                        const apt = appointments.find(
                          (a) =>
                            a.professionalId === selectedProfId &&
                            a.dayIndex === day.index &&
                            a.time === hour
                        );
                        const blocked = blockedSlots.find(
                          (b) =>
                            b.professionalId === selectedProfId &&
                            b.dayIndex === day.index &&
                            b.time === hour
                        );
                        const isDragOver = dragOverCell === cellKey;

                        return (
                          <div
                            key={cellKey}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (isWorkingDay) setDragOverCell(cellKey);
                            }}
                            onDragLeave={() => setDragOverCell(null)}
                            onDrop={() => handleDropOnSlot(day.index, day.iso, hour)}
                            onClick={() => {
                              if (!apt && !blocked && isWorkingDay) {
                                setSlotActionMode('book');
                                setSlotModal({
                                  dayIndex: day.index,
                                  isoDate: day.iso,
                                  dayLabel: `${day.label} ${day.dateNum} Nov`,
                                  time: hour,
                                });
                              }
                            }}
                            className={`p-2 border-r last:border-r-0 border-[#E4ECE7] relative transition-all ${
                              !isWorkingDay
                                ? 'bg-stone-100/50 cursor-not-allowed'
                                : isDragOver
                                ? 'bg-[#EBF3EE] ring-2 ring-inset ring-[#2C4A3B]'
                                : !apt && !blocked
                                ? 'hover:bg-[#F9F8F6] cursor-pointer group'
                                : ''
                            }`}
                          >
                            {!apt && !blocked && isWorkingDay && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity h-full w-full flex flex-col items-center justify-center text-[11px] font-semibold text-[#2C4A3B]/70 gap-1">
                                <Plus size={15} />
                                <span>Agendar / Bloquear</span>
                              </div>
                            )}

                            {blocked && (
                              <div className="h-full w-full rounded-2xl bg-stone-100 border border-dashed border-stone-300 p-2.5 flex flex-col justify-between text-xs text-stone-500">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[10px] flex items-center gap-1 text-stone-600">
                                    <Ban size={11} /> Bloqueado
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBlockedSlots((prev) =>
                                        prev.filter((b) => b.id !== blocked.id)
                                      );
                                      showToast('Horario desbloqueado');
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:underline"
                                  >
                                    Liberar
                                  </button>
                                </div>
                                <p className="text-[11px] truncate font-medium">{blocked.reason}</p>
                              </div>
                            )}

                            {apt && (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, apt.id)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setContextMenu({ x: e.clientX, y: e.clientY, apt });
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setContextMenu({ x: e.clientX, y: e.clientY, apt });
                                }}
                                className={`h-full w-full rounded-2xl p-2.5 border shadow-xs cursor-grab active:cursor-grabbing transition-all hover:shadow-md flex flex-col justify-between select-none ${
                                  apt.paymentStatus === 'Pagado'
                                    ? 'bg-[#EBF3EE]/90 border-[#2C4A3B]/35'
                                    : 'bg-white border-[#C87D65]/45'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        apt.modality === 'Online'
                                          ? 'bg-sky-100 text-sky-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {apt.modality === 'Online' ? (
                                        <Video size={9} />
                                      ) : (
                                        <MapPin size={9} />
                                      )}
                                      {apt.modality}
                                    </span>

                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        apt.paymentStatus === 'Pagado'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {apt.paymentStatus}
                                    </span>
                                  </div>

                                  <p className="font-bold text-xs text-stone-900 truncate">
                                    {apt.patientName}
                                  </p>
                                  <p className="text-[10px] text-stone-500 truncate">
                                    {apt.serviceName}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-1 mt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
                                  <span className="font-semibold text-[#2C4A3B]">
                                    {apt.clinicalStatus}
                                  </span>
                                  <span>${(apt.price / 1000).toFixed(0)}k</span>
                                </div>
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

          {/* ---------------------------------------------------------
              3. MÓDULO: PACIENTES, SERVICIOS Y MODALIDAD (ONLINE/PRESENCIAL)
             --------------------------------------------------------- */}
          {activeModule === 'pacientes' && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-[#2C4A3B]" />
                  <span className="text-xs font-bold text-stone-600">Filtrar por modalidad:</span>
                  {(['Todas', 'Online', 'Presencial'] as const).map((mod) => (
                    <button
                      key={mod}
                      onClick={() => setPatientModalityFilter(mod)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        patientModalityFilter === mod
                          ? 'bg-[#2C4A3B] text-white'
                          : 'bg-[#F9F8F6] text-stone-600 border border-[#E4ECE7]'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setSlotActionMode('book');
                    setSlotModal({
                      dayIndex: 1,
                      isoDate: '2026-11-09',
                      dayLabel: 'Lunes 09 Nov',
                      time: '10:00',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                >
                  <Plus size={15} />
                  <span>Agregar Paciente a la Agenda</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAppointments.map((apt) => {
                  const prof =
                    professionals.find((p) => p.id === apt.professionalId) || currentProf;
                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-base text-stone-900">
                              {apt.patientName}
                            </h3>
                            <p className="text-xs text-stone-500">
                              Profesional: <strong>{prof.name}</strong>
                            </p>
                          </div>
                          <button
                            onClick={() => togglePaymentStatus(apt.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              apt.paymentStatus === 'Pagado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {apt.paymentStatus} · ${apt.price.toLocaleString('es-CL')}
                          </button>
                        </div>

                        <div className="space-y-3 bg-[#F9F8F6] p-4 rounded-2xl border border-[#E4ECE7] text-xs">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                              Servicio que tomará el paciente
                            </label>
                            <select
                              value={apt.serviceName}
                              onChange={(e) => {
                                const svc = CLINICAL_SERVICES.find(
                                  (s) => s.name === e.target.value
                                );
                                setAppointments((prev) =>
                                  prev.map((a) =>
                                    a.id === apt.id
                                      ? {
                                          ...a,
                                          serviceName: e.target.value,
                                          price: svc ? svc.price : a.price,
                                        }
                                      : a
                                  )
                                );
                                showToast('Servicio actualizado', e.target.value);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800"
                            >
                              {CLINICAL_SERVICES.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name} (${s.price.toLocaleString('es-CL')})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-stone-500 font-semibold">Modalidad:</span>
                            <div className="flex gap-1.5">
                              {(['Online', 'Presencial'] as const).map((mod) => (
                                <button
                                  key={mod}
                                  type="button"
                                  onClick={() => {
                                    setAppointments((prev) =>
                                      prev.map((a) =>
                                        a.id === apt.id ? { ...a, modality: mod } : a
                                      )
                                    );
                                    showToast(`Modalidad cambiada a ${mod}`);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                    apt.modality === mod
                                      ? 'bg-[#2C4A3B] text-white'
                                      : 'bg-white border border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {mod === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
                                  {mod}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-200/60 text-[11px] text-stone-600 space-y-1">
                            <p>
                              <strong>Cita:</strong> {apt.isoDate} · {apt.time} hrs
                            </p>
                            <p className="truncate">
                              <strong>
                                {apt.modality === 'Presencial' ? 'Dirección:' : 'Link Online:'}
                              </strong>{' '}
                              {apt.modality === 'Presencial'
                                ? prof.presencialAddress
                                : prof.onlineRoomUrl}
                            </p>
                            <p>
                              <strong>Contacto:</strong> +{apt.patientPhone} · {apt.patientEmail}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => triggerNotificationForApt(apt)}
                          className="py-2.5 px-3 bg-[#EBF3EE] hover:bg-[#dbeadd] text-[#2C4A3B] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Confirmar API</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDirectWhatsApp(apt)}
                          className="py-2.5 px-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp Directo</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              4. MÓDULO: PROFESIONALES, DÍAS DE ATENCIÓN Y DIRECCIÓN PRESENCIAL
             --------------------------------------------------------- */}
          {activeModule === 'profesionales' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Disponibilidad & Ubicaciones Clínicas
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Horarios por Profesional, Modalidad y Dirección Presencial
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewProfModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl text-xs font-bold shadow-xs"
                >
                  <UserPlus size={16} />
                  <span>Agregar Profesional</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-white rounded-[2rem] p-7 border border-[#E4ECE7] shadow-xs space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-base">
                          {prof.avatar}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-stone-900">{prof.name}</h4>
                          <p className="text-xs text-stone-500">{prof.specialty}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-xs font-bold">
                        {prof.modalityMode}
                      </span>
                    </div>

                    {/* Selección de días que atiende */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                        ¿Qué días atiende? (Activar / Desactivar)
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {WEEK_DAYS.map((d) => {
                          const active = prof.workingDays.includes(d.index);
                          return (
                            <button
                              key={d.index}
                              type="button"
                              onClick={() => toggleProfWorkingDay(prof.id, d.index)}
                              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                active
                                  ? 'bg-[#2C4A3B] text-white border-[#2C4A3B]'
                                  : 'bg-stone-50 text-stone-400 border-stone-200'
                              }`}
                            >
                              {d.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rango de Horas y Modalidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                          Hora Inicio
                        </label>
                        <select
                          value={prof.startHour}
                          onChange={(e) =>
                            setProfessionals((prev) =>
                              prev.map((p) =>
                                p.id === prof.id ? { ...p, startHour: e.target.value } : p
                              )
                            )
                          }
                          className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-3 py-2.5 text-xs font-semibold"
                        >
                          {ALL_HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h} hrs
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                          Hora Término
                        </label>
                        <select
                          value={prof.endHour}
                          onChange={(e) =>
                            setProfessionals((prev) =>
                              prev.map((p) =>
                                p.id === prof.id ? { ...p, endHour: e.target.value } : p
                              )
                            )
                          }
                          className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-3 py-2.5 text-xs font-semibold"
                        >
                          {ALL_HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h} hrs
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                          Modalidad de Trabajo
                        </label>
                        <select
                          value={prof.modalityMode}
                          onChange={(e) =>
                            setProfessionals((prev) =>
                              prev.map((p) =>
                                p.id === prof.id
                                  ? { ...p, modalityMode: e.target.value as any }
                                  : p
                              )
                            )
                          }
                          className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-3 py-2.5 text-xs font-semibold"
                        >
                          <option value="Ambas (Híbrido)">Ambas (Híbrido)</option>
                          <option value="Solo Online">Solo Online</option>
                          <option value="Solo Presencial">Solo Presencial</option>
                        </select>
                      </div>
                    </div>

                    {/* Dirección donde atiende Presencial */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                        <Building2 size={14} className="text-[#C87D65]" />
                        <span>Dirección Consulta Presencial (Calle, Oficina / Box, Comuna)</span>
                      </label>
                      <input
                        type="text"
                        value={prof.presencialAddress}
                        onChange={(e) =>
                          setProfessionals((prev) =>
                            prev.map((p) =>
                              p.id === prof.id
                                ? { ...p, presencialAddress: e.target.value }
                                : p
                            )
                          )
                        }
                        placeholder="Ej. Av. Nueva Providencia 1881, Of. 1204, Providencia"
                        className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2C4A3B]"
                      />
                    </div>

                    {/* Link Videollamada Online */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                        <Video size={14} className="text-[#2C4A3B]" />
                        <span>Link de Sala Online (Meet / Zoom)</span>
                      </label>
                      <input
                        type="text"
                        value={prof.onlineRoomUrl}
                        onChange={(e) =>
                          setProfessionals((prev) =>
                            prev.map((p) =>
                              p.id === prof.id ? { ...p, onlineRoomUrl: e.target.value } : p
                            )
                          )
                        }
                        placeholder="https://meet.google.com/..."
                        className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2C4A3B]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            'Ficha de profesional actualizada',
                            `${prof.name}: horario y dirección sincronizados.`
                          )
                        }
                        className="px-5 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold hover:bg-[#233B2F]"
                      >
                        Guardar Horario y Dirección
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              5. MÓDULO RESTAURADO: DOCUMENTOS CLÍNICOS (DocumentosTab.tsx)
             --------------------------------------------------------- */}
          {activeModule === 'documentos' && (
            <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs">
              <DocumentosTab
                centerId={defaultCenterId}
                patients={appointments}
                professionals={professionals}
              />
            </div>
          )}

          {/* ---------------------------------------------------------
              6. MÓDULO RESTAURADO: COMUNICACIONES OMNICANAL (ComunicacionesTab.tsx)
             --------------------------------------------------------- */}
          {activeModule === 'comunicaciones' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#2C4A3B] block">
                    Diagnóstico en Vivo · Meta Cloud API v25.0 + Resend
                  </span>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Prueba el disparo inmediato hacia tu número verificado (+56961699991) o gestiona tus reglas abajo.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (appointments[0]) triggerNotificationForApt(appointments[0]);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                >
                  <Send size={14} />
                  <span>Probar Envío Real Ahora</span>
                </button>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs">
                <ComunicacionesTab
                  centerId={defaultCenterId}
                  appointments={appointments}
                  professionals={professionals}
                />
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              7. MÓDULO: CAJA & FINANZAS CLÍNICAS
             --------------------------------------------------------- */}
          {activeModule === 'finanzas' && (
            <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4ECE7] pb-4">
                <div>
                  <h3 className="font-bold text-lg text-stone-900">
                    Control de Pagos y Recaudación por Sesión
                  </h3>
                  <p className="text-xs text-stone-500">
                    Haz clic en el estado de cualquier paciente para alternar entre Pagado y Pendiente.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Servicio</th>
                      <th className="py-3 px-4">Modalidad</th>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Estado de Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4ECE7]">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-[#F9F8F6]">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{apt.patientName}</td>
                        <td className="py-3.5 px-4 text-stone-600">{apt.serviceName}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold">
                            {apt.modality}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {apt.isoDate} · {apt.time} hrs
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          ${apt.price.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => togglePaymentStatus(apt.id)}
                            className={`px-3 py-1 rounded-full font-bold ${
                              apt.paymentStatus === 'Pagado'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {apt.paymentStatus}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================
          MENÚ CONTEXTUAL DE CLIC DERECHO EN LA AGENDA
         ========================================================= */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              top: Math.min(
                contextMenu.y,
                typeof window !== 'undefined' ? window.innerHeight - 340 : 350
              ),
              left: Math.min(
                contextMenu.x,
                typeof window !== 'undefined' ? window.innerWidth - 290 : 350
              ),
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E4ECE7] p-2 text-xs"
          >
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <p className="font-bold text-stone-900 truncate">{contextMenu.apt.patientName}</p>
              <p className="text-[11px] text-stone-500 truncate">
                {contextMenu.apt.serviceName} · ${contextMenu.apt.price.toLocaleString('es-CL')}
              </p>
            </div>

            <button
              onClick={() => {
                togglePaymentStatus(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EBF3EE] text-stone-800 font-bold transition-colors"
            >
              <CreditCard size={15} className="text-emerald-700" />
              <span>
                {contextMenu.apt.paymentStatus === 'Pagado'
                  ? 'Marcar como Pendiente'
                  : 'Marcar como Pagado ($)'}
              </span>
            </button>

            <button
              onClick={() => {
                toggleModality(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-700 font-medium transition-colors"
            >
              <RefreshCw size={15} className="text-[#2C4A3B]" />
              <span>
                Cambiar a {contextMenu.apt.modality === 'Online' ? 'Presencial' : 'Online'}
              </span>
            </button>

            <button
              onClick={() => {
                updateClinicalStatus(contextMenu.apt.id, 'Atendida');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-700 font-medium transition-colors"
            >
              <Check size={15} className="text-[#2C4A3B]" />
              <span>Marcar como Sesión Atendida</span>
            </button>

            <button
              onClick={() => {
                triggerNotificationForApt(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-700 font-medium transition-colors"
            >
              <Send size={15} className="text-[#C87D65]" />
              <span>Enviar Confirmación (Email + API)</span>
            </button>

            <button
              onClick={() => {
                openDirectWhatsApp(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-bold transition-colors"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>WhatsApp Directo (Con Dirección/Link)</span>
            </button>

            <div className="my-1 border-t border-stone-100" />

            <button
              onClick={() => {
                deleteAppointment(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-bold transition-colors"
            >
              <Trash2 size={15} />
              <span>Eliminar Cita / Liberar Hora</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL DE CELDA VACÍA: AGENDAR O BLOQUEAR HORARIO
         ========================================================= */}
      <AnimatePresence>
        {slotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-md w-full p-7 border border-[#E4ECE7] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
                    {slotModal.dayLabel} · {slotModal.time} hrs
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">Asignar Bloque de Agenda</h3>
                </div>
                <button
                  onClick={() => setSlotModal(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7] mb-5">
                <button
                  type="button"
                  onClick={() => setSlotActionMode('book')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    slotActionMode === 'book' ? 'bg-[#2C4A3B] text-white' : 'text-stone-600'
                  }`}
                >
                  Agendar Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setSlotActionMode('block')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    slotActionMode === 'block' ? 'bg-stone-800 text-white' : 'text-stone-600'
                  }`}
                >
                  Bloquear Horario
                </button>
              </div>

              <form onSubmit={handleCreateSlotAction} className="space-y-3.5 text-xs">
                {slotActionMode === 'block' ? (
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1.5">
                      Motivo del Bloqueo
                    </label>
                    <input
                      required
                      type="text"
                      value={blockReasonInput}
                      onChange={(e) => setBlockReasonInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm"
                      placeholder="Ej. Almuerzo, Reunión Clínica, Personal..."
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="font-bold uppercase text-stone-500 block mb-1">
                        Nombre del Paciente
                      </label>
                      <input
                        required
                        type="text"
                        value={newBookingForm.patientName}
                        onChange={(e) =>
                          setNewBookingForm({ ...newBookingForm, patientName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                        placeholder="Ej. Camila Vergara"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          Email
                        </label>
                        <input
                          required
                          type="email"
                          value={newBookingForm.patientEmail}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              patientEmail: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs"
                          placeholder="paciente@correo.cl"
                        />
                      </div>
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          WhatsApp (569...)
                        </label>
                        <input
                          required
                          type="tel"
                          value={newBookingForm.patientPhone}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              patientPhone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs"
                          placeholder="56961699991"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold uppercase text-stone-500 block mb-1">
                        Servicio Clínico
                      </label>
                      <select
                        value={newBookingForm.serviceName}
                        onChange={(e) =>
                          setNewBookingForm({ ...newBookingForm, serviceName: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                      >
                        {CLINICAL_SERVICES.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} (${s.price.toLocaleString('es-CL')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          Modalidad
                        </label>
                        <select
                          value={newBookingForm.modality}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              modality: e.target.value as ModalityType,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                        >
                          <option value="Online">Online (Videollamada)</option>
                          <option value="Presencial">Consulta Presencial</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          Pago
                        </label>
                        <select
                          value={newBookingForm.paymentStatus}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              paymentStatus: e.target.value as PaymentStatus,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Pagado">Pagado</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold text-xs transition-all shadow-md"
                >
                  {slotActionMode === 'block'
                    ? 'Confirmar Bloqueo en Agenda'
                    : 'Agendar y Enviar Confirmación'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL PARA AGREGAR NUEVO PROFESIONAL
         ========================================================= */}
      <AnimatePresence>
        {showNewProfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-md w-full p-7 border border-[#E4ECE7] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-stone-900">Nuevo Profesional Clínico</h3>
                <button
                  onClick={() => setShowNewProfModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddProfessional} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Nombre Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={newProfForm.name}
                    onChange={(e) => setNewProfForm({ ...newProfForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    placeholder="Ej. Dra. Francisca Silva"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Especialidad
                  </label>
                  <input
                    required
                    type="text"
                    value={newProfForm.specialty}
                    onChange={(e) =>
                      setNewProfForm({ ...newProfForm, specialty: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Modalidad de Atención
                  </label>
                  <select
                    value={newProfForm.modalityMode}
                    onChange={(e) =>
                      setNewProfForm({
                        ...newProfForm,
                        modalityMode: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                  >
                    <option value="Ambas (Híbrido)">Ambas (Híbrido)</option>
                    <option value="Solo Online">Solo Online</option>
                    <option value="Solo Presencial">Solo Presencial</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Dirección de Consulta Presencial
                  </label>
                  <input
                    required
                    type="text"
                    value={newProfForm.presencialAddress}
                    onChange={(e) =>
                      setNewProfForm({ ...newProfForm, presencialAddress: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                >
                  Guardar Profesional
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}