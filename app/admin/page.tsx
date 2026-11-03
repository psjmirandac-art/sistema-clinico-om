'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
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
  Building2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  UserPlus,
  Filter,
  Edit3,
  Mail,
  BellRing,
  CalendarDays,
  GripVertical,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import DocumentosTabRaw from '@/components/admin/DocumentosTab';
import ComunicacionesTabRaw from '@/components/admin/ComunicacionesTab';

const DocumentosTab = DocumentosTabRaw as React.ComponentType<any>;
const ComunicacionesTab = ComunicacionesTabRaw as React.ComponentType<any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID ?? 'kairos-main';

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

export interface ProfessionalConfig {
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

export interface AppointmentItem {
  id: string;
  patientName: string;
  patientRUT: string;
  patientEmail: string;
  patientPhone: string;
  professionalId: string;
  serviceName: string;
  modality: ModalityType;
  isoDate: string; // YYYY-MM-DD
  time: string;
  price: number;
  paymentStatus: PaymentStatus;
  clinicalStatus: ClinicalStatus;
  notes?: string;
}

export interface BlockedSlot {
  id: string;
  professionalId: string;
  isoDate: string; // YYYY-MM-DD
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

const DETERMINISTIC_BASE_MONDAY = '2026-11-02T12:00:00';

function getMondayFromAnchor(anchorIso: string, offsetWeeks: number = 0): Date {
  const base = new Date(anchorIso);
  const day = base.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(base.getDate() + diffToMonday + offsetWeeks * 7);
  return monday;
}

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    isoDate: '2026-11-02',
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
    isoDate: '2026-11-03',
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
    isoDate: '2026-11-05',
    time: '16:00',
    price: 55000,
    paymentStatus: 'Pendiente',
    clinicalStatus: 'En Espera',
    notes: 'Aplicación de batería diagnóstica.',
  },
];

const INITIAL_BLOCKED_SLOTS: BlockedSlot[] = [
  {
    id: 'blk-1',
    professionalId: 'prof-1',
    isoDate: '2026-11-04',
    time: '13:00',
    reason: 'Almuerzo / Supervisión Clínica',
  },
];

function AdminGlassSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex font-sans">
      <div className="w-72 bg-[#1E3329] shrink-0 p-6 hidden md:flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-12 w-48 bg-white/10 rounded-2xl animate-pulse" />
          <div className="space-y-2.5 pt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="h-11 w-full bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-28 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
      <div className="flex-1 p-8 space-y-6">
        <div className="h-20 w-full bg-white/80 rounded-3xl border border-[#E4ECE7] animate-pulse" />
        <div className="h-[580px] w-full bg-white/90 rounded-[2rem] border border-[#E4ECE7] animate-pulse" />
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const [activeModule, setActiveModule] = useState<AdminModule>('agenda');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalityFilter, setPatientModalityFilter] = useState<'Todas' | ModalityType>('Todas');

  const [anchorIso, setAnchorIso] = useState<string>(DETERMINISTIC_BASE_MONDAY);
  const [todayIso, setTodayIso] = useState<string>('2026-11-03');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    const now = new Date();
    setAnchorIso(now.toISOString());
    setTodayIso(formatIsoDate(now));
  }, []);

  const dynamicWeekDays = useMemo(() => {
    const monday = getMondayFromAnchor(anchorIso, weekOffset);
    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const fullNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];

    return [0, 1, 2, 3, 4, 5].map((i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatIsoDate(d);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthShort = monthNames[d.getMonth()];
      return {
        index: i + 1,
        short: shortNames[i],
        label: fullNames[i],
        dateNum: `${dayNum} ${monthShort}`,
        iso,
      };
    });
  }, [anchorIso, weekOffset]);

  const weekRangeLabel = useMemo(() => {
    if (dynamicWeekDays.length === 0) return '';
    const first = dynamicWeekDays[0];
    const last = dynamicWeekDays[dynamicWeekDays.length - 1];
    const year = first.iso.split('-')[0];
    return `${first.dateNum} – ${last.dateNum} ${year}`;
  }, [dynamicWeekDays]);

  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(INITIAL_PROFESSIONALS);
  const [selectedProfId, setSelectedProfId] = useState<string>(INITIAL_PROFESSIONALS[0].id);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(INITIAL_BLOCKED_SLOTS);

  const [adminEmailCopy, setAdminEmailCopy] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Drag & Drop
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Menú Contextual (Clic Derecho)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    apt: AppointmentItem;
  } | null>(null);

  // Modal de Celda Vacía
  const [slotModal, setSlotModal] = useState<{
    dayIndex: number;
    isoDate: string;
    dayLabel: string;
    time: string;
  } | null>(null);
  const [slotActionMode, setSlotActionMode] = useState<'book' | 'block'>('book');
  const [blockReasonInput, setBlockReasonInput] = useState('Bloqueo Personal / Almuerzo');

  // Modal CRUD Paciente
  const [editingApt, setEditingApt] = useState<AppointmentItem | null>(null);

  // Modal CRUD Profesional
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profForm, setProfForm] = useState({
    name: '',
    specialty: 'Psicoterapia Clínica',
    rut: '',
    email: '',
    startHour: '09:00',
    endHour: '18:00',
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

  const [toastMessage, setToastMessage] = useState<{
    title: string;
    detail?: string;
    type: 'success' | 'warn';
  } | null>(null);

  const showToast = (title: string, detail?: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ title, detail, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sincronización con el portal público (/centro/[slug])
  useEffect(() => {
    const savedProfs = localStorage.getItem('kairos_profs_prod');
    const savedApts = localStorage.getItem('kairos_apts_prod');
    const savedBlocks = localStorage.getItem('kairos_blocks_prod');
    const savedAdminEmail = localStorage.getItem('kairos_admin_email_prod');
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedApts) setAppointments(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
    if (savedAdminEmail) setAdminEmailCopy(savedAdminEmail);

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'kairos_apts_prod' && e.newValue) {
        setAppointments(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_profs_prod', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kairos_apts_prod', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('kairos_blocks_prod', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  useEffect(() => {
    localStorage.setItem('kairos_admin_email_prod', adminEmailCopy);
  }, [adminEmailCopy]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const currentProf = useMemo(
    () => professionals.find((p) => p.id === selectedProfId) ?? professionals[0],
    [professionals, selectedProfId]
  );

  const visibleHours = useMemo(() => {
    if (!currentProf) return ALL_HOURS;
    return ALL_HOURS.filter((h) => h >= currentProf.startHour && h <= currentProf.endHour);
  }, [currentProf]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        a.patientName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        a.patientEmail.toLowerCase().includes(q) ||
        a.patientRUT.toLowerCase().includes(q);
      const matchesModality =
        patientModalityFilter === 'Todas' || a.modality === patientModalityFilter;
      return matchesSearch && matchesModality;
    });
  }, [appointments, searchQuery, patientModalityFilter]);

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

  const handleJumpToDate = (isoString: string) => {
    if (!isoString) return;
    const [y, m, d] = isoString.split('-').map(Number);
    const target = new Date(y, m - 1, d, 12, 0, 0);
    const currentMon = getMondayFromAnchor(anchorIso, 0);
    const targetDay = target.getDay();
    const diffTargetMon = targetDay === 0 ? -6 : 1 - targetDay;
    const targetMon = new Date(target);
    targetMon.setDate(target.getDate() + diffTargetMon);

    const diffTime = targetMon.getTime() - currentMon.getTime();
    const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
    setWeekOffset(diffWeeks);
  };

  const triggerEmailNotification = async (apt: AppointmentItem, isReminder: boolean = false) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const locationAddress =
      apt.modality === 'Presencial' ? prof.presencialAddress : prof.onlineRoomUrl;

    showToast(
      isReminder ? 'Despachando recordatorio por correo...' : 'Enviando confirmación por correo...',
      `Destinatario: ${apt.patientEmail}`
    );

    try {
      const res = await fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: apt.patientName,
          patientEmail: apt.patientEmail,
          date: apt.isoDate,
          isoDate: apt.isoDate,
          time: apt.time,
          serviceName: apt.serviceName,
          modality:
            apt.modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Videollamada)',
          locationAddress,
          professionalName: prof.name,
          centerName: 'Kairós Clínico',
          overrideAdminEmail: adminEmailCopy,
        }),
      });

      const data = await res.json();
      if (data.diagnostics?.emailSent) {
        showToast(
          'Correo entregado exitosamente',
          `Ubicación enviada: ${locationAddress}`,
          'success'
        );
      } else {
        showToast(
          'Aviso de Resend (Modo Sandbox)',
          data.diagnostics?.emailError ??
            'Configura tu correo de Resend en "Configurar Correo Admin" en la barra lateral.',
          'warn'
        );
      }
    } catch (error) {
      showToast('Error de red al enviar correo', undefined, 'warn');
    }
  };

  const handleSendBulkReminders = async () => {
    const visibleIsos = new Set(dynamicWeekDays.map((d) => d.iso));
    const weekApts = appointments.filter((a) => visibleIsos.has(a.isoDate));
    if (weekApts.length === 0) {
      showToast('Sin citas en esta semana', 'Navega a una semana con pacientes agendados.', 'warn');
      return;
    }
    for (const apt of weekApts) {
      await triggerEmailNotification(apt, true);
    }
  };

  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección Presencial: ${prof.presencialAddress}`
        : `💻 Link Videollamada: ${prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *Kairós Clínico* para confirmar y recordar tu sesión de *${apt.serviceName}* (${apt.modality}) con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}\n\n¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDragStart = (e: React.DragEvent, aptId: string) => {
    setDraggedAptId(aptId);
    e.dataTransfer.setData('text/plain', aptId);
  };

  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;

    if (!currentProf.workingDays.includes(dayIndex)) {
      showToast('Día inactivo', `${currentProf.name} no atiende ese día de la semana.`, 'warn');
      setDraggedAptId(null);
      return;
    }

    const isBlocked = blockedSlots.some(
      (b) => b.professionalId === selectedProfId && b.isoDate === isoDate && b.time === time
    );
    const isOccupied = appointments.some(
      (a) =>
        a.professionalId === selectedProfId &&
        a.isoDate === isoDate &&
        a.time === time &&
        a.id !== draggedAptId
    );

    if (isBlocked || isOccupied) {
      showToast('Horario ocupado', 'El bloque de destino ya tiene una cita o está bloqueado.', 'warn');
      setDraggedAptId(null);
      return;
    }

    const movedApt = appointments.find((a) => a.id === draggedAptId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === draggedAptId ? { ...a, isoDate, time } : a))
    );
    setDraggedAptId(null);

    if (movedApt) {
      const updated = { ...movedApt, isoDate, time };
      showToast(
        'Paciente reagendado en el calendario',
        `${movedApt.patientName} movido al ${isoDate} a las ${time} hrs.`
      );
      triggerEmailNotification(updated, true);
    }
  };

  const togglePaymentStatus = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextStatus: PaymentStatus = a.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
        showToast(`Pago actualizado a ${nextStatus}`, `Paciente: ${a.patientName}`);
        return { ...a, paymentStatus: nextStatus };
      })
    );
  };

  const toggleModality = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextMod: ModalityType = a.modality === 'Online' ? 'Presencial' : 'Online';
        showToast(`Modalidad cambiada a ${nextMod}`, `Paciente: ${a.patientName}`);
        return { ...a, modality: nextMod };
      })
    );
  };

  const updateClinicalStatus = (aptId: string, status: ClinicalStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, clinicalStatus: status } : a))
    );
    showToast(`Estado clínico: ${status}`);
  };

  const deleteAppointment = (aptId: string) => {
    const target = appointments.find((a) => a.id === aptId);
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    if (editingApt?.id === aptId) setEditingApt(null);
    showToast(
      'Paciente / Cita eliminada',
      target ? `Se eliminó el registro de ${target.patientName}` : undefined
    );
  };

  const handleSaveEditedAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === editingApt.id ? editingApt : a))
    );
    showToast('Paciente actualizado correctamente', editingApt.patientName);
    setEditingApt(null);
  };

  const handleCreateSlotAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    if (slotActionMode === 'block') {
      const reasonText =
        blockReasonInput.trim().length > 0 ? blockReasonInput.trim() : 'Bloqueo de Agenda';
      const newBlock: BlockedSlot = {
        id: `blk-${Date.now()}`,
        professionalId: selectedProfId,
        isoDate: slotModal.isoDate,
        time: slotModal.time,
        reason: reasonText,
      };
      setBlockedSlots((prev) => [...prev, newBlock]);
      showToast('Horario bloqueado', `${slotModal.dayLabel} · ${slotModal.time} hrs`);
      setSlotModal(null);
      return;
    }

    const svcObj =
      CLINICAL_SERVICES.find((s) => s.name === newBookingForm.serviceName) ?? CLINICAL_SERVICES[0];

    const rutClean =
      newBookingForm.patientRUT.trim().length > 0 ? newBookingForm.patientRUT.trim() : 'Sin RUT';

    const createdApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName: newBookingForm.patientName.trim(),
      patientRUT: rutClean,
      patientEmail: newBookingForm.patientEmail.trim(),
      patientPhone: newBookingForm.patientPhone.replace(/\D/g, ''),
      professionalId: selectedProfId,
      serviceName: newBookingForm.serviceName,
      modality: newBookingForm.modality,
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

    await triggerEmailNotification(createdApt, false);
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

  const openCreateProfModal = () => {
    setEditingProfId(null);
    setProfForm({
      name: '',
      specialty: 'Psicoterapia Clínica',
      rut: '',
      email: '',
      startHour: '09:00',
      endHour: '18:00',
      modalityMode: 'Ambas (Híbrido)',
      presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
      onlineRoomUrl: 'https://meet.google.com/kairos-sala',
      basePrice: 45000,
    });
    setShowProfModal(true);
  };

  const openEditProfModal = (prof: ProfessionalConfig) => {
    setEditingProfId(prof.id);
    setProfForm({
      name: prof.name,
      specialty: prof.specialty,
      rut: prof.rut,
      email: prof.email,
      startHour: prof.startHour,
      endHour: prof.endHour,
      modalityMode: prof.modalityMode,
      presencialAddress: prof.presencialAddress,
      onlineRoomUrl: prof.onlineRoomUrl,
      basePrice: prof.basePrice,
    });
    setShowProfModal(true);
  };

  const handleSaveProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInitials = profForm.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
    const initials = rawInitials.length > 0 ? rawInitials : 'PR';

    if (editingProfId) {
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === editingProfId
            ? {
                ...p,
                name: profForm.name.trim(),
                specialty: profForm.specialty.trim(),
                rut: profForm.rut.trim(),
                email: profForm.email.trim(),
                avatar: initials,
                startHour: profForm.startHour,
                endHour: profForm.endHour,
                modalityMode: profForm.modalityMode,
                presencialAddress: profForm.presencialAddress.trim(),
                onlineRoomUrl: profForm.onlineRoomUrl.trim(),
                basePrice: Number(profForm.basePrice) > 0 ? Number(profForm.basePrice) : 45000,
              }
            : p
        )
      );
      showToast('Profesional modificado con éxito', profForm.name);
    } else {
      const createdProf: ProfessionalConfig = {
        id: `prof-${Date.now()}`,
        name: profForm.name.trim(),
        specialty: profForm.specialty.trim(),
        rut: profForm.rut.trim(),
        email: profForm.email.trim(),
        avatar: initials,
        workingDays: [1, 2, 3, 4, 5],
        startHour: profForm.startHour,
        endHour: profForm.endHour,
        modalityMode: profForm.modalityMode,
        presencialAddress: profForm.presencialAddress.trim(),
        onlineRoomUrl: profForm.onlineRoomUrl.trim(),
        basePrice: Number(profForm.basePrice) > 0 ? Number(profForm.basePrice) : 45000,
      };
      setProfessionals((prev) => [...prev, createdProf]);
      setSelectedProfId(createdProf.id);
      showToast('Nuevo profesional agregado', createdProf.name);
    }
    setShowProfModal(false);
  };

  const handleDeleteProfessional = (profId: string) => {
    if (professionals.length <= 1) {
      showToast(
        'Acción bloqueada',
        'El centro debe mantener al menos 1 profesional activo.',
        'warn'
      );
      return;
    }
    const target = professionals.find((p) => p.id === profId);
    const remaining = professionals.filter((p) => p.id !== profId);
    setProfessionals(remaining);
    if (selectedProfId === profId) {
      setSelectedProfId(remaining[0].id);
    }
    setAppointments((prev) =>
      prev.map((a) => (a.professionalId === profId ? { ...a, professionalId: remaining[0].id } : a))
    );
    showToast(
      'Profesional eliminado del centro',
      target ? `${target.name} fue removido y sus citas reasignadas.` : undefined
    );
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
    { id: 'dashboard', label: 'Resumen Ejecutivo', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda Interactiva', badge: 'Vivo', icon: CalendarIcon },
    {
      id: 'pacientes',
      label: 'Pacientes & Servicios',
      badge: String(appointments.length),
      icon: Users,
    },
    {
      id: 'profesionales',
      label: 'Profesionales & Horarios',
      badge: String(professionals.length),
      icon: Stethoscope,
    },
    { id: 'documentos', label: 'Documentos Clínicos', icon: FileText },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
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
          BARRA LATERAL (SIDEBAR CLÍNICA DE LUJO)
         ========================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } shrink-0 bg-[#1E3329] text-stone-100 flex flex-col justify-between transition-all duration-300 border-r border-[#2C4A3B]/40 sticky top-0 h-screen z-30 select-none shadow-2xl`}
      >
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C87D65] to-[#b0664f] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md">
                K
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/80 font-bold block">
                    Kairós Clínico
                  </span>
                  <h1 className="text-sm font-bold text-white truncate">
                    Centro de Mando Admin
                  </h1>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-white/10 text-stone-300 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

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
                      ? 'bg-[#2C4A3B] text-white shadow-md ring-1 ring-emerald-400/30'
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

        <div className="p-4 border-t border-white/10 space-y-3">
          {!sidebarCollapsed && (
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 text-[11px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Motor Clínico Activo
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <Mail size={13} />
                <span>Correo Resend Admin</span>
              </button>
              <a
                href="/centro/kairos-central"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-[#C87D65] hover:bg-[#b56d56] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm"
              >
                <span>Abrir Portal Pacientes</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          CONTENEDOR CENTRAL DEL ADMINISTRADOR
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar de Cristal Esmerilado */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
                Suite Administrativa · Kairós Clínico
              </span>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {SIDEBAR_ITEMS.find((i) => i.id === activeModule)?.label}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente, RUT o servicio..."
                className="pl-9 pr-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl text-xs focus:outline-none focus:border-[#2C4A3B] w-56 transition-all"
              />
            </div>

            <button
              onClick={handleSendBulkReminders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#EBF3EE] hover:bg-[#dbeadd] text-[#2C4A3B] rounded-xl text-xs font-bold transition-all"
            >
              <BellRing size={14} />
              <span>Recordatorios Semana</span>
            </button>

            <button
              onClick={() => {
                setActiveModule('agenda');
                setSlotActionMode('book');
                const firstDay = dynamicWeekDays[0];
                setSlotModal({
                  dayIndex: 1,
                  isoDate: firstDay.iso,
                  dayLabel: `${firstDay.label} ${firstDay.dateNum}`,
                  time: '10:00',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus size={15} />
              <span>Agendar Paciente</span>
            </button>
          </div>
        </header>

        <main className="p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Franja de KPIs Ejecutivos siempre visible en Dashboard y Agenda */}
          {(activeModule === 'dashboard' || activeModule === 'agenda') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-[0_8px_30px_rgb(44,74,59,0.03)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Recaudado Confirmado
                  </span>
                  <p className="text-2xl font-bold text-[#2C4A3B] mt-1">
                    ${metrics.totalPagado.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-[0_8px_30px_rgb(44,74,59,0.03)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Pendiente por Cobrar
                  </span>
                  <p className="text-2xl font-bold text-[#C87D65] mt-1">
                    ${metrics.totalPendiente.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C87D65] flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-[0_8px_30px_rgb(44,74,59,0.03)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Distribución Clínica
                  </span>
                  <p className="text-lg font-bold text-stone-900 mt-1">
                    {metrics.onlineCount} Online · {metrics.presencialCount} Presencial
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Video size={20} />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-[0_8px_30px_rgb(44,74,59,0.03)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Equipo Terapéutico
                  </span>
                  <p className="text-lg font-bold text-stone-900 mt-1">
                    {professionals.length} Especialistas
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Stethoscope size={20} />
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              1. RESUMEN EJECUTIVO
             --------------------------------------------------------- */}
          {activeModule === 'dashboard' && (
            <div className="bg-white rounded-[2rem] p-8 border border-[#E4ECE7] shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4ECE7] pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Centro de Operaciones
                  </span>
                  <h3 className="text-2xl font-bold text-stone-900">
                    Accesos Directos de Gestión Clínica
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveModule('agenda')}
                    className="px-5 py-3 bg-[#2C4A3B] text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-[#233B2F] transition-all"
                  >
                    Ir a la Agenda Interactiva
                  </button>
                  <button
                    onClick={() => setActiveModule('pacientes')}
                    className="px-5 py-3 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-800 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
                  >
                    Gestionar Pacientes
                  </button>
                  <button
                    onClick={() => setActiveModule('profesionales')}
                    className="px-5 py-3 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-800 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
                  >
                    Configurar Profesionales y Direcciones
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-5 rounded-3xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-xs">
                        {prof.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900">{prof.name}</p>
                        <p className="text-xs text-stone-500">{prof.specialty}</p>
                      </div>
                    </div>
                    <div className="text-xs text-stone-600 space-y-1 pt-2 border-t border-stone-200/70">
                      <p>
                        <strong>Horario:</strong> {prof.startHour} a {prof.endHour} hrs
                      </p>
                      <p>
                        <strong>Modalidad:</strong> {prof.modalityMode}
                      </p>
                      <p className="truncate">
                        <strong>Dirección:</strong> {prof.presencialAddress}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              2. AGENDA INTERACTIVA (MULTI-SEMANA + DRAG & DROP + CLIC DERECHO)
             --------------------------------------------------------- */}
          {activeModule === 'agenda' && (
            <div className="space-y-5">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {professionals.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfId(prof.id)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                        selectedProfId === prof.id
                          ? 'bg-[#2C4A3B] border-[#2C4A3B] text-white shadow-sm'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          selectedProfId === prof.id
                            ? 'bg-white/20 text-white'
                            : 'bg-[#2C4A3B] text-white'
                        }`}
                      >
                        {prof.avatar}
                      </span>
                      <div className="text-left">
                        <p className="font-bold leading-none">{prof.name}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          {prof.startHour}-{prof.endHour} · {prof.modalityMode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navegador de Semanas y Selector de Fecha */}
                <div className="flex flex-wrap items-center gap-2 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-700 transition-all"
                    title="Semana Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      weekOffset === 0
                        ? 'bg-[#2C4A3B] text-white'
                        : 'bg-white text-stone-700 border border-stone-200/80 hover:bg-stone-100'
                    }`}
                  >
                    Hoy
                  </button>

                  <div className="px-3 py-1 text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-[#2C4A3B]" />
                    <span className="capitalize">{weekRangeLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-700 transition-all"
                    title="Semana Siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <input
                    type="date"
                    value={dynamicWeekDays[0]?.iso ?? ''}
                    onChange={(e) => handleJumpToDate(e.target.value)}
                    className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#2C4A3B]"
                    title="Saltar a cualquier fecha"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl px-4 py-3 border border-[#E4ECE7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-700 truncate">
                    <MapPin size={15} className="text-[#C87D65] shrink-0" />
                    <span className="truncate">
                      <strong>Dirección Presencial:</strong> {currentProf?.presencialAddress}
                    </span>
                  </div>
                  <button
                    onClick={() => currentProf && openEditProfModal(currentProf)}
                    className="text-[#2C4A3B] font-bold hover:underline ml-2 shrink-0"
                  >
                    Editar Dirección / Horario
                  </button>
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 border border-[#E4ECE7] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-700 truncate">
                    <GripVertical size={15} className="text-[#2C4A3B] shrink-0" />
                    <span className="truncate">
                      <strong>Arrastra</strong> pacientes para reagendar · <strong>Clic derecho</strong> para marcar pagado, editar o WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Grilla del Calendario */}
              <div className="bg-white rounded-[2rem] border border-[#E4ECE7] shadow-[0_12px_40px_rgb(44,74,59,0.05)] overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F9F8F6]/80">
                    <div className="p-3.5 text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-center border-r border-[#E4ECE7]">
                      Hora
                    </div>
                    {dynamicWeekDays.map((day) => {
                      const isWorkingDay = currentProf?.workingDays.includes(day.index);
                      const isToday = day.iso === todayIso;
                      return (
                        <div
                          key={day.iso}
                          className={`p-3.5 text-center border-r last:border-r-0 border-[#E4ECE7] ${
                            !isWorkingDay
                              ? 'bg-stone-100/70 opacity-60'
                              : isToday
                              ? 'bg-[#EBF3EE]/70'
                              : ''
                          }`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
                            {day.label} {isToday && '· HOY'}
                          </span>
                          <span className="text-base font-bold text-stone-900 mt-0.5 inline-block capitalize">
                            {day.dateNum}
                          </span>
                          {!isWorkingDay && (
                            <span className="block text-[10px] font-semibold text-rose-500">
                              Sin atención
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {visibleHours.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-7 border-b last:border-b-0 border-[#E4ECE7] min-h-[108px]"
                    >
                      <div className="p-3 border-r border-[#E4ECE7] bg-[#F9F8F6]/40 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-stone-700">{hour}</span>
                        <span className="text-[10px] text-stone-400">hrs</span>
                      </div>

                      {dynamicWeekDays.map((day) => {
                        const cellKey = `${day.iso}-${hour}`;
                        const isWorkingDay = currentProf?.workingDays.includes(day.index);
                        const apt = appointments.find(
                          (a) =>
                            a.professionalId === selectedProfId &&
                            a.isoDate === day.iso &&
                            a.time === hour
                        );
                        const blocked = blockedSlots.find(
                          (b) =>
                            b.professionalId === selectedProfId &&
                            b.isoDate === day.iso &&
                            a.time === hour
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
                                  dayLabel: `${day.label} ${day.dateNum}`,
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
                                  <span className="font-bold text-stone-700">Opciones ▾</span>
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
              3. PACIENTES & SERVICIOS (CRUD COMPLETO)
             --------------------------------------------------------- */}
          {activeModule === 'pacientes' && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-[#2C4A3B]" />
                  <span className="text-xs font-bold text-stone-600">Modalidad:</span>
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
                    const firstDay = dynamicWeekDays[0];
                    setSlotModal({
                      dayIndex: 1,
                      isoDate: firstDay.iso,
                      dayLabel: `${firstDay.label} ${firstDay.dateNum}`,
                      time: '10:00',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                >
                  <Plus size={15} />
                  <span>Nuevo Paciente</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAppointments.map((apt) => {
                  const prof =
                    professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
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
                              RUT: {apt.patientRUT} · <strong>{prof?.name}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingApt({ ...apt })}
                              className="p-2 rounded-xl bg-stone-100 hover:bg-[#EBF3EE] text-stone-700 hover:text-[#2C4A3B] transition-colors"
                              title="Editar todos los datos del paciente"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAppointment(apt.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Eliminar paciente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 bg-[#F9F8F6] p-4 rounded-2xl border border-[#E4ECE7] text-xs">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                              Servicio Clínico Asignado
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
                              <strong>Fecha y Hora:</strong> {apt.isoDate} · {apt.time} hrs
                            </p>
                            <p className="truncate">
                              <strong>
                                {apt.modality === 'Presencial' ? 'Dirección:' : 'Link Online:'}
                              </strong>{' '}
                              {apt.modality === 'Presencial'
                                ? prof?.presencialAddress
                                : prof?.onlineRoomUrl}
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
                          onClick={() => triggerEmailNotification(apt, true)}
                          className="py-2.5 px-3 bg-[#EBF3EE] hover:bg-[#dbeadd] text-[#2C4A3B] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Enviar Correo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDirectWhatsApp(apt)}
                          className="py-2.5 px-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp 1-Clic</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              4. PROFESIONALES & HORARIOS (CRUD COMPLETO)
             --------------------------------------------------------- */}
          {activeModule === 'profesionales' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Gestión de Equipo Clínico
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Profesionales, Días de Atención, Horarios y Direcciones
                  </h3>
                </div>
                <button
                  onClick={openCreateProfModal}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl text-xs font-bold shadow-xs"
                >
                  <UserPlus size={16} />
                  <span>Agregar Nuevo Profesional</span>
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
                          <p className="text-xs text-stone-500">
                            {prof.specialty} · RUT: {prof.rut}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProfModal(prof)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-[#EBF3EE] text-stone-700 hover:text-[#2C4A3B] text-xs font-bold transition-colors"
                        >
                          <Edit3 size={14} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfessional(prof.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                        Días de Atención (Clic para activar o desactivar)
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { idx: 1, short: 'Lun' },
                          { idx: 2, short: 'Mar' },
                          { idx: 3, short: 'Mié' },
                          { idx: 4, short: 'Jue' },
                          { idx: 5, short: 'Vie' },
                          { idx: 6, short: 'Sáb' },
                        ].map((d) => {
                          const active = prof.workingDays.includes(d.idx);
                          return (
                            <button
                              key={d.idx}
                              type="button"
                              onClick={() => toggleProfWorkingDay(prof.id, d.idx)}
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
                          Modalidad
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

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                        <Building2 size={14} className="text-[#C87D65]" />
                        <span>Dirección Consulta Presencial</span>
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
                        className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2C4A3B]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                        <Video size={14} className="text-[#2C4A3B]" />
                        <span>Link Sala Online (Google Meet / Zoom)</span>
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
                        className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2C4A3B]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              5. DOCUMENTOS CLÍNICOS
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
              6. COMUNICACIONES
             --------------------------------------------------------- */}
          {activeModule === 'comunicaciones' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#2C4A3B] block">
                    Motor de Correos Transaccionales (Resend) + WhatsApp Directo
                  </span>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Cada reserva envía confirmación automática por correo e incluye botón de WhatsApp directo con dirección o link.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="px-4 py-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold"
                  >
                    Configurar Correo de Copia
                  </button>
                  <button
                    onClick={() => {
                      if (appointments[0]) triggerEmailNotification(appointments[0], false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                  >
                    <Send size={14} />
                    <span>Probar Envío de Correo Ahora</span>
                  </button>
                </div>
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
              7. CAJA & FINANZAS
             --------------------------------------------------------- */}
          {activeModule === 'finanzas' && (
            <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs space-y-4">
              <h3 className="font-bold text-lg text-stone-900">
                Control de Pagos y Recaudación por Paciente
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Servicio</th>
                      <th className="py-3 px-4">Modalidad</th>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Pago</th>
                      <th className="py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4ECE7]">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-[#F9F8F6]">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{apt.patientName}</td>
                        <td className="py-3.5 px-4 text-stone-600">{apt.serviceName}</td>
                        <td className="py-3.5 px-4">{apt.modality}</td>
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
                        <td className="py-3.5 px-4 flex gap-2">
                          <button
                            onClick={() => setEditingApt({ ...apt })}
                            className="text-[#2C4A3B] font-bold hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteAppointment(apt.id)}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            Eliminar
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
          MENÚ CONTEXTUAL DE CLIC DERECHO EN EL CALENDARIO
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
                typeof window !== 'undefined' ? window.innerHeight - 380 : 320
              ),
              left: Math.min(
                contextMenu.x,
                typeof window !== 'undefined' ? window.innerWidth - 300 : 320
              ),
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E4ECE7] p-2 text-xs"
          >
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <p className="font-bold text-stone-900 truncate">{contextMenu.apt.patientName}</p>
              <p className="text-[11px] text-stone-500 truncate">
                {contextMenu.apt.isoDate} · {contextMenu.apt.time} hrs
              </p>
            </div>

            <button
              onClick={() => {
                setEditingApt({ ...contextMenu.apt });
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-900 font-bold transition-colors"
            >
              <Edit3 size={15} className="text-[#2C4A3B]" />
              <span>Editar Paciente / Cambiar Fecha</span>
            </button>

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
              <span>Marcar Sesión Atendida</span>
            </button>

            <button
              onClick={() => {
                triggerEmailNotification(contextMenu.apt, true);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-700 font-medium transition-colors"
            >
              <Send size={15} className="text-[#C87D65]" />
              <span>Enviar Correo de Confirmación</span>
            </button>

            <button
              onClick={() => {
                openDirectWhatsApp(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-bold transition-colors"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>Enviar WhatsApp Directo (1-Clic)</span>
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
              <span>Eliminar Paciente / Liberar Hora</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL CRUD: EDITAR PACIENTE / CITA COMPLETA
         ========================================================= */}
      <AnimatePresence>
        {editingApt && (
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
              className="bg-white rounded-[2rem] max-w-lg w-full p-7 border border-[#E4ECE7] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
                    Edición Completa de Registro
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Modificar o Eliminar Paciente
                  </h3>
                </div>
                <button
                  onClick={() => setEditingApt(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedAppointment} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Nombre del Paciente
                    </label>
                    <input
                      required
                      type="text"
                      value={editingApt.patientName}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, patientName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={editingApt.patientRUT}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, patientRUT: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={editingApt.patientEmail}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, patientEmail: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      WhatsApp (569...)
                    </label>
                    <input
                      required
                      type="tel"
                      value={editingApt.patientPhone}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, patientPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Profesional Asignado
                    </label>
                    <select
                      value={editingApt.professionalId}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, professionalId: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Servicio Clínico
                    </label>
                    <select
                      value={editingApt.serviceName}
                      onChange={(e) => {
                        const svc = CLINICAL_SERVICES.find((s) => s.name === e.target.value);
                        setEditingApt({
                          ...editingApt,
                          serviceName: e.target.value,
                          price: svc ? svc.price : editingApt.price,
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {CLINICAL_SERVICES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Fecha (YYYY-MM-DD)
                    </label>
                    <input
                      required
                      type="date"
                      value={editingApt.isoDate}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, isoDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Hora
                    </label>
                    <select
                      value={editingApt.time}
                      onChange={(e) => setEditingApt({ ...editingApt, time: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {ALL_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h} hrs
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Modalidad
                    </label>
                    <select
                      value={editingApt.modality}
                      onChange={(e) =>
                        setEditingApt({
                          ...editingApt,
                          modality: e.target.value as ModalityType,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      <option value="Online">Online</option>
                      <option value="Presencial">Presencial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Valor Sesión ($)
                    </label>
                    <input
                      type="number"
                      value={editingApt.price}
                      onChange={(e) =>
                        setEditingApt({ ...editingApt, price: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Estado de Pago
                    </label>
                    <select
                      value={editingApt.paymentStatus}
                      onChange={(e) =>
                        setEditingApt({
                          ...editingApt,
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

                <div className="flex items-center justify-between gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => deleteAppointment(editingApt.id)}
                    className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Trash2 size={15} />
                    <span>Eliminar Paciente</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold"
                  >
                    Guardar Cambios del Paciente
                  </button>
                </div>
              </form>
            </motion.div>
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
                    {slotModal.dayLabel} ({slotModal.isoDate}) · {slotModal.time} hrs
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
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
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
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
                          placeholder="Ej. Camila Vergara"
                        />
                      </div>
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          RUT
                        </label>
                        <input
                          type="text"
                          value={newBookingForm.patientRUT}
                          onChange={(e) =>
                            setNewBookingForm({ ...newBookingForm, patientRUT: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
                          placeholder="18.456.789-2"
                        />
                      </div>
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
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
                          placeholder="tu-correo@ejemplo.cl"
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
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
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
                    : 'Agendar y Enviar Confirmación por Correo'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL CRUD: CREAR O EDITAR PROFESIONAL
         ========================================================= */}
      <AnimatePresence>
        {showProfModal && (
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
                <h3 className="text-xl font-bold text-stone-900">
                  {editingProfId ? 'Modificar Profesional' : 'Nuevo Profesional Clínico'}
                </h3>
                <button
                  onClick={() => setShowProfModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfessional} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Nombre Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={profForm.name}
                    onChange={(e) => setProfForm({ ...profForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    placeholder="Ej. Dra. Francisca Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Especialidad
                    </label>
                    <input
                      required
                      type="text"
                      value={profForm.specialty}
                      onChange={(e) => setProfForm({ ...profForm, specialty: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      RUT Profesional
                    </label>
                    <input
                      type="text"
                      value={profForm.rut}
                      onChange={(e) => setProfForm({ ...profForm, rut: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Hora Inicio
                    </label>
                    <select
                      value={profForm.startHour}
                      onChange={(e) => setProfForm({ ...profForm, startHour: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {ALL_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h} hrs
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Hora Término
                    </label>
                    <select
                      value={profForm.endHour}
                      onChange={(e) => setProfForm({ ...profForm, endHour: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {ALL_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h} hrs
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Modalidad de Atención
                  </label>
                  <select
                    value={profForm.modalityMode}
                    onChange={(e) =>
                      setProfForm({
                        ...profForm,
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
                    value={profForm.presencialAddress}
                    onChange={(e) =>
                      setProfForm({ ...profForm, presencialAddress: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Enlace Sala Online (Meet / Zoom)
                  </label>
                  <input
                    required
                    type="text"
                    value={profForm.onlineRoomUrl}
                    onChange={(e) =>
                      setProfForm({ ...profForm, onlineRoomUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  {editingProfId && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteProfessional(editingProfId);
                        setShowProfModal(false);
                      }}
                      className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold"
                    >
                      Eliminar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                  >
                    {editingProfId ? 'Guardar Cambios' : 'Crear Profesional'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL DE CORREO DE COPIA PARA RESEND
         ========================================================= */}
      <AnimatePresence>
        {showEmailModal && (
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
              className="bg-white rounded-[2rem] max-w-md w-full p-7 border border-[#E4ECE7] shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900">
                  Correo de Copia Administrador (Resend)
                </h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-stone-500 leading-relaxed">
                Si tu cuenta de Resend aún está en modo gratuito sin dominio verificado, ingresa aquí tu correo de Resend para recibir copia automática de todas las confirmaciones agendadas.
              </p>
              <div>
                <label className="font-bold uppercase text-stone-500 block mb-1">
                  Tu Correo Verificado en Resend
                </label>
                <input
                  type="email"
                  value={adminEmailCopy}
                  onChange={(e) => setAdminEmailCopy(e.target.value)}
                  placeholder="tu-correo@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(false);
                  if (appointments[0]) triggerEmailNotification(appointments[0], false);
                }}
                className="w-full py-3 bg-[#2C4A3B] text-white rounded-xl font-bold"
              >
                Guardar y Probar Correo Ahora
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminGlassSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}