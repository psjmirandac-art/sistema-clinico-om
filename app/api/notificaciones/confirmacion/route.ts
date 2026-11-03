import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientName = 'Paciente',
      patientEmail = '',
      date = '',
      isoDate = '',
      time = '',
      serviceName = 'Sesión de Psicoterapia',
      modality = 'Online (Videollamada)',
      locationAddress = 'Enlace enviado previo a la sesión',
      professionalName = 'Especialista Kairós',
      centerName = 'Kairós Clínico',
      overrideAdminEmail = '',
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY || '';
    const customFromEmail = process.env.RESEND_FROM_EMAIL || '';

    const safeName = escapeHtml(patientName);
    const safeProf = escapeHtml(professionalName);
    const safeCenter = escapeHtml(centerName);
    const safeDate = escapeHtml(date || isoDate);
    const safeTime = escapeHtml(time);
    const safeService = escapeHtml(serviceName);
    const safeModality = escapeHtml(modality);
    const safeLocation = escapeHtml(locationAddress);

    const calDate = (isoDate || '20261103').replace(/-/g, '');
    const startHour = (time || '11:00').replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`; const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${serviceName} - ${professionalName}`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent( `Atención en ${centerName} con ${professionalName}. Modalidad: ${modality}. Ubicación/Acceso: ${locationAddress}` )}&location=${encodeURIComponent(locationAddress)}`;

    const diagnostics = {
      emailSent: false,
      emailError: null as string | null,
    };

    const targetEmail = (patientEmail || overrideAdminEmail || '').trim();

    if (targetEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const htmlContent = `
          <div style="background-color: #F9F8F6; padding: 40px 20px; font-family: 'Inter', -apple-system, sans-serif; color: #1C1917;">
            <div style="max-width: 540px; margin: 0 auto; background-color: #FFFFFF; border-radius: 28px; padding: 38px; border: 1px solid #E4ECE7; box-shadow: 0 12px 32px rgba(44, 74, 59, 0.06);">
              <div style="display: inline-block; padding: 6px 14px; background-color: #EBF3EE; color: #2C4A3B; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px;">
                Confirmación Oficial · ${safeCenter}
              </div>
              <h1 style="font-size: 23px; font-weight: 700; color: #1C1917; margin: 0 0 10px 0;">
                Hola, ${safeName}
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                Tu sesión clínica ha sido agendada y confirmada. Aquí tienes todos los detalles de tu atención:
              </p>
              <div style="background-color: #F9F8F6; border-radius: 20px; padding: 22px; border: 1px solid #E4ECE7; margin-bottom: 24px;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Servicio:</strong> ${safeService}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Especialista:</strong> ${safeProf}</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #2C4A3B;"><strong>Fecha y Hora:</strong> ${safeDate} a las${safeTime} hrs</p>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #57534E;"><strong>Modalidad:</strong> ${safeModality}</p>
                <p style="margin: 0; font-size: 13px; color: #1C1917;"><strong>Dirección / Acceso:</strong> ${safeLocation}</p>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${gCalUrl}" target="_blank" style="display: inline-block; background-color: #2C4A3B; color: #FFFFFF; text-decoration: none; padding: 13px 26px; border-radius: 14px; font-size: 13px; font-weight: 600;">
                  Agregar a Google Calendar
                </a>
              </div>
              <p style="font-size: 12px; color: #A8A29E; text-align: center; margin: 0; border-top: 1px solid #F5F5F4; padding-top: 18px;">
                Si necesitas reagendar, por favor avísanos con al menos 24 horas de anticipación.
              </p>
            </div>
          </div>
        `;

        const fromAddress = customFromEmail || 'Kairós Clínico <onboarding@resend.dev>';
        let emailResponse = await resend.emails.send({
          from: fromAddress,
          to: targetEmail,
          subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
          html: htmlContent,
        });

        if (emailResponse.error && customFromEmail) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: targetEmail,
            subject: `Cita Confirmada · ${safeDate} (${safeTime} hrs)`,
            html: htmlContent,
          });
        }

        if (emailResponse.error && overrideAdminEmail && overrideAdminEmail !== targetEmail) {
          emailResponse = await resend.emails.send({
            from: 'Kairós Clínico <onboarding@resend.dev>',
            to: overrideAdminEmail.trim(),
            subject: `[Copia Admin] Cita Confirmada de ${safeName} · ${safeDate}`, html: htmlContent, }); }  if (emailResponse.error) { diagnostics.emailError = emailResponse.error.message; } else { diagnostics.emailSent = true; } } catch (err: any) { diagnostics.emailError = err.message \vert{}\vert{} 'Error al enviar correo con Resend'; } } else if (!resendApiKey) { diagnostics.emailError = 'Falta RESEND_API_KEY en variables de entorno'; }  return NextResponse.json({ success: diagnostics.emailSent, diagnostics, }); } catch (error: any) { return NextResponse.json( { success: false, error: error.message \vert{}\vert{} 'Error interno del servidor' }, { status: 500 } ); } } ```  ---  ### Paso 2: Reemplazar `app/admin/page.tsx` Copia y pega este código completo. Incluye la barra lateral completa, el calendario multi-semana dinámico, Drag & Drop, bloqueo de horas, clic derecho para pagos/estados/WhatsApp directo, y CRUD completo de pacientes y profesionales:  ```tsx 'use client';  import React, { Suspense, useState, useEffect, useMemo } from 'react'; import { createClient } from '@supabase/supabase-js'; import { motion, AnimatePresence } from 'framer-motion'; import { LayoutDashboard, Calendar as CalendarIcon, Users, Stethoscope, FileText, MessageSquare, Wallet, MapPin, Video, CheckCircle2, CreditCard, Ban, Plus, Send, Trash2, Check, X, Building2, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, ShieldCheck, ExternalLink, UserPlus, Filter, Edit3, Mail, BellRing, CalendarDays, GripVertical, } from 'lucide-react';  import DocumentosTabRaw from '@/components/admin/DocumentosTab'; import ComunicacionesTabRaw from '@/components/admin/ComunicacionesTab';  const DocumentosTab = DocumentosTabRaw as React.ComponentType<any>; const ComunicacionesTab = ComunicacionesTabRaw as React.ComponentType<any>;  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL \vert{}\vert{} ''; const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY \vert{}\vert{} ''; const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID \vert{}\vert{} 'kairos-main';  const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;  type AdminModule = \vert{} 'dashboard' \vert{} 'agenda' \vert{} 'pacientes' \vert{} 'profesionales' \vert{} 'documentos' \vert{} 'comunicaciones' \vert{} 'finanzas';  type ModalityType = 'Online' \vert{} 'Presencial'; type PaymentStatus = 'Pagado' \vert{} 'Pendiente'; type ClinicalStatus = 'Confirmada' \vert{} 'En Espera' \vert{} 'En Consulta' \vert{} 'Atendida' \vert{} 'No Asistió';  export interface ProfessionalConfig { id: string; name: string; specialty: string; rut: string; email: string; avatar: string; workingDays: number[]; // 1 = Lun ... 6 = Sáb startHour: string; endHour: string; modalityMode: 'Ambas (Híbrido)' \vert{} 'Solo Online' \vert{} 'Solo Presencial'; presencialAddress: string; onlineRoomUrl: string; basePrice: number; }  export interface AppointmentItem { id: string; patientName: string; patientRUT: string; patientEmail: string; patientPhone: string; professionalId: string; serviceName: string; modality: ModalityType; isoDate: string; // YYYY-MM-DD time: string; price: number; paymentStatus: PaymentStatus; clinicalStatus: ClinicalStatus; notes?: string; }  export interface BlockedSlot { id: string; professionalId: string; isoDate: string; // YYYY-MM-DD time: string; reason: string; }  const CLINICAL_SERVICES = [ { name: 'Psicoterapia Individual', price: 45000, duration: '50 min' }, { name: 'Terapia de Pareja / Familiar', price: 60000, duration: '60 min' }, { name: 'Evaluación Psicodiagnóstica', price: 55000, duration: '60 min' }, { name: 'Consulta Psiquiátrica', price: 75000, duration: '45 min' }, { name: 'Psicoterapia Infanto-Juvenil', price: 48000, duration: '50 min' }, ];  const ALL_HOURS = [ '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', ];  const DETERMINISTIC_BASE_MONDAY = '2026-11-02T12:00:00';  function getMondayFromAnchor(anchorIso: string, offsetWeeks: number = 0): Date { const base = new Date(anchorIso); const day = base.getDay(); const diffToMonday = day === 0 ? -6 : 1 - day; const monday = new Date(base); monday.setHours(12, 0, 0, 0); monday.setDate(base.getDate() + diffToMonday + offsetWeeks * 7); return monday; }  function formatIsoDate(d: Date): string { const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`;
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
          <div className="h-10 w-44 bg-white/10 rounded-2xl animate-pulse" />
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-11 w-full bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-24 w-full bg-white/5 rounded-2xl animate-pulse" />
      </div>
      <div className="flex-1 p-8 space-y-6">
        <div className="h-16 w-full bg-white/80 rounded-3xl border border-[#E4ECE7] animate-pulse" />
        <div className="h-[540px] w-full bg-white/90 rounded-[2rem] border border-[#E4ECE7] animate-pulse" />
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
        dateNum: `${dayNum}${monthShort}`,
        iso,
      };
    });
  }, [anchorIso, weekOffset]);

  const weekRangeLabel = useMemo(() => {
    if (dynamicWeekDays.length === 0) return '';
    const first = dynamicWeekDays[0];
    const last = dynamicWeekDays[dynamicWeekDays.length - 1];
    const year = first.iso.split('-')[0];
    return `${first.dateNum} –${last.dateNum} ${year}`; }, [dynamicWeekDays]);  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(INITIAL_PROFESSIONALS); const [selectedProfId, setSelectedProfId] = useState<string>(INITIAL_PROFESSIONALS[0].id); const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS); const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(INITIAL_BLOCKED_SLOTS);  const [adminEmailCopy, setAdminEmailCopy] = useState(''); const [showEmailModal, setShowEmailModal] = useState(false);  // Drag & Drop const [draggedAptId, setDraggedAptId] = useState<string \vert{} null>(null); const [dragOverCell, setDragOverCell] = useState<string \vert{} null>(null);  // Menú Contextual (Clic Derecho) const [contextMenu, setContextMenu] = useState<{ x: number; y: number; apt: AppointmentItem; } \vert{} null>(null);  // Modal de Celda Vacía const [slotModal, setSlotModal] = useState<{ dayIndex: number; isoDate: string; dayLabel: string; time: string; } \vert{} null>(null); const [slotActionMode, setSlotActionMode] = useState<'book' \vert{} 'block'>('book'); const [blockReasonInput, setBlockReasonInput] = useState('Bloqueo Personal / Almuerzo');  // Modal de Edición de Paciente (CRUD) const [editingApt, setEditingApt] = useState<AppointmentItem \vert{} null>(null);  // Modal de Creación / Edición de Profesional (CRUD) const [showProfModal, setShowProfModal] = useState(false); const [editingProfId, setEditingProfId] = useState<string \vert{} null>(null); const [profForm, setProfForm] = useState({ name: '', specialty: 'Psicoterapia Clínica', rut: '', email: '', startHour: '09:00', endHour: '18:00', modalityMode: 'Ambas (Híbrido)' as ProfessionalConfig['modalityMode'], presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia', onlineRoomUrl: 'https://meet.google.com/kairos-sala', basePrice: 45000, });  const [newBookingForm, setNewBookingForm] = useState({ patientName: '', patientRUT: '', patientEmail: '', patientPhone: '56961699991', serviceName: CLINICAL_SERVICES[0].name, modality: 'Online' as ModalityType, paymentStatus: 'Pendiente' as PaymentStatus, notes: '', });  const [toastMessage, setToastMessage] = useState<{ title: string; detail?: string; type: 'success' \vert{} 'warn'; } \vert{} null>(null);  const showToast = (title: string, detail?: string, type: 'success' \vert{} 'warn' = 'success') => { setToastMessage({ title, detail, type }); setTimeout(() => setToastMessage(null), 5000); };  // Sincronización con el portal público (/centro/[slug]) vía localStorage compartido useEffect(() => { const savedProfs = localStorage.getItem('kairos_profs_prod'); const savedApts = localStorage.getItem('kairos_apts_prod'); const savedBlocks = localStorage.getItem('kairos_blocks_prod'); const savedAdminEmail = localStorage.getItem('kairos_admin_email_prod'); if (savedProfs) setProfessionals(JSON.parse(savedProfs)); if (savedApts) setAppointments(JSON.parse(savedApts)); if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks)); if (savedAdminEmail) setAdminEmailCopy(savedAdminEmail);  const onStorageChange = (e: StorageEvent) => { if (e.key === 'kairos_apts_prod' && e.newValue) { setAppointments(JSON.parse(e.newValue)); } }; window.addEventListener('storage', onStorageChange); return () => window.removeEventListener('storage', onStorageChange); }, []);  useEffect(() => { localStorage.setItem('kairos_profs_prod', JSON.stringify(professionals)); }, [professionals]);  useEffect(() => { localStorage.setItem('kairos_apts_prod', JSON.stringify(appointments)); }, [appointments]);  useEffect(() => { localStorage.setItem('kairos_blocks_prod', JSON.stringify(blockedSlots)); }, [blockedSlots]);  useEffect(() => { localStorage.setItem('kairos_admin_email_prod', adminEmailCopy); }, [adminEmailCopy]);  useEffect(() => { const handleGlobalClick = () => setContextMenu(null); window.addEventListener('click', handleGlobalClick); return () => window.removeEventListener('click', handleGlobalClick); }, []);  const currentProf = useMemo( () => professionals.find((p) => p.id === selectedProfId) \vert{}\vert{} professionals[0], [professionals, selectedProfId] );  const visibleHours = useMemo(() => { if (!currentProf) return ALL_HOURS; return ALL_HOURS.filter((h) => h >= currentProf.startHour && h <= currentProf.endHour); }, [currentProf]);  const filteredAppointments = useMemo(() => { return appointments.filter((a) => { const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) \vert{}\vert{} a.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) \vert{}\vert{} a.patientEmail.toLowerCase().includes(searchQuery.toLowerCase()) \vert{}\vert{} a.patientRUT.toLowerCase().includes(searchQuery.toLowerCase()); const matchesModality = patientModalityFilter === 'Todas' \vert{}\vert{} a.modality === patientModalityFilter; return matchesSearch && matchesModality; }); }, [appointments, searchQuery, patientModalityFilter]);  const metrics = useMemo(() => { const totalPagado = appointments .filter((a) => a.paymentStatus === 'Pagado') .reduce((acc, cur) => acc + cur.price, 0); const totalPendiente = appointments .filter((a) => a.paymentStatus === 'Pendiente') .reduce((acc, cur) => acc + cur.price, 0); const onlineCount = appointments.filter((a) => a.modality === 'Online').length; const presencialCount = appointments.filter((a) => a.modality === 'Presencial').length; return { totalPagado, totalPendiente, onlineCount, presencialCount }; }, [appointments]);  const handleJumpToDate = (isoString: string) => { if (!isoString) return; const [y, m, d] = isoString.split('-').map(Number); const target = new Date(y, m - 1, d, 12, 0, 0); const currentMon = getMondayFromAnchor(anchorIso, 0); const targetDay = target.getDay(); const diffTargetMon = targetDay === 0 ? -6 : 1 - targetDay; const targetMon = new Date(target); targetMon.setDate(target.getDate() + diffTargetMon);  const diffTime = targetMon.getTime() - currentMon.getTime(); const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7)); setWeekOffset(diffWeeks); };  // Envío de Correo Automático vía Resend const triggerEmailNotification = async (apt: AppointmentItem, isReminder: boolean = false) => { const prof = professionals.find((p) => p.id === apt.professionalId) \vert{}\vert{} currentProf; const locationAddress = apt.modality === 'Presencial' ? prof.presencialAddress : prof.onlineRoomUrl;  showToast( isReminder ? 'Despachando recordatorio por correo...' : 'Enviando confirmación por correo...', `Destinatario: ${apt.patientEmail}`
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
          'Correo de confirmación entregado con éxito',
          `Incluye dirección/acceso: ${locationAddress}`,
          'success'
        );
      } else {
        showToast(
          'Aviso de Resend (Modo Sandbox)',
          data.diagnostics?.emailError ||
            'Configura tu correo personal de Resend en el botón superior "Configurar Correo" para recibir todas las copias.',
          'warn'
        );
      }
    } catch (error) {
      showToast('Error de conexión con el servidor de correo', undefined, 'warn');
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

  // WhatsApp Web Directo en 1 clic (Sin depender de tokens de Meta)
  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) || currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección Presencial: ${prof.presencialAddress}`
        : `💻 Link Videollamada: ${prof.onlineRoomUrl}`; const msg = `Hola ${apt.patientName}, te escribimos de *Kairós Clínico* para confirmar y recordar tu sesión de *${apt.serviceName}* (${apt.modality}) con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}\n\n¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank'); };  // Drag & Drop en Calendario const handleDragStart = (e: React.DragEvent, aptId: string) => { setDraggedAptId(aptId); e.dataTransfer.setData('text/plain', aptId); };  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => { setDragOverCell(null); if (!draggedAptId) return;  if (!currentProf.workingDays.includes(dayIndex)) { showToast('Día inactivo', `${currentProf.name} no atiende ese día de la semana.`, 'warn');
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
        `${movedApt.patientName} movido al ${isoDate} a las${time} hrs.`
      );
      triggerEmailNotification(updated, true);
    }
  };

  // CRUD Pacientes
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
      const newBlock: BlockedSlot = {
        id: `blk-${Date.now()}`, professionalId: selectedProfId, isoDate: slotModal.isoDate, time: slotModal.time, reason: blockReasonInput.trim() \vert{}\vert{} 'Bloqueo de Agenda', }; setBlockedSlots((prev) => [...prev, newBlock]); showToast('Horario bloqueado', `${slotModal.dayLabel} · ${slotModal.time} hrs`); setSlotModal(null); return; }  const svcObj = CLINICAL_SERVICES.find((s) => s.name === newBookingForm.serviceName) \vert{}\vert{} CLINICAL_SERVICES[0];  const createdApt: AppointmentItem = { id: `apt-${Date.now()}`,
      patientName: newBookingForm.patientName.trim(),
      patientRUT: newBookingForm.patientRUT.trim() || 'Sin RUT',
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

  // CRUD Profesionales
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
    const initials = profForm.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');

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
                avatar: initials || p.avatar,
                startHour: profForm.startHour,
                endHour: profForm.endHour,
                modalityMode: profForm.modalityMode,
                presencialAddress: profForm.presencialAddress.trim(),
                onlineRoomUrl: profForm.onlineRoomUrl.trim(),
                basePrice: Number(profForm.basePrice) || 45000,
              }
            : p
        )
      );
      showToast('Profesional modificado con éxito', profForm.name);
    } else {
      const createdProf: ProfessionalConfig = {
        id: `prof-${Date.now()}`, name: profForm.name.trim(), specialty: profForm.specialty.trim(), rut: profForm.rut.trim(), email: profForm.email.trim(), avatar: initials \vert{}\vert{} 'PR', workingDays: [1, 2, 3, 4, 5], startHour: profForm.startHour, endHour: profForm.endHour, modalityMode: profForm.modalityMode, presencialAddress: profForm.presencialAddress.trim(), onlineRoomUrl: profForm.onlineRoomUrl.trim(), basePrice: Number(profForm.basePrice) \vert{}\vert{} 45000, }; setProfessionals((prev) => [...prev, createdProf]); setSelectedProfId(createdProf.id); showToast('Nuevo profesional agregado', createdProf.name); } setShowProfModal(false); };  const handleDeleteProfessional = (profId: string) => { if (professionals.length <= 1) { showToast( 'Acción bloqueada', 'El centro debe mantener al menos 1 profesional activo.', 'warn' ); return; } const target = professionals.find((p) => p.id === profId); const remaining = professionals.filter((p) => p.id !== profId); setProfessionals(remaining); if (selectedProfId === profId) { setSelectedProfId(remaining[0].id); } setAppointments((prev) => prev.map((a) => (a.professionalId === profId ? { ...a, professionalId: remaining[0].id } : a)) ); showToast( 'Profesional eliminado del centro', target ? `${target.name} fue removido y sus citas reasignadas.` : undefined
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
    { id: 'dashboard', label: 'Resumen Clínico', icon: LayoutDashboard },
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
            className={`fixed top-5 right-5 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl