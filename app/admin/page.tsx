'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Users,
  Stethoscope,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  CreditCard,
  Ban,
  Plus,
  Send,
  Trash2,
  Sparkles,
  Check,
  X,
  Phone,
  Mail,
  Building2,
  GripVertical,
  AlertCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID || 'kairos-main';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type ModalityType = 'Online' | 'Presencial';
type PaymentStatus = 'Pagado' | 'Pendiente';
type ClinicalStatus = 'Confirmada' | 'En Consulta' | 'Atendida' | 'No Asistió';

interface ProfessionalConfig {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  workingDays: number[]; // 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
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
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

const INITIAL_PROFESSIONALS: ProfessionalConfig[] = [
  {
    id: 'prof-1',
    name: 'Dr. Alejandro Kairós',
    specialty: 'Psicoterapia Clínica & Ansiedad',
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
    avatar: 'VM',
    workingDays: [1, 3, 4, 5, 6],
    startHour: '10:00',
    endHour: '19:00',
    modalityMode: 'Ambas (Híbrido)',
    presencialAddress: 'Av. Alonso de Córdova 5870, Of. 702, Las Condes',
    onlineRoomUrl: 'https://meet.google.com/kairos-valentina',
    basePrice: 40000,
  },
];

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-101',
    patientName: 'Camila Vergara',
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
  },
  {
    id: 'apt-102',
    patientName: 'Matías Errázuriz',
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
  },
  {
    id: 'apt-103',
    patientName: 'Sofía Domínguez',
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
    clinicalStatus: 'Confirmada',
  },
];

export default function KairosAdminCommandCenter() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'pacientes' | 'profesionales'>('agenda');
  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(INITIAL_PROFESSIONALS);
  const [selectedProfId, setSelectedProfId] = useState<string>(INITIAL_PROFESSIONALS[0].id);
  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([
    {
      id: 'blk-1',
      professionalId: 'prof-1',
      dayIndex: 3,
      time: '13:00',
      reason: 'Reunión Clínica Equipo',
    },
  ]);

  // Estado Drag & Drop
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Estado Menú Contextual (Clic Derecho)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    apt: AppointmentItem;
  } | null>(null);

  // Estado Modal de Celda Vacía (Agendar o Bloquear Horario)
  const [slotModal, setSlotModal] = useState<{
    dayIndex: number;
    isoDate: string;
    dayLabel: string;
    time: string;
  } | null>(null);

  const [slotActionMode, setSlotActionMode] = useState<'book' | 'block'>('book');
  const [blockReasonInput, setBlockReasonInput] = useState('Bloqueo Personal / Almuerzo');

  const [newBookingForm, setNewBookingForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '56961699991',
    serviceName: CLINICAL_SERVICES[0].name,
    modality: 'Online' as ModalityType,
    paymentStatus: 'Pendiente' as PaymentStatus,
  });

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    detail?: string;
    type: 'success' | 'warn';
  } | null>(null);

  const showToast = (title: string, detail?: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ title, detail, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Persistencia local + carga inicial
  useEffect(() => {
    const savedProfs = localStorage.getItem('kairos_profs_v2');
    const savedApts = localStorage.getItem('kairos_apts_v2');
    const savedBlocks = localStorage.getItem('kairos_blocks_v2');
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedApts) setAppointments(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
  }, []);

  useEffect(() => {
    localStorage.setItem('kairos_profs_v2', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kairos_apts_v2', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('kairos_blocks_v2', JSON.stringify(blockedSlots));
  }, [blockedSlots]);

  // Cerrar menú contextual al hacer clic en cualquier parte
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const currentProf = useMemo(
    () => professionals.find((p) => p.id === selectedProfId) || professionals[0],
    [professionals, selectedProfId]
  );

  // Horas filtradas según la jornada configurada del profesional
  const visibleHours = useMemo(() => {
    return ALL_HOURS.filter(
      (h) => h >= currentProf.startHour && h <= currentProf.endHour
    );
  }, [currentProf]);

  // Función para disparar notificaciones reales (Email + WhatsApp) y mostrar diagnóstico
  const triggerNotificationForApt = async (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) || currentProf;
    const locationAddress =
      apt.modality === 'Presencial'
        ? prof.presencialAddress
        : prof.onlineRoomUrl;

    showToast('Enviando notificación omnicanal...', `Destino: ${apt.patientEmail} y +${apt.patientPhone}`);

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
          modality: apt.modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Videollamada)',
          locationAddress,
          professionalName: prof.name,
          centerName: 'Kairós Clínico',
        }),
      });

      const data = await res.json();
      if (data.diagnostics) {
        const { emailSent, emailError, whatsappSent, whatsappError } = data.diagnostics;
        if (emailSent && whatsappSent) {
          showToast('WhatsApp y Correo entregados con éxito', `Dirección incluida: ${locationAddress}`, 'success');
        } else if (emailSent && !whatsappSent) {
          showToast(
            'Correo enviado · WhatsApp requiere atención',
            `Meta API: ${whatsappError}. Puedes usar "Abrir WhatsApp Directo" con clic derecho.`,
            'warn'
          );
        } else if (!emailSent && whatsappSent) {
          showToast('WhatsApp enviado · Correo rechazado', `Resend: ${emailError}`, 'warn');
        } else {
          showToast(
            'Alerta en credenciales de envío',
            `Email: ${emailError || 'Error'} | WA: ${whatsappError || 'Token expirado'}`,
            'warn'
          );
        }
      }
    } catch (err) {
      showToast('Error de red al notificar', 'Verifica tu conexión o variables en Vercel', 'warn');
    }
  };

  // Abrir WhatsApp Web directo con el mensaje clínico pre-armado (Plan B instantáneo)
  const openDirectWhatsApp = (apt: AppointmentItem) => {
    const prof = professionals.find((p) => p.id === apt.professionalId) || currentProf;
    const cleanPhone = apt.patientPhone.replace(/\D/g, '');
    const ubicacion =
      apt.modality === 'Presencial'
        ? `📍 Dirección: ${prof.presencialAddress}`
        : `💻 Link Videollamada: ${prof.onlineRoomUrl}`;
    const msg = `Hola ${apt.patientName}, te escribimos de *Kairós Clínico* para confirmar tu sesión de *${apt.serviceName}* (${apt.modality}) con *${prof.name}* el día *${apt.isoDate}* a las *${apt.time} hrs*.\n\n${ubicacion}\n\n¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Manejadores Drag & Drop en la Agenda
  const handleDragStart = (e: React.DragEvent, aptId: string) => {
    setDraggedAptId(aptId);
    e.dataTransfer.setData('text/plain', aptId);
  };

  const handleDropOnSlot = async (dayIndex: number, isoDate: string, time: string) => {
    setDragOverCell(null);
    if (!draggedAptId) return;

    // Verificar si el día está habilitado para este profesional
    if (!currentProf.workingDays.includes(dayIndex)) {
      showToast('Día no habilitado', `${currentProf.name} no atiende ese día.`, 'warn');
      setDraggedAptId(null);
      return;
    }

    // Verificar si el bloque está bloqueado o ya ocupado
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
      showToast('Horario no disponible', 'El bloque de destino está ocupado o bloqueado.', 'warn');
      setDraggedAptId(null);
      return;
    }

    const movedApt = appointments.find((a) => a.id === draggedAptId);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === draggedAptId ? { ...a, dayIndex, isoDate, time } : a
      )
    );
    setDraggedAptId(null);

    if (movedApt) {
      showToast(
        'Paciente reagendado con éxito',
        `${movedApt.patientName} movido al ${isoDate} a las ${time} hrs.`
      );
      if (supabase) {
        await supabase
          .from('appointments')
          .update({ date: isoDate, time })
          .eq('id', movedApt.id);
      }
    }
  };

  // Acciones del Menú Contextual (Clic Derecho)
  const togglePaymentStatus = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== aptId) return a;
        const nextStatus: PaymentStatus = a.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado';
        showToast(
          `Estado de pago actualizado: ${nextStatus}`,
          `Paciente: ${a.patientName}`
        );
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
    setAppointments((prev) => prev.filter((a) => a.id !== aptId));
    showToast('Cita liberada de la agenda');
  };

  // Crear nueva cita o bloqueo desde celda vacía
  const handleCreateSlotAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    if (slotActionMode === 'block') {
      const newBlock: BlockedSlot = {
        id: `blk-${Date.now()}`,
        professionalId: selectedProfId,
        dayIndex: slotModal.dayIndex,
        time: slotModal.time,
        reason: blockReasonInput.trim() || 'Horario Bloqueado',
      };
      setBlockedSlots((prev) => [...prev, newBlock]);
      showToast('Horario bloqueado', `${slotModal.dayLabel} a las ${slotModal.time} hrs`);
      setSlotModal(null);
      return;
    }

    const selectedServiceObj =
      CLINICAL_SERVICES.find((s) => s.name === newBookingForm.serviceName) || CLINICAL_SERVICES[0];

    const createdApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientName: newBookingForm.patientName.trim(),
      patientEmail: newBookingForm.patientEmail.trim(),
      patientPhone: newBookingForm.patientPhone.replace(/\D/g, ''),
      professionalId: selectedProfId,
      serviceName: newBookingForm.serviceName,
      modality: newBookingForm.modality,
      dayIndex: slotModal.dayIndex,
      isoDate: slotModal.isoDate,
      time: slotModal.time,
      price: selectedServiceObj.price,
      paymentStatus: newBookingForm.paymentStatus,
      clinicalStatus: 'Confirmada',
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
      patientEmail: '',
      patientPhone: '56961699991',
      serviceName: CLINICAL_SERVICES[0].name,
      modality: 'Online',
      paymentStatus: 'Pendiente',
    });
  };

  // Alternar día laboral de un profesional
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

  // Métricas financieras rápidas
  const totalPagado = useMemo(
    () =>
      appointments
        .filter((a) => a.paymentStatus === 'Pagado')
        .reduce((acc, cur) => acc + cur.price, 0),
    [appointments]
  );

  const totalPendiente = useMemo(
    () =>
      appointments
        .filter((a) => a.paymentStatus === 'Pendiente')
        .reduce((acc, cur) => acc + cur.price, 0),
    [appointments]
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans selection:bg-[#2C4A3B]/15 selection:text-[#2C4A3B]">
      {/* Notificación Flotante (Toast) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 max-w-md px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl flex items-start gap-3 ${
              toastMessage.type === 'warn'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
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

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#E4ECE7] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              K
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#C87D65] font-bold block">
                Kairós Clínico · Suite Ejecutiva
              </span>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                Centro de Control Clínico & Agenda Interactiva
              </h1>
            </div>
          </div>

          {/* Navegación de Módulos */}
          <nav className="flex items-center gap-1.5 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'agenda'
                  ? 'bg-[#2C4A3B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarIcon size={15} />
              <span>Agenda Interactiva</span>
            </button>
            <button
              onClick={() => setActiveTab('pacientes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'pacientes'
                  ? 'bg-[#2C4A3B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users size={15} />
              <span>Pacientes & Servicios</span>
            </button>
            <button
              onClick={() => setActiveTab('profesionales')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profesionales'
                  ? 'bg-[#2C4A3B] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Stethoscope size={15} />
              <span>Profesionales & Horarios</span>
            </button>
          </nav>

          {/* Resumen de Caja en Vivo */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-xs">
              <span className="text-emerald-700 font-medium block text-[10px] uppercase">
                Recaudado
              </span>
              <span className="font-bold text-emerald-900 text-sm">
                ${totalPagado.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
              <span className="text-amber-700 font-medium block text-[10px] uppercase">
                Por Cobrar
              </span>
              <span className="font-bold text-amber-900 text-sm">
                ${totalPendiente.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* =========================================================
            MÓDULO 1: AGENDA INTERACTIVA (DRAG & DROP + CLIC DERECHO)
           ========================================================= */}
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            {/* Barra superior de filtro de profesional e instrucciones */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-[#E4ECE7] shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Agenda de:
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
                      <p className="text-[10px] opacity-75 mt-0.5">{prof.modalityMode}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 bg-[#F9F8F6] px-4 py-2.5 rounded-2xl border border-[#E4ECE7]">
                <span className="flex items-center gap-1.5">
                  <GripVertical size={14} className="text-[#2C4A3B]" />
                  <strong>Arrastra</strong> para mover pacientes
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-[#C87D65]" />
                  <strong>Clic derecho</strong> para marcar pagado / WhatsApp
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Ban size={14} className="text-stone-500" />
                  <strong>Clic en celda vacía</strong> para agendar o bloquear
                </span>
              </div>
            </div>

            {/* Información de sede presencial y sala online del profesional activo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-2xl px-5 py-3.5 border border-[#E4ECE7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <MapPin size={16} className="text-[#C87D65] shrink-0" />
                  <span>
                    <strong>Consulta Presencial:</strong> {currentProf.presencialAddress}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('profesionales')}
                  className="text-[#2C4A3B] font-semibold hover:underline ml-2 shrink-0"
                >
                  Editar
                </button>
              </div>
              <div className="bg-white/80 rounded-2xl px-5 py-3.5 border border-[#E4ECE7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <Video size={16} className="text-[#2C4A3B] shrink-0" />
                  <span>
                    <strong>Sala Online:</strong> {currentProf.onlineRoomUrl}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('profesionales')}
                  className="text-[#2C4A3B] font-semibold hover:underline ml-2 shrink-0"
                >
                  Configurar horario
                </button>
              </div>
            </div>

            {/* Grilla Semanal Interactiva */}
            <div className="bg-white rounded-[2rem] border border-[#E4ECE7] shadow-[0_12px_40px_rgb(44,74,59,0.04)] overflow-x-auto">
              <div className="min-w-[980px]">
                {/* Cabecera de Días */}
                <div className="grid grid-cols-7 border-b border-[#E4ECE7] bg-[#F9F8F6]/70">
                  <div className="p-4 text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center justify-center border-r border-[#E4ECE7]">
                    Hora
                  </div>
                  {WEEK_DAYS.map((day) => {
                    const isWorkingDay = currentProf.workingDays.includes(day.index);
                    return (
                      <div
                        key={day.index}
                        className={`p-4 text-center border-r last:border-r-0 border-[#E4ECE7] ${
                          !isWorkingDay ? 'bg-stone-100/70 opacity-60' : ''
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
                          {day.label}
                        </span>
                        <span className="text-xl font-bold text-stone-900 mt-0.5 inline-block">
                          {day.dateNum} Nov
                        </span>
                        {!isWorkingDay && (
                          <span className="block text-[10px] font-semibold text-stone-400 mt-0.5">
                            Sin atención
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Filas de Horas */}
                {visibleHours.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-7 border-b last:border-b-0 border-[#E4ECE7] min-h-[108px]"
                  >
                    {/* Columna de Hora */}
                    <div className="p-3 border-r border-[#E4ECE7] bg-[#F9F8F6]/40 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-stone-600">{hour}</span>
                      <span className="text-[10px] text-stone-400">hrs</span>
                    </div>

                    {/* Celdas por Día */}
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
                          {/* Indicador sutil en celda vacía */}
                          {!apt && !blocked && isWorkingDay && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity h-full w-full flex flex-col items-center justify-center text-[11px] font-semibold text-[#2C4A3B]/70 gap-1">
                              <Plus size={16} />
                              <span>Agendar / Bloquear</span>
                            </div>
                          )}

                          {/* Estado: Horario Bloqueado */}
                          {blocked && (
                            <div className="h-full w-full rounded-2xl bg-stone-100 border border-dashed border-stone-300 p-2.5 flex flex-col justify-between text-xs text-stone-500">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] flex items-center gap-1 text-stone-600">
                                  <Ban size={12} /> Bloqueado
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBlockedSlots((prev) =>
                                      prev.filter((b) => b.id !== blocked.id)
                                    );
                                    showToast('Bloque horario liberado');
                                  }}
                                  className="text-[10px] font-bold text-rose-600 hover:underline"
                                >
                                  Desbloquear
                                </button>
                              </div>
                              <p className="text-[11px] truncate font-medium">{blocked.reason}</p>
                            </div>
                          )}

                          {/* Estado: Cita Agendada (Arrastrable + Clic Derecho) */}
                          {apt && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, apt.id)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  apt,
                                });
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  apt,
                                });
                              }}
                              className={`h-full w-full rounded-2xl p-2.5 border shadow-xs cursor-grab active:cursor-grabbing transition-all hover:shadow-md flex flex-col justify-between select-none ${
                                apt.paymentStatus === 'Pagado'
                                  ? 'bg-[#EBF3EE]/90 border-[#2C4A3B]/30'
                                  : 'bg-white border-[#C87D65]/40'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      apt.modality === 'Online'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {apt.modality === 'Online' ? (
                                      <Video size={10} />
                                    ) : (
                                      <MapPin size={10} />
                                    )}
                                    {apt.modality}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

                              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
                                <span className="font-semibold text-[#2C4A3B]">
                                  {apt.clinicalStatus}
                                </span>
                                <span>Clic der. opciones</span>
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

        {/* =========================================================
            MÓDULO 2: DIRECTORIO DE PACIENTES & SERVICIOS CLÍNICOS
           ========================================================= */}
        {activeTab === 'pacientes' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-[#E4ECE7] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                  Gestión Clínica & Modalidad
                </span>
                <h2 className="text-2xl font-bold text-stone-900">
                  Pacientes, Servicios Asignados y Pagos
                </h2>
              </div>
              <button
                onClick={() => {
                  setActiveTab('agenda');
                  setSlotActionMode('book');
                  setSlotModal({
                    dayIndex: 1,
                    isoDate: '2026-11-09',
                    dayLabel: 'Lunes 09 Nov',
                    time: '09:00',
                  });
                }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl text-xs font-semibold transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Nuevo Paciente / Agendar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {appointments.map((apt) => {
                const prof =
                  professionals.find((p) => p.id === apt.professionalId) || currentProf;
                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-3xl p-6 border border-[#E4ECE7] shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-base text-stone-900">
                            {apt.patientName}
                          </h3>
                          <p className="text-xs text-stone-500">
                            Atiende: <strong>{prof.name}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => togglePaymentStatus(apt.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            apt.paymentStatus === 'Pagado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {apt.paymentStatus} · ${apt.price.toLocaleString('es-CL')}
                        </button>
                      </div>

                      {/* Selector directo de Servicio Clínico */}
                      <div className="space-y-3 bg-[#F9F8F6] p-4 rounded-2xl border border-[#E4ECE7] text-xs">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                            Servicio Clínico
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

                        {/* Selector directo Online vs Presencial */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-stone-500 font-medium">Modalidad:</span>
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
                                  showToast(`Cambiado a modalidad ${mod}`);
                                }}
                                className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1 ${
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
                            <strong>Fecha:</strong> {apt.isoDate} a las {apt.time} hrs
                          </p>
                          <p className="truncate">
                            <strong>Ubicación:</strong>{' '}
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

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => triggerNotificationForApt(apt)}
                        className="py-2.5 px-3 bg-[#EBF3EE] hover:bg-[#dbeadd] text-[#2C4A3B] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Send size={13} />
                        <span>Enviar API</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDirectWhatsApp(apt)}
                        className="py-2.5 px-3 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
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

        {/* =========================================================
            MÓDULO 3: PROFESIONALES, DÍAS DE ATENCIÓN Y DIRECCIÓN PRESENCIAL
           ========================================================= */}
        {activeTab === 'profesionales' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-[#E4ECE7]">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block">
                Configuración de Especialistas
              </span>
              <h2 className="text-2xl font-bold text-stone-900">
                Horarios de Atención, Modalidades y Dirección Presencial
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Cualquier cambio en los días de atención, horario o dirección de consulta se refleja inmediatamente en la Agenda Interactiva y en las confirmaciones enviadas a los pacientes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-white rounded-[2rem] p-7 border border-[#E4ECE7] shadow-xs space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-base">
                        {prof.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-stone-900">{prof.name}</h3>
                        <p className="text-xs text-stone-500">{prof.specialty}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2C4A3B] text-xs font-bold">
                      Activo
                    </span>
                  </div>

                  {/* 1. Días que atiende */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2.5">
                      Días de Atención Habilitados
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
                                ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-xs'
                                : 'bg-stone-50 text-stone-400 border-stone-200'
                            }`}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Rango Horario y Modalidad que ofrece */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                        Inicio Jornada
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
                        Fin Jornada
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
                        Modalidad Ofrecida
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

                  {/* 3. Dirección Consulta Presencial */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                      <Building2 size={14} className="text-[#C87D65]" />
                      <span>Dirección de Atención Presencial (Consulta / Box)</span>
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
                      placeholder="Ej. Av. Nueva Providencia 1881, Of. 1204"
                      className="w-full bg-[#F9F8F6] border border-[#E4ECE7] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#2C4A3B]"
                    />
                  </div>

                  {/* 4. Enlace de Videollamada Online */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-1.5">
                      <Video size={14} className="text-[#2C4A3B]" />
                      <span>Enlace Sala Online (Google Meet / Zoom)</span>
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

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          'Configuración guardada',
                          `Horarios y dirección de ${prof.name} actualizados.`
                        )
                      }
                      className="px-5 py-2.5 bg-[#2C4A3B] text-white rounded-xl text-xs font-semibold hover:bg-[#233B2F] transition-all"
                    >
                      Guardar Cambios del Profesional
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          MENÚ CONTEXTUAL DE CLIC DERECHO SOBRE LA CITA
         ========================================================= */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 320 : 400),
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 280 : 400),
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-68 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E4ECE7] p-2 text-xs"
          >
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <p className="font-bold text-stone-900 truncate">{contextMenu.apt.patientName}</p>
              <p className="text-[11px] text-stone-500 truncate">
                {contextMenu.apt.serviceName} · {contextMenu.apt.time} hrs
              </p>
            </div>

            <button
              onClick={() => {
                togglePaymentStatus(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EBF3EE] text-stone-800 font-semibold transition-colors"
            >
              <CreditCard size={15} className="text-emerald-700" />
              <span>
                {contextMenu.apt.paymentStatus === 'Pagado'
                  ? 'Marcar como Pendiente de Pago'
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
              <span>Marcar Sesión como Atendida</span>
            </button>

            <button
              onClick={() => {
                triggerNotificationForApt(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-stone-700 font-medium transition-colors"
            >
              <Send size={15} className="text-[#C87D65]" />
              <span>Reenviar Correo + WhatsApp API</span>
            </button>

            <button
              onClick={() => {
                openDirectWhatsApp(contextMenu.apt);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-800 font-semibold transition-colors"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>Abrir WhatsApp Directo (Con Dirección)</span>
            </button>

            <div className="my-1 border-t border-stone-100" />

            <button
              onClick={() => {
                deleteAppointment(contextMenu.apt.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition-colors"
            >
              <Trash2 size={15} />
              <span>Cancelar y Liberar Horario</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL DE CELDA VACÍA: AGENDAR PACIENTE O BLOQUEAR HORARIO
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
                  <h3 className="text-xl font-bold text-stone-900">
                    Gestionar Bloque Horario
                  </h3>
                </div>
                <button
                  onClick={() => setSlotModal(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selector Agendar vs Bloquear */}
              <div className="grid grid-cols-2 gap-2 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7] mb-5">
                <button
                  type="button"
                  onClick={() => setSlotActionMode('book')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    slotActionMode === 'book'
                      ? 'bg-[#2C4A3B] text-white'
                      : 'text-stone-600'
                  }`}
                >
                  Agendar Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setSlotActionMode('block')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    slotActionMode === 'block'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600'
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
                      placeholder="Ej. Almuerzo, Supervisión Clínica..."
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
                        placeholder="Ej. Sofía Domínguez"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold uppercase text-stone-500 block mb-1">
                          Correo Electrónico
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
                          setNewBookingForm({
                            ...newBookingForm,
                            serviceName: e.target.value,
                          })
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
                          Estado de Pago
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
                    ? 'Confirmar Bloqueo de Horario'
                    : 'Agendar y Disparar Confirmación'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}