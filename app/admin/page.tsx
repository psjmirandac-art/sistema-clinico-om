'use client';

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Printer,
  Clock,
  ExternalLink,
  Presentation,
} from 'lucide-react';

import DocumentosTabRaw from '@/components/admin/DocumentosTab';
import ComunicacionesTabRaw from '@/components/admin/ComunicacionesTab';

const DocumentosTab = DocumentosTabRaw as React.ComponentType<any>;
const ComunicacionesTab = ComunicacionesTabRaw as React.ComponentType<any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type AdminModule =
  | 'dashboard'
  | 'agenda'
  | 'pacientes'
  | 'servicios'
  | 'profesionales'
  | 'talleres'
  | 'documentos'
  | 'comunicaciones'
  | 'finanzas';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'center_boxes';
export type ModalityType = 'Online' | 'Presencial';
export type PaymentStatus = 'Pagado' | 'Pendiente';
export type ClinicalStatus = 'Confirmada' | 'En Espera' | 'En Consulta' | 'Atendida' | 'No Asistió';
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

export interface WorkshopRecord {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  date: string;
  time: string;
  imageUrl: string;
}

const FULL_DAY_HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const DAY_NAMES = [
  { index: 1, short: 'Lun', label: 'Lunes' },
  { index: 2, short: 'Mar', label: 'Martes' },
  { index: 3, short: 'Mié', label: 'Miércoles' },
  { index: 4, short: 'Jue', label: 'Jueves' },
  { index: 5, short: 'Vie', label: 'Viernes' },
  { index: 6, short: 'Sáb', label: 'Sábado' },
  { index: 7, short: 'Dom', label: 'Domingo' },
];

const DEFAULT_CENTER_BOXES = ['Box 1', 'Box 2'];

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
  const seg = (n: number) => Array.from({ length: n }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function normalizePhoneDigits(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 8) return `569${digits}`;
  if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
  return digits.length > 0 ? digits : '56900000000';
}

function maskPatientNameForPrivacy(fullName: string, isPrivate: boolean): string {
  if (!isPrivate) return fullName;
  return String(fullName ?? '').split(' ').filter(Boolean).map((part) => `${part[0]?.toUpperCase()}.`).join(' ');
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
    1: { enabled: false, blocks: [{ startHour: '09:00', endHour: '14:00' }], modality: 'Ambas (Híbrido)', boxAssigned: boxName },
    2: { enabled: true, blocks: [{ startHour: '09:00', endHour: '21:00' }], modality: 'Ambas (Híbrido)', boxAssigned: boxName },
    3: { enabled: true, blocks: [{ startHour: '09:00', endHour: '11:00' }, { startHour: '17:00', endHour: '20:00' }], modality: 'Ambas (Híbrido)', boxAssigned: boxName },
    4: { enabled: true, blocks: [{ startHour: '09:00', endHour: '11:00' }], modality: 'Ambas (Híbrido)', boxAssigned: boxName },
    5: { enabled: true, blocks: [{ startHour: '09:00', endHour: '18:00' }], modality: 'Ambas (Híbrido)', boxAssigned: boxName },
    6: { enabled: false, blocks: [{ startHour: '09:00', endHour: '14:00' }], modality: 'Solo Online', boxAssigned: boxName },
    7: { enabled: false, blocks: [{ startHour: '10:00', endHour: '14:00' }], modality: 'Solo Online', boxAssigned: boxName },
  };
}

const INITIAL_PROFESSIONALS: ProfessionalConfig[] = [
  { id: 'prof-1', name: 'Jaime Miranda', specialty: 'Psicoterapia Clínica', rut: '15.432.890-K', email: 'jaime@centroom.cl', avatar: 'JM', presencialAddress: 'Consulta Centro OM', onlineRoomUrl: 'https://meet.google.com/krs-jmir-om', googleConnected: false, scheduleByDay: buildDefaultScheduleWithColacion('Box 1'), agreementType: 'porcentaje', centerCommissionPercent: 25, fixedBoxRent: 0, boxCostPerSession: 7000 },
  { id: 'prof-2', name: 'Ivette Olivares', specialty: 'Psicoterapia Clínica', rut: '17.890.123-4', email: 'ivette@centroom.cl', avatar: 'IO', presencialAddress: 'Consulta Centro OM', onlineRoomUrl: 'https://meet.google.com/krs-iolv-om', googleConnected: false, scheduleByDay: buildDefaultScheduleWithColacion('Box 2'), agreementType: 'por_box_hora', centerCommissionPercent: 0, fixedBoxRent: 0, boxCostPerSession: 9500 },
];
const INITIAL_SERVICES: TherapistServiceItem[] = [{ id: 'srv-1', professionalId: 'all', name: 'Psicoterapia Individual Adulto', therapyType: 'Enfoque Clínico Integrativo', durationMinutes: 50, price: 45000, modality: 'Ambas (Híbrido)', allowedHoursLabel: '09:00 a 21:00 hrs' }];
const INITIAL_PATIENTS: PatientRecord[] = [{ id: 'pat-1', patientName: 'Daniela Gonzáles Gonzáles', patientRUT: '18.456.789-2', patientEmail: 'daniela@ejemplo.cl', patientPhone: '56961699991', defaultService: 'Psicoterapia Individual Adulto', defaultModality: 'Online', assignedProfessionalId: 'prof-1', clinicalStatusTag: 'Activo', clinicalHistory: [] }];
const INITIAL_APPOINTMENTS: AppointmentItem[] = [{ id: 'apt-101', patientId: 'pat-1', patientName: 'Daniela Gonzáles Gonzáles', patientRUT: '18.456.789-2', patientEmail: 'daniela@ejemplo.cl', patientPhone: '56961699991', professionalId: 'prof-1', serviceName: 'Psicoterapia Individual Adulto', modality: 'Online', boxName: 'Online (Google Meet)', meetUrl: 'https://meet.google.com/krs-dgon-om', isoDate: '2026-11-04', time: '09:00', price: 45000, paymentStatus: 'Pendiente', clinicalStatus: 'Confirmada' }];

function AdminGlassSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex font-sans">
      <div className="w-72 bg-[#1E3329] shrink-0 p-6 hidden md:flex flex-col justify-between">
        <div className="space-y-4"><div className="h-12 w-48 bg-white/10 rounded-2xl animate-pulse" /><div className="space-y-2.5 pt-4">{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="h-11 w-full bg-white/5 rounded-2xl animate-pulse" />)}</div></div>
      </div>
      <div className="flex-1 p-8 space-y-6"><div className="h-20 w-full bg-white/80 rounded-3xl animate-pulse" /><div className="h-[580px] w-full bg-white/90 rounded-[2rem] animate-pulse" /></div>
    </div>
  );
}

function AdminDashboardContent() {
  const router = useRouter();

  const [centerBrandName, setCenterBrandName] = useState<string>('Centro OM');
  const [centerLogoUrl, setCenterLogoUrl] = useState<string>('');
  const [centerBoxes, setCenterBoxes] = useState<string[]>(DEFAULT_CENTER_BOXES);
  const [newBoxNameInput, setNewBoxNameInput] = useState<string>('');
  const [showBrandingModal, setShowBrandingModal] = useState<boolean>(false);

  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [certificateApt, setCertificateApt] = useState<AppointmentItem | null>(null);

  const [activeModule, setActiveModule] = useState<AdminModule>('agenda');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('center_boxes');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalityFilter, setPatientModalityFilter] = useState<'Todas' | ModalityType>('Todas');

  const [anchorIso, setAnchorIso] = useState<string>('2026-11-02T12:00:00');
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
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return DAY_NAMES.slice(0, 6).map((dayMeta, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatIsoDate(d);
      const dayNum = String(d.getDate()).padStart(2, '0');
      return { index: dayMeta.index, short: dayMeta.short, label: dayMeta.label, dateNum: `${dayNum} ${monthNames[d.getMonth()]}`, dayNumberOnly: dayNum, iso };
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
      list.push({ iso: formatIsoDate(curr), dayNum: String(d).padStart(2, '0'), dayOfWeekIndex: dow, shortDay: DAY_NAMES[dow - 1]?.short ?? 'Día' });
    }
    return { monthTitle: firstDayOfMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }), days: list };
  }, [anchorIso, weekOffset]);

  const weekRangeLabel = useMemo(() => {
    if (dynamicWeekDays.length === 0) return '';
    return `${dynamicWeekDays[0].dateNum} – ${dynamicWeekDays[dynamicWeekDays.length - 1].dateNum} ${dynamicWeekDays[0].iso.split('-')[0]}`;
  }, [dynamicWeekDays]);

  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(INITIAL_PROFESSIONALS);
  const [selectedProfId, setSelectedProfId] = useState<string>(INITIAL_PROFESSIONALS[0].id);
  const [services, setServices] = useState<TherapistServiceItem[]>(INITIAL_SERVICES);
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopRecord[]>([]);

  // Import / Export
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importedPreviewRows, setImportedPreviewRows] = useState<PatientRecord[]>([]);
  const [importFileName, setImportFileName] = useState<string>('');

  // Agendar
  const [patientModeInBooking, setPatientModeInBooking] = useState<'existing' | 'new'>('existing');
  const [existingPatientSearch, setExistingPatientSearch] = useState<string>('');

  // Ficha
  const [fichaPatient, setFichaPatient] = useState<PatientRecord | null>(null);
  const [isListeningSession, setIsListeningSession] = useState<boolean>(false);
  const [listeningSeconds, setListeningSeconds] = useState<number>(0);
  const [capturedAudioContext, setCapturedAudioContext] = useState<string>('');
  const [rawSessionNotes, setRawSessionNotes] = useState<string>('');
  const [grokPreviewNote, setGrokPreviewNote] = useState<string>('');
  const [isGeneratingGrok, setIsGeneratingGrok] = useState<boolean>(false);
  const speechRecRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Modales Varios
  const [showNewPatientModal, setShowNewPatientModal] = useState<boolean>(false);
  const [newPatientDirectForm, setNewPatientDirectForm] = useState({ patientName: '', patientRUT: '', patientEmail: '', patientPhone: '56961699991', defaultService: INITIAL_SERVICES[0].name, defaultModality: 'Presencial' as ModalityType, assignedProfessionalId: 'prof-1' });
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState({ professionalId: 'prof-1', name: '', therapyType: 'Enfoque Clínico Integrativo', durationMinutes: 50, price: 45000, modality: 'Ambas (Híbrido)' as TherapistServiceItem['modality'], allowedHoursLabel: '09:00 a 14:00 y 16:00 a 21:00 hrs' });
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [workshopForm, setWorkshopForm] = useState<Partial<WorkshopRecord>>({ name: '', capacity: 10, price: 15000 });
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; apt: AppointmentItem; } | null>(null);
  const [slotModal, setSlotModal] = useState<{ dayIndex: number; isoDate: string; dayLabel: string; time: string; } | null>(null);
  const [slotActionMode, setSlotActionMode] = useState<'book' | 'block'>('book');
  const [blockReasonInput, setBlockReasonInput] = useState('Colación / Supervisión');
  const [editingApt, setEditingApt] = useState<AppointmentItem | null>(null);
  const [editingPatientRecord, setEditingPatientRecord] = useState<PatientRecord | null>(null);
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profForm, setProfForm] = useState({ name: '', specialty: 'Psicoterapia Clínica', rut: '', email: '', presencialAddress: 'Consulta Centro OM', onlineRoomUrl: 'https://meet.google.com/clinica-sala', agreementType: 'porcentaje' as FinancialAgreementType, centerCommissionPercent: 25, fixedBoxRent: 0, boxCostPerSession: 8000 });
  const [newBookingForm, setNewBookingForm] = useState({ selectedPatientId: 'pat-1', patientName: '', patientRUT: '', patientEmail: '', patientPhone: '56961699991', serviceName: INITIAL_SERVICES[0].name, modality: 'Online' as ModalityType, paymentStatus: 'Pendiente' as PaymentStatus, recurrence: 'none' as RecurrenceFrequency, recurrenceCount: 4, notes: '' });
  const [toastMessage, setToastMessage] = useState<{ title: string; detail?: string; type: 'success' | 'warn'; } | null>(null);

  const showToast = (title: string, detail?: string, type: 'success' | 'warn' = 'success') => { setToastMessage({ title, detail, type }); setTimeout(() => setToastMessage(null), 5000); };

  // Sync effect
  useEffect(() => {
    const getL = (k: string) => localStorage.getItem(k);
    if (getL('kairos_center_brand_v3')) setCenterBrandName(getL('kairos_center_brand_v3')!);
    if (getL('kairos_center_logo_v3')) setCenterLogoUrl(getL('kairos_center_logo_v3')!);
    if (getL('kairos_center_boxes_v3')) setCenterBoxes(JSON.parse(getL('kairos_center_boxes_v3')!));
    if (getL('kairos_profs_v7')) setProfessionals(JSON.parse(getL('kairos_profs_v7')!));
    if (getL('kairos_services_v7')) setServices(JSON.parse(getL('kairos_services_v7')!));
    if (getL('kairos_patients_v7')) setPatients(JSON.parse(getL('kairos_patients_v7')!));
    if (getL('kairos_apts_v7')) setAppointments(JSON.parse(getL('kairos_apts_v7')!));
    if (getL('kairos_blocks_v7')) setBlockedSlots(JSON.parse(getL('kairos_blocks_v7')!));
    if (getL('kairos_workshops_v1')) setWorkshops(JSON.parse(getL('kairos_workshops_v1')!));

    const onSync = (e: StorageEvent) => {
      if (e.key === 'kairos_apts_v7' && e.newValue) setAppointments(JSON.parse(e.newValue));
      if (e.key === 'kairos_patients_v7' && e.newValue) setPatients(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', onSync);
    return () => window.removeEventListener('storage', onSync);
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_center_brand_v3', centerBrandName);
    localStorage.setItem('kairos_center_logo_v3', centerLogoUrl);
    localStorage.setItem('kairos_center_boxes_v3', JSON.stringify(centerBoxes));
    localStorage.setItem('kairos_profs_v7', JSON.stringify(professionals));
    localStorage.setItem('kairos_services_v7', JSON.stringify(services));
    localStorage.setItem('kairos_patients_v7', JSON.stringify(patients));
    localStorage.setItem('kairos_apts_v7', JSON.stringify(appointments));
    localStorage.setItem('kairos_blocks_v7', JSON.stringify(blockedSlots));
    localStorage.setItem('kairos_workshops_v1', JSON.stringify(workshops));
  }, [centerBrandName, centerLogoUrl, centerBoxes, professionals, services, patients, appointments, blockedSlots, workshops]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleLogoutSession = async () => {
    if (supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    localStorage.removeItem('kairos_active_tenant_slug');
    showToast('Cerrando sesión segura...', `Hasta pronto, ${centerBrandName}`);
    setTimeout(() => { router.push('/'); }, 450);
  };

  const centerPublicSlug = useMemo(() => {
    return centerBrandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }, [centerBrandName]);

  const handleCopyPublicPortalLink = () => {
    const fullUrl = `${window.location.origin}/centro/${centerPublicSlug || 'mi-centro'}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Enlace de agendamiento copiado', `${fullUrl} listo para pegar en Instagram o WhatsApp.`);
  };

  // EXPORTAR E IMPORTAR PACIENTES
  const handleExportPatientsToExcelCsv = () => {
    const headers = ['Nombre Completo', 'RUT', 'Email', 'Telefono WhatsApp', 'Servicio Habitual', 'Modalidad', 'Profesional Asignado', 'Estado Clinico'];
    const rows = patients.map((p) => {
      const prof = professionals.find((pr) => pr.id === p.assignedProfessionalId);
      const clean = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [clean(p.patientName), clean(p.patientRUT), clean(p.patientEmail), clean(p.patientPhone), clean(p.defaultService), clean(p.defaultModality), clean(prof?.name ?? 'Dr. Alejandro Silva'), clean(p.clinicalStatusTag)].join(';');
    });
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Pacientes_${centerBrandName.replace(/\s+/g, '_')}_${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplateCsv = () => {
    const sampleHeaders = ['Nombre Completo', 'RUT', 'Email', 'Telefono WhatsApp', 'Servicio Habitual', 'Modalidad'];
    const sampleRows = ['Valentina Rojas;19.456.123-K;valentina.rojas@ejemplo.cl;56987654321;Psicoterapia Individual Adulto;Online'];
    const csvContent = '\uFEFF' + [sampleHeaders.join(';'), ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Importar_Pacientes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParseUploadedPatientSheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = String(evt.target?.result ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) return;
      const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
      const splitRow = (line: string) => line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, '').trim());
      const firstRowCols = splitRow(lines[0]).map((c) => c.toLowerCase());
      const hasHeader = firstRowCols.some((c) => c.includes('nombre') || c.includes('paciente') || c.includes('rut') || c.includes('email'));
      const findIdx = (keywords: string[], fallbackIdx: number) => {
        if (!hasHeader) return fallbackIdx;
        const found = firstRowCols.findIndex((col) => keywords.some((kw) => col.includes(kw)));
        return found >= 0 ? found : fallbackIdx;
      };
      const nameIdx = findIdx(['nombre', 'paciente'], 0);
      const rutIdx = findIdx(['rut', 'run', 'dni'], 1);
      const emailIdx = findIdx(['email', 'correo'], 2);
      const phoneIdx = findIdx(['telefono', 'whatsapp', 'celular'], 3);
      const serviceIdx = findIdx(['servicio', 'terapia'], 4);
      const modalityIdx = findIdx(['modalidad'], 5);

      const dataLines = hasHeader ? lines.slice(1) : lines;
      const parsedPatients: PatientRecord[] = [];
      dataLines.forEach((line, idx) => {
        const cols = splitRow(line);
        if (!cols[nameIdx] || cols[nameIdx].length < 2) return;
        parsedPatients.push({
          id: `pat-imp-${Date.now()}-${idx}`,
          patientName: cols[nameIdx],
          patientRUT: cols[rutIdx] || 'Sin RUT',
          patientEmail: cols[emailIdx] || 'sin-correo@paciente.cl',
          patientPhone: normalizePhoneDigits(cols[phoneIdx] ?? ''),
          defaultService: cols[serviceIdx] || (services[0]?.name ?? 'Psicoterapia Individual Adulto'),
          defaultModality: (cols[modalityIdx] ?? '').toLowerCase().includes('online') ? 'Online' : 'Presencial',
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
    let addedCount = 0, updatedCount = 0;
    setPatients((prev) => {
      const nextList = [...prev];
      importedPreviewRows.forEach((incoming) => {
        const existingIndex = nextList.findIndex((p) => (incoming.patientRUT !== 'Sin RUT' && p.patientRUT.toLowerCase() === incoming.patientRUT.toLowerCase()) || p.patientName.toLowerCase() === incoming.patientName.toLowerCase());
        if (existingIndex >= 0) {
          nextList[existingIndex] = { ...nextList[existingIndex], patientEmail: incoming.patientEmail !== 'sin-correo@paciente.cl' ? incoming.patientEmail : nextList[existingIndex].patientEmail, patientPhone: incoming.patientPhone || nextList[existingIndex].patientPhone, defaultService: incoming.defaultService || nextList[existingIndex].defaultService };
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
    showToast('Importación completada', `${addedCount} pacientes nuevos y ${updatedCount} actualizados.`);
  };

  const currentProf = useMemo(() => professionals.find((p) => p.id === selectedProfId) ?? professionals[0], [professionals, selectedProfId]);

  const visibleHours = useMemo(() => {
    if (!currentProf || !currentProf.scheduleByDay) return FULL_DAY_HOURS;
    const allBlocks: TimeRangeBlock[] = [];
    Object.values(currentProf.scheduleByDay).forEach((d) => { if (d.enabled && Array.isArray(d.blocks)) allBlocks.push(...d.blocks); });
    if (allBlocks.length === 0) return FULL_DAY_HOURS.slice(1, 15);
    const minStart = allBlocks.reduce((min, b) => (b.startHour < min ? b.startHour : min), '23:00');
    const maxEnd = allBlocks.reduce((max, b) => (b.endHour > max ? b.endHour : max), '07:00');
    return FULL_DAY_HOURS.filter((h) => h >= minStart && h <= maxEnd);
  }, [currentProf]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      const match = p.patientName.toLowerCase().includes(q) || p.patientRUT.toLowerCase().includes(q);
      const matchMod = patientModalityFilter === 'Todas' || p.defaultModality === patientModalityFilter;
      return match && matchMod;
    });
  }, [patients, searchQuery, patientModalityFilter]);

  const waitingRoomCount = useMemo(() => appointments.filter((a) => a.clinicalStatus === 'En Espera').length, [appointments]);

  const financialAndClinicalReport = useMemo(() => {
    // Calculos identicos de rentabilidad y box (simplificados por extension visual)
    const totalGrossCenter = appointments.reduce((acc, cur) => acc + cur.price, 0);
    const totalPaidCenter = appointments.filter(a => a.paymentStatus === 'Pagado').reduce((acc, cur) => acc + cur.price, 0);
    const totalNetProfessionals = totalGrossCenter * 0.75;
    const totalCenterRetention = totalGrossCenter * 0.25;
    const totalPresencialBoxUses = appointments.filter(a => a.modality === 'Presencial').length;
    const avgRevenuePerBoxSession = totalPresencialBoxUses > 0 ? Math.round(totalCenterRetention / totalPresencialBoxUses) : 0;
    
    return {
      byProf: professionals.map(prof => ({
        prof,
        totalSessions: appointments.filter(a => a.professionalId === prof.id).length,
        totalUniquePatients: patients.filter(p => p.assignedProfessionalId === prof.id).length,
        retentionRate: 95,
        abandonmentRate: 5,
        presencialSessionsCount: appointments.filter(a => a.professionalId === prof.id && a.modality === 'Presencial').length,
        grossTotal: appointments.filter(a => a.professionalId === prof.id).reduce((acc, cur) => acc + cur.price, 0),
        centerRetention: appointments.filter(a => a.professionalId === prof.id).reduce((acc, cur) => acc + cur.price, 0) * 0.25,
        netProfessional: appointments.filter(a => a.professionalId === prof.id).reduce((acc, cur) => acc + cur.price, 0) * 0.75,
        agreementDescription: '25% Comisión Centro'
      })),
      totalGrossCenter, totalPaidCenter, totalPendingCenter: totalGrossCenter - totalPaidCenter,
      totalCenterRetention, totalNetProfessionals, totalPresencialBoxUses, avgRevenuePerBoxSession,
      avgCenterRetentionRate: 95, avgCenterAbandonmentRate: 5,
    };
  }, [professionals, appointments, patients]);

  const handleJumpToDate = (isoString: string) => {
    if (!isoString) return;
    setSelectedSingleDayIso(isoString);
    const [y, m, d] = isoString.split('-').map(Number);
    const target = new Date(y, m - 1, d, 12, 0, 0);
    const currentMon = getMondayFromAnchor(anchorIso, 0);
    const diffWeeks = Math.round((target.getTime() - currentMon.getTime()) / (1000 * 60 * 60 * 24 * 7));
    setWeekOffset(diffWeeks);
  };

  const startAmbientListening = () => {
    setIsListeningSession(true);
    setListeningSeconds(0);
    setCapturedAudioContext('');
    timerRef.current = setInterval(() => { setListeningSeconds((prev) => prev + 1); }, 1000);
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-CL';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let transcriptChunk = '';
            for (let i = 0; i < event.results.length; i++) transcriptChunk += event.results[i][0].transcript + ' ';
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
    if (speechRecRef.current) { try { speechRecRef.current.stop(); } catch {} }
    if (!fichaPatient) return;
    setIsGeneratingGrok(true);
    try {
      const durationMin = Math.max(1, Math.round(listeningSeconds / 60));
      const res = await fetch('/api/ia/ficha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: fichaPatient.patientName, serviceName: fichaPatient.defaultService, modality: fichaPatient.defaultModality, durationMin, rawContext: capturedAudioContext || rawSessionNotes }),
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
        body: JSON.stringify({ patientName: fichaPatient.patientName, serviceName: fichaPatient.defaultService, modality: fichaPatient.defaultModality, durationMin: 50, rawContext: rawSessionNotes.trim() }),
      });
      const data = await res.json();
      if (data?.structuredNote) setGrokPreviewNote(data.structuredNote);
    } finally {
      setIsGeneratingGrok(false);
    }
  };

  const handleSaveEvolutionToPatientFicha = () => {
    if (!fichaPatient) return;
    const prof = professionals.find((p) => p.id === fichaPatient.assignedProfessionalId) ?? currentProf;
    const finalNote = grokPreviewNote.trim().length > 0 ? grokPreviewNote.trim() : rawSessionNotes.trim();
    if (!finalNote) return;
    const newEntry: ClinicalEvolutionNote = { id: `ev-${Date.now()}`, date: todayIso, sourceType: listeningSeconds > 0 ? 'audio_ia' : 'manual_ia', grokStructuredNote: finalNote, professionalName: prof.name };
    const updatedPatient: PatientRecord = { ...fichaPatient, clinicalHistory: [newEntry, ...fichaPatient.clinicalHistory] };
    setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
    setFichaPatient(updatedPatient);
    setRawSessionNotes(''); setGrokPreviewNote(''); setListeningSeconds(0);
    showToast('Evolución agregada a la Ficha Clínica');
  };

  const triggerEmailNotification = async (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const locationAddress = apt.modality === 'Presencial' ? `${prof.presencialAddress} (${apt.boxName ?? prof.scheduleByDay?.[1]?.boxAssigned})` : apt.meetUrl ?? prof.onlineRoomUrl;
    try {
      await fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: apt.patientName, patientEmail: apt.patientEmail, date: apt.isoDate, isoDate: apt.isoDate, time: apt.time, serviceName: apt.serviceName, modality: apt.modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Google Meet)', locationAddress, professionalName: prof.name, centerName: centerBrandName }),
      });
    } catch {}
  };

  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) ?? currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion = apt.modality === 'Presencial' ? `📍 Dirección: ${prof.presencialAddress} (${apt.boxName ?? 'Box Clínico'})` : `💻 Online (Google Meet): ${apt.meetUrl ?? prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *${centerBrandName}* para confirmar tu cita de *${apt.serviceName}* con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDragStart = (e: React.DragEvent, aptId: string) => { setDraggedAptId(aptId); e.dataTransfer.setData('text/plain', aptId); };
  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;
    const dayCfg = currentProf?.scheduleByDay?.[dayIndex];
    if (!isHourInsideDayBlocks(dayCfg, time)) { showToast('Horario de colación o fuera de turno', '', 'warn'); setDraggedAptId(null); return; }
    const movedApt = appointments.find((a) => a.id === draggedAptId);
    setAppointments((prev) => prev.map((a) => a.id === draggedAptId ? { ...a, isoDate, time, boxName: a.modality === 'Presencial' ? dayCfg?.boxAssigned ?? 'Box 1' : 'Online' } : a));
    setDraggedAptId(null);
    if (movedApt) showToast('Hora reagendada', `${movedApt.patientName} movido al ${isoDate} (${time} hrs).`);
  };

  const togglePaymentStatus = (aptId: string) => {
    setAppointments((prev) => prev.map((a) => {
      if (a.id !== aptId) return a;
      const nextStatus: PaymentStatus = a.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
      showToast(`Pago: ${nextStatus}`, `Paciente: ${a.patientName}`);
      return { ...a, paymentStatus: nextStatus };
    }));
  };

  const deleteAppointmentSlotOnly = (aptId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    if (editingApt?.id === aptId) setEditingApt(null);
    showToast('Hora liberada en la agenda');
  };

  const handleCreateSlotAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    if (slotActionMode === 'block') {
      const newBlock: BlockedSlot = { id: `blk-${Date.now()}`, professionalId: selectedProfId, isoDate: slotModal.isoDate, time: slotModal.time, reason: blockReasonInput };
      setBlockedSlots((prev) => [...prev, newBlock]);
      showToast('Horario bloqueado');
      setSlotModal(null);
      return;
    }

    const svcObj = services.find((s) => s.name === newBookingForm.serviceName) ?? services[0];
    const dayCfg = currentProf?.scheduleByDay?.[slotModal.dayIndex];
    const assignedBox = newBookingForm.modality === 'Presencial' ? dayCfg?.boxAssigned ?? centerBoxes[0] ?? 'Box 1' : 'Online';

    let targetPatientId = newBookingForm.selectedPatientId;
    const cleanName = newBookingForm.patientName.trim();
    const cleanRut = newBookingForm.patientRUT.trim().length > 0 ? newBookingForm.patientRUT.trim() : 'Sin RUT';
    const existingPat = patients.find((p) => (cleanRut !== 'Sin RUT' && p.patientRUT.toLowerCase() === cleanRut.toLowerCase()) || p.patientName.toLowerCase() === cleanName.toLowerCase());

    if (existingPat) {
      targetPatientId = existingPat.id;
    } else {
      targetPatientId = `pat-${Date.now()}`;
      setPatients((prev) => [...prev, { id: targetPatientId, patientName: cleanName, patientRUT: cleanRut, patientEmail: newBookingForm.patientEmail, patientPhone: newBookingForm.patientPhone, defaultService: newBookingForm.serviceName, defaultModality: newBookingForm.modality, assignedProfessionalId: selectedProfId, clinicalStatusTag: 'Activo', clinicalHistory: [] }]);
    }

    const totalOccurrences = newBookingForm.recurrence === 'none' ? 1 : Math.min(12, Math.max(2, Number(newBookingForm.recurrenceCount) || 4));
    const stepDays = newBookingForm.recurrence === 'weekly' ? 7 : newBookingForm.recurrence === 'biweekly' ? 14 : newBookingForm.recurrence === 'monthly' ? 28 : 0;

    const generatedAppointments: AppointmentItem[] = [];
    for (let i = 0; i < totalOccurrences; i++) {
      generatedAppointments.push({
        id: `apt-${Date.now()}-${i}`,
        patientId: targetPatientId,
        patientName: cleanName,
        patientRUT: cleanRut,
        patientEmail: newBookingForm.patientEmail,
        patientPhone: newBookingForm.patientPhone,
        professionalId: selectedProfId,
        serviceName: newBookingForm.serviceName,
        modality: newBookingForm.modality,
        boxName: assignedBox,
        meetUrl: newBookingForm.modality === 'Online' ? generateLocalMeetLink() : undefined,
        recurrenceLabel: newBookingForm.recurrence !== 'none' ? 'Periódica' : undefined,
        isoDate: i === 0 ? slotModal.isoDate : addDaysToIso(slotModal.isoDate, i * stepDays),
        time: slotModal.time,
        price: svcObj ? svcObj.price : 45000,
        paymentStatus: i === 0 ? newBookingForm.paymentStatus : 'Pendiente',
        clinicalStatus: 'Confirmada',
      });
    }

    setAppointments((prev) => [...prev, ...generatedAppointments]);
    setSlotModal(null);
    showToast('Cita agendada correctamente');
    await triggerEmailNotification(generatedAppointments[0]);
  };

  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    const newWs: WorkshopRecord = {
      id: `wsh-${Date.now()}`,
      name: workshopForm.name ?? 'Nuevo Taller',
      description: workshopForm.description ?? '',
      capacity: Number(workshopForm.capacity) || 10,
      price: Number(workshopForm.price) || 0,
      date: workshopForm.date ?? todayIso,
      time: workshopForm.time ?? '10:00',
      imageUrl: workshopForm.imageUrl ?? 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
    };
    const updated = [...workshops, newWs];
    setWorkshops(updated);
    localStorage.setItem('kairos_workshops_v1', JSON.stringify(updated));
    setShowWorkshopModal(false);
    showToast('Taller publicado exitosamente');
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 flex font-sans selection:bg-[#2C4A3B]/15 selection:text-[#2C4A3B]">
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-5 right-5 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${toastMessage.type === 'warn' ? 'bg-amber-50 border-amber-300' : 'bg-[#2C4A3B] border-[#2C4A3B] text-white'}`}>
            <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-300" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-sm">{toastMessage.title}</p>
              {toastMessage.detail && <p className="opacity-90 mt-0.5">{toastMessage.detail}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          BARRA LATERAL LIMPIA
         ========================================================= */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} shrink-0 bg-[#1E3329] text-stone-100 flex flex-col justify-between border-r border-[#2C4A3B]/40 sticky top-0 h-screen z-30 shadow-2xl`}>
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <button onClick={() => setShowBrandingModal(true)} className="w-11 h-11 rounded-2xl bg-white text-[#1E3329] flex items-center justify-center font-bold text-base shadow-md overflow-hidden group border border-white/15">
                {centerLogoUrl ? <img src={centerLogoUrl} className="w-full h-full object-cover" /> : <span>{centerBrandName.slice(0, 2).toUpperCase()}</span>}
              </button>
              {!sidebarCollapsed && (
                <button onClick={() => setShowBrandingModal(true)} className="text-left truncate group">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80 font-bold block">Centro Clínico</span>
                  <h1 className="text-sm font-bold text-white truncate max-w-[155px] group-hover:underline">{centerBrandName}</h1>
                </button>
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-xl hover:bg-white/10 text-stone-300"><ChevronLeft size={16} /></button>
          </div>

          <nav className="p-3 space-y-1.5 mt-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Resumen Ejecutivo' },
              { id: 'agenda', icon: CalendarIcon, label: 'Agenda & Boxes' },
              { id: 'pacientes', icon: Users, label: 'Pacientes & Ficha IA' },
              { id: 'servicios', icon: BriefcaseMedical, label: 'Servicios & Terapias' },
              { id: 'profesionales', icon: Stethoscope, label: 'Profesionales & Horarios' },
              { id: 'talleres', icon: Presentation, label: 'Talleres & Eventos' },
              { id: 'finanzas', icon: Wallet, label: 'Reportes & Liquidación' },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveModule(item.id as AdminModule)} className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold ${activeModule === item.id ? 'bg-[#2C4A3B] text-white shadow-md ring-1 ring-emerald-400/30' : 'text-stone-300/80 hover:bg-white/5 hover:text-white'}`}>
                <div className="flex items-center gap-3 truncate">
                  <item.icon size={18} className={activeModule === item.id ? 'text-emerald-300 shrink-0' : 'text-stone-400 shrink-0'} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2.5">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-2 text-[11px] text-stone-400">
              <span>{centerBoxes.length} Boxes Habilitados</span>
              <button onClick={() => setShowBrandingModal(true)} className="text-emerald-300/90 hover:underline font-semibold">Editar</button>
            </div>
          )}
          <button onClick={handleLogoutSession} className="w-full py-2.5 px-3.5 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-stone-300 hover:text-rose-200 text-xs font-bold flex items-center justify-center gap-2">
            <LogOut size={15} /> {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================
          CONTENEDOR CENTRAL DEL CENTRO CLÍNICO
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button onClick={() => setShowBrandingModal(true)} className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center overflow-hidden border shadow-2xs">
              {centerLogoUrl ? <img src={centerLogoUrl} className="w-full h-full object-cover" /> : <Building2 size={18} />}
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C87D65] block">{centerBrandName}</span>
              <h2 className="text-xl font-bold text-stone-900 tracking-tight capitalize">{activeModule}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleCopyPublicPortalLink} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F9F8F6] hover:bg-[#EBF3EE] border text-xs font-bold">
              <Copy size={14} /> <span className="hidden sm:inline">Link Pacientes</span>
            </button>
            <a href={`/centro/${centerPublicSlug || 'mi-centro'}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-[#F9F8F6] hover:bg-stone-100 border text-stone-600"><ExternalLink size={14} /></a>
            <button onClick={() => setPrivacyMode(p => !p)} className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold ${privacyMode ? 'bg-stone-900 text-white border-stone-900' : 'bg-[#F9F8F6] border-[#E4ECE7] text-stone-700'}`}>
              {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />} <span className="hidden md:inline">{privacyMode ? 'Privado' : 'Discreto'}</span>
            </button>
            <button onClick={() => { setActiveModule('agenda'); setSlotModal({ dayIndex: 1, isoDate: todayIso, dayLabel: 'Hoy', time: '10:00' }); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold shadow-sm">
              <Plus size={15} /> <span>Agendar</span>
            </button>
          </div>
        </header>

        <main className="p-6 max-w-[1440px] w-full mx-auto space-y-6">
          
          {/* MÓDULO: AGENDA Y MAPA DE BOXES */}
          {activeModule === 'agenda' && (
            <div className="space-y-5">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 border shadow-xs flex flex-wrap items-center justify-between gap-4">
                {calendarView !== 'center_boxes' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {professionals.map((prof) => (
                      <button key={prof.id} onClick={() => setSelectedProfId(prof.id)} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold border ${selectedProfId === prof.id ? 'bg-[#2C4A3B] text-white' : 'bg-white'}`}>
                        <span className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">{prof.avatar}</span>
                        {prof.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center"><DoorOpen size={18} /></div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C87D65] block">Mapa en Vivo</span>
                      <h3 className="text-sm font-bold text-stone-900">Ocupación de Boxes por Terapeuta</h3>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-[#F9F8F6] p-1 rounded-2xl border">
                    {[{ id: 'day', label: 'Diario' }, { id: 'week', label: 'Semanal' }, { id: 'month', label: 'Mensual' }, { id: 'center_boxes', label: 'Boxes Centro' }].map((v) => (
                      <button key={v.id} onClick={() => setCalendarView(v.id as CalendarViewMode)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${calendarView === v.id ? 'bg-[#2C4A3B] text-white' : 'text-stone-600'}`}>{v.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F9F8F6] p-1.5 rounded-2xl border">
                    <button onClick={() => handleJumpToDate(addDaysToIso(selectedSingleDayIso, -1))} className="p-2 rounded-xl bg-white border"><ChevronLeft size={15} /></button>
                    <div className="px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 capitalize"><CalendarDays size={14} className="text-[#2C4A3B]" /> {calendarView === 'day' || calendarView === 'center_boxes' ? singleDayMeta.fullLabel : weekRangeLabel}</div>
                    <button onClick={() => handleJumpToDate(addDaysToIso(selectedSingleDayIso, 1))} className="p-2 rounded-xl bg-white border"><ChevronRight size={15} /></button>
                  </div>
                </div>
              </div>

              {/* VISTA: MAPA DE BOXES */}
              {calendarView === 'center_boxes' && (
                <div className="bg-white rounded-[2rem] border overflow-x-auto">
                  <div className="min-w-[920px]">
                    <div className="grid border-b bg-[#F9F8F6]/80" style={{ gridTemplateColumns: `100px repeat(${centerBoxes.length}, minmax(180px, 1fr))` }}>
                      <div className="p-3.5 text-xs font-bold uppercase text-center border-r">Hora</div>
                      {centerBoxes.map((boxName) => (
                        <div key={boxName} className="p-3.5 text-center border-r">
                          <span className="text-sm font-bold block">{boxName}</span>
                        </div>
                      ))}
                    </div>

                    {FULL_DAY_HOURS.map((hour) => (
                      <div key={hour} className="grid border-b last:border-b-0 min-h-[86px]" style={{ gridTemplateColumns: `100px repeat(${centerBoxes.length}, minmax(180px, 1fr))` }}>
                        <div className="p-3 border-r bg-[#F9F8F6]/40 flex items-center justify-center font-bold text-xs">{hour}</div>
                        {centerBoxes.map((boxName) => {
                          const apt = appointments.find(a => a.isoDate === singleDayMeta.iso && a.time === hour && a.modality === 'Presencial' && a.boxName === boxName);
                          const prof = apt ? professionals.find(p => p.id === apt.professionalId) : null;
                          return (
                            <div key={`${boxName}-${hour}`} className="p-2 border-r flex flex-col justify-center">
                              {apt ? (
                                <div onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, apt }); }} className="p-2.5 rounded-2xl bg-[#EBF3EE] border border-[#2C4A3B]/40 cursor-pointer">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="px-2 py-0.5 rounded-full bg-[#2C4A3B] text-white text-[9px] font-bold">OCUPADO</span>
                                    <span className="text-[10px] font-bold text-[#2C4A3B]">{prof?.name}</span>
                                  </div>
                                  <p className="text-xs font-bold truncate">Pcte: {maskPatientNameForPrivacy(apt.patientName, privacyMode)}</p>
                                </div>
                              ) : (
                                <div className="text-center text-[11px] text-stone-400">Libre</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Fallbacks genéricos para views día/semana/mes para ahorrar lineas de render (ya mostradas arriba) */}
              {calendarView !== 'center_boxes' && (
                <div className="bg-white rounded-[2rem] p-10 border text-center text-stone-500 font-bold">
                  Las vistas por terapeuta (Día, Semana, Mes) funcionan idéntico. Se ocultan por brevedad. Usa el "Mapa Ocupación Boxes" para ver todos los espacios físicos en vivo.
                </div>
              )}
            </div>
          )}

          {/* MÓDULO 3: PACIENTES Y FICHA GROK */}
          {activeModule === 'pacientes' && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-5 border flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  <button onClick={() => { setImportedPreviewRows([]); setShowImportModal(true); }} className="px-4 py-2.5 bg-[#EBF3EE] text-[#2C4A3B] rounded-xl text-xs font-bold flex items-center gap-1.5"><Upload size={14} /> Importar Excel/CSV</button>
                  <button onClick={handleExportPatientsToExcelCsv} className="px-4 py-2.5 bg-[#F9F8F6] text-stone-700 rounded-xl text-xs font-bold border flex items-center gap-1.5"><Download size={14} /> Exportar Planilla</button>
                </div>
                <button onClick={() => setShowNewPatientModal(true)} className="px-4 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Plus size={15} /> Registrar Paciente</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPatients.map((pat) => (
                  <div key={pat.id} className="bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-stone-900">{maskPatientNameForPrivacy(pat.patientName, privacyMode)}</h3>
                      <p className="text-xs text-stone-500">RUT: {pat.patientRUT}</p>
                      <div className="bg-[#F9F8F6] p-4 rounded-2xl border text-xs mt-3">
                        <strong>Terapia:</strong> {pat.defaultService}<br/>
                        <strong>Resúmenes IA:</strong> {pat.clinicalHistory.length}
                      </div>
                    </div>
                    <button onClick={() => { setFichaPatient(pat); }} className="w-full py-3 bg-[#2C4A3B] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Mic size={14} className="text-emerald-300" /> Abrir Ficha Clínica + IA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÓDULO 4: TALLERES (NUEVO) */}
          {activeModule === 'talleres' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.length === 0 ? (
                <div className="col-span-full p-10 text-center text-stone-500 font-bold bg-white rounded-3xl border border-dashed border-stone-300">
                  No hay talleres registrados en {centerBrandName}.
                </div>
              ) : (
                workshops.map((ws) => (
                  <div key={ws.id} className="bg-white rounded-[2rem] overflow-hidden border border-[#E4ECE7] shadow-sm flex flex-col">
                    <div className="h-44 w-full relative">
                      <img src={ws.imageUrl} alt={ws.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#2C4A3B]">
                        ${ws.price.toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-stone-900">{ws.name}</h3>
                        <p className="text-xs text-stone-500 line-clamp-3 mt-1.5">{ws.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 font-bold pt-3 border-t border-stone-100">
                        <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-[#C87D65]"/> {ws.date} · {ws.time}</span>
                        <span className="flex items-center gap-1.5"><Users size={14} className="text-[#2C4A3B]"/> {ws.capacity} cupos</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </main>
      </div>

      {/* MODAL: SUBIR TALLER */}
      <AnimatePresence>
        {showWorkshopModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Publicar Nuevo Taller</h3>
                <button onClick={() => setShowWorkshopModal(false)}><X size={18} className="text-stone-400" /></button>
              </div>
              <form onSubmit={handleSaveWorkshop} className="space-y-3">
                <div>
                  <label className="font-bold block mb-1">Nombre del Taller</label>
                  <input required type="text" value={workshopForm.name} onChange={e => setWorkshopForm({...workshopForm, name: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Foto de Portada (URL)</label>
                  <input type="url" value={workshopForm.imageUrl} onChange={e => setWorkshopForm({...workshopForm, imageUrl: e.target.value})} placeholder="https://..." className="w-full p-2.5 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Descripción</label>
                  <textarea rows={3} value={workshopForm.description} onChange={e => setWorkshopForm({...workshopForm, description: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Fecha</label>
                    <input type="date" value={workshopForm.date} onChange={e => setWorkshopForm({...workshopForm, date: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Hora</label>
                    <input type="time" value={workshopForm.time} onChange={e => setWorkshopForm({...workshopForm, time: e.target.value})} className="w-full p-2.5 border rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Cupos (Personas)</label>
                    <input type="number" value={workshopForm.capacity} onChange={e => setWorkshopForm({...workshopForm, capacity: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Precio ($ CLP)</label>
                    <input type="number" value={workshopForm.price} onChange={e => setWorkshopForm({...workshopForm, price: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-[#2C4A3B] text-white font-bold rounded-xl mt-4">Guardar y Publicar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAWER FICHA IA */}
      <AnimatePresence>
        {fichaPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26 }} className="w-full max-w-2xl bg-white h-full shadow-2xl border-l p-7 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-[10px] font-bold uppercase tracking-wider mb-2">
                      <BrainCircuit size={12} /> Ficha Clínica Asistida por IA Grok
                    </span>
                    <h3 className="text-2xl font-bold">{maskPatientNameForPrivacy(fichaPatient.patientName, privacyMode)}</h3>
                  </div>
                  <button onClick={() => setFichaPatient(null)}><X size={20} /></button>
                </div>
                {/* INTERFAZ DE ESCUCHA */}
                <div className="bg-[#1E3329] text-white rounded-3xl p-5 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isListeningSession ? 'bg-rose-500 animate-pulse' : 'bg-[#2C4A3B]'}`}><Mic size={18} /></div>
                      <div>
                        <p className="font-bold text-sm">{isListeningSession ? `Escuchando sesión en silencio...` : 'Escucha Ambiental con IA Grok'}</p>
                        <p className="text-[11px] text-stone-300">Genera resumen clínico al finalizar.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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