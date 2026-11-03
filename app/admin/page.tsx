'use client';

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
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
  UserPlus,
  Filter,
  Edit3,
  CalendarDays,
  TrendingUp,
  BrainCircuit,
  ImagePlus,
  UserCheck,
  Mic,
  Square,
  Repeat,
  DoorOpen,
  Activity,
  UserX,
  Upload,
  Download,
  FileSpreadsheet,
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

export type CalendarViewMode = 'day' | 'week' | 'month' | 'center_boxes';
export type ModalityType = 'Online' | 'Presencial';
export type PaymentStatus = 'Pagado' | 'Pendiente';
export type ClinicalStatus =
  | 'Confirmada'
  | 'En Espera'
  | 'En Consulta'
  | 'Atendida'
  | 'No Asistió';
export type FinancialAgreementType = 'porcentaje' | 'arriendo_fijo' | 'por_box_hora';
export type RecurrenceFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface TimeRangeBlock {
  startHour: string;
  endHour: string;
}

export interface DayScheduleConfig {
  enabled: boolean;
  blocks: TimeRangeBlock[];
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
  googleConnected: boolean;
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
  sourceType: 'audio_ia' | 'manual_ia';
  grokStructuredNote: string;
  professionalName: string;
}

export interface PatientRecord {
  id: string;
  patientName: string;
  patientRUT: string;
  patientEmail: string;
  patientPhone: string;
  defaultService: string;
  defaultModality: ModalityType;
  assignedProfessionalId: string;
  clinicalStatusTag: 'Activo' | 'En Seguimiento' | 'Alta Clínica' | 'Abandono';
  clinicalHistory: ClinicalEvolutionNote[];
}

export interface AppointmentItem {
  id: string;
  patientId: string;
  patientName: string;
  patientRUT: string;
  patientEmail: string;
  patientPhone: string;
  professionalId: string;
  serviceName: string;
  modality: ModalityType;
  boxName?: string;
  meetUrl?: string;
  recurrenceLabel?: string;
  isoDate: string;
  time: string;
  price: number;
  paymentStatus: PaymentStatus;
  clinicalStatus: ClinicalStatus;
  notes?: string;
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

const DEFAULT_CENTER_BOXES = [
  'Box 1 · Salvia',
  'Box 2 · Arena',
  'Box 3 · Olivo',
  'Box 4 · Terracota',
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

function addDaysToIso(isoDate: string, daysToAdd: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  dateObj.setDate(dateObj.getDate() + daysToAdd);
  return formatIsoDate(dateObj);
}

function generateLocalMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n: number) =>
    Array.from({ length: n }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function normalizePhoneDigits(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 8) return `569${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  return digits.length > 0 ? digits : '56900000000';
}

function isHourInsideDayBlocks(dayCfg: DayScheduleConfig | undefined, hour: string): boolean {
  if (!dayCfg || !dayCfg.enabled) return false;
  if (!Array.isArray(dayCfg.blocks) || dayCfg.blocks.length === 0) return false;
  return dayCfg.blocks.some((b) => hour >= b.startHour && hour <= b.endHour);
}

function formatDayBlocksSummary(dayCfg: DayScheduleConfig | undefined): string {
  if (!dayCfg || !dayCfg.enabled || !Array.isArray(dayCfg.blocks) || dayCfg.blocks.length === 0) {
    return 'Sin atención';
  }
  return dayCfg.blocks.map((b) => `${b.startHour}-${b.endHour}`).join(' y ');
}

function buildDefaultScheduleWithColacion(boxName: string): Record<number, DayScheduleConfig> {
  return {
    1: {
      enabled: true,
      blocks: [
        { startHour: '09:00', endHour: '14:00' },
        { startHour: '16:00', endHour: '21:00' },
      ],
      modality: 'Ambas (Híbrido)',
      boxAssigned: boxName,
    },
    2: {
      enabled: true,
      blocks: [
        { startHour: '09:00', endHour: '13:00' },
        { startHour: '15:00', endHour: '21:00' },
      ],
      modality: 'Ambas (Híbrido)',
      boxAssigned: boxName,
    },
    3: {
      enabled: true,
      blocks: [
        { startHour: '09:00', endHour: '14:00' },
        { startHour: '16:00', endHour: '21:00' },
      ],
      modality: 'Ambas (Híbrido)',
      boxAssigned: boxName,
    },
    4: {
      enabled: true,
      blocks: [
        { startHour: '10:00', endHour: '14:00' },
        { startHour: '16:00', endHour: '22:00' },
      ],
      modality: 'Ambas (Híbrido)',
      boxAssigned: boxName,
    },
    5: {
      enabled: true,
      blocks: [{ startHour: '09:00', endHour: '18:00' }],
      modality: 'Ambas (Híbrido)',
      boxAssigned: boxName,
    },
    6: {
      enabled: false,
      blocks: [{ startHour: '09:00', endHour: '14:00' }],
      modality: 'Solo Online',
      boxAssigned: boxName,
    },
    7: {
      enabled: false,
      blocks: [{ startHour: '10:00', endHour: '14:00' }],
      modality: 'Solo Online',
      boxAssigned: boxName,
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
    onlineRoomUrl: 'https://meet.google.com/krs-aslv-clin',
    googleConnected: false,
    scheduleByDay: buildDefaultScheduleWithColacion('Box 1 · Salvia'),
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
    onlineRoomUrl: 'https://meet.google.com/krs-vmnt-tcc',
    googleConnected: false,
    scheduleByDay: buildDefaultScheduleWithColacion('Box 2 · Arena'),
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
    onlineRoomUrl: 'https://meet.google.com/krs-marr-sist',
    googleConnected: false,
    scheduleByDay: buildDefaultScheduleWithColacion('Box 3 · Olivo'),
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
    allowedHoursLabel: '09:00 a 14:00 y 16:00 a 21:00 hrs',
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
];

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-1',
    patientName: 'Camila Vergara',
    patientRUT: '18.456.789-2',
    patientEmail: 'camila@ejemplo.cl',
    patientPhone: '56961699991',
    defaultService: 'Psicoterapia Individual Adulto',
    defaultModality: 'Presencial',
    assignedProfessionalId: 'prof-1',
    clinicalStatusTag: 'Activo',
    clinicalHistory: [
      {
        id: 'ev-1',
        date: '2026-10-26',
        sourceType: 'audio_ia',
        grokStructuredNote:
          '• SÍNTESIS DE ESCUCHA CLÍNICA (IA Grok):\n  Paciente relata disminución de episodios de ansiedad laboral y mejor descanso nocturno.\n• FOCO TERAPÉUTICO:\n  Consolidación de límites saludables y manejo de rumiación.\n• PLAN CLÍNICO:\n  Continuar seguimiento semanal.',
        professionalName: 'Dr. Alejandro Silva',
      },
    ],
  },
  {
    id: 'pat-2',
    patientName: 'Matías Errázuriz',
    patientRUT: '16.789.234-5',
    patientEmail: 'matias@ejemplo.cl',
    patientPhone: '56961699991',
    defaultService: 'Psicoterapia Individual Adulto',
    defaultModality: 'Online',
    assignedProfessionalId: 'prof-1',
    clinicalStatusTag: 'Activo',
    clinicalHistory: [],
  },
  {
    id: 'pat-3',
    patientName: 'Sofía Domínguez',
    patientRUT: '19.321.654-8',
    patientEmail: 'sofia@ejemplo.cl',
    patientPhone: '56961699991',
    defaultService: 'Evaluación Psicodiagnóstica',
    defaultModality: 'Presencial',
    assignedProfessionalId: 'prof-2',
    clinicalStatusTag: 'En Seguimiento',
    clinicalHistory: [],
  },
];

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-101',
    patientId: 'pat-1',
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
    clinicalStatus: 'Atendida',
  },
  {
    id: 'apt-102',
    patientId: 'pat-2',
    patientName: 'Matías Errázuriz',
    patientRUT: '16.789.234-5',
    patientEmail: 'matias@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-1',
    serviceName: 'Psicoterapia Individual Adulto',
    modality: 'Online',
    boxName: 'Online (Google Meet)',
    meetUrl: 'https://meet.google.com/krs-mtez-ses',
    isoDate: '2026-11-03',
    time: '17:00',
    price: 45000,
    paymentStatus: 'Pagado',
    clinicalStatus: 'Confirmada',
  },
  {
    id: 'apt-103',
    patientId: 'pat-3',
    patientName: 'Sofía Domínguez',
    patientRUT: '19.321.654-8',
    patientEmail: 'sofia@ejemplo.cl',
    patientPhone: '56961699991',
    professionalId: 'prof-2',
    serviceName: 'Evaluación Psicodiagnóstica',
    modality: 'Presencial',
    boxName: 'Box 2 · Arena',
    isoDate: '2026-11-03',
    time: '10:00',
    price: 55000,
    paymentStatus: 'Pendiente',
    clinicalStatus: 'Confirmada',
  },
];

const INITIAL_BLOCKED_SLOTS: BlockedSlot[] = [
  {
    id: 'blk-1',
    professionalId: 'prof-1',
    isoDate: '2026-11-04',
    time: '13:00',
    reason: 'Reunión Clínica',
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
  const [centerLogoUrl, setCenterLogoUrl] = useState<string>('');
  const [centerBoxes, setCenterBoxes] = useState<string[]>(DEFAULT_CENTER_BOXES);
  const [newBoxNameInput, setNewBoxNameInput] = useState<string>('');
  const [showBrandingModal, setShowBrandingModal] = useState<boolean>(false);

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
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(INITIAL_BLOCKED_SLOTS);

  // Estado Importar / Exportar Planilla Excel / CSV
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importedPreviewRows, setImportedPreviewRows] = useState<PatientRecord[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');

  // Estado del selector de pacientes al agendar + repetición
  const [patientModeInBooking, setPatientModeInBooking] = useState<'existing' | 'new'>('existing');
  const [existingPatientSearch, setExistingPatientSearch] = useState<string>('');

  // Ficha Clínica con Escucha Ambiental IA Grok
  const [fichaPatient, setFichaPatient] = useState<PatientRecord | null>(null);
  const [isListeningSession, setIsListeningSession] = useState<boolean>(false);
  const [listeningSeconds, setListeningSeconds] = useState<number>(0);
  const [capturedAudioContext, setCapturedAudioContext] = useState<string>('');
  const [rawSessionNotes, setRawSessionNotes] = useState<string>('');
  const [grokPreviewNote, setGrokPreviewNote] = useState<string>('');
  const [isGeneratingGrok, setIsGeneratingGrok] = useState<boolean>(false);
  const speechRecRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Modal Crear Paciente directo en Directorio
  const [showNewPatientModal, setShowNewPatientModal] = useState<boolean>(false);
  const [newPatientDirectForm, setNewPatientDirectForm] = useState({
    patientName: '',
    patientRUT: '',
    patientEmail: '',
    patientPhone: '56961699991',
    defaultService: INITIAL_SERVICES[0].name,
    defaultModality: 'Presencial' as ModalityType,
    assignedProfessionalId: 'prof-1',
  });

  // Modal Nuevo Servicio
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState({
    professionalId: 'prof-1',
    name: '',
    therapyType: 'Enfoque Clínico Integrativo',
    durationMinutes: 50,
    price: 45000,
    modality: 'Ambas (Híbrido)' as TherapistServiceItem['modality'],
    allowedHoursLabel: '09:00 a 14:00 y 16:00 a 21:00 hrs',
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
  const [blockReasonInput, setBlockReasonInput] = useState('Colación / Supervisión');

  // Modal CRUD Cita
  const [editingApt, setEditingApt] = useState<AppointmentItem | null>(null);

  // Modal CRUD Paciente
  const [editingPatientRecord, setEditingPatientRecord] = useState<PatientRecord | null>(null);

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
    selectedPatientId: 'pat-1',
    patientName: '',
    patientRUT: '',
    patientEmail: '',
    patientPhone: '56961699991',
    serviceName: INITIAL_SERVICES[0].name,
    modality: 'Online' as ModalityType,
    paymentStatus: 'Pendiente' as PaymentStatus,
    recurrence: 'none' as RecurrenceFrequency,
    recurrenceCount: 4,
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
    const savedCenterName = localStorage.getItem('kairos_center_brand_v3');
    const savedLogo = localStorage.getItem('kairos_center_logo_v3');
    const savedBoxes = localStorage.getItem('kairos_center_boxes_v3');
    const savedProfs = localStorage.getItem('kairos_profs_v7');
    const savedSrvs = localStorage.getItem('kairos_services_v7');
    const savedPatients = localStorage.getItem('kairos_patients_v7');
    const savedApts = localStorage.getItem('kairos_apts_v7');
    const savedBlocks = localStorage.getItem('kairos_blocks_v7');
    if (savedCenterName) setCenterBrandName(savedCenterName);
    if (savedLogo) setCenterLogoUrl(savedLogo);
    if (savedBoxes) setCenterBoxes(JSON.parse(savedBoxes));
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedSrvs) setServices(JSON.parse(savedSrvs));
    if (savedPatients) setPatients(JSON.parse(savedPatients));
    if (savedApts) setAppointments(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));

    const onStorageSync = (e: StorageEvent) => {
      if (e.key === 'kairos_apts_v7' && e.newValue) {
        setAppointments(JSON.parse(e.newValue));
      }
      if (e.key === 'kairos_patients_v7' && e.newValue) {
        setPatients(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', onStorageSync);
    return () => window.removeEventListener('storage', onStorageSync);
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_center_brand_v3', centerBrandName);
    localStorage.setItem('kairos_center_brand_v2', centerBrandName);
  }, [centerBrandName]);

  useEffect(() => {
    localStorage.setItem('kairos_center_logo_v3', centerLogoUrl);
    localStorage.setItem('kairos_center_logo_v2', centerLogoUrl);
  }, [centerLogoUrl]);

  useEffect(() => {
    localStorage.setItem('kairos_center_boxes_v3', JSON.stringify(centerBoxes));
  }, [centerBoxes]);

  useEffect(() => {
    localStorage.setItem('kairos_profs_v7', JSON.stringify(professionals));
    localStorage.setItem('kairos_profs_v6', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kairos_services_v7', JSON.stringify(services));
    localStorage.setItem('kairos_services_v6', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('kairos_patients_v7', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('kairos_apts_v7', JSON.stringify(appointments));
    localStorage.setItem('kairos_apts_prod', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('kairos_blocks_v7', JSON.stringify(blockedSlots));
    localStorage.setItem('kairos_blocks_prod', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // =========================================================
  // MOTOR DE IMPORTACIÓN Y EXPORTACIÓN DE PACIENTES (EXCEL / CSV)
  // =========================================================
  const handleExportPatientsToExcelCsv = () => {
    const headers = [
      'Nombre Completo',
      'RUT',
      'Email',
      'Telefono WhatsApp',
      'Servicio Habitual',
      'Modalidad',
      'Profesional Asignado',
      'Estado Clinico',
    ];

    const rows = patients.map((p) => {
      const prof = professionals.find((pr) => pr.id === p.assignedProfessionalId);
      const clean = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        clean(p.patientName),
        clean(p.patientRUT),
        clean(p.patientEmail),
        clean(p.patientPhone),
        clean(p.defaultService),
        clean(p.defaultModality),
        clean(prof?.name ?? 'Dr. Alejandro Silva'),
        clean(p.clinicalStatusTag),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Pacientes_${centerBrandName.replace(/\s+/g, '_')}_${todayIso}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      'Planilla de pacientes exportada',
      `${patients.length} pacientes descargados en formato compatible con Excel.`
    );
  };

  const handleDownloadSampleTemplateCsv = () => {
    const sampleHeaders = [
      'Nombre Completo',
      'RUT',
      'Email',
      'Telefono WhatsApp',
      'Servicio Habitual',
      'Modalidad',
    ];
    const sampleRows = [
      'Valentina Rojas;19.456.123-K;valentina.rojas@ejemplo.cl;56987654321;Psicoterapia Individual Adulto;Online',
      'Sebastián Morales;17.222.333-4;sebastian.m@ejemplo.cl;56912345678;Terapia de Pareja / Vincular;Presencial',
      'Francisca Soto;20.111.444-9;fran.soto@ejemplo.cl;56961699991;Evaluación Psicodiagnóstica;Presencial',
    ];
    const csvContent = '\uFEFF' + [sampleHeaders.join(';'), ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Importar_Pacientes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleParseUploadedPatientSheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const rawText = String(evt.target?.result ?? '');
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) return;

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';')
        ? ';'
        : firstLine.includes('\t')
        ? '\t'
        : ',';

      const splitRow = (line: string) =>
        line
          .split(delimiter)
          .map((cell) => cell.replace(/^"|"$/g, '').trim());

      const firstRowCols = splitRow(firstLine).map((c) => c.toLowerCase());
      const hasHeader =
        firstRowCols.some(
          (c) => c.includes('nombre') || c.includes('paciente') || c.includes('name')
        ) ||
        firstRowCols.some(
          (c) =>
            c.includes('rut') ||
            c.includes('dni') ||
            c.includes('email') ||
            c.includes('correo')
        );

      const findIdx = (keywords: string[], fallbackIdx: number) => {
        if (!hasHeader) return fallbackIdx;
        const found = firstRowCols.findIndex((col) =>
          keywords.some((kw) => col.includes(kw))
        );
        return found >= 0 ? found : fallbackIdx;
      };

      const nameIdx = findIdx(['nombre', 'paciente', 'name', 'cliente'], 0);
      const rutIdx = findIdx(['rut', 'run', 'dni', 'documento'], 1);
      const emailIdx = findIdx(['email', 'correo', 'mail'], 2);
      const phoneIdx = findIdx(
        ['telefono', 'teléfono', 'whatsapp', 'celular', 'fono', 'movil'],
        3
      );
      const serviceIdx = findIdx(['servicio', 'terapia', 'prestacion'], 4);
      const modalityIdx = findIdx(['modalidad', 'tipo', 'atencion'], 5);

      const dataLines = hasHeader ? lines.slice(1) : lines;
      const parsedPatients: PatientRecord[] = [];

      dataLines.forEach((line, idx) => {
        const cols = splitRow(line);
        const rawName = cols[nameIdx] ?? '';
        if (!rawName || rawName.length < 2) return;

        const rawRut = cols[rutIdx] ?? 'Sin RUT';
        const rawEmail = cols[emailIdx] ?? '';
        const rawPhone = normalizePhoneDigits(cols[phoneIdx] ?? '');
        const rawService =
          cols[serviceIdx] || (services[0]?.name ?? 'Psicoterapia Individual Adulto');
        const rawModStr = (cols[modalityIdx] ?? '').toLowerCase();
        const mod: ModalityType = rawModStr.includes('online') ? 'Online' : 'Presencial';

        parsedPatients.push({
          id: `pat-imp-${Date.now()}-${idx}`,
          patientName: rawName,
          patientRUT: rawRut.length > 0 ? rawRut : 'Sin RUT',
          patientEmail: rawEmail.length > 0 ? rawEmail : 'sin-correo@paciente.cl',
          patientPhone: rawPhone,
          defaultService: rawService,
          defaultModality: mod,
          assignedProfessionalId: selectedProfId,
          clinicalStatusTag: 'Activo',
          clinicalHistory: [],
        });
      });

      setImportedPreviewRows(parsedPatients);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmBatchImportPatients = async () => {
    if (importedPreviewRows.length === 0) return;

    let addedCount = 0;
    let updatedCount = 0;

    setPatients((prev) => {
      const nextList = [...prev];
      importedPreviewRows.forEach((incoming) => {
        const existingIndex = nextList.findIndex(
          (p) =>
            (incoming.patientRUT !== 'Sin RUT' &&
              p.patientRUT.toLowerCase() === incoming.patientRUT.toLowerCase()) ||
            p.patientName.toLowerCase() === incoming.patientName.toLowerCase()
        );

        if (existingIndex >= 0) {
          nextList[existingIndex] = {
            ...nextList[existingIndex],
            patientEmail:
              incoming.patientEmail !== 'sin-correo@paciente.cl'
                ? incoming.patientEmail
                : nextList[existingIndex].patientEmail,
            patientPhone: incoming.patientPhone || nextList[existingIndex].patientPhone,
            defaultService:
              incoming.defaultService || nextList[existingIndex].defaultService,
          };
          updatedCount++;
        } else {
          nextList.push(incoming);
          addedCount++;
        }
      });
      return nextList;
    });

    setShowImportModal(false);
    setImportedPreviewRows([]);
    setImportFileName('');
    showToast(
      'Importación masiva completada',
      `${addedCount} pacientes nuevos registrados y ${updatedCount} actualizados.`
    );
  };

  // Subir Logo desde PC al pinchar la foto del centro arriba
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCenterLogoUrl(reader.result);
        showToast('Logo del centro actualizado');
      }
    };
    reader.readAsDataURL(file);
  };

  // Conectar Google Calendar de un Profesional: Una vez conectado, el botón desaparece
  const handleConnectProfGoogleCalendar = async (profId: string) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === profId ? { ...p, googleConnected: true } : p))
    );
    showToast(
      'Google Calendar sincronizado',
      'El calendario y Google Meet del profesional quedaron vinculados.'
    );
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}/admin`,
        },
      });
    }
  };

  const currentProf = useMemo(
    () => professionals.find((p) => p.id === selectedProfId) ?? professionals[0],
    [professionals, selectedProfId]
  );

  const visibleHours = useMemo(() => {
    if (!currentProf || !currentProf.scheduleByDay) return FULL_DAY_HOURS;
    const allBlocks: TimeRangeBlock[] = [];
    Object.values(currentProf.scheduleByDay).forEach((d) => {
      if (d.enabled && Array.isArray(d.blocks)) {
        allBlocks.push(...d.blocks);
      }
    });
    if (allBlocks.length === 0) return FULL_DAY_HOURS.slice(1, 15);
    const minStart = allBlocks.reduce(
      (min, b) => (b.startHour < min ? b.startHour : min),
      '23:00'
    );
    const maxEnd = allBlocks.reduce(
      (max, b) => (b.endHour > max ? b.endHour : max),
      '07:00'
    );
    return FULL_DAY_HOURS.filter((h) => h >= minStart && h <= maxEnd);
  }, [currentProf]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.patientName.toLowerCase().includes(q) ||
        p.patientRUT.toLowerCase().includes(q) ||
        p.patientEmail.toLowerCase().includes(q) ||
        p.defaultService.toLowerCase().includes(q);
      const matchesModality =
        patientModalityFilter === 'Todas' || p.defaultModality === patientModalityFilter;
      return matchesSearch && matchesModality;
    });
  }, [patients, searchQuery, patientModalityFilter]);

  const financialAndClinicalReport = useMemo(() => {
    const byProf = professionals.map((prof) => {
      const profApts = appointments.filter((a) => a.professionalId === prof.id);
      const profPatients = patients.filter((p) => p.assignedProfessionalId === prof.id);
      const uniquePatientIds = new Set(profApts.map((a) => a.patientId || a.patientRUT));
      const totalUniquePatients = Math.max(profPatients.length, uniquePatientIds.size);

      const retainedPatientsCount = profPatients.filter(
        (p) => p.clinicalStatusTag === 'Activo' || p.clinicalStatusTag === 'En Seguimiento'
      ).length;

      const noShowAppointmentsCount = profApts.filter(
        (a) => a.clinicalStatus === 'No Asistió'
      ).length;
      const droppedPatientsCount = profPatients.filter(
        (p) => p.clinicalStatusTag === 'Abandono'
      ).length;

      const retentionRate =
        totalUniquePatients > 0
          ? Math.min(100, Math.round((retainedPatientsCount / totalUniquePatients) * 100))
          : 100;

      const abandonmentRate =
        profApts.length > 0
          ? Math.min(
              100,
              Math.round(
                ((noShowAppointmentsCount + droppedPatientsCount) /
                  Math.max(1, profApts.length)) *
                  100
              )
            )
          : 0;

      const paidApts = profApts.filter((a) => a.paymentStatus === 'Pagado');
      const pendingApts = profApts.filter((a) => a.paymentStatus === 'Pendiente');
      const presencialSessionsCount = profApts.filter(
        (a) => a.modality === 'Presencial'
      ).length;

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
        agreementDescription = `Pago por Box ($${prof.boxCostPerSession.toLocaleString('es-CL')} × ${presencialSessionsCount})`;
      }

      const netProfessional = Math.max(0, grossTotal - centerRetention);

      return {
        prof,
        totalSessions: profApts.length,
        totalUniquePatients,
        retentionRate,
        abandonmentRate,
        noShowAppointmentsCount,
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
    const totalPresencialBoxUses = byProf.reduce(
      (acc, r) => acc + r.presencialSessionsCount,
      0
    );
    const avgRevenuePerBoxSession =
      totalPresencialBoxUses > 0
        ? Math.round(totalCenterRetention / totalPresencialBoxUses)
        : 0;

    const avgCenterRetentionRate =
      byProf.length > 0
        ? Math.round(byProf.reduce((acc, r) => acc + r.retentionRate, 0) / byProf.length)
        : 100;
    const avgCenterAbandonmentRate =
      byProf.length > 0
        ? Math.round(byProf.reduce((acc, r) => acc + r.abandonmentRate, 0) / byProf.length)
        : 0;

    return {
      byProf,
      totalGrossCenter,
      totalPaidCenter,
      totalPendingCenter,
      totalCenterRetention,
      totalNetProfessionals,
      totalPresencialBoxUses,
      avgRevenuePerBoxSession,
      avgCenterRetentionRate,
      avgCenterAbandonmentRate,
    };
  }, [professionals, appointments, patients]);

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

  // =========================================================
  // ESCUCHA AMBIENTAL CON IA GROK CONECTADA A /api/ia/ficha
  // =========================================================
  const startAmbientListening = () => {
    setIsListeningSession(true);
    setListeningSeconds(0);
    setCapturedAudioContext('');

    timerRef.current = setInterval(() => {
      setListeningSeconds((prev) => prev + 1);
    }, 1000);

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-CL';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let transcriptChunk = '';
            for (let i = 0; i < event.results.length; i++) {
              transcriptChunk += event.results[i][0].transcript + ' ';
            }
            setCapturedAudioContext(transcriptChunk.trim());
          };
          recognition.start();
          speechRecRef.current = recognition;
        } catch {}
      }
    }
  };

  const stopAmbientListeningAndSummarize = async () => {
    setIsListeningSession(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
    }

    if (!fichaPatient) return;
    setIsGeneratingGrok(true);

    try {
      const durationMin = Math.max(1, Math.round(listeningSeconds / 60));
      const res = await fetch('/api/ia/ficha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: fichaPatient.patientName,
          serviceName: fichaPatient.defaultService,
          modality: fichaPatient.defaultModality,
          durationMin,
          rawContext: capturedAudioContext || rawSessionNotes,
        }),
      });
      const data = await res.json();
      if (data?.structuredNote) {
        setGrokPreviewNote(data.structuredNote);
        showToast('Resumen IA Grok generado', 'Listo para guardar en la ficha clínica.');
      }
    } catch {
      showToast('Resumen local generado', undefined, 'warn');
    } finally {
      setIsGeneratingGrok(false);
    }
  };

  const handleGenerateGrokFromNotes = async () => {
    if (!rawSessionNotes.trim() || !fichaPatient) return;
    setIsGeneratingGrok(true);
    try {
      const res = await fetch('/api/ia/ficha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: fichaPatient.patientName,
          serviceName: fichaPatient.defaultService,
          modality: fichaPatient.defaultModality,
          durationMin: 50,
          rawContext: rawSessionNotes.trim(),
        }),
      });
      const data = await res.json();
      if (data?.structuredNote) {
        setGrokPreviewNote(data.structuredNote);
      }
    } finally {
      setIsGeneratingGrok(false);
    }
  };

  const handleSaveEvolutionToPatientFicha = () => {
    if (!fichaPatient) return;
    const prof =
      professionals.find((p) => p.id === fichaPatient.assignedProfessionalId) ?? currentProf;
    const finalNote =
      grokPreviewNote.trim().length > 0 ? grokPreviewNote.trim() : rawSessionNotes.trim();
    if (!finalNote) return;

    const newEntry: ClinicalEvolutionNote = {
      id: `ev-${Date.now()}`,
      date: todayIso,
      sourceType: listeningSeconds > 0 ? 'audio_ia' : 'manual_ia',
      grokStructuredNote: finalNote,
      professionalName: prof.name,
    };

    const updatedPatient: PatientRecord = {
      ...fichaPatient,
      clinicalHistory: [newEntry, ...fichaPatient.clinicalHistory],
    };

    setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
    setFichaPatient(updatedPatient);
    setRawSessionNotes('');
    setGrokPreviewNote('');
    setListeningSeconds(0);
    showToast('Evolución agregada a la Ficha Clínica', `Paciente: ${updatedPatient.patientName}`);
  };

  const triggerEmailNotification = async (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const locationAddress =
      apt.modality === 'Presencial'
        ? `${prof.presencialAddress} (${apt.boxName ?? prof.scheduleByDay?.[1]?.boxAssigned})`
        : apt.meetUrl ?? prof.onlineRoomUrl;

    try {
      await fetch('/api/notificaciones/confirmacion', {
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
            apt.modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Google Meet)',
          locationAddress,
          professionalName: prof.name,
          centerName: centerBrandName,
        }),
      });
    } catch {}
  };

  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección: ${prof.presencialAddress} (${apt.boxName ?? 'Box Clínico'})`
        : `💻 Online (Google Meet): ${apt.meetUrl ?? prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *${centerBrandName}* para confirmar tu cita de *${apt.serviceName}* con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDragStart = (e: React.DragEvent, aptId: string) => {
    setDraggedAptId(aptId);
    e.dataTransfer.setData('text/plain', aptId);
  };

  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;

    const dayCfg = currentProf?.scheduleByDay?.[dayIndex];
    if (!isHourInsideDayBlocks(dayCfg, time)) {
      showToast(
        'Horario de colación o fuera de turno',
        `${currentProf.name} no tiene tramo activo a las ${time} hrs ese día.`,
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
      showToast('Bloque ocupado', 'Ya existe una cita o bloqueo en esa hora.', 'warn');
      setDraggedAptId(null);
      return;
    }

    const movedApt = appointments.find((a) => a.id === draggedAptId);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === draggedAptId
          ? {
              ...a,
              isoDate,
              time,
              boxName:
                a.modality === 'Presencial'
                  ? dayCfg?.boxAssigned ?? 'Box 1 · Salvia'
                  : 'Online (Google Meet)',
            }
          : a
      )
    );
    setDraggedAptId(null);

    if (movedApt) {
      showToast(
        'Hora reagendada',
        `${movedApt.patientName} movido al ${isoDate} (${time} hrs).`
      );
    }
  };

  const togglePaymentStatus = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextStatus: PaymentStatus = a.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
        showToast(`Pago: ${nextStatus}`, `Paciente: ${a.patientName}`);
        return { ...a, paymentStatus: nextStatus };
      })
    );
  };

  // ELIMINAR HORA EN AGENDA: Libera el horario pero MANTIENE INTACTO al paciente en el directorio
  const deleteAppointmentSlotOnly = (aptId: string) => {
    const target = appointments.find((a) => a.id === aptId);
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    if (editingApt?.id === aptId) setEditingApt(null);
    showToast(
      'Hora liberada en la agenda',
      target
        ? `La ficha de ${target.patientName} sigue intacta en Pacientes.`
        : undefined
    );
  };

  const deletePatientFromDirectory = (patientId: string) => {
    const target = patients.find((p) => p.id === patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    if (fichaPatient?.id === patientId) setFichaPatient(null);
    if (editingPatientRecord?.id === patientId) setEditingPatientRecord(null);
    showToast(
      'Paciente eliminado del directorio',
      target ? `${target.patientName} fue removido.` : undefined
    );
  };

  const handleSaveEditedAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setAppointments((prev) => prev.map((a) => (a.id === editingApt.id ? editingApt : a)));
    showToast('Cita actualizada', editingApt.patientName);
    setEditingApt(null);
  };

  const handleCreateSlotAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    if (slotActionMode === 'block') {
      const reasonText =
        blockReasonInput.trim().length > 0 ? blockReasonInput.trim() : 'Colación / Bloqueo';
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
    const assignedBox =
      newBookingForm.modality === 'Presencial'
        ? dayCfg?.boxAssigned ?? centerBoxes[0] ?? 'Box 1 · Salvia'
        : 'Online (Google Meet)';

    if (newBookingForm.modality === 'Presencial') {
      const boxConflict = appointments.find(
        (a) =>
          a.modality === 'Presencial' &&
          a.boxName === assignedBox &&
          a.isoDate === slotModal.isoDate &&
          a.time === slotModal.time &&
          a.professionalId !== selectedProfId
      );
      if (boxConflict) {
        const conflictProf = professionals.find((p) => p.id === boxConflict.professionalId);
        showToast(
          `${assignedBox} ocupado en ese horario`,
          `Está siendo utilizado por ${conflictProf?.name ?? 'otro terapeuta'}.`,
          'warn'
        );
        return;
      }
    }

    let targetPatientId = newBookingForm.selectedPatientId;
    const cleanName = newBookingForm.patientName.trim();
    const cleanRut =
      newBookingForm.patientRUT.trim().length > 0
        ? newBookingForm.patientRUT.trim()
        : 'Sin RUT';
    const cleanEmail = newBookingForm.patientEmail.trim();
    const cleanPhone = newBookingForm.patientPhone.replace(/\D/g, '');

    const existingPat = patients.find(
      (p) =>
        (cleanRut !== 'Sin RUT' && p.patientRUT.toLowerCase() === cleanRut.toLowerCase()) ||
        p.patientName.toLowerCase() === cleanName.toLowerCase()
    );

    if (existingPat) {
      targetPatientId = existingPat.id;
    } else {
      targetPatientId = `pat-${Date.now()}`;
      const newPatRecord: PatientRecord = {
        id: targetPatientId,
        patientName: cleanName,
        patientRUT: cleanRut,
        patientEmail: cleanEmail,
        patientPhone: cleanPhone,
        defaultService: newBookingForm.serviceName,
        defaultModality: newBookingForm.modality,
        assignedProfessionalId: selectedProfId,
        clinicalStatusTag: 'Activo',
        clinicalHistory: [],
      };
      setPatients((prev) => [...prev, newPatRecord]);
    }

    const totalOccurrences =
      newBookingForm.recurrence === 'none'
        ? 1
        : Math.min(12, Math.max(2, Number(newBookingForm.recurrenceCount) || 4));

    const stepDays =
      newBookingForm.recurrence === 'weekly'
        ? 7
        : newBookingForm.recurrence === 'biweekly'
        ? 14
        : newBookingForm.recurrence === 'monthly'
        ? 28
        : 0;

    const recurrenceLabel =
      newBookingForm.recurrence === 'weekly'
        ? 'Semanal'
        : newBookingForm.recurrence === 'biweekly'
        ? 'Quincenal'
        : newBookingForm.recurrence === 'monthly'
        ? 'Mensual'
        : undefined;

    const generatedAppointments: AppointmentItem[] = [];

    for (let i = 0; i < totalOccurrences; i++) {
      const targetIso =
        i === 0 ? slotModal.isoDate : addDaysToIso(slotModal.isoDate, i * stepDays);
      const meetForSession =
        newBookingForm.modality === 'Online' ? generateLocalMeetLink() : undefined;

      generatedAppointments.push({
        id: `apt-${Date.now()}-${i}`,
        patientId: targetPatientId,
        patientName: cleanName,
        patientRUT: cleanRut,
        patientEmail: cleanEmail,
        patientPhone: cleanPhone,
        professionalId: selectedProfId,
        serviceName: newBookingForm.serviceName,
        modality: newBookingForm.modality,
        boxName: assignedBox,
        meetUrl: meetForSession,
        recurrenceLabel,
        isoDate: targetIso,
        time: slotModal.time,
        price: svcObj ? svcObj.price : 45000,
        paymentStatus: i === 0 ? newBookingForm.paymentStatus : 'Pendiente',
        clinicalStatus: 'Confirmada',
        notes: newBookingForm.notes.trim(),
      });
    }

    setAppointments((prev) => [...prev, ...generatedAppointments]);
    setSlotModal(null);

    showToast(
      totalOccurrences > 1
        ? `${totalOccurrences} sesiones agendadas (${recurrenceLabel})`
        : 'Cita agendada correctamente',
      `${cleanName} · ${slotModal.time} hrs`
    );

    await triggerEmailNotification(generatedAppointments[0]);
  };

  const handleCreateDirectPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created: PatientRecord = {
      id: `pat-${Date.now()}`,
      patientName: newPatientDirectForm.patientName.trim(),
      patientRUT: newPatientDirectForm.patientRUT.trim() || 'Sin RUT',
      patientEmail: newPatientDirectForm.patientEmail.trim(),
      patientPhone: newPatientDirectForm.patientPhone.replace(/\D/g, ''),
      defaultService: newPatientDirectForm.defaultService,
      defaultModality: newPatientDirectForm.defaultModality,
      assignedProfessionalId: newPatientDirectForm.assignedProfessionalId,
      clinicalStatusTag: 'Activo',
      clinicalHistory: [],
    };
    setPatients((prev) => [...prev, created]);
    setShowNewPatientModal(false);
    showToast('Paciente registrado en el directorio', created.patientName);
  };

  const handleSaveEditedPatientRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatientRecord) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === editingPatientRecord.id ? editingPatientRecord : p))
    );
    showToast('Ficha de paciente actualizada', editingPatientRecord.patientName);
    setEditingPatientRecord(null);
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
    showToast('Servicio eliminado');
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
          blocks: [{ startHour: '09:00', endHour: '14:00' }],
          modality: 'Ambas (Híbrido)',
          boxAssigned: centerBoxes[0] ?? 'Box 1 · Salvia',
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

  const handleUpdateTimeBlock = (
    profId: string,
    dayIndex: number,
    blockIdx: number,
    field: 'startHour' | 'endHour',
    val: string
  ) => {
    const prof = professionals.find((p) => p.id === profId);
    if (!prof) return;
    const dayCfg = prof.scheduleByDay[dayIndex];
    if (!dayCfg) return;
    const nextBlocks = dayCfg.blocks.map((b, idx) =>
      idx === blockIdx ? { ...b, [field]: val } : b
    );
    updateProfDaySchedule(profId, dayIndex, { blocks: nextBlocks });
  };

  const handleAddTimeBlockToDay = (profId: string, dayIndex: number) => {
    const prof = professionals.find((p) => p.id === profId);
    if (!prof) return;
    const dayCfg = prof.scheduleByDay[dayIndex];
    const currentBlocks = dayCfg?.blocks ?? [];
    const nextBlocks = [...currentBlocks, { startHour: '16:00', endHour: '21:00' }];
    updateProfDaySchedule(profId, dayIndex, { enabled: true, blocks: nextBlocks });
  };

  const handleRemoveTimeBlockFromDay = (
    profId: string,
    dayIndex: number,
    blockIdx: number
  ) => {
    const prof = professionals.find((p) => p.id === profId);
    if (!prof) return;
    const dayCfg = prof.scheduleByDay[dayIndex];
    if (!dayCfg || dayCfg.blocks.length <= 1) return;
    const nextBlocks = dayCfg.blocks.filter((_, idx) => idx !== blockIdx);
    updateProfDaySchedule(profId, dayIndex, { blocks: nextBlocks });
  };

  const openCreateProfModal = () => {
    setEditingProfId(null);
    setProfForm({
      name: '',
      specialty: 'Psicoterapia Clínica',
      rut: '',
      email: '',
      presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
      onlineRoomUrl: generateLocalMeetLink(),
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
      showToast('Profesional actualizado', profForm.name);
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
        googleConnected: false,
        scheduleByDay: buildDefaultScheduleWithColacion(centerBoxes[0] ?? 'Box 1 · Salvia'),
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
      badge: String(patients.length),
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
    { id: 'finanzas', label: 'Reportes & Liquidación Box', icon: Wallet },
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
          BARRA LATERAL LIMPIA (SOLO PINCHAR FOTO/NOMBRE ARRIBA PARA EDITAR)
         ========================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } shrink-0 bg-[#1E3329] text-stone-100 flex flex-col justify-between transition-all duration-300 border-r border-[#2C4A3B]/40 sticky top-0 h-screen z-30 select-none shadow-2xl`}
      >
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBrandingModal(true)}
                className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C87D65] to-[#b0664f] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md overflow-hidden group border border-white/15"
                title="Pincha aquí para cambiar la foto/logo del centro"
              >
                {centerLogoUrl ? (
                  <img
                    src={centerLogoUrl}
                    alt={centerBrandName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{centerBrandName.slice(0, 1).toUpperCase()}</span>
                )}
                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImagePlus size={15} className="text-white" />
                </span>
              </button>

              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setShowBrandingModal(true)}
                  className="text-left truncate group"
                  title="Pincha para editar nombre, logo o cantidad de boxes del centro"
                >
                  <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 font-bold block">
                    Centro Clínico
                  </span>
                  <h1 className="text-sm font-bold text-white truncate max-w-[155px] group-hover:underline">
                    {centerBrandName}
                  </h1>
                </button>
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

        <div className="p-4 border-t border-white/10">
          {!sidebarCollapsed && (
            <p className="text-[11px] text-stone-400 text-center">
              {centerBoxes.length} Boxes Habilitados
            </p>
          )}
        </div>
      </aside>

      {/* =========================================================
          CONTENEDOR CENTRAL DEL CENTRO CLÍNICO
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setShowBrandingModal(true)}
              className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center overflow-hidden border border-[#E4ECE7] shadow-2xs group relative"
              title="Pincha para cambiar la foto del centro"
            >
              {centerLogoUrl ? (
                <img
                  src={centerLogoUrl}
                  alt={centerBrandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 size={18} />
              )}
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
                {centerBrandName}
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
                placeholder="Buscar paciente, RUT o terapia..."
                className="pl-9 pr-4 py-2.5 bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl text-xs focus:outline-none focus:border-[#2C4A3B] w-56 transition-all"
              />
            </div>

            <button
              onClick={() => {
                setActiveModule('agenda');
                setSlotActionMode('book');
                setPatientModeInBooking(patients.length > 0 ? 'existing' : 'new');
                if (patients[0]) {
                  setNewBookingForm((prev) => ({
                    ...prev,
                    selectedPatientId: patients[0].id,
                    patientName: patients[0].patientName,
                    patientRUT: patients[0].patientRUT,
                    patientEmail: patients[0].patientEmail,
                    patientPhone: patients[0].patientPhone,
                    serviceName: patients[0].defaultService,
                    modality: patients[0].defaultModality,
                  }));
                }
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
              <span>Agendar Cita</span>
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
                      ${financialAndClinicalReport.totalGrossCenter.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Retención Clínica Pacientes
                    </span>
                    <p className="text-2xl font-bold text-[#2C4A3B] mt-1">
                      {financialAndClinicalReport.avgCenterRetentionRate}%
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Líquido a Profesionales
                    </span>
                    <p className="text-2xl font-bold text-[#C87D65] mt-1">
                      ${financialAndClinicalReport.totalNetProfessionals.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C87D65] flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Boxes Físicos del Centro
                    </span>
                    <p className="text-2xl font-bold text-stone-900 mt-1">
                      {centerBoxes.length} Boxes
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
                    <DoorOpen size={20} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------
              2. AGENDA (DIARIO, SEMANAL, MENSUAL + AGENDA CENTRO OCUPACIÓN DE BOXES)
             --------------------------------------------------------- */}
          {activeModule === 'agenda' && (
            <div className="space-y-5">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-[#E4ECE7] shadow-xs flex flex-wrap items-center justify-between gap-4">
                {calendarView !== 'center_boxes' ? (
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
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
                      <DoorOpen size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C87D65] block">
                        Mapa en Vivo del Centro
                      </span>
                      <h3 className="text-sm font-bold text-stone-900">
                        Ocupación de Boxes por Terapeuta ({centerBoxes.length} Boxes)
                      </h3>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#F9F8F6] p-1 rounded-2xl border border-[#E4ECE7]">
                    {(
                      [
                        { id: 'day', label: 'Diario' },
                        { id: 'week', label: 'Semanal' },
                        { id: 'month', label: 'Mensual' },
                        { id: 'center_boxes', label: 'Boxes Centro' },
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

                  <div className="flex items-center gap-1.5 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarView === 'day' || calendarView === 'center_boxes') {
                          const prev = addDaysToIso(selectedSingleDayIso, -1);
                          handleJumpToDate(prev);
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
                        {calendarView === 'day' || calendarView === 'center_boxes'
                          ? singleDayMeta.fullLabel
                          : calendarView === 'month'
                          ? dynamicMonthDays.monthTitle
                          : weekRangeLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (calendarView === 'day' || calendarView === 'center_boxes') {
                          const next = addDaysToIso(selectedSingleDayIso, 1);
                          handleJumpToDate(next);
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

              {/* VISTA ESPECIAL: AGENDA CENTRO (OCUPACIÓN DE BOXES POR TERAPEUTA Y HORARIO) */}
              {calendarView === 'center_boxes' && (
                <div className="bg-white rounded-[2rem] border border-[#E4ECE7] shadow-xs overflow-x-auto">
                  <div className="min-w-[920px]">
                    <div
                      className="grid border-b border-[#E4ECE7] bg-[#F9F8F6]/80"
                      style={{
                        gridTemplateColumns: `100px repeat(${centerBoxes.length}, minmax(180px, 1fr))`,
                      }}
                    >
                      <div className="p-3.5 text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-center border-r border-[#E4ECE7]">
                        Hora
                      </div>
                      {centerBoxes.map((boxName) => {
                        const assignedProfsToday = professionals.filter(
                          (p) =>
                            p.scheduleByDay?.[singleDayMeta.dayIndex]?.enabled &&
                            p.scheduleByDay?.[singleDayMeta.dayIndex]?.boxAssigned === boxName
                        );
                        return (
                          <div
                            key={boxName}
                            className="p-3.5 text-center border-r last:border-r-0 border-[#E4ECE7]"
                          >
                            <span className="text-sm font-bold text-stone-900 block">
                              {boxName}
                            </span>
                            <span className="text-[11px] font-semibold text-[#2C4A3B]">
                              {assignedProfsToday.length > 0
                                ? `Asignado hoy: ${assignedProfsToday
                                    .map((p) => p.name)
                                    .join(', ')}`
                                : 'Sin terapeuta fijo hoy'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {FULL_DAY_HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="grid border-b last:border-b-0 border-[#E4ECE7] min-h-[86px]"
                        style={{
                          gridTemplateColumns: `100px repeat(${centerBoxes.length}, minmax(180px, 1fr))`,
                        }}
                      >
                        <div className="p-3 border-r border-[#E4ECE7] bg-[#F9F8F6]/40 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-stone-700">{hour}</span>
                          <span className="text-[10px] text-stone-400">hrs</span>
                        </div>

                        {centerBoxes.map((boxName) => {
                          const occupyingApt = appointments.find(
                            (a) =>
                              a.isoDate === singleDayMeta.iso &&
                              a.time === hour &&
                              a.modality === 'Presencial' &&
                              a.boxName === boxName
                          );
                          const occupyingProf = occupyingApt
                            ? professionals.find((p) => p.id === occupyingApt.professionalId)
                            : undefined;

                          const holderProf = professionals.find((p) => {
                            const cfg = p.scheduleByDay?.[singleDayMeta.dayIndex];
                            return (
                              cfg?.boxAssigned === boxName && isHourInsideDayBlocks(cfg, hour)
                            );
                          });

                          return (
                            <div
                              key={`${boxName}-${hour}`}
                              className="p-2 border-r last:border-r-0 border-[#E4ECE7] flex flex-col justify-center"
                            >
                              {occupyingApt ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      apt: occupyingApt,
                                    });
                                  }}
                                  className="p-2.5 rounded-2xl bg-[#EBF3EE] border border-[#2C4A3B]/40 cursor-pointer hover:shadow-sm transition-all"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="px-2 py-0.5 rounded-full bg-[#2C4A3B] text-white text-[9px] font-bold">
                                      OCUPADO
                                    </span>
                                    <span className="text-[10px] font-bold text-[#2C4A3B]">
                                      {occupyingProf?.name}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-stone-900 truncate">
                                    Paciente: {occupyingApt.patientName}
                                  </p>
                                  <p className="text-[10px] text-stone-500 truncate">
                                    {occupyingApt.serviceName}
                                  </p>
                                </div>
                              ) : holderProf ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProfId(holderProf.id);
                                    setSlotActionMode('book');
                                    setNewBookingForm((prev) => ({
                                      ...prev,
                                      modality: 'Presencial',
                                    }));
                                    setSlotModal({
                                      dayIndex: singleDayMeta.dayIndex,
                                      isoDate: singleDayMeta.iso,
                                      dayLabel: singleDayMeta.fullLabel,
                                      time: hour,
                                    });
                                  }}
                                  className="h-full w-full rounded-xl bg-amber-50/60 border border-amber-200/70 p-2 text-left hover:bg-amber-50 transition-all"
                                >
                                  <span className="text-[10px] font-bold text-amber-900 block">
                                    Reservado: {holderProf.name}
                                  </span>
                                  <span className="text-[10px] text-stone-500">
                                    Sin paciente aún · Clic para agendar
                                  </span>
                                </button>
                              ) : (
                                <div className="text-center text-[11px] text-emerald-700/70 font-medium">
                                  Box Libre
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

              {/* VISTA 1: AGENDA DIARIA */}
              {calendarView === 'day' && (
                <div className="bg-white rounded-[2rem] border border-[#E4ECE7] p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4ECE7] pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                        Vista Diaria · {currentProf?.name}
                      </span>
                      <h3 className="text-lg font-bold text-stone-900 capitalize">
                        {singleDayMeta.fullLabel}
                      </h3>
                    </div>
                    <div className="text-xs text-stone-600 bg-[#F9F8F6] px-4 py-2 rounded-xl border border-[#E4ECE7]">
                      <strong>Tramos activos hoy:</strong>{' '}
                      {formatDayBlocksSummary(
                        currentProf?.scheduleByDay?.[singleDayMeta.dayIndex]
                      )}{' '}
                      ({currentProf?.scheduleByDay?.[singleDayMeta.dayIndex]?.boxAssigned})
                    </div>
                  </div>

                  <div className="divide-y divide-[#E4ECE7]">
                    {visibleHours.map((hour) => {
                      const dayCfg = currentProf?.scheduleByDay?.[singleDayMeta.dayIndex];
                      const isWithinDayHours = isHourInsideDayBlocks(dayCfg, hour);
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
                            !isWithinDayHours
                              ? 'bg-stone-100/60 opacity-55'
                              : 'hover:bg-[#F9F8F6]'
                          }`}
                        >
                          <div className="w-20 shrink-0">
                            <span className="text-sm font-bold text-stone-800">{hour} hrs</span>
                          </div>

                          <div className="flex-1">
                            {!isWithinDayHours ? (
                              <span className="text-xs text-stone-400">
                                Horario de colación / Fuera de tramo activo
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
                                      ({apt.serviceName} ·{' '}
                                      {apt.modality === 'Online'
                                        ? 'Online (Google Meet)'
                                        : apt.boxName}
                                      )
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const pat = patients.find((p) => p.id === apt.patientId);
                                      if (pat) setFichaPatient(pat);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-[#2C4A3B] text-white text-xs font-bold flex items-center gap-1"
                                  >
                                    <BrainCircuit size={13} />
                                    <span>Ficha IA</span>
                                  </button>
                                  <button
                                    onClick={() => deleteAppointmentSlotOnly(apt.id)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
                                  >
                                    Liberar Hora
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
                                  Disponible ({dayCfg?.boxAssigned}) · Agendar Cita
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
                            onClick={() => setSelectedSingleDayIso(day.iso)}
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
                            <span className="block text-[10px] font-semibold text-[#2C4A3B] mt-0.5">
                              {formatDayBlocksSummary(dayCfg)}
                            </span>
                            {isWorkingDay && (
                              <span className="block text-[9px] text-stone-500">
                                {dayCfg?.boxAssigned}
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
                          const isSlotEnabledForDay = isHourInsideDayBlocks(dayCfg, hour);

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
                                  setPatientModeInBooking(
                                    patients.length > 0 ? 'existing' : 'new'
                                  );
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
                                  <span>Agendar Cita</span>
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
                                        {apt.modality === 'Online' ? 'Meet' : apt.boxName}
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
                                      {apt.recurrenceLabel
                                        ? `↻ ${apt.recurrenceLabel}`
                                        : apt.clinicalStatus}
                                    </span>
                                    <span className="font-bold text-stone-700">▾</span>
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
                          </div>

                          <div className="text-[10px] text-stone-400 truncate">
                            {formatDayBlocksSummary(dayCfg)}
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
              3. MÓDULO PACIENTES & FICHA IA + IMPORTAR / EXPORTAR PLANILLA EXCEL / CSV
             --------------------------------------------------------- */}
          {activeModule === 'pacientes' && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-[#2C4A3B]" />
                  <span className="text-xs font-bold text-stone-600">Modalidad habitual:</span>
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

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setImportedPreviewRows([]);
                      setImportFileName('');
                      setShowImportModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#EBF3EE] hover:bg-[#dbeadd] text-[#2C4A3B] rounded-xl text-xs font-bold transition-all"
                  >
                    <Upload size={14} />
                    <span>Importar Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPatientsToExcelCsv}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F9F8F6] hover:bg-stone-100 border border-[#E4ECE7] text-stone-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <Download size={14} />
                    <span>Exportar Planilla</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNewPatientModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    <Plus size={15} />
                    <span>Registrar Paciente</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPatients.map((pat) => {
                  const prof =
                    professionals.find((p) => p.id === pat.assignedProfessionalId) ??
                    currentProf;
                  const patAppointments = appointments.filter(
                    (a) =>
                      a.patientId === pat.id ||
                      a.patientName.toLowerCase() === pat.patientName.toLowerCase()
                  );
                  return (
                    <div
                      key={pat.id}
                      className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-stone-900">
                                {pat.patientName}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pat.clinicalStatusTag === 'Abandono'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-[#EBF3EE] text-[#2C4A3B]'
                                }`}
                              >
                                {pat.clinicalStatusTag}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500">
                              RUT: {pat.patientRUT} · <strong>{prof?.name}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingPatientRecord({ ...pat })}
                              className="p-2 rounded-xl bg-stone-100 hover:bg-[#EBF3EE] text-stone-700 hover:text-[#2C4A3B]"
                              title="Editar Paciente"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePatientFromDirectory(pat.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                              title="Eliminar Paciente del Directorio"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#F9F8F6] p-4 rounded-2xl border border-[#E4ECE7] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Terapia:</span>
                            <strong className="text-stone-900">{pat.defaultService}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Sesiones Agendadas:</span>
                            <strong className="text-[#2C4A3B]">
                              {patAppointments.length} sesiones
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Resúmenes IA en Ficha:</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#2C4A3B] font-bold text-[10px]">
                              {pat.clinicalHistory.length} evoluciones
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFichaPatient(pat);
                            setRawSessionNotes('');
                            setGrokPreviewNote('');
                            setListeningSeconds(0);
                          }}
                          className="w-full py-3 px-4 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                        >
                          <Mic size={14} className="text-emerald-300" />
                          <span>Abrir Ficha Clínica + Escucha IA</span>
                        </button>
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
              5. MÓDULO PROFESIONALES & MÚLTIPLES BLOQUES HORARIOS POR DÍA (COLACIÓN) + BOXES
             --------------------------------------------------------- */}
          {activeModule === 'profesionales' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Turnos con Corte de Colación & Asignación de Box
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Profesionales, Múltiples Tramos por Día (Ej: 09:00-14:00 y 16:00-21:00) y Boxes
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
                        {!prof.googleConnected && (
                          <button
                            type="button"
                            onClick={() => handleConnectProfGoogleCalendar(prof.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C4A3B] text-white text-xs font-bold hover:bg-[#233B2F] transition-all"
                          >
                            <CalendarIcon size={13} />
                            <span>Sincronizar con Google Calendar</span>
                          </button>
                        )}

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
                        Tramos Horarios por Día (Puedes agregar más bloques para separar mañana, colación y tarde) y Box Asignado
                      </label>
                      <div className="space-y-2.5">
                        {DAY_NAMES.map((dayMeta) => {
                          const cfg = prof.scheduleByDay?.[dayMeta.index] ?? {
                            enabled: false,
                            blocks: [{ startHour: '09:00', endHour: '14:00' }],
                            modality: 'Ambas (Híbrido)',
                            boxAssigned: centerBoxes[0] ?? 'Box 1 · Salvia',
                          };
                          return (
                            <div
                              key={dayMeta.index}
                              className={`p-3.5 rounded-2xl border grid grid-cols-1 lg:grid-cols-12 items-center gap-3 text-xs transition-all ${
                                cfg.enabled
                                  ? 'bg-[#F9F8F6] border-[#E4ECE7]'
                                  : 'bg-stone-100/60 border-stone-200/60 opacity-60'
                              }`}
                            >
                              <div className="lg:col-span-2 flex items-center gap-2">
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

                              <div className="lg:col-span-6 flex flex-wrap items-center gap-2">
                                {(cfg.blocks ?? []).map((b, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200"
                                  >
                                    <span className="text-[10px] font-bold text-stone-400">
                                      T{bIdx + 1}:
                                    </span>
                                    <select
                                      disabled={!cfg.enabled}
                                      value={b.startHour}
                                      onChange={(e) =>
                                        handleUpdateTimeBlock(
                                          prof.id,
                                          dayMeta.index,
                                          bIdx,
                                          'startHour',
                                          e.target.value
                                        )
                                      }
                                      className="font-semibold text-stone-800 bg-transparent focus:outline-none"
                                    >
                                      {FULL_DAY_HOURS.map((h) => (
                                        <option key={h} value={h}>
                                          {h}
                                        </option>
                                      ))}
                                    </select>
                                    <span className="text-stone-400">a</span>
                                    <select
                                      disabled={!cfg.enabled}
                                      value={b.endHour}
                                      onChange={(e) =>
                                        handleUpdateTimeBlock(
                                          prof.id,
                                          dayMeta.index,
                                          bIdx,
                                          'endHour',
                                          e.target.value
                                        )
                                      }
                                      className="font-semibold text-stone-800 bg-transparent focus:outline-none"
                                    >
                                      {FULL_DAY_HOURS.map((h) => (
                                        <option key={h} value={h}>
                                          {h}
                                        </option>
                                      ))}
                                    </select>
                                    {cfg.blocks.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveTimeBlockFromDay(
                                            prof.id,
                                            dayMeta.index,
                                            bIdx
                                          )
                                        }
                                        className="text-rose-500 hover:text-rose-700 ml-1"
                                        title="Quitar este tramo"
                                      >
                                        <X size={13} />
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {cfg.enabled && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddTimeBlockToDay(prof.id, dayMeta.index)
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-[#EBF3EE] text-[#2C4A3B] font-bold text-[11px] hover:bg-[#dbeadd] transition-all"
                                  >
                                    + Tramo (Post-Colación)
                                  </button>
                                )}
                              </div>

                              <div className="lg:col-span-2">
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

                              <div className="lg:col-span-2">
                                <select
                                  disabled={!cfg.enabled}
                                  value={cfg.boxAssigned}
                                  onChange={(e) =>
                                    updateProfDaySchedule(prof.id, dayMeta.index, {
                                      boxAssigned: e.target.value,
                                    })
                                  }
                                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-[#2C4A3B] w-full"
                                >
                                  {centerBoxes.map((box) => (
                                    <option key={box} value={box}>
                                      {box}
                                    </option>
                                  ))}
                                </select>
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
              8. REPORTES CLÍNICOS (RETENCIÓN, ABANDONO, PACIENTES) & LIQUIDACIÓN BOX
             --------------------------------------------------------- */}
          {activeModule === 'finanzas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Total Bruto Generado
                  </span>
                  <p className="text-2xl font-bold text-stone-900 mt-1">
                    ${financialAndClinicalReport.totalGrossCenter.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Pagado: ${financialAndClinicalReport.totalPaidCenter.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Retención Centro (Boxes / %)
                  </span>
                  <p className="text-2xl font-bold text-[#2C4A3B] mt-1">
                    ${financialAndClinicalReport.totalCenterRetention.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Promedio/Box: $
                    {financialAndClinicalReport.avgRevenuePerBoxSession.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Líquido a Profesionales
                  </span>
                  <p className="text-2xl font-bold text-[#C87D65] mt-1">
                    ${financialAndClinicalReport.totalNetProfessionals.toLocaleString('es-CL')}
                  </p>
                  <span className="text-[11px] text-stone-500">Libre de descuento de box</span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Tasa de Retención Clínica
                  </span>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {financialAndClinicalReport.avgCenterRetentionRate}%
                  </p>
                  <span className="text-[11px] text-stone-500">
                    {patients.length} pacientes en cartera
                  </span>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4ECE7]">
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">
                    Tasa de Abandono / No-Show
                  </span>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {financialAndClinicalReport.avgCenterAbandonmentRate}%
                  </p>
                  <span className="text-[11px] text-stone-500">Inasistencias y deserciones</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-[#E4ECE7] shadow-xs space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                    Reporte Ejecutivo y Clínico por Profesional
                  </span>
                  <h3 className="font-bold text-lg text-stone-900">
                    Pacientes Agendados, % Retención, % Abandono, Descuento Box y Líquido Profesional
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                        <th className="py-3 px-4">Profesional</th>
                        <th className="py-3 px-4">Pacientes / Sesiones</th>
                        <th className="py-3 px-4">% Retención</th>
                        <th className="py-3 px-4">% Abandono</th>
                        <th className="py-3 px-4">Convenio Box</th>
                        <th className="py-3 px-4">Bruto Total</th>
                        <th className="py-3 px-4">Retención Centro</th>
                        <th className="py-3 px-4">Líquido Profesional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4ECE7]">
                      {financialAndClinicalReport.byProf.map((row) => (
                        <tr key={row.prof.id} className="hover:bg-[#F9F8F6]">
                          <td className="py-3.5 px-4 font-bold text-stone-900">
                            {row.prof.name}
                          </td>
                          <td className="py-3.5 px-4 text-stone-700 font-semibold">
                            {row.totalUniquePatients} pac. · {row.totalSessions} citas (
                            {row.presencialSessionsCount} en box)
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                              {row.retentionRate}% Retención
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold">
                              {row.abandonmentRate}% Abandono
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold">
                              {row.agreementDescription}
                            </span>
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
          MODAL DE IMPORTACIÓN MASIVA DE PACIENTES (EXCEL / CSV)
         ========================================================= */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-2xl w-full p-7 border border-[#E4ECE7] shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C87D65] block">
                      Carga Masiva Instantánea
                    </span>
                    <h3 className="text-xl font-bold text-stone-900">
                      Importar Pacientes desde Planilla Excel / CSV
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-stone-800">
                    ¿Tienes tus pacientes en Excel?
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    Guarda tu Excel como <strong>CSV (delimitado por comas o punto y coma)</strong> y súbelo aquí. El sistema detecta automáticamente Nombre, RUT, Email, Teléfono y Terapia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplateCsv}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-[#2C4A3B] font-bold hover:bg-stone-50 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={13} />
                  <span>Descargar Plantilla Ejemplo</span>
                </button>
              </div>

              <label className="border-2 border-dashed border-[#2C4A3B]/30 hover:border-[#2C4A3B] bg-[#EBF3EE]/30 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                <Upload size={28} className="text-[#2C4A3B] mb-2" />
                <span className="font-bold text-sm text-stone-900">
                  {importFileName
                    ? `Archivo cargado: ${importFileName}`
                    : 'Haz clic aquí para seleccionar tu archivo .CSV de Excel'}
                </span>
                <span className="text-[11px] text-stone-500 mt-1">
                  Soporta planillas exportadas desde Excel, Google Sheets o Numbers
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleParseUploadedPatientSheet}
                  className="hidden"
                />
              </label>

              {importedPreviewRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">
                      Vista Previa: {importedPreviewRows.length} pacientes detectados listos para registrar
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-2xl border border-[#E4ECE7]">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#F9F8F6] border-b border-[#E4ECE7] text-stone-400 uppercase text-[10px]">
                          <th className="py-2.5 px-3">Nombre</th>
                          <th className="py-2.5 px-3">RUT</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">WhatsApp</th>
                          <th className="py-2.5 px-3">Modalidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4ECE7]">
                        {importedPreviewRows.map((row) => (
                          <tr key={row.id}>
                            <td className="py-2 px-3 font-bold text-stone-900">
                              {row.patientName}
                            </td>
                            <td className="py-2 px-3 text-stone-600">{row.patientRUT}</td>
                            <td className="py-2 px-3 text-stone-600">{row.patientEmail}</td>
                            <td className="py-2 px-3 text-stone-600">+{row.patientPhone}</td>
                            <td className="py-2 px-3 font-semibold text-[#2C4A3B]">
                              {row.defaultModality}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmBatchImportPatients}
                    className="w-full py-3.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold text-xs shadow-md transition-all"
                  >
                    Registrar {importedPreviewRows.length} Pacientes Ahora
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL DE AGENDAR CITA (CON REPETICIÓN SEMANAL/QUINCENAL/MENSUAL Y TEXTOS LIMPIOS)
         ========================================================= */}
      <AnimatePresence>
        {slotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-lg w-full p-7 border border-[#E4ECE7] shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">
                    {slotModal.dayLabel} · {slotModal.time} hrs
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">Agendar Cita</h3>
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
                  Agendar Cita
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

              <form onSubmit={handleCreateSlotAction} className="space-y-4 text-xs">
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
                    <div className="p-3.5 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3B] flex items-center gap-1.5">
                          <UserCheck size={14} />
                          <span>Seleccionar Paciente</span>
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setPatientModeInBooking('existing')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              patientModeInBooking === 'existing'
                                ? 'bg-[#2C4A3B] text-white'
                                : 'bg-white text-stone-600 border border-stone-200'
                            }`}
                          >
                            Existente ({patients.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPatientModeInBooking('new');
                              setNewBookingForm({
                                ...newBookingForm,
                                selectedPatientId: '',
                                patientName: '',
                                patientRUT: '',
                                patientEmail: '',
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              patientModeInBooking === 'new'
                                ? 'bg-[#2C4A3B] text-white'
                                : 'bg-white text-stone-600 border border-stone-200'
                            }`}
                          >
                            + Nuevo
                          </button>
                        </div>
                      </div>

                      {patientModeInBooking === 'existing' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={existingPatientSearch}
                            onChange={(e) => setExistingPatientSearch(e.target.value)}
                            placeholder="Filtrar por nombre o RUT..."
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs"
                          />
                          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                            {patients
                              .filter((p) => {
                                const q = existingPatientSearch.toLowerCase();
                                return (
                                  p.patientName.toLowerCase().includes(q) ||
                                  p.patientRUT.toLowerCase().includes(q)
                                );
                              })
                              .map((p) => {
                                const isChosen =
                                  newBookingForm.patientName === p.patientName &&
                                  newBookingForm.patientRUT === p.patientRUT;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setNewBookingForm({
                                        ...newBookingForm,
                                        selectedPatientId: p.id,
                                        patientName: p.patientName,
                                        patientRUT: p.patientRUT,
                                        patientEmail: p.patientEmail,
                                        patientPhone: p.patientPhone,
                                        serviceName: p.defaultService,
                                        modality: p.defaultModality,
                                      });
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${
                                      isChosen
                                        ? 'bg-[#EBF3EE] border-[#2C4A3B] text-[#2C4A3B] font-bold'
                                        : 'bg-white border-stone-200/80 hover:border-stone-300'
                                    }`}
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-stone-900">
                                        {p.patientName}
                                      </p>
                                      <p className="text-[10px] text-stone-500">
                                        RUT: {p.patientRUT}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#2C4A3B]">
                                      Elegir →
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

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
                            setNewBookingForm({
                              ...newBookingForm,
                              patientName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
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
                            setNewBookingForm({
                              ...newBookingForm,
                              patientRUT: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200"
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
                          WhatsApp
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

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          Servicio / Terapia
                        </label>
                        <select
                          value={newBookingForm.serviceName}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              serviceName: e.target.value,
                            })
                          }
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
                          <option value="Online">Online (Google Meet)</option>
                          <option value="Presencial">Consulta Presencial (Box)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold uppercase text-stone-500 flex items-center gap-1 mb-1">
                          <Repeat size={12} className="text-[#2C4A3B]" />
                          <span>Repetición</span>
                        </label>
                        <select
                          value={newBookingForm.recurrence}
                          onChange={(e) =>
                            setNewBookingForm({
                              ...newBookingForm,
                              recurrence: e.target.value as RecurrenceFrequency,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-semibold"
                        >
                          <option value="none">Sin repetición (Sesión única)</option>
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quincenal (Cada 2 semanas)</option>
                          <option value="monthly">Mensual</option>
                        </select>
                      </div>

                      {newBookingForm.recurrence !== 'none' ? (
                        <div>
                          <label className="font-bold uppercase text-stone-500 block mb-1">
                            N° de Sesiones
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={12}
                            value={newBookingForm.recurrenceCount}
                            onChange={(e) =>
                              setNewBookingForm({
                                ...newBookingForm,
                                recurrenceCount: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-bold"
                          />
                        </div>
                      ) : (
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
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-semibold"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagado">Pagado</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold text-xs transition-all shadow-md"
                >
                  {slotActionMode === 'block' ? 'Confirmar Bloqueo' : 'Agendar Cita'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          DRAWER DE FICHA CLÍNICA CON ESCUCHA AMBIENTAL IA GROK
         ========================================================= */}
      <AnimatePresence>
        {fichaPatient && (
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
                      Ficha Clínica Electrónica · Escucha Ambiental IA Grok
                    </span>
                    <h3 className="text-2xl font-bold text-stone-900">
                      {fichaPatient.patientName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      RUT: {fichaPatient.patientRUT} · {fichaPatient.defaultService}
                    </p>
                  </div>
                  <button
                    onClick={() => setFichaPatient(null)}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-[#1E3329] text-white rounded-3xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          isListeningSession ? 'bg-rose-500 animate-pulse' : 'bg-[#2C4A3B]'
                        }`}
                      >
                        <Mic size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {isListeningSession
                            ? `Escuchando sesión en silencio... (${Math.floor(
                                listeningSeconds / 60
                              )}:${String(listeningSeconds % 60).padStart(2, '0')})`
                            : 'Escucha Ambiental con IA Grok'}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          La IA escucha la sesión sin mostrar texto en bruto y genera el resumen clínico al finalizar.
                        </p>
                      </div>
                    </div>

                    {!isListeningSession ? (
                      <button
                        type="button"
                        onClick={startAmbientListening}
                        className="px-4 py-2.5 bg-[#C87D65] hover:bg-[#b56d56] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Mic size={14} />
                        <span>Iniciar Escucha IA</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopAmbientListeningAndSummarize}
                        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Square size={13} />
                        <span>Finalizar y Resumir</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#F9F8F6] rounded-3xl p-5 border border-[#E4ECE7] space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Observaciones Manuales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={rawSessionNotes}
                    onChange={(e) => setRawSessionNotes(e.target.value)}
                    placeholder="O escribe apuntes breves si prefieres resumir sin micrófono..."
                    className="w-full rounded-2xl border border-stone-200 bg-white p-3.5 text-xs focus:outline-none focus:border-[#2C4A3B]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingGrok || !rawSessionNotes.trim()}
                      onClick={handleGenerateGrokFromNotes}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-800 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      <Sparkles size={14} className="text-[#2C4A3B]" />
                      <span>
                        {isGeneratingGrok ? 'Procesando con IA Grok...' : 'Resumir Apuntes con IA'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveEvolutionToPatientFicha}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold"
                    >
                      <Check size={14} />
                      <span>Agregar Resumen a la Ficha</span>
                    </button>
                  </div>

                  {grokPreviewNote && (
                    <div className="mt-3 p-4 rounded-2xl bg-white border border-[#2C4A3B]/30 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C4A3B] block">
                        Resumen Clínico Generado por IA Grok (Editable antes de guardar):
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
                    Historial Clínico del Paciente ({fichaPatient.clinicalHistory.length})
                  </h4>
                  {fichaPatient.clinicalHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-white border border-[#E4ECE7] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-100 pb-1.5">
                        <strong className="text-[#2C4A3B]">{entry.date}</strong>
                        <span>
                          {entry.sourceType === 'audio_ia'
                            ? '🎙️ Escucha Ambiental IA'
                            : '✨ Síntesis IA'}{' '}
                          · {entry.professionalName}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-stone-700 leading-relaxed">
                        {entry.grokStructuredNote}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL AL PINCHAR LA FOTO/LOGO DEL CENTRO ARRIBA
         ========================================================= */}
      <AnimatePresence>
        {showBrandingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-md w-full p-7 border border-[#E4ECE7] shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900">
                  Configuración del Centro Clínico
                </h3>
                <button
                  onClick={() => setShowBrandingModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7]">
                <div className="w-16 h-16 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                  {centerLogoUrl ? (
                    <img
                      src={centerLogoUrl}
                      alt={centerBrandName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{centerBrandName.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2C4A3B] text-white font-bold cursor-pointer hover:bg-[#233B2F] transition-all">
                    <ImagePlus size={14} />
                    <span>Subir Foto / Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-stone-500 block mb-1">
                  Nombre del Centro
                </label>
                <input
                  type="text"
                  value={centerBrandName}
                  onChange={(e) => setCenterBrandName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold uppercase text-stone-500 block">
                  Boxes del Centro ({centerBoxes.length})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {centerBoxes.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F9F8F6] border border-[#E4ECE7] font-semibold"
                    >
                      <span>{b}</span>
                      {centerBoxes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCenterBoxes((prev) => prev.filter((item) => item !== b))
                          }
                          className="text-rose-500"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newBoxNameInput}
                    onChange={(e) => setNewBoxNameInput(e.target.value)}
                    placeholder="Ej. Box 5 · Ciprés"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBoxNameInput.trim()) return;
                      setCenterBoxes((prev) => [...prev, newBoxNameInput.trim()]);
                      setNewBoxNameInput('');
                    }}
                    className="px-3.5 py-2 bg-stone-800 text-white rounded-xl font-bold"
                  >
                    + Box
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBrandingModal(false)}
                className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
              >
                Guardar
              </button>
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
                typeof window !== 'undefined' ? window.innerHeight - 420 : 320
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
                const pat = patients.find(
                  (p) =>
                    p.id === contextMenu.apt.patientId ||
                    p.patientName.toLowerCase() ===
                      contextMenu.apt.patientName.toLowerCase()
                );
                if (pat) setFichaPatient(pat);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EBF3EE] text-[#2C4A3B] font-bold transition-colors"
            >
              <Mic size={15} />
              <span>Abrir Ficha + Escucha IA</span>
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
                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === contextMenu.apt.id ? { ...a, clinicalStatus: 'No Asistió' } : a
                  )
                );
                showToast('Marcado como No Asistió (Impacta reporte de abandono)');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-amber-900 font-medium transition-colors"
            >
              <UserX size={15} className="text-amber-600" />
              <span>Marcar No Asistió (Inasistencia)</span>
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
                deleteAppointmentSlotOnly(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-bold transition-colors"
            >
              <Trash2 size={15} />
              <span>Eliminar Hora de Agenda (Mantiene Paciente)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL REGISTRAR NUEVO PACIENTE DIRECTO EN DIRECTORIO
         ========================================================= */}
      <AnimatePresence>
        {showNewPatientModal && (
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
                <h3 className="text-xl font-bold text-stone-900">Registrar Paciente</h3>
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateDirectPatient} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Nombre Completo
                  </label>
                  <input
                    required
                    type="text"
                    value={newPatientDirectForm.patientName}
                    onChange={(e) =>
                      setNewPatientDirectForm({
                        ...newPatientDirectForm,
                        patientName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={newPatientDirectForm.patientRUT}
                      onChange={(e) =>
                        setNewPatientDirectForm({
                          ...newPatientDirectForm,
                          patientRUT: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={newPatientDirectForm.patientPhone}
                      onChange={(e) =>
                        setNewPatientDirectForm({
                          ...newPatientDirectForm,
                          patientPhone: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={newPatientDirectForm.patientEmail}
                    onChange={(e) =>
                      setNewPatientDirectForm({
                        ...newPatientDirectForm,
                        patientEmail: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                >
                  Guardar Paciente
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL EDITAR PACIENTE DEL DIRECTORIO
         ========================================================= */}
      <AnimatePresence>
        {editingPatientRecord && (
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
                <h3 className="text-xl font-bold text-stone-900">Editar Ficha de Paciente</h3>
                <button
                  onClick={() => setEditingPatientRecord(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditedPatientRecord} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Nombre del Paciente
                  </label>
                  <input
                    required
                    type="text"
                    value={editingPatientRecord.patientName}
                    onChange={(e) =>
                      setEditingPatientRecord({
                        ...editingPatientRecord,
                        patientName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">
                    Estado Clínico (Para Reporte de Retención / Abandono)
                  </label>
                  <select
                    value={editingPatientRecord.clinicalStatusTag}
                    onChange={(e) =>
                      setEditingPatientRecord({
                        ...editingPatientRecord,
                        clinicalStatusTag: e.target.value as PatientRecord['clinicalStatusTag'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold"
                  >
                    <option value="Activo">Activo (Retenido)</option>
                    <option value="En Seguimiento">En Seguimiento (Retenido)</option>
                    <option value="Alta Clínica">Alta Clínica</option>
                    <option value="Abandono">Abandono / Deserción</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2C4A3B] text-white rounded-xl font-bold"
                >
                  Guardar Cambios
                </button>
              </form>
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
          MODAL CRUD PROFESIONAL + CONVENIO BOX
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
                    Convenio Financiero con el Centro
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
                      Cobro por Uso de Box Presencial ($ por sesión en Box)
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

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminGlassSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}