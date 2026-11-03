'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Sparkles,
  Stethoscope,
  BriefcaseMedical,
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
  CalendarDays,
  TrendingUp,
  BrainCircuit,
  Calculator,
  Home,
} from 'lucide-react';

import DocumentosTabRaw from '@/components/admin/DocumentosTab';
import ComunicacionesTabRaw from '@/components/admin/ComunicacionesTab';

const DocumentosTab = DocumentosTabRaw as React.ComponentType<any>;
const ComunicacionesTab = ComunicacionesTabRaw as React.ComponentType<any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID ?? 'centro-principal';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type AdminModule =
  | 'dashboard'
  | 'agenda'
  | 'pacientes'
  | 'servicios'
  | 'profesionales'
  | 'documentos'
  | 'comunicaciones'
  | 'finanzas';

export type CalendarViewMode = 'day' | 'week' | 'month';
export type ModalityType = 'Online' | 'Presencial';
export type PaymentStatus = 'Pagado' | 'Pendiente';
export type ClinicalStatus =
  | 'Confirmada'
  | 'En Espera'
  | 'En Consulta'
  | 'Atendida'
  | 'No Asistió';
export type FinancialAgreementType = 'porcentaje' | 'arriendo_fijo' | 'por_box_hora';

export interface DayScheduleConfig {
  enabled: boolean;
  startHour: string;
  endHour: string;
  modality: 'Ambas (Híbrido)' | 'Solo Online' | 'Solo Presencial';
  boxAssigned: string;
}

export interface ProfessionalConfig {
  id: string;
  name: string;
  specialty: string;
  rut: string;
  email: string;
  avatar: string;
  presencialAddress: string;
  onlineRoomUrl: string;
  scheduleByDay: Record<number, DayScheduleConfig>;
  agreementType: FinancialAgreementType;
  centerCommissionPercent: number;
  fixedBoxRent: number;
  boxCostPerSession: number;
}

export interface TherapistServiceItem {
  id: string;
  professionalId: string;
  name: string;
  therapyType: string;
  durationMinutes: number;
  price: number;
  modality: 'Ambas (Híbrido)' | 'Online' | 'Presencial';
  allowedHoursLabel: string;
}

export interface ClinicalEvolutionNote {
  id: string;
  date: string;
  rawInput: string;
  grokStructuredNote: string;
  professionalName: string;
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
  boxName?: string;
  isoDate: string;
  time: string;
  price: number;
  paymentStatus: PaymentStatus;
  clinicalStatus: ClinicalStatus;
  notes?: string;
  clinicalHistory?: ClinicalEvolutionNote[];
}

export interface BlockedSlot {
  id: string;
  professionalId: string;
  isoDate: string;
  time: string;
  reason: string;
}

const FULL_DAY_HOURS = [
  '07:00',
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
  '21:00',
  '22:00',
  '23:00',
];

const DAY_NAMES: { index: number; short: string; label: string }[] = [
  { index: 1, short: 'Lun', label: 'Lunes' },
  { index: 2, short: 'Mar', label: 'Martes' },
  { index: 3, short: 'Mié', label: 'Miércoles' },
  { index: 4, short: 'Jue', label: 'Jueves' },
  { index: 5, short: 'Vie', label: 'Viernes' },
  { index: 6, short: 'Sáb', label: 'Sábado' },
  { index: 7, short: 'Dom', label: 'Domingo' },
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

function buildDefaultSchedule(
  morningOnlyMondays: boolean = false
): Record<number, DayScheduleConfig> {
  return {
    1: {
      enabled: true,
      startHour: '08:00',
      endHour: morningOnlyMondays ? '13:00' : '21:00',
      modality: 'Ambas (Híbrido)',
      boxAssigned: 'Box 1 · Salvia',
    },
    2: {
      enabled: true,
      startHour: morningOnlyMondays ? '14:00' : '09:00',
      endHour: '22:00',
      modality: 'Ambas (Híbrido)',
      boxAssigned: 'Box 2 · Arena',
    },
    3: {
      enabled: true,
      startHour: '09:00',
      endHour: '21:00',
      modality: 'Ambas (Híbrido)',
      boxAssigned: 'Box 1 · Salvia',
    },
    4: {
      enabled: true,
      startHour: '10:00',
      endHour: '22:00',
      modality: 'Ambas (Híbrido)',
      boxAssigned: 'Box 3 · Olivo',
    },
    5: {
      enabled: true,
      startHour: '09:00',
      endHour: '20:00',
      modality: 'Ambas (Híbrido)',
      boxAssigned: 'Box 1 · Salvia',
    },
    6: {
      enabled: false,
      startHour: '09:00',
      endHour: '14:00',
      modality: 'Solo Online',
      boxAssigned: 'Sin Box',
    },
    7: {
      enabled: false,
      startHour: '10:00',
      endHour: '14:00',
      modality: 'Solo Online',
      boxAssigned: 'Sin Box',
    },
  };
}

const INITIAL_PROFESSIONALS: ProfessionalConfig[] = [
  {
    id: 'prof-1',
    name: 'Dr. Alejandro Silva',
    specialty: 'Psicoterapia Clínica & Ansiedad',
    rut: '15.432.890-K',
    email: 'alejandro@centroclinico.cl',
    avatar: 'AS',
    presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
    onlineRoomUrl: 'https://meet.google.com/clinica-alejandro',
    scheduleByDay: buildDefaultSchedule(true),
    agreementType: 'porcentaje',
    centerCommissionPercent: 25,
    fixedBoxRent: 0,
    boxCostPerSession: 7000,
  },
  {
    id: 'prof-2',
    name: 'Ps. Valentina Montt',
    specialty: 'Terapia Cognitivo-Conductual',
    rut: '17.890.123-4',
    email: 'valentina@centroclinico.cl',
    avatar: 'VM',
    presencialAddress: 'Av. Alonso de Córdova 5870, Of. 702, Las Condes',
    onlineRoomUrl: 'https://meet.google.com/clinica-valentina',
    scheduleByDay: buildDefaultSchedule(false),
    agreementType: 'por_box_hora',
    centerCommissionPercent: 0,
    fixedBoxRent: 0,
    boxCostPerSession: 9500,
  },
  {
    id: 'prof-3',
    name: 'Ps. Martín Arriagada',
    specialty: 'Terapia Sistémica & Parejas',
    rut: '16.221.450-8',
    email: 'martin@centroclinico.cl',
    avatar: 'MA',
    presencialAddress: 'Av. Nueva Providencia 1881, Box 3, Providencia',
    onlineRoomUrl: 'https://meet.google.com/clinica-martin',
    scheduleByDay: buildDefaultSchedule(false),
    agreementType: 'arriendo_fijo',
    centerCommissionPercent: 0,
    fixedBoxRent: 160000,
    boxCostPerSession: 0,
  },
];

const INITIAL_SERVICES: TherapistServiceItem[] = [
  {
    id: 'srv-1',
    professionalId: 'prof-1',
    name: 'Psicoterapia Individual Adulto',
    therapyType: 'Enfoque Clínico Integrativo',
    durationMinutes: 50,
    price: 45000,
    modality: 'Ambas (Híbrido)',
    allowedHoursLabel: '08:00 a 22:00 hrs',
  },
  {
    id: 'srv-2',
    professionalId: 'prof-3',
    name: 'Terapia de Pareja / Vincular',
    therapyType: 'Terapia Sistémica Relacional',
    durationMinutes: 60,
    price: 60000,
    modality: 'Ambas (Híbrido)',
    allowedHoursLabel: '09:00 a 22:00 hrs',
  },
  {
    id: 'srv-3',
    professionalId: 'prof-2',
    name: 'Evaluación Psicodiagnóstica',
    therapyType: 'Cognitivo-Conductual / Batería Clínica',
    durationMinutes: 60,
    price: 55000,
    modality: 'Presencial',
    allowedHoursLabel: '09:00 a 21:00 hrs',
  },
  {
    id: 'srv-4',
    professionalId: 'all',
    name: 'Psicoterapia Vespertina / Nocturna',
    therapyType: 'Atención Extendida Post-Laboral',
    durationMinutes: 50,
    price: 50000,
    modality: 'Online',
    allowedHoursLabel: '19:00 a 23:00 hrs',
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
    serviceName: 'Psicoterapia Individual Adulto',
    modality: 'Presencial',
    boxName: 'Box 1 · Salvia',
    isoDate: '2026-11-02',
    time: '10:00',
    price: 45000,
    paymentStatus: 'Pagado',
    clinicalStatus: 'Confirmada',
    notes: 'Paciente refiere disminución de sintomatología ansiosa laboral.',
    clinicalHistory: [
      {
        id: 'ev-1',
        date: '2026-10-26',
        rawInput: 'Paciente llega puntual, comenta estrés laboral pero mejor higiene del sueño.',
        grokStructuredNote:
          '• Motivo de Sesión: Seguimiento de cuadro ansioso reactivo.\n• Estado Afectivo: Eutímica, orientada, discurso fluido.\n• Intervención (IA Grok): Reestructuración cognitiva sobre límites laborales y consolidación de pauta de sueño.\n• Plan Terapéutico: Mantener registro de episodios y control en 7 días.',
        professionalName: 'Dr. Alejandro Silva',
      },
    ],
  },
  {
    id: 'apt-102',
    patientName: 'Matías Errázuriz',
    patientRUT: '16.789.234-5',
    patientEmail: 'matias@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-1',
    serviceName: 'Psicoterapia Vespertina / Nocturna',
    modality: 'Online',
    boxName: 'Sala Virtual',
    isoDate: '2026-11-03',
    time: '21:00',
    price: 50000,
    paymentStatus: 'Pagado',
    clinicalStatus: 'Confirmada',
    notes: 'Horario vespertino post-trabajo.',
    clinicalHistory: [],
  },
  {
    id: 'apt-103',
    patientName: 'Sofía Domínguez',
    patientRUT: '19.321.654-8',
    patientEmail: 'sofia@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-2',
    serviceName: 'Evaluación Psicodiagnóstica',
    modality: 'Presencial',
    boxName: 'Box 2 · Arena',
    isoDate: '2026-11-05',
    time: '16:00',
    price: 55000,
    paymentStatus: 'Pendiente',
    clinicalStatus: 'En Espera',
    notes: 'Segunda sesión de psicodiagnóstico.',
    clinicalHistory: [],
  },
];

const INITIAL_BLOCKED_SLOTS: BlockedSlot[] = [
  {
    id: 'blk-1',
    professionalId: 'prof-1',
    isoDate: '2026-11-04',
    time: '13:00',
    reason: 'Supervisión Clínica de Equipo',
  },
];

function AdminGlassSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex font-sans">
      <div className="w-72 bg-[#1E3329] shrink-0 p-6 hidden md:flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-12 w-48 bg-white/10 rounded-2xl animate-pulse" />
          <div className="space-y-2.5 pt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-11 w-full bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-24 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
      <div className="flex-1 p-8 space-y-6">
        <div className="h-20 w-full bg-white/80 rounded-3xl border border-[#E4ECE7] animate-pulse" />
        <div className="h-[580px] w-full bg-white/90 rounded-[2rem] border border-[#E4ECE7] animate-pulse" />
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const [centerBrandName, setCenterBrandName] = useState<string>('Centro Terapéutico Horizonte');
  const [isEditingCenterName, setIsEditingCenterName] = useState<boolean>(false);

  const [activeModule, setActiveModule] = useState<AdminModule>('agenda');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('week');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalityFilter, setPatientModalityFilter] = useState<'Todas' | ModalityType>('Todas');

  const [anchorIso, setAnchorIso] = useState<string>(DETERMINISTIC_BASE_MONDAY);
  const [todayIso, setTodayIso] = useState<string>('2026-11-03');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedSingleDayIso, setSelectedSingleDayIso] = useState<string>('2026-11-03');

  useEffect(() => {
    const now = new Date();
    const iso = formatIsoDate(now);
    setAnchorIso(now.toISOString());
    setTodayIso(iso);
    setSelectedSingleDayIso(iso);
  }, []);

  const dynamicWeekDays = useMemo(() => {
    const monday = getMondayFromAnchor(anchorIso, weekOffset);
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

    return DAY_NAMES.slice(0, 6).map((dayMeta, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatIsoDate(d);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthShort = monthNames[d.getMonth()];
      return {
        index: dayMeta.index,
        short: dayMeta.short,
        label: dayMeta.label,
        dateNum: `${dayNum} ${monthShort}`,
        dayNumberOnly: dayNum,
        iso,
      };
    });
  }, [anchorIso, weekOffset]);

  const dynamicMonthDays = useMemo(() => {
    const base = getMondayFromAnchor(anchorIso, weekOffset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const curr = new Date(year, month, d, 12, 0, 0);
      const dow = curr.getDay() === 0 ? 7 : curr.getDay();
      list.push({
        iso: formatIsoDate(curr),
        dayNum: String(d).padStart(2, '0'),
        dayOfWeekIndex: dow,
        shortDay: DAY_NAMES[dow - 1]?.short ?? 'Día',
      });
    }
    return {
      monthTitle: firstDayOfMonth.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric',
      }),
      days: list,
    };
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
  const [services, setServices] = useState<TherapistServiceItem[]>(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(INITIAL_BLOCKED_SLOTS);

  // Ficha Clínica con IA Grok
  const [fichaPatientApt, setFichaPatientApt] = useState<AppointmentItem | null>(null);
  const [rawSessionNotes, setRawSessionNotes] = useState<string>('');
  const [grokPreviewNote, setGrokPreviewNote] = useState<string>('');
  const [isGeneratingGrok, setIsGeneratingGrok] = useState<boolean>(false);

  // Modal Nuevo Servicio
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState({
    professionalId: 'prof-1',
    name: '',
    therapyType: 'Enfoque Clínico Integrativo',
    durationMinutes: 50,
    price: 45000,
    modality: 'Ambas (Híbrido)' as TherapistServiceItem['modality'],
    allowedHoursLabel: '08:00 a 22:30 hrs',
  });

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
    presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
    onlineRoomUrl: 'https://meet.google.com/clinica-sala',
    agreementType: 'porcentaje' as FinancialAgreementType,
    centerCommissionPercent: 25,
    fixedBoxRent: 0,
    boxCostPerSession: 8000,
  });

  const [newBookingForm, setNewBookingForm] = useState({
    patientName: '',
    patientRUT: '',
    patientEmail: '',
    patientPhone: '56961699991',
    serviceName: INITIAL_SERVICES[0].name,
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

  useEffect(() => {
    const savedCenterName = localStorage.getItem('kairos_center_brand_v2');
    const savedProfs = localStorage.getItem('kairos_profs_v6');
    const savedSrvs = localStorage.getItem('kairos_services_v6');
    const savedApts = localStorage.getItem('kairos_apts_prod');
    const savedBlocks = localStorage.getItem('kairos_blocks_prod');
    if (savedCenterName) setCenterBrandName(savedCenterName);
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedSrvs) setServices(JSON.parse(savedSrvs));
    if (savedApts) setAppointments(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_center_brand_v2', centerBrandName);
  }, [centerBrandName]);

  useEffect(() => {
    localStorage.setItem('kairos_profs_v6', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kairos_services_v6', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('kairos_apts_prod', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('kairos_blocks_prod', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

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
    if (!currentProf || !currentProf.scheduleByDay) return FULL_DAY_HOURS;
    const enabledDays = Object.values(currentProf.scheduleByDay).filter((d) => d.enabled);
    if (enabledDays.length === 0) return FULL_DAY_HOURS.slice(1, 14);
    const minStart = enabledDays.reduce(
      (min, d) => (d.startHour < min ? d.startHour : min),
      '23:00'
    );
    const maxEnd = enabledDays.reduce(
      (max, d) => (d.endHour > max ? d.endHour : max),
      '07:00'
    );
    return FULL_DAY_HOURS.filter((h) => h >= minStart && h <= maxEnd);
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

  const financialBreakdown = useMemo(() => {
    const byProf = professionals.map((prof) => {
      const profApts = appointments.filter((a) => a.professionalId === prof.id);
      const paidApts = profApts.filter((a) => a.paymentStatus === 'Pagado');
      const pendingApts = profApts.filter((a) => a.paymentStatus === 'Pendiente');
      const presencialSessionsCount = profApts.filter((a) => a.modality === 'Presencial').length;

      const grossTotal = profApts.reduce((acc, cur) => acc + cur.price, 0);
      const grossPaid = paidApts.reduce((acc, cur) => acc + cur.price, 0);
      const grossPending = pendingApts.reduce((acc, cur) => acc + cur.price, 0);

      let centerRetention = 0;
      let agreementDescription = '';

      if (prof.agreementType === 'porcentaje') {
        centerRetention = Math.round((grossTotal * prof.centerCommissionPercent) / 100);
        agreementDescription = `${prof.centerCommissionPercent}% Comisión Centro`;
      } else if (prof.agreementType === 'arriendo_fijo') {
        centerRetention = prof.fixedBoxRent;
        agreementDescription = `Arriendo Fijo ($${prof.fixedBoxRent.toLocaleString('es-CL')})`;
      } else {
        centerRetention = presencialSessionsCount * prof.boxCostPerSession;
        agreementDescription = `Pago por Box ($${prof.boxCostPerSession.toLocaleString('es-CL')} × ${presencialSessionsCount} presenciales)`;
      }

      const netProfessional = Math.max(0, grossTotal - centerRetention);

      return {
        prof,
        totalSessions: profApts.length,
        presencialSessionsCount,
        grossTotal,
        grossPaid,
        grossPending,
        centerRetention,
        netProfessional,
        agreementDescription,
      };
    });

    const totalGrossCenter = byProf.reduce((acc, r) => acc + r.grossTotal, 0);
    const totalPaidCenter = byProf.reduce((acc, r) => acc + r.grossPaid, 0);
    const totalPendingCenter = byProf.reduce((acc, r) => acc + r.grossPending, 0);
    const totalCenterRetention = byProf.reduce((acc, r) => acc + r.centerRetention, 0);
    const totalNetProfessionals = byProf.reduce((acc, r) => acc + r.netProfessional, 0);
    const totalPresencialBoxUses = byProf.reduce((acc, r) => acc + r.presencialSessionsCount, 0);
    const avgRevenuePerBoxSession =
      totalPresencialBoxUses > 0 ? Math.round(totalCenterRetention / totalPresencialBoxUses) : 0;

    return {
      byProf,
      totalGrossCenter,
      totalPaidCenter,
      totalPendingCenter,
      totalCenterRetention,
      totalNetProfessionals,
      totalPresencialBoxUses,
      avgRevenuePerBoxSession,
    };
  }, [professionals, appointments]);

  const handleJumpToDate = (isoString: string) => {
    if (!isoString) return;
    setSelectedSingleDayIso(isoString);
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
      isReminder ? 'Despachando recordatorio...' : 'Enviando confirmación...',
      `Centro: ${centerBrandName} → ${apt.patientEmail}`
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
          centerName: centerBrandName,
        }),
      });

      const data = await res.json();
      if (data.diagnostics?.emailSent) {
        showToast('Correo entregado exitosamente', `Nombre del centro: ${centerBrandName}`);
      } else {
        showToast(
          'Cita registrada en el sistema',
          data.diagnostics?.emailError ?? 'Confirmación procesada.'
        );
      }
    } catch (error) {
      showToast('Error de red al enviar correo', undefined, 'warn');
    }
  };

  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección Presencial: ${prof.presencialAddress} (${apt.boxName ?? 'Box Clínico'})`
        : `💻 Link Videollamada: ${prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *${centerBrandName}* para confirmar tu sesión de *${apt.serviceName}* (${apt.modality}) con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}\n\n¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleGenerateGrokEvolution = () => {
    if (!rawSessionNotes.trim() || !fichaPatientApt) return;
    setIsGeneratingGrok(true);
    setTimeout(() => {
      const structured = [
        `• SÍNTESIS CLÍNICA (Asistente IA Grok · ${centerBrandName}):`,
        `  Paciente ${fichaPatientApt.patientName} asiste a sesión de ${fichaPatientApt.serviceName} (${fichaPatientApt.modality}).`,
        `• OBSERVACIÓN Y RELATO:`,
        `  "${rawSessionNotes.trim()}"`,
        `• ANÁLISIS EVOLUTIVO E HIPÓTESIS:`,
        `  Se observa adecuada alianza terapéutica, capacidad de insight conservada y regulación emocional progresiva frente a estresores.`,
        `• PLAN E INDICACIONES DE PRÓXIMA SESIÓN:`,
        `  Continuar trabajo sobre focos identificados, monitoreo de autorregistro y seguimiento en próxima cita agendada.`,
      ].join('\n');
      setGrokPreviewNote(structured);
      setIsGeneratingGrok(false);
    }, 450);
  };

  const handleSaveEvolutionToFicha = () => {
    if (!fichaPatientApt) return;
    const prof = professionals.find((p) => p.id === fichaPatientApt.professionalId) ?? currentProf;
    const finalNote =
      grokPreviewNote.trim().length > 0 ? grokPreviewNote.trim() : rawSessionNotes.trim();
    if (!finalNote) return;

    const newEntry: ClinicalEvolutionNote = {
      id: `ev-${Date.now()}`,
      date: todayIso,
      rawInput: rawSessionNotes.trim(),
      grokStructuredNote: finalNote,
      professionalName: prof.name,
    };

    const updatedHistory = [newEntry, ...(fichaPatientApt.clinicalHistory ?? [])];
    const updatedApt: AppointmentItem = {
      ...fichaPatientApt,
      clinicalHistory: updatedHistory,
    };

    setAppointments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    setFichaPatientApt(updatedApt);
    setRawSessionNotes('');
    setGrokPreviewNote('');
    showToast('Evolución guardada en Ficha Clínica', `Paciente: ${updatedApt.patientName}`);
  };

  const handleDragStart = (e: React.DragEvent, aptId: string) => {
    setDraggedAptId(aptId);
    e.dataTransfer.setData('text/plain', aptId);
  };

  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;

    const dayCfg = currentProf?.scheduleByDay?.[dayIndex];
    if (!dayCfg || !dayCfg.enabled || time < dayCfg.startHour || time > dayCfg.endHour) {
      showToast(
        'Fuera del horario de ese día',
        `${currentProf.name} no atiende los ${DAY_NAMES[dayIndex - 1]?.label} a las ${time} hrs.`,
        'warn'
      );
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
      prev.map((a) =>
        a.id === draggedAptId
          ? { ...a, isoDate, time, boxName: dayCfg.boxAssigned }
          : a
      )
    );
    setDraggedAptId(null);

    if (movedApt) {
      showToast(
        'Cita reagendada',
        `${movedApt.patientName} movido al ${isoDate} a las ${time} hrs.`
      );
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

  const deleteAppointment = (aptId: string) => {
    const target = appointments.find((a) => a.id === aptId);
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    if (editingApt?.id === aptId) setEditingApt(null);
    if (fichaPatientApt?.id === aptId) setFichaPatientApt(null);
    showToast(
      'Registro eliminado',
      target ? `Se eliminó la cita de ${target.patientName}` : undefined
    );
  };

  const handleSaveEditedAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === editingApt.id ? editingApt : a))
    );
    showToast('Datos del paciente actualizados', editingApt.patientName);
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
      services.find((s) => s.name === newBookingForm.serviceName) ?? services[0];
    const dayCfg = currentProf?.scheduleByDay?.[slotModal.dayIndex];

    const createdApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName: newBookingForm.patientName.trim(),
      patientRUT:
        newBookingForm.patientRUT.trim().length > 0
          ? newBookingForm.patientRUT.trim()
          : 'Sin RUT',
      patientEmail: newBookingForm.patientEmail.trim(),
      patientPhone: newBookingForm.patientPhone.replace(/\D/g, ''),
      professionalId: selectedProfId,
      serviceName: newBookingForm.serviceName,
      modality: newBookingForm.modality,
      boxName:
        newBookingForm.modality === 'Presencial'
          ? dayCfg?.boxAssigned ?? 'Box 1'
          : 'Sala Online',
      isoDate: slotModal.isoDate,
      time: slotModal.time,
      price: svcObj ? svcObj.price : 45000,
      paymentStatus: newBookingForm.paymentStatus,
      clinicalStatus: 'Confirmada',
      notes: newBookingForm.notes.trim(),
      clinicalHistory: [],
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
      serviceName: services[0]?.name ?? 'Psicoterapia Individual',
      modality: 'Online',
      paymentStatus: 'Pendiente',
      notes: '',
    });
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const newSrv: TherapistServiceItem = {
      id: `srv-${Date.now()}`,
      professionalId: serviceForm.professionalId,
      name: serviceForm.name.trim(),
      therapyType: serviceForm.therapyType.trim(),
      durationMinutes: Number(serviceForm.durationMinutes) || 50,
      price: Number(serviceForm.price) || 45000,
      modality: serviceForm.modality,
      allowedHoursLabel: serviceForm.allowedHoursLabel.trim(),
    };
    setServices((prev) => [...prev, newSrv]);
    setShowServiceModal(false);
    showToast('Servicio clínico agregado', newSrv.name);
  };

  const handleDeleteService = (srvId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== srvId));
    showToast('Servicio eliminado del catálogo');
  };

  const updateProfDaySchedule = (
    profId: string,
    dayIndex: number,
    patch: Partial<DayScheduleConfig>
  ) => {
    setProfessionals((prev) =>
      prev.map((p) => {
        if (p.id !== profId) return p;
        const currentDay = p.scheduleByDay[dayIndex] ?? {
          enabled: true,
          startHour: '09:00',
          endHour: '20:00',
          modality: 'Ambas (Híbrido)',
          boxAssigned: 'Box 1',
        };
        return {
          ...p,
          scheduleByDay: {
            ...p.scheduleByDay,
            [dayIndex]: { ...currentDay, ...patch },
          },
        };
      })
    );
  };

  const openCreateProfModal = () => {
    setEditingProfId(null);
    setProfForm({
      name: '',
      specialty: 'Psicoterapia Clínica',
      rut: '',
      email: '',
      presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
      onlineRoomUrl: 'https://meet.google.com/clinica-sala',
      agreementType: 'porcentaje',
      centerCommissionPercent: 25,
      fixedBoxRent: 0,
      boxCostPerSession: 8000,
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
      presencialAddress: prof.presencialAddress,
      onlineRoomUrl: prof.onlineRoomUrl,
      agreementType: prof.agreementType,
      centerCommissionPercent: prof.centerCommissionPercent,
      fixedBoxRent: prof.fixedBoxRent,
      boxCostPerSession: prof.boxCostPerSession,
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
                presencialAddress: profForm.presencialAddress.trim(),
                onlineRoomUrl: profForm.onlineRoomUrl.trim(),
                agreementType: profForm.agreementType,
                centerCommissionPercent: Number(profForm.centerCommissionPercent) || 0,
                fixedBoxRent: Number(profForm.fixedBoxRent) || 0,
                boxCostPerSession: Number(profForm.boxCostPerSession) || 0,
              }
            : p
        )
      );
      showToast('Ficha de profesional actualizada', profForm.name);
    } else {
      const createdProf: ProfessionalConfig = {
        id: `prof-${Date.now()}`,
        name: profForm.name.trim(),
        specialty: profForm.specialty.trim(),
        rut: profForm.rut.trim(),
        email: profForm.email.trim(),
        avatar: initials,
        presencialAddress: profForm.presencialAddress.trim(),
        onlineRoomUrl: profForm.onlineRoomUrl.trim(),
        scheduleByDay: buildDefaultSchedule(false),
        agreementType: profForm.agreementType,
        centerCommissionPercent: Number(profForm.centerCommissionPercent) || 0,
        fixedBoxRent: Number(profForm.fixedBoxRent) || 0,
        boxCostPerSession: Number(profForm.boxCostPerSession) || 0,
      };
      setProfessionals((prev) => [...prev, createdProf]);
      setSelectedProfId(createdProf.id);
      showToast('Nuevo profesional incorporado', createdProf.name);
    }
    setShowProfModal(false);
  };

  const handleDeleteProfessional = (profId: string) => {
    if (professionals.length <= 1) {
      showToast('Acción bloqueada', 'El centro debe mantener al menos 1 profesional.', 'warn');
      return;
    }
    const remaining = professionals.filter((p) => p.id !== profId);
    setProfessionals(remaining);
    if (selectedProfId === profId) setSelectedProfId(remaining[0].id);
    setAppointments((prev) =>
      prev.map((a) => (a.professionalId === profId ? { ...a, professionalId: remaining[0].id } : a))
    );
    showToast('Profesional eliminado del centro');
  };

  const SIDEBAR_ITEMS: {
    id: AdminModule;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Resumen Ejecutivo', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
    {
      id: 'pacientes',
      label: 'Pacientes & Ficha IA',
      badge: String(appointments.length),
      icon: Users,
    },
    {
      id: 'servicios',
      label: 'Servicios & Terapias',
      badge: String(services.length),
      icon: BriefcaseMedical,
    },
    {
      id: 'profesionales',
      label: 'Profesionales & Horarios',
      badge: String(professionals.length),
      icon: Stethoscope,
    },
    { id: 'documentos', label: 'Documentos Clínicos', icon: FileText },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
    { id: 'finanzas', label: 'Caja & Liquidación Box', icon: Wallet },
  ];

  const singleDayMeta = useMemo(() => {
    const [y, m, d] = selectedSingleDayIso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const dow = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
    return {
      iso: selectedSingleDayIso,
      dayIndex: dow,
      fullLabel: dateObj.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [selectedSingleDayIso]);

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
          BARRA LATERAL CON EL NOMBRE DEL CENTRO CLÍNICO REGISTRADO
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
                {centerBrandName.slice(0, 1).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 font-bold block">
                    Centro Clínico Activo
                  </span>
                  {isEditingCenterName ? (
                    <input
                      autoFocus
                      type="text"
                      value={centerBrandName}
                      onChange={(e) => setCenterBrandName(e.target.value)}
                      onBlur={() => setIsEditingCenterName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingCenterName(false);
                      }}
                      className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-lg w-40 focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingCenterName(true)}
                      className="text-left group flex items-center gap-1.5"
                      title="Haz clic para cambiar el nombre de tu Centro Clínico"
                    >
                      <h1 className="text-sm font-bold text-white truncate max-w-[145px]">
                        {centerBrandName}
                      </h1>
                      <Edit3
                        size={12}
                        className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </button>
                  )}
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
                <span className="text-stone-300 font-semibold flex items-center gap-1.5 truncate">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{centerBrandName}</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <a
                href="/centro/mi-centro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-[#C87D65] hover:bg-[#b56d56] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs shadow-sm"
              >
                <span>Portal de Reserva Público</span>
                <ExternalLink size={13} />
              </a>
              <p className="text-[10px] text-stone-400 text-center pt-0.5">
                Infraestructura Kairós SaaS
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          CONTENEDOR CENTRAL DEL CENTRO CLÍNICO
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65]">
                  {centerBrandName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingCenterName(true)}
                  className="text-[10px] font-semibold text-stone-400 hover:text-[#2C4A3B] underline"
                >
                  Cambiar nombre del centro
                </button>
              </div>
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
                placeholder="Buscar paciente, RUT o terapia..."
                className="pl-9 pr-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl text-xs focus:outline-none focus:border-[#2C4A3B] w-56 transition-all"
              />
            </div>

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
          {/* ---------------------------------------------------------
              1. RESUMEN EJECUTIVO
             --------------------------------------------------------- */}
          {activeModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Facturación Bruta Centro
                    </span>
                    <p className="text-2xl font-bold text-stone-900 mt-1">
                      ${financialBreakdown.totalGrossCenter.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Ingreso Centro (Boxes / %)
                    </span>
                    <p className="text-2xl font-bold text-[#2C4A3B] mt-1">
                      ${financialBreakdown.totalCenterRetention.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Home size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Líquido a Profesionales
                    </span>
                    <p className="text-2xl font-bold text-[#C87D65] mt-1">
                      ${financialBreakdown.totalNetProfessionals.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C87D65] flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Promedio Retención / Box
                    </span>
                    <p className="text-2xl font-bold text-stone-900 mt-1">
                      ${financialBreakdown.avgRevenuePerBoxSession.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
                    <Calculator size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-[#E4ECE7] shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4ECE7] pb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                      {centerBrandName}
                    </span>
                    <h3 className="text-2xl font-bold text-stone-900">
                      Resumen Operativo del Centro
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveModule('agenda')}
                      className="px-5 py-3 bg-[#2C4A3B] text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-[#233B2F] transition-all"
                    >
                      Abrir Agenda
                    </button>
                    <button
                      onClick={() => setActiveModule('pacientes')}
                      className="px-5 py-3 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-800 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
                    >
                      Pacientes & Ficha IA Grok
                    </button>
                    <button
                      onClick={() => setActiveModule('servicios')}
                      className="px-5 py-3 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-800 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
                    >
                      Catálogo de Servicios
                    </button>
                    <button
                      onClick={() => setActiveModule('finanzas')}
                      className="px-5 py-3 bg-[#F9F8F6] border border-[#E4ECE7] text-stone-800 rounded-2xl text-xs font-bold hover:bg-stone-100 transition-all"
                    >
                      Liquidación de Boxes y Profesionales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              2. AGENDA (CON VISTAS DIARIA, SEMANAL Y MENSUAL + HORARIOS POR DÍA)
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
                        <p className="text-[10px] opacity-80 mt-0.5">{prof.specialty}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selector de Vista: Diario | Semanal | Mensual */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#F9F8F6] p-1 rounded-2xl border border-[#E4ECE7]">
                    {(
                      [
                        { id: 'day', label: 'Diario' },
                        { id: 'week', label: 'Semanal' },
                        { id: 'month', label: 'Mensual' },
                      ] as const
                    ).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCalendarView(v.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          calendarView === v.id
                            ? 'bg-[#2C4A3B] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {/* Navegación de Fechas */}
                  <div className="flex items-center gap-1.5 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarView === 'day') {
                          const [y, m, d] = selectedSingleDayIso.split('-').map(Number);
                          const prev = new Date(y, m - 1, d - 1, 12, 0, 0);
                          handleJumpToDate(formatIsoDate(prev));
                        } else {
                          setWeekOffset((prev) => prev - 1);
                        }
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-700"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWeekOffset(0);
                        setSelectedSingleDayIso(todayIso);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-700 border border-stone-200/80 hover:bg-stone-100"
                    >
                      Hoy
                    </button>

                    <div className="px-2.5 py-1 text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-[#2C4A3B]" />
                      <span className="capitalize">
                        {calendarView === 'day'
                          ? singleDayMeta.fullLabel
                          : calendarView === 'month'
                          ? dynamicMonthDays.monthTitle
                          : weekRangeLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (calendarView === 'day') {
                          const [y, m, d] = selectedSingleDayIso.split('-').map(Number);
                          const next = new Date(y, m - 1, d + 1, 12, 0, 0);
                          handleJumpToDate(formatIsoDate(next));
                        } else {
                          setWeekOffset((prev) => prev + 1);
                        }
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-700"
                    >
                      <ChevronRight size={15} />
                    </button>

                    <input
                      type="date"
                      value={selectedSingleDayIso}
                      onChange={(e) => handleJumpToDate(e.target.value)}
                      className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#2C4A3B]"
                    />
                  </div>
                </div>
              </div>

              {/* VISTA 1: AGENDA DIARIA */}
              {calendarView === 'day' && (
                <div className="bg-white rounded-[2rem] border border-[#E4ECE7] p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4ECE7] pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                        Vista Diaria Detallada · {currentProf?.name}
                      </span>
                      <h3 className="text-lg font-bold text-stone-900 capitalize">
                        {singleDayMeta.fullLabel}
                      </h3>
                    </div>
                    <div className="text-xs text-stone-600 bg-[#F9F8F6] px-4 py-2 rounded-xl border border-[#E4ECE7]">
                      {currentProf?.scheduleByDay?.[singleDayMeta.dayIndex]?.enabled ? (
                        <span>
                          <strong>Horario de hoy:</strong>{' '}
                          {currentProf.scheduleByDay[singleDayMeta.dayIndex].startHour} a{' '}
                          {currentProf.scheduleByDay[singleDayMeta.dayIndex].endHour} hrs ·{' '}
                          {currentProf.scheduleByDay[singleDayMeta.dayIndex].modality} (
                          {currentProf.scheduleByDay[singleDayMeta.dayIndex].boxAssigned})
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">
                          El profesional no tiene atención habilitada este día
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-[#E4ECE7]">
                    {visibleHours.map((hour) => {
                      const dayCfg = currentProf?.scheduleByDay?.[singleDayMeta.dayIndex];
                      const isWithinDayHours =
                        Boolean(dayCfg?.enabled) &&
                        hour >= (dayCfg?.startHour ?? '09:00') &&
                        hour <= (dayCfg?.endHour ?? '20:00');
                      const apt = appointments.find(
                        (a) =>
                          a.professionalId === selectedProfId &&
                          a.isoDate === singleDayMeta.iso &&
                          a.time === hour
                      );
                      const blocked = blockedSlots.find(
                        (b) =>
                          b.professionalId === selectedProfId &&
                          b.isoDate === singleDayMeta.iso &&
                          b.time === hour
                      );

                      return (
                        <div
                          key={hour}
                          className={`py-3 px-4 flex items-center justify-between gap-4 ${
                            !isWithinDayHours ? 'bg-stone-100/60 opacity-55' : 'hover:bg-[#F9F8F6]'
                          }`}
                        >
                          <div className="w-20 shrink-0">
                            <span className="text-sm font-bold text-stone-800">{hour} hrs</span>
                          </div>

                          <div className="flex-1">
                            {!isWithinDayHours ? (
                              <span className="text-xs text-stone-400">
                                Fuera del turno configurado para este día
                              </span>
                            ) : blocked ? (
                              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-stone-100 border border-dashed border-stone-300 text-xs">
                                <Ban size={14} className="text-stone-500" />
                                <span className="font-bold">{blocked.reason}</span>
                                <button
                                  onClick={() =>
                                    setBlockedSlots((prev) =>
                                      prev.filter((b) => b.id !== blocked.id)
                                    )
                                  }
                                  className="text-rose-600 font-bold hover:underline ml-2"
                                >
                                  Desbloquear
                                </button>
                              </div>
                            ) : apt ? (
                              <div
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setContextMenu({ x: e.clientX, y: e.clientY, apt });
                                }}
                                className="p-3.5 rounded-2xl bg-[#EBF3EE]/70 border border-[#2C4A3B]/30 flex flex-wrap items-center justify-between gap-3"
                              >
                                <div>
                                  <p className="font-bold text-sm text-stone-900">
                                    {apt.patientName}{' '}
                                    <span className="text-xs font-normal text-stone-500">
                                      ({apt.serviceName} · {apt.modality})
                                    </span>
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    {apt.boxName ?? dayCfg?.boxAssigned} · RUT: {apt.patientRUT}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setFichaPatientApt(apt)}
                                    className="px-3 py-1.5 rounded-xl bg-[#2C4A3B] text-white text-xs font-bold flex items-center gap-1"
                                  >
                                    <BrainCircuit size={13} />
                                    <span>Abrir Ficha IA</span>
                                  </button>
                                  <button
                                    onClick={() => togglePaymentStatus(apt.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                      apt.paymentStatus === 'Pagado'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {apt.paymentStatus}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSlotActionMode('book');
                                  setSlotModal({
                                    dayIndex: singleDayMeta.dayIndex,
                                    isoDate: singleDayMeta.iso,
                                    dayLabel: singleDayMeta.fullLabel,
                                    time: hour,
                                  });
                                }}
                                className="text-xs font-semibold text-[#2C4A3B] hover:underline flex items-center gap-1"
                              >
                                <Plus size={14} />
                                <span>
                                  Disponible ({dayCfg?.boxAssigned}) · Clic para agendar o bloquear
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VISTA 2: AGENDA SEMANAL */}
              {calendarView === 'week' && (
                <div className="bg-white rounded-[2rem] border border-[#E4ECE7] shadow-[0_12px_40px_rgb(44,74,59,0.05)] overflow-x-auto">
                  <div className="min-w-[980px]">
                    <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F9F8F6]/80">
                      <div className="p-3.5 text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-center border-r border-[#E4ECE7]">
                        Hora
                      </div>
                      {dynamicWeekDays.map((day) => {
                        const dayCfg = currentProf?.scheduleByDay?.[day.index];
                        const isWorkingDay = dayCfg?.enabled;
                        const isToday = day.iso === todayIso;
                        return (
                          <div
                            key={day.iso}
                            onClick={() => {
                              setSelectedSingleDayIso(day.iso);
                            }}
                            className={`p-3 text-center border-r last:border-r-0 border-[#E4ECE7] cursor-pointer ${
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
                            {isWorkingDay ? (
                              <span className="block text-[10px] font-semibold text-[#2C4A3B] mt-0.5">
                                {dayCfg.startHour} - {dayCfg.endHour} ({dayCfg.boxAssigned})
                              </span>
                            ) : (
                              <span className="block text-[10px] font-semibold text-rose-500 mt-0.5">
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
                        className="grid grid-cols-7 border-b last:border-b-0 border-[#E4ECE7] min-h-[104px]"
                      >
                        <div className="p-3 border-r border-[#E4ECE7] bg-[#F9F8F6]/40 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-stone-700">{hour}</span>
                          <span className="text-[10px] text-stone-400">hrs</span>
                        </div>

                        {dynamicWeekDays.map((day) => {
                          const cellKey = `${day.iso}-${hour}`;
                          const dayCfg = currentProf?.scheduleByDay?.[day.index];
                          const isSlotEnabledForDay =
                            Boolean(dayCfg?.enabled) &&
                            hour >= (dayCfg?.startHour ?? '09:00') &&
                            hour <= (dayCfg?.endHour ?? '20:00');

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
                              b.time === hour
                          );
                          const isDragOver = dragOverCell === cellKey;

                          return (
                            <div
                              key={cellKey}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (isSlotEnabledForDay) setDragOverCell(cellKey);
                              }}
                              onDragLeave={() => setDragOverCell(null)}
                              onDrop={() => handleDropOnSlot(day.index, day.iso, hour)}
                              onClick={() => {
                                if (!apt && !blocked && isSlotEnabledForDay) {
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
                                !isSlotEnabledForDay
                                  ? 'bg-stone-100/60 cursor-not-allowed'
                                  : isDragOver
                                  ? 'bg-[#EBF3EE] ring-2 ring-inset ring-[#2C4A3B]'
                                  : !apt && !blocked
                                  ? 'hover:bg-[#F9F8F6] cursor-pointer group'
                                  : ''
                              }`}
                            >
                              {!apt && !blocked && isSlotEnabledForDay && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity h-full w-full flex flex-col items-center justify-center text-[10px] font-semibold text-[#2C4A3B]/70 gap-0.5">
                                  <Plus size={14} />
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
                                  <p className="text-[11px] truncate font-medium">
                                    {blocked.reason}
                                  </p>
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
                                    <span className="font-semibold text-[#2C4A3B] truncate">
                                      {apt.boxName ?? dayCfg?.boxAssigned}
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
              )}

              {/* VISTA 3: AGENDA MENSUAL */}
              {calendarView === 'month' && (
                <div className="bg-white rounded-[2rem] border border-[#E4ECE7] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-stone-900 capitalize">
                      Panorama Mensual · {dynamicMonthDays.monthTitle}
                    </h3>
                    <span className="text-xs text-stone-500">
                      Haz clic en cualquier día para abrir su Agenda Diaria detallada
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {dynamicMonthDays.days.map((d) => {
                      const dayApts = appointments.filter(
                        (a) => a.professionalId === selectedProfId && a.isoDate === d.iso
                      );
                      const dayCfg = currentProf?.scheduleByDay?.[d.dayOfWeekIndex];
                      return (
                        <div
                          key={d.iso}
                          onClick={() => {
                            setSelectedSingleDayIso(d.iso);
                            setCalendarView('day');
                          }}
                          className={`min-h-[115px] rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                            !dayCfg?.enabled
                              ? 'bg-stone-100/60 border-stone-200/60 opacity-60'
                              : d.iso === todayIso
                              ? 'bg-[#EBF3EE]/60 border-[#2C4A3B]'
                              : 'bg-white border-[#E4ECE7] hover:border-[#2C4A3B]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-stone-400">
                              {d.shortDay}
                            </span>
                            <span className="text-sm font-bold text-stone-900">{d.dayNum}</span>
                          </div>

                          <div className="space-y-1 my-1">
                            {dayApts.slice(0, 3).map((a) => (
                              <div
                                key={a.id}
                                className="px-2 py-1 rounded-lg bg-[#2C4A3B]/10 text-[#2C4A3B] text-[10px] font-semibold truncate"
                              >
                                {a.time} · {a.patientName}
                              </div>
                            ))}
                            {dayApts.length > 3 && (
                              <span className="text-[10px] font-bold text-stone-500 block">
                                +{dayApts.length - 3} sesiones más
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-stone-400">
                            {dayCfg?.enabled
                              ? `${dayCfg.startHour}-${dayCfg.endHour}`
                              : 'Sin turno'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------
              3. MÓDULO PACIENTES & FICHA CLÍNICA CON IA GROK
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
                              className="p-2 rounded-xl bg-stone-100 hover:bg-[#EBF3EE] text-stone-700 hover:text-[#2C4A3B]"
                              title="Editar Paciente"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAppointment(apt.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                              title="Eliminar Paciente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#F9F8F6] p-4 rounded-2xl border border-[#E4ECE7] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Terapia:</span>
                            <strong className="text-stone-900">{apt.serviceName}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Modalidad / Box:</span>
                            <strong className="text-[#2C4A3B]">
                              {apt.modality} ({apt.boxName ?? 'Box 1'})
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Próxima Sesión:</span>
                            <strong className="text-stone-800">
                              {apt.isoDate} · {apt.time} hrs
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Evoluciones en Ficha:</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#2C4A3B] font-bold text-[10px]">
                              {(apt.clinicalHistory ?? []).length} registros IA
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFichaPatientApt(apt);
                            setRawSessionNotes('');
                            setGrokPreviewNote('');
                          }}
                          className="w-full py-3 px-4 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                        >
                          <BrainCircuit size={15} />
                          <span>Abrir Ficha Clínica + IA Grok</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => triggerEmailNotification(apt, true)}
                            className="py-2 px-3 bg-[#EBF3EE] text-[#2C4A3B] rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <Send size={12} />
                            <span>Correo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDirectWhatsApp(apt)}
                            className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <MessageSquare size={12} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              4. MÓDULO SERVICIOS & TERAPIAS
             --------------------------------------------------------- */}
          {activeModule === 'servicios' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Catálogo Clínico Personalizable
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Servicios, Tipos de Terapia, Horarios Libres y Aranceles
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Cada profesional define qué terapias realiza, su duración, valor y en qué rango horario las ofrece (incluyendo horarios vespertinos después de las 20:00 hrs).
                  </p>
                </div>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl text-xs font-bold shadow-xs"
                >
                  <Plus size={16} />
                  <span>Crear Nuevo Servicio / Terapia</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((srv) => {
                  const assignedProf = professionals.find((p) => p.id === srv.professionalId);
                  return (
                    <div
                      key={srv.id}
                      className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-[10px] font-bold uppercase tracking-wider mb-2">
                            {srv.therapyType}
                          </span>
                          <h4 className="font-bold text-lg text-stone-900">{srv.name}</h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Impartido por:{' '}
                            <strong>
                              {srv.professionalId === 'all'
                                ? 'Todos los profesionales del centro'
                                : assignedProf?.name ?? 'Especialista'}
                            </strong>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-bold text-[#2C4A3B] block">
                            ${srv.price.toLocaleString('es-CL')}
                          </span>
                          <span className="text-xs text-stone-400">{srv.durationMinutes} min</span>
                        </div>
                      </div>

                      <div className="bg-[#F9F8F6] rounded-2xl p-4 border border-[#E4ECE7] grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            Modalidad Habilitada
                          </span>
                          <span className="font-semibold text-stone-800">{srv.modality}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-stone-400 block">
                            Franja Horaria Permitida
                          </span>
                          <span className="font-semibold text-[#2C4A3B]">
                            {srv.allowedHoursLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar Servicio</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              5. MÓDULO PROFESIONALES & HORARIOS DIFERENCIADOS POR DÍA (07:00 A 23:00)
             --------------------------------------------------------- */}
          {activeModule === 'profesionales' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Disponibilidad Flexible Día a Día
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Profesionales, Turnos Diferenciados por Día (07:00 a 23:00) y Convenio Box
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Configura horarios distintos para cada día (ej. Lunes solo en la mañana, Martes en la tarde hasta las 22:00 o 23:00 hrs) y el box asignado.
                  </p>
                </div>
                <button
                  onClick={openCreateProfModal}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl text-xs font-bold shadow-xs"
                >
                  <UserPlus size={16} />
                  <span>Agregar Nuevo Profesional</span>
                </button>
              </div>

              <div className="space-y-6">
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-white rounded-[2rem] p-7 border border-[#E4ECE7] shadow-xs space-y-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4ECE7] pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-base">
                          {prof.avatar}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-stone-900">{prof.name}</h4>
                          <p className="text-xs text-stone-500">
                            {prof.specialty} · RUT: {prof.rut} ·{' '}
                            <strong className="text-[#2C4A3B]">
                              Convenio:{' '}
                              {prof.agreementType === 'porcentaje'
                                ? `${prof.centerCommissionPercent}% Centro`
                                : prof.agreementType === 'arriendo_fijo'
                                ? `Arriendo Fijo $${prof.fixedBoxRent.toLocaleString('es-CL')}`
                                : `$${prof.boxCostPerSession.toLocaleString('es-CL')} por Box/Sesión`}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditProfModal(prof)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-[#EBF3EE] text-stone-700 hover:text-[#2C4A3B] text-xs font-bold"
                        >
                          <Edit3 size={14} />
                          <span>Editar Convenio / Dirección</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfessional(prof.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
                        Horario Específico por Día (Puedes fijar mañana, tarde o noche hasta las 23:00 hrs en cada día)
                      </label>
                      <div className="space-y-2">
                        {DAY_NAMES.map((dayMeta) => {
                          const cfg = prof.scheduleByDay?.[dayMeta.index] ?? {
                            enabled: false,
                            startHour: '09:00',
                            endHour: '20:00',
                            modality: 'Ambas (Híbrido)',
                            boxAssigned: 'Box 1',
                          };
                          return (
                            <div
                              key={dayMeta.index}
                              className={`p-3 rounded-2xl border grid grid-cols-1 sm:grid-cols-12 items-center gap-3 text-xs transition-all ${
                                cfg.enabled
                                  ? 'bg-[#F9F8F6] border-[#E4ECE7]'
                                  : 'bg-stone-100/60 border-stone-200/60 opacity-60'
                              }`}
                            >
                              <div className="sm:col-span-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={cfg.enabled}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      enabled: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 accent-[#2C4A3B] rounded"
                                />
                                <span className="font-bold text-stone-900">{dayMeta.label}</span>
                              </div>

                              <div className="sm:col-span-3 flex items-center gap-1.5">
                                <span className="text-stone-400 text-[11px]">Inicio:</span>
                                <select
                                  disabled={!cfg.enabled}
                                  value={cfg.startHour}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      startHour: e.target.value,
                                    })
                                  }
                                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 w-full"
                                >
                                  {FULL_DAY_HOURS.map((h) => (
                                    <option key={h} value={h}>
                                      {h} hrs
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-3 flex items-center gap-1.5">
                                <span className="text-stone-400 text-[11px]">Término:</span>
                                <select
                                  disabled={!cfg.enabled}
                                  value={cfg.endHour}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      endHour: e.target.value,
                                    })
                                  }
                                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 w-full"
                                >
                                  {FULL_DAY_HOURS.map((h) => (
                                    <option key={h} value={h}>
                                      {h} hrs
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <select
                                  disabled={!cfg.enabled}
                                  value={cfg.modality}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      modality: e.target.value as DayScheduleConfig['modality'],
                                    })
                                  }
                                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 w-full"
                                >
                                  <option value="Ambas (Híbrido)">Híbrido</option>
                                  <option value="Solo Online">Solo Online</option>
                                  <option value="Solo Presencial">Solo Presencial</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <input
                                  disabled={!cfg.enabled}
                                  type="text"
                                  value={cfg.boxAssigned}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      boxAssigned: e.target.value,
                                    })
                                  }
                                  placeholder="Ej. Box 1"
                                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-medium text-stone-800 w-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              6. DOCUMENTOS CLÍNICOS
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
              7. COMUNICACIONES
             --------------------------------------------------------- */}
          {activeModule === 'comunicaciones' && (
            <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs">
              <ComunicacionesTab
                centerId={defaultCenterId}
                appointments={appointments}
                professionals={professionals}
              />
            </div>
          )}

          {/* ---------------------------------------------------------
              8. CAJA & FINANZAS (PROMEDIO POR BOX, ARRIENDO FIJO, % COMISIÓN, BRUTO VS NETO)
             --------------------------------------------------------- */}
          {activeModule === 'finanzas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Total Bruto Generado
                  </span>
                  <p className="text-2xl font-bold text-stone-900 mt-1">
                    ${financialBreakdown.totalGrossCenter.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Pagado: ${financialBreakdown.totalPaidCenter.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Retención Centro (Boxes / %)
                  </span>
                  <p className="text-2xl font-bold text-[#2C4A3B] mt-1">
                    ${financialBreakdown.totalCenterRetention.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Utilidad directa para {centerBrandName}
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Total Líquido Profesionales
                  </span>
                  <p className="text-2xl font-bold text-[#C87D65] mt-1">
                    ${financialBreakdown.totalNetProfessionals.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Descontando arriendo de box o comisión
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Promedio Ingreso por Uso de Box
                  </span>
                  <p className="text-2xl font-bold text-stone-900 mt-1">
                    ${financialBreakdown.avgRevenuePerBoxSession.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    {financialBreakdown.totalPresencialBoxUses} sesiones presenciales en box
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                      Liquidación Automática por Especialista
                    </span>
                    <h3 className="font-bold text-lg text-stone-900">
                      Desglose Bruto, Descuento por Box / Arriendo / Porcentaje y Líquido Profesional
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                        <th className="py-3 px-4">Profesional</th>
                        <th className="py-3 px-4">Convenio con el Centro</th>
                        <th className="py-3 px-4">Sesiones (Presencial)</th>
                        <th className="py-3 px-4">Total Bruto</th>
                        <th className="py-3 px-4">Descuento Centro / Box</th>
                        <th className="py-3 px-4">Líquido / Neto Profesional</th>
                        <th className="py-3 px-4">Configurar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4ECE7]">
                      {financialBreakdown.byProf.map((row) => (
                        <tr key={row.prof.id} className="hover:bg-[#F9F8F6]">
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {row.prof.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold">
                              {row.agreementDescription}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-stone-600">
                            {row.totalSessions} totales ({row.presencialSessionsCount} en box)
                          </td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            ${row.grossTotal.toLocaleString('es-CL')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">
                            - ${row.centerRetention.toLocaleString('es-CL')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-3 py-1 rounded-xl bg-[#EBF3EE] text-[#2C4A3B] font-bold text-sm">
                              ${row.netProfessional.toLocaleString('es-CL')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => openEditProfModal(row.prof)}
                              className="text-[#2C4A3B] font-bold hover:underline"
                            >
                              Cambiar % o Box
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs space-y-4">
                <h3 className="font-bold text-base text-stone-900">
                  Detalle de Pagos por Sesión Agendada
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                        <th className="py-3 px-4">Paciente</th>
                        <th className="py-3 px-4">Servicio</th>
                        <th className="py-3 px-4">Box / Modalidad</th>
                        <th className="py-3 px-4">Fecha / Hora</th>
                        <th className="py-3 px-4">Valor Bruto</th>
                        <th className="py-3 px-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4ECE7]">
                      {appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-[#F9F8F6]">
                          <td className="py-3 px-4 font-bold text-stone-900">{apt.patientName}</td>
                          <td className="py-3 px-4 text-stone-600">{apt.serviceName}</td>
                          <td className="py-3 px-4">
                            {apt.modality} · {apt.boxName ?? 'Box 1'}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {apt.isoDate} · {apt.time} hrs
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-900">
                            ${apt.price.toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 px-4">
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
            </div>
          )}
        </main>
      </div>

      {/* =========================================================
          DRAWER / MODAL DE FICHA CLÍNICA EVOLUTIVA CON IA GROK
         ========================================================= */}
      <AnimatePresence>
        {fichaPatientApt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-[#E4ECE7] p-7 overflow-y-auto flex flex-col justify-between space-y-6"
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b border-[#E4ECE7] pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-[10px] font-bold uppercase tracking-wider mb-2">
                      <BrainCircuit size={12} />
                      Ficha Clínica Electrónica · Asistida por IA Grok
                    </span>
                    <h3 className="text-2xl font-bold text-stone-900">
                      {fichaPatientApt.patientName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      RUT: {fichaPatientApt.patientRUT} · {fichaPatientApt.serviceName} (
                      {fichaPatientApt.modality})
                    </p>
                  </div>
                  <button
                    onClick={() => setFichaPatientApt(null)}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-[#F9F8F6] rounded-3xl p-5 border border-[#E4ECE7] space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Apuntes Rápidos de la Sesión (Borrador libre del terapeuta)
                  </label>
                  <textarea
                    rows={3}
                    value={rawSessionNotes}
                    onChange={(e) => setRawSessionNotes(e.target.value)}
                    placeholder="Escribe ideas sueltas de la sesión (ej. paciente llega angustiado por cambio laboral, trabajamos regulación emocional y límites...)"
                    className="w-full rounded-2xl border border-stone-200 bg-white p-3.5 text-xs focus:outline-none focus:border-[#2C4A3B]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingGrok || !rawSessionNotes.trim()}
                      onClick={handleGenerateGrokEvolution}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E3329] hover:bg-[#2C4A3B] text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
                    >
                      <Sparkles size={14} className="text-emerald-300" />
                      <span>
                        {isGeneratingGrok
                          ? 'Estructurando con IA Grok...'
                          : 'Estructurar Nota Clínica con IA Grok'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveEvolutionToFicha}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                    >
                      <Check size={14} />
                      <span>Guardar en Ficha Oficial</span>
                    </button>
                  </div>

                  {grokPreviewNote && (
                    <div className="mt-3 p-4 rounded-2xl bg-white border border-[#2C4A3B]/30 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C4A3B] block">
                        Propuesta Estructurada por IA Grok (Editable):
                      </span>
                      <textarea
                        rows={6}
                        value={grokPreviewNote}
                        onChange={(e) => setGrokPreviewNote(e.target.value)}
                        className="w-full text-xs text-stone-800 leading-relaxed focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Historial de Evoluciones Clínicas ({(fichaPatientApt.clinicalHistory ?? []).length})
                  </h4>
                  {(fichaPatientApt.clinicalHistory ?? []).length === 0 ? (
                    <p className="text-xs text-stone-400 italic">
                      Aún no hay evoluciones registradas en la ficha de este paciente.
                    </p>
                  ) : (
                    (fichaPatientApt.clinicalHistory ?? []).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded-2xl bg-white border border-[#E4ECE7] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-100 pb-1.5">
                          <strong className="text-[#2C4A3B]">{entry.date}</strong>
                          <span>Firma: {entry.professionalName}</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-stone-700 leading-relaxed">
                          {entry.grokStructuredNote}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL CREAR NUEVO SERVICIO / TERAPIA
         ========================================================= */}
      <AnimatePresence>
        {showServiceModal && (
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
                  Nuevo Servicio / Tipo de Terapia
                </h3>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Profesional que lo imparte
                  </label>
                  <select
                    value={serviceForm.professionalId}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, professionalId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                  >
                    <option value="all">Todos los profesionales del centro</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Nombre del Servicio
                  </label>
                  <input
                    required
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="Ej. Psicoterapia Individual Vespertina"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Tipo de Terapia / Enfoque
                  </label>
                  <input
                    required
                    type="text"
                    value={serviceForm.therapyType}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, therapyType: e.target.value })
                    }
                    placeholder="Ej. Cognitivo-Conductual, Sistémica, EMDR..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Duración (Minutos)
                    </label>
                    <input
                      type="number"
                      value={serviceForm.durationMinutes}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Valor ($ CLP)
                    </label>
                    <input
                      type="number"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Modalidad
                    </label>
                    <select
                      value={serviceForm.modality}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          modality: e.target.value as TherapistServiceItem['modality'],
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      <option value="Ambas (Híbrido)">Ambas (Híbrido)</option>
                      <option value="Online">Solo Online</option>
                      <option value="Presencial">Solo Presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Horario en que se ofrece
                    </label>
                    <input
                      type="text"
                      value={serviceForm.allowedHoursLabel}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          allowedHoursLabel: e.target.value,
                        })
                      }
                      placeholder="Ej. 08:00 a 23:00 hrs"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                >
                  Guardar Servicio Clínico
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                typeof window !== 'undefined' ? window.innerHeight - 400 : 320
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
                setFichaPatientApt(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EBF3EE] text-[#2C4A3B] font-bold transition-colors"
            >
              <BrainCircuit size={15} />
              <span>Abrir Ficha Clínica + IA Grok</span>
            </button>

            <button
              onClick={() => {
                setEditingApt({ ...contextMenu.apt });
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-900 font-bold transition-colors"
            >
              <Edit3 size={15} className="text-[#2C4A3B]" />
              <span>Editar Paciente / Cambiar Hora</span>
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
                openDirectWhatsApp(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-bold transition-colors"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>Enviar WhatsApp Directo</span>
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
                <h3 className="text-xl font-bold text-stone-900">
                  Modificar o Eliminar Paciente
                </h3>
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
                      Servicio / Terapia
                    </label>
                    <select
                      value={editingApt.serviceName}
                      onChange={(e) => {
                        const svc = services.find((s) => s.name === e.target.value);
                        setEditingApt({
                          ...editingApt,
                          serviceName: e.target.value,
                          price: svc ? svc.price : editingApt.price,
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Hora (07:00 a 23:00)
                    </label>
                    <select
                      value={editingApt.time}
                      onChange={(e) => setEditingApt({ ...editingApt, time: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                    >
                      {FULL_DAY_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h} hrs
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Fecha
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
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      Pago
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
                    <span>Eliminar</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold"
                  >
                    Guardar Cambios
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
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold uppercase text-stone-500 block mb-1">
                        Servicio / Terapia
                      </label>
                      <select
                        value={newBookingForm.serviceName}
                        onChange={(e) =>
                          setNewBookingForm({ ...newBookingForm, serviceName: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.name}>
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
                          <option value="Presencial">Consulta Presencial (Box)</option>
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
                  {slotActionMode === 'block' ? 'Confirmar Bloqueo' : 'Confirmar Cita en Agenda'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL CRUD PROFESIONAL + MODELO DE ARRIENDO BOX / PORCENTAJE
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
              className="bg-white rounded-[2rem] max-w-lg w-full p-7 border border-[#E4ECE7] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-stone-900">
                  {editingProfId
                    ? 'Configurar Profesional y Convenio Box'
                    : 'Nuevo Profesional Clínico'}
                </h3>
                <button
                  onClick={() => setShowProfModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfessional} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
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
                    />
                  </div>
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
                </div>

                <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-3">
                  <label className="font-bold uppercase text-[#2C4A3B] block">
                    Convenio Financiero con el Centro (Descuento para Liquidación)
                  </label>
                  <select
                    value={profForm.agreementType}
                    onChange={(e) =>
                      setProfForm({
                        ...profForm,
                        agreementType: e.target.value as FinancialAgreementType,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                  >
                    <option value="porcentaje">
                      Porcentaje de Comisión por Sesión (% para el Centro)
                    </option>
                    <option value="por_box_hora">
                      Cobro por Uso de Box Presencial ($ por cada sesión en Box)
                    </option>
                    <option value="arriendo_fijo">
                      Arriendo Fijo Mensual de Box ($ monto fijo descontado)
                    </option>
                  </select>

                  {profForm.agreementType === 'porcentaje' && (
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">
                        Porcentaje que retiene el Centro (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={profForm.centerCommissionPercent}
                        onChange={(e) =>
                          setProfForm({
                            ...profForm,
                            centerCommissionPercent: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                  )}

                  {profForm.agreementType === 'por_box_hora' && (
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">
                        Valor Arriendo por Hora/Sesión en Box ($ CLP)
                      </label>
                      <input
                        type="number"
                        value={profForm.boxCostPerSession}
                        onChange={(e) =>
                          setProfForm({
                            ...profForm,
                            boxCostPerSession: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                  )}

                  {profForm.agreementType === 'arriendo_fijo' && (
                    <div>
                      <label className="font-bold text-stone-600 block mb-1">
                        Monto Arriendo Fijo de Box ($ CLP)
                      </label>
                      <input
                        type="number"
                        value={profForm.fixedBoxRent}
                        onChange={(e) =>
                          setProfForm({
                            ...profForm,
                            fixedBoxRent: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Dirección Consulta Presencial
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
                    Enlace Sala Online
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

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                >
                  Guardar Profesional y Convenio
                </button>
              </form>
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