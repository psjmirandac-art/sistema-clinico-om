'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Video,
  MapPin,
  CalendarPlus,
  RotateCcw,
  Stethoscope,
  LogIn,
  DoorOpen,
  UserCheck,
  CreditCard,
  ShieldCheck,
  Clock,
  CalendarClock,
  AlertTriangle,
  Trash2,
  Check,
  Lock,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID ?? 'centro-principal';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

type PaymentMethodOption = 'webpay' | 'mercadopago' | 'transferencia';

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeRut(raw: string): string {
  return String(raw ?? '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase();
}

function isHourInsideDayBlocks(dayCfg: any, hour: string): boolean {
  if (!dayCfg || !dayCfg.enabled) return false;
  if (Array.isArray(dayCfg.blocks) && dayCfg.blocks.length > 0) {
    return dayCfg.blocks.some(
      (b: { startHour: string; endHour: string }) =>
        hour >= b.startHour && hour <= b.endHour
    );
  }
  if (dayCfg.startHour && dayCfg.endHour) {
    return hour >= dayCfg.startHour && hour <= dayCfg.endHour;
  }
  return false;
}

// Calcula cuántas horas faltan para la sesión para aplicar la Regla de 24 Horas
function getHoursUntilSession(isoDate: string, time: string, nowIso: string): number {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const [hh, mm] = String(time).split(':').map(Number);
  const sessionDate = new Date(y, (m || 1) - 1, d || 1, hh || 10, mm || 0, 0);
  const nowDate = new Date(nowIso);
  const diffMs = sessionDate.getTime() - nowDate.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

function BookingGlassSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 z-10 my-auto">
      <div className="bg-white/85 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.05)] border border-[#E4ECE7] animate-pulse">
        <div className="h-3 w-36 bg-stone-200/80 rounded-full mb-3" />
        <div className="h-8 w-72 bg-stone-200 rounded-xl mb-8" />
        <div className="h-12 w-full bg-[#F9F8F6] rounded-2xl mb-7 border border-[#E4ECE7]" />
        <div className="h-14 w-full bg-[#2C4A3B]/20 rounded-2xl" />
      </div>
    </div>
  );
}

function CentroBookingContent() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : 'mi-centro';

  // Modo Principal del Portal: 'book' (Reservar) vs 'manage' (Reagendar / Cancelar con Regla 24h)
  const [portalMode, setPortalMode] = useState<'book' | 'manage'>('book');

  const [centerBrandName, setCenterBrandName] = useState<string>('Centro Terapéutico Horizonte');
  const [centerLogoUrl, setCenterLogoUrl] = useState<string>('');
  const [centerBoxes, setCenterBoxes] = useState<string[]>([
    'Box 1 · Salvia',
    'Box 2 · Arena',
    'Box 3 · Olivo',
    'Box 4 · Terracota',
  ]);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [patientsDirectory, setPatientsDirectory] = useState<any[]>([]);
  const [existingApts, setExistingApts] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [anchorDateIso, setAnchorDateIso] = useState<string>('2026-11-03T12:00:00');

  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [isPatientGoogleLogged, setIsPatientGoogleLogged] = useState<boolean>(false);
  const [recognizedPatientBanner, setRecognizedPatientBanner] = useState<string>('');

  // Pasarela de Pagos en el Paso 3
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodOption>('webpay');
  const [paymentTransactionCode, setPaymentTransactionCode] = useState<string>('');

  // Estado del Portal de Autogestión (Regla 24h)
  const [lookupRutInput, setLookupRutInput] = useState<string>('');
  const [reschedulingAptId, setReschedulingAptId] = useState<string | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('10:00');
  const [manageFeedback, setManageFeedback] = useState<string>('');

  const [patientData, setPatientData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefonoOchoDigitos: '',
  });

  useEffect(() => {
    setAnchorDateIso(new Date().toISOString());
    const savedName =
      localStorage.getItem('kairos_center_brand_v3') ??
      localStorage.getItem('kairos_center_brand_v2');
    const savedLogo =
      localStorage.getItem('kairos_center_logo_v3') ??
      localStorage.getItem('kairos_center_logo_v2');
    const savedBoxes = localStorage.getItem('kairos_center_boxes_v3');
    const savedProfs =
      localStorage.getItem('kairos_profs_v7') ?? localStorage.getItem('kairos_profs_v6');
    const savedSrvs =
      localStorage.getItem('kairos_services_v7') ??
      localStorage.getItem('kairos_services_v6');
    const savedPatients = localStorage.getItem('kairos_patients_v7');
    const savedApts =
      localStorage.getItem('kairos_apts_v7') ?? localStorage.getItem('kairos_apts_prod');
    const savedBlocks =
      localStorage.getItem('kairos_blocks_v7') ??
      localStorage.getItem('kairos_blocks_prod');

    if (savedName) setCenterBrandName(savedName);
    if (savedLogo) setCenterLogoUrl(savedLogo);
    if (savedBoxes) setCenterBoxes(JSON.parse(savedBoxes));
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedSrvs) setServices(JSON.parse(savedSrvs));
    if (savedPatients) setPatientsDirectory(JSON.parse(savedPatients));
    if (savedApts) setExistingApts(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      if (session?.user) {
        setIsPatientGoogleLogged(true);
        setPatientData((prev) => ({
          ...prev,
          nombre: session.user.user_metadata?.full_name ?? prev.nombre,
          email: session.user.email ?? prev.email,
        }));
      }
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
      }
    });
  }, []);

  const handlePatientGoogleSignIn = async () => {
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.href,
        },
      });
    }
  };

  const activeProfs = useMemo(
    () =>
      professionals.length > 0
        ? professionals
        : [
            {
              id: 'prof-1',
              name: 'Dr. Alejandro Silva',
              specialty: 'Psicoterapia Clínica & Ansiedad',
              avatar: 'AS',
              presencialAddress: 'Av. Nueva Providencia 1881, Of. 1204, Providencia',
              onlineRoomUrl: 'https://meet.google.com/krs-aslv-clin',
              scheduleByDay: {
                1: {
                  enabled: true,
                  blocks: [
                    { startHour: '09:00', endHour: '14:00' },
                    { startHour: '16:00', endHour: '21:00' },
                  ],
                  modality: 'Ambas (Híbrido)',
                  boxAssigned: 'Box 1 · Salvia',
                },
                2: {
                  enabled: true,
                  blocks: [
                    { startHour: '09:00', endHour: '13:00' },
                    { startHour: '15:00', endHour: '21:00' },
                  ],
                  modality: 'Ambas (Híbrido)',
                  boxAssigned: 'Box 1 · Salvia',
                },
                3: {
                  enabled: true,
                  blocks: [
                    { startHour: '09:00', endHour: '14:00' },
                    { startHour: '16:00', endHour: '21:00' },
                  ],
                  modality: 'Ambas (Híbrido)',
                  boxAssigned: 'Box 1 · Salvia',
                },
                4: {
                  enabled: true,
                  blocks: [
                    { startHour: '10:00', endHour: '14:00' },
                    { startHour: '16:00', endHour: '22:00' },
                  ],
                  modality: 'Ambas (Híbrido)',
                  boxAssigned: 'Box 1 · Salvia',
                },
                5: {
                  enabled: true,
                  blocks: [{ startHour: '09:00', endHour: '18:00' }],
                  modality: 'Ambas (Híbrido)',
                  boxAssigned: 'Box 1 · Salvia',
                },
              },
            },
          ],
    [professionals]
  );

  const activeServices = useMemo(
    () =>
      services.length > 0
        ? services
        : [
            {
              id: 'srv-1',
              name: 'Psicoterapia Individual Adulto',
              durationMinutes: 50,
              price: 45000,
            },
          ],
    [services]
  );

  // Pasos del flujo de reserva con Checkout integrado: schedule -> patient -> payment -> success
  const [step, setStep] = useState<'schedule' | 'patient' | 'payment' | 'success'>('schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProfId, setSelectedProfId] = useState<string>('prof-1');
  const selectedProf = useMemo(
    () => activeProfs.find((p) => p.id === selectedProfId) ?? activeProfs[0],
    [activeProfs, selectedProfId]
  );

  const [selectedService, setSelectedService] = useState<string>(
    'Psicoterapia Individual Adulto'
  );
  const currentServiceObj = useMemo(
    () => activeServices.find((s) => s.name === selectedService) ?? activeServices[0],
    [activeServices, selectedService]
  );

  const [modality, setModality] = useState<'Online' | 'Presencial'>('Online');
  const [confirmedMeetUrl, setConfirmedMeetUrl] = useState<string>('');
  const [confirmedBoxName, setConfirmedBoxName] = useState<string>('');

  const availableDays = useMemo(() => {
    const days = [];
    const base = new Date(anchorDateIso);
    const shortNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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

    let offset = 0;
    while (days.length < 5 && offset < 25) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      offset++;
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      if (selectedProf?.scheduleByDay && !selectedProf.scheduleByDay[dow]?.enabled) {
        continue;
      }
      const iso = formatIsoDate(d);
      days.push({
        iso,
        dow,
        dayName: shortNames[d.getDay()],
        dayNumber: String(d.getDate()).padStart(2, '0'),
        monthShort: monthNames[d.getMonth()],
        fullLabel: `${shortNames[d.getDay()]} ${d.getDate()} de ${monthNames[d.getMonth()]}`,
      });
    }
    return days;
  }, [anchorDateIso, selectedProf]);

  const [selectedDayIso, setSelectedDayIso] = useState<string>('');

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.some((d) => d.iso === selectedDayIso)) {
      setSelectedDayIso(availableDays[0].iso);
    }
  }, [availableDays, selectedDayIso]);

  const currentDayObj = useMemo(
    () => availableDays.find((d) => d.iso === selectedDayIso) ?? availableDays[0],
    [availableDays, selectedDayIso]
  );

  const availableTimeSlots = useMemo(() => {
    if (!selectedProf || !currentDayObj) return ['10:00', '11:00', '16:00'];
    const dayCfg = selectedProf.scheduleByDay?.[currentDayObj.dow];

    return FULL_DAY_HOURS.filter((hour) => {
      if (!isHourInsideDayBlocks(dayCfg, hour)) return false;

      const isProfBooked = existingApts.some(
        (a) =>
          a.professionalId === selectedProf.id &&
          a.isoDate === currentDayObj.iso &&
          a.time === hour
      );
      const isProfBlocked = blockedSlots.some(
        (b) =>
          b.professionalId === selectedProf.id &&
          b.isoDate === currentDayObj.iso &&
          b.time === hour
      );
      if (isProfBooked || isProfBlocked) return false;

      if (modality === 'Presencial') {
        const occupiedBoxesAtHour = existingApts.filter(
          (a) =>
            a.isoDate === currentDayObj.iso &&
            a.time === hour &&
            a.modality === 'Presencial'
        ).length;
        if (occupiedBoxesAtHour >= centerBoxes.length) return false;
      }

      return true;
    });
  }, [selectedProf, currentDayObj, existingApts, blockedSlots, modality, centerBoxes]);

  const [selectedTime, setSelectedTime] = useState<string>('10:00');

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, selectedTime]);

  const handleRutInputAndLookup = (val: string) => {
    setPatientData((prev) => ({ ...prev, rut: val }));
    const cleanTarget = normalizeRut(val);
    if (cleanTarget.length >= 7) {
      const found = patientsDirectory.find(
        (p) => normalizeRut(p.patientRUT) === cleanTarget
      );
      if (found) {
        const rawDigits = String(found.patientPhone ?? '').replace(/\D/g, '');
        const lastEight = rawDigits.length >= 8 ? rawDigits.slice(-8) : rawDigits;
        setPatientData({
          rut: found.patientRUT,
          nombre: found.patientName,
          email: found.patientEmail !== 'sin-correo@paciente.cl' ? found.patientEmail : '',
          telefonoOchoDigitos: lastEight,
        });
        setRecognizedPatientBanner(
          `¡Hola de nuevo, ${found.patientName.split(' ')[0]}! Autocompletamos tus datos.`
        );
        return;
      }
    }
    setRecognizedPatientBanner('');
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPatientData((prev) => ({ ...prev, telefonoOchoDigitos: digitsOnly }));
  };

  const fullE164Phone = `569${patientData.telefonoOchoDigitos}`;

  const handleProceedToPaymentStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.telefonoOchoDigitos.length < 8 || !currentDayObj) return;
    setStep('payment');
  };

  // Procesar Pago en Pasarela + Confirmar Cita como 'Pagado' en /admin
  const handleProcessPaymentAndConfirm = async () => {
    if (!currentDayObj) return;
    setIsSubmitting(true);

    try {
      const txCode = `${selectedPaymentMethod.toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
      setPaymentTransactionCode(txCode);

      const dayCfg = selectedProf?.scheduleByDay?.[currentDayObj.dow];
      const preferredBox = dayCfg?.boxAssigned ?? centerBoxes[0] ?? 'Box 1 · Salvia';
      const usedBoxesAtSlot = new Set(
        existingApts
          .filter(
            (a) =>
              a.isoDate === currentDayObj.iso &&
              a.time === selectedTime &&
              a.modality === 'Presencial'
          )
          .map((a) => a.boxName)
      );

      const finalBoxAssigned =
        modality === 'Presencial'
          ? !usedBoxesAtSlot.has(preferredBox)
            ? preferredBox
            : centerBoxes.find((b) => !usedBoxesAtSlot.has(b)) ?? preferredBox
          : 'Online (Google Meet)';

      setConfirmedBoxName(finalBoxAssigned);

      let assignedMeetUrl = '';
      try {
        const gRes = await fetch('/api/google/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: googleAccessToken,
            summary: `${selectedService} - ${selectedProf.name} (${centerBrandName})`,
            description: `Sesión pagada (${txCode}) en ${centerBrandName} con ${selectedProf.name}`,
            isoDate: currentDayObj.iso,
            time: selectedTime,
            durationMinutes: currentServiceObj?.durationMinutes ?? 50,
            patientEmail: patientData.email.trim(),
            professionalEmail: selectedProf.email ?? '',
            modality,
            locationAddress: selectedProf.presencialAddress,
          }),
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          assignedMeetUrl = gData.meetUrl ?? '';
        }
      } catch {
        assignedMeetUrl = 'https://meet.google.com/krs-auto-meet';
      }

      setConfirmedMeetUrl(assignedMeetUrl);

      const existingPat = patientsDirectory.find(
        (p) => normalizeRut(p.patientRUT) === normalizeRut(patientData.rut)
      );
      const patientId = existingPat ? existingPat.id : `pat-${Date.now()}`;

      if (!existingPat) {
        const updatedDirectory = [
          ...patientsDirectory,
          {
            id: patientId,
            patientName: patientData.nombre.trim(),
            patientRUT: patientData.rut.trim() || 'Sin RUT',
            patientEmail: patientData.email.trim(),
            patientPhone: fullE164Phone,
            defaultService: selectedService,
            defaultModality: modality,
            assignedProfessionalId: selectedProf.id,
            clinicalStatusTag: 'Activo',
            clinicalHistory: [],
          },
        ];
        setPatientsDirectory(updatedDirectory);
        localStorage.setItem('kairos_patients_v7', JSON.stringify(updatedDirectory));
      }

      const newApt = {
        id: `apt-${Date.now()}`,
        patientId,
        patientName: patientData.nombre.trim(),
        patientRUT: patientData.rut.trim() || 'Sin RUT',
        patientEmail: patientData.email.trim(),
        patientPhone: fullE164Phone,
        professionalId: selectedProf.id,
        serviceName: selectedService,
        modality,
        boxName: finalBoxAssigned,
        meetUrl: modality === 'Online' ? assignedMeetUrl : undefined,
        isoDate: currentDayObj.iso,
        time: selectedTime,
        price: currentServiceObj?.price ?? 45000,
        paymentStatus: 'Pagado', // Entra directo como Pagado tras el checkout
        clinicalStatus: 'Confirmada',
        notes: `Pago verificado vía ${selectedPaymentMethod.toUpperCase()} (${txCode})`,
      };

      const updatedApts = [...existingApts, newApt];
      setExistingApts(updatedApts);
      localStorage.setItem('kairos_apts_v7', JSON.stringify(updatedApts));
      localStorage.setItem('kairos_apts_prod', JSON.stringify(updatedApts));

      const locationAddress =
        modality === 'Presencial'
          ? `${selectedProf.presencialAddress} (${finalBoxAssigned})`
          : assignedMeetUrl || selectedProf.onlineRoomUrl;

      fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: newApt.patientName,
          patientEmail: newApt.patientEmail,
          date: currentDayObj.fullLabel,
          isoDate: currentDayObj.iso,
          time: selectedTime,
          serviceName: selectedService,
          modality: modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Google Meet)',
          locationAddress,
          professionalName: selectedProf.name,
          centerName: centerBrandName,
        }),
      }).catch(() => {});

      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // LÓGICA DE AUTOGESTIÓN DEL PACIENTE (REGLA DE 24 HORAS)
  // =========================================================
  const patientFoundAppointments = useMemo(() => {
    const cleanQuery = normalizeRut(lookupRutInput);
    if (cleanQuery.length < 6) return [];
    return existingApts.filter(
      (a) =>
        normalizeRut(a.patientRUT) === cleanQuery ||
        String(a.id).toUpperCase() === lookupRutInput.trim().toUpperCase()
    );
  }, [existingApts, lookupRutInput]);

  const handlePatientCancelAppointment24h = (aptId: string) => {
    const target = existingApts.find((a) => a.id === aptId);
    if (!target) return;
    const hoursLeft = getHoursUntilSession(target.isoDate, target.time, anchorDateIso);
    if (hoursLeft < 24) {
      setManageFeedback(
        'No es posible cancelar con menos de 24 horas de anticipación según la política clínica del centro.'
      );
      return;
    }
    const updated = existingApts.filter((a) => a.id !== aptId);
    setExistingApts(updated);
    localStorage.setItem('kairos_apts_v7', JSON.stringify(updated));
    localStorage.setItem('kairos_apts_prod', JSON.stringify(updated));
    setManageFeedback(
      `Tu cita del ${target.isoDate} (${target.time} hrs) fue cancelada y el box fue liberado.`
    );
  };

  const handlePatientReschedule24h = (aptId: string) => {
    const target = existingApts.find((a) => a.id === aptId);
    if (!target || !newRescheduleDate || !newRescheduleTime) return;

    const hoursLeft = getHoursUntilSession(target.isoDate, target.time, anchorDateIso);
    if (hoursLeft < 24) {
      setManageFeedback('Solo puedes reagendar hasta 24 horas antes de tu sesión.');
      return;
    }

    const updated = existingApts.map((a) =>
      a.id === aptId
        ? { ...a, isoDate: newRescheduleDate, time: newRescheduleTime }
        : a
    );
    setExistingApts(updated);
    localStorage.setItem('kairos_apts_v7', JSON.stringify(updated));
    localStorage.setItem('kairos_apts_prod', JSON.stringify(updated));
    setReschedulingAptId(null);
    setManageFeedback(
      `¡Listo! Tu sesión fue reagendada para el ${newRescheduleDate} a las ${newRescheduleTime} hrs.`
    );
  };

  const googleCalendarUrl = useMemo(() => {
    const calDate = (currentDayObj?.iso ?? '2026-11-03').replace(/-/g, '');
    const startHour = (selectedTime ?? '10:00').replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;
    const locationAddress =
      modality === 'Presencial'
        ? `${selectedProf?.presencialAddress} (${confirmedBoxName})`
        : confirmedMeetUrl || selectedProf?.onlineRoomUrl;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${selectedService} - ${selectedProf?.name} (${centerBrandName})`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Sesión en ${centerBrandName} (${modality}) con ${selectedProf?.name}. Acceso/Ubicación: ${locationAddress}`
    )}&location=${encodeURIComponent(locationAddress ?? '')}`;
  }, [
    currentDayObj,
    selectedTime,
    selectedProf,
    modality,
    selectedService,
    centerBrandName,
    confirmedBoxName,
    confirmedMeetUrl,
  ]);

  return (
    <>
      <header className="w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden border border-[#E4ECE7]">
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
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#C87D65] font-bold block">
              Portal Oficial de Pacientes
            </span>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              {centerBrandName}
            </h2>
          </div>
        </div>

        {/* Conmutador: Reservar Nueva Hora vs Gestionar mi Cita (Regla 24h) */}
        <div className="flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-[#E4ECE7] flex items-center">
            <button
              type="button"
              onClick={() => setPortalMode('book')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                portalMode === 'book'
                  ? 'bg-[#2C4A3B] text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Agendar Cita
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('manage');
                setManageFeedback('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                portalMode === 'manage'
                  ? 'bg-[#2C4A3B] text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarClock size={14} />
              <span>Reagendar / Cancelar</span>
            </button>
          </div>

          {!isPatientGoogleLogged && (
            <button
              type="button"
              onClick={handlePatientGoogleSignIn}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E4ECE7] text-xs font-bold text-stone-700 hover:border-[#2C4A3B] transition-all"
            >
              <LogIn size={14} className="text-[#2C4A3B]" />
              <span>Google</span>
            </button>
          )}
        </div>
      </header>

      <section className="w-full max-w-2xl mx-auto px-4 py-6 z-10 my-auto">
        {portalMode === 'manage' ? (
          /* =========================================================
             MÓDULO DE AUTOGESTIÓN DEL PACIENTE CON REGLA DE 24 HORAS
             ========================================================= */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7] space-y-6"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C87D65] block mb-1">
                Autogestión de Citas · Regla de 24 Horas
              </span>
              <h1 className="text-2xl font-bold text-stone-900">
                Reagenda o cancela tu sesión
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Ingresa tu RUT para ver tus próximas sesiones. Puedes modificar o anular tu hora sin costo hasta <strong>24 horas antes</strong> del inicio de la consulta.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-stone-500 block mb-1.5">
                Ingresa tu RUT
              </label>
              <input
                type="text"
                value={lookupRutInput}
                onChange={(e) => setLookupRutInput(e.target.value)}
                placeholder="Ej. 18.456.789-2"
                className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-[#F9F8F6] text-sm font-semibold focus:outline-none focus:border-[#2C4A3B]"
              />
            </div>

            {manageFeedback && (
              <div className="p-4 rounded-2xl bg-[#EBF3EE] border border-[#2C4A3B]/30 text-xs font-bold text-[#2C4A3B]">
                {manageFeedback}
              </div>
            )}

            <div className="space-y-3">
              {lookupRutInput.trim().length >= 6 && patientFoundAppointments.length === 0 && (
                <div className="p-5 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] text-xs text-stone-500 text-center">
                  No encontramos sesiones activas asociadas a ese RUT.
                </div>
              )}

              {patientFoundAppointments.map((apt) => {
                const prof = activeProfs.find((p) => p.id === apt.professionalId);
                const hoursRemaining = getHoursUntilSession(
                  apt.isoDate,
                  apt.time,
                  anchorDateIso
                );
                const canModify24h = hoursRemaining >= 24;

                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-3xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-4 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#2C4A3B] font-bold text-[10px]">
                          {apt.modality === 'Online' ? 'Online (Google Meet)' : apt.boxName}
                        </span>
                        <h3 className="font-bold text-base text-stone-900 mt-1.5">
                          {apt.serviceName}
                        </h3>
                        <p className="text-stone-500">
                          Especialista: <strong>{prof?.name ?? 'Especialista'}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-[#2C4A3B]">
                          {apt.isoDate} · {apt.time} hrs
                        </p>
                        <span
                          className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            canModify24h
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {canModify24h
                            ? `Faltan ${Math.round(hoursRemaining)} hrs (Habilitado)`
                            : `Menos de 24h (${Math.max(0, Math.round(hoursRemaining))} hrs)`}
                        </span>
                      </div>
                    </div>

                    {!canModify24h ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-center gap-2.5">
                        <AlertTriangle size={16} className="text-[#C87D65] shrink-0" />
                        <span>
                          Esta sesión está a menos de 24 horas de realizarse, por lo que el bloque y el box ya están reservados en firme.
                        </span>
                      </div>
                    ) : reschedulingAptId === apt.id ? (
                      <div className="p-4 rounded-2xl bg-white border border-[#E4ECE7] space-y-3">
                        <p className="font-bold text-stone-800">
                          Selecciona la nueva fecha y horario:
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            type="date"
                            value={newRescheduleDate}
                            onChange={(e) => setNewRescheduleDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-stone-200"
                          />
                          <select
                            value={newRescheduleTime}
                            onChange={(e) => setNewRescheduleTime(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-semibold"
                          >
                            {FULL_DAY_HOURS.map((h) => (
                              <option key={h} value={h}>
                                {h} hrs
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReschedulingAptId(null)}
                            className="px-3 py-2 rounded-xl bg-stone-100 text-stone-600 font-bold"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePatientReschedule24h(apt.id)}
                            className="px-4 py-2 rounded-xl bg-[#2C4A3B] text-white font-bold flex items-center gap-1"
                          >
                            <Check size={14} />
                            <span>Confirmar Cambio</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/70">
                        <button
                          type="button"
                          onClick={() => {
                            setReschedulingAptId(apt.id);
                            setNewRescheduleDate(apt.isoDate);
                            setNewRescheduleTime(apt.time);
                          }}
                          className="flex-1 py-2.5 px-4 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                        >
                          <CalendarClock size={14} />
                          <span>Reagendar Hora</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePatientCancelAppointment24h(apt.id)}
                          className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          <span>Cancelar Cita</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 'schedule' && (
              <motion.div
                key="step-schedule"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D65] block mb-1">
                      Paso 1 de 3 · {centerBrandName}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                      Agenda tu hora clínica
                    </h1>
                  </div>
                  <Sparkles size={22} className="text-[#2C4A3B]/60 hidden sm:block" />
                </div>

                {/* 1. Servicio */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                    Servicio / Tipo de Terapia
                  </label>
                  <div className="relative">
                    <Stethoscope
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C4A3B]"
                    />
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9F8F6] border border-[#E4ECE7] rounded-2xl text-sm font-semibold text-stone-800 focus:outline-none focus:border-[#2C4A3B]"
                    >
                      {activeServices.map((svc) => (
                        <option key={svc.id} value={svc.name}>
                          {svc.name} · {svc.durationMinutes} min ($
                          {Number(svc.price).toLocaleString('es-CL')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Especialista */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                    Especialista
                  </label>
                  <div className="space-y-2.5">
                    {activeProfs.map((prof) => {
                      const isSelected = selectedProf?.id === prof.id;
                      return (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => setSelectedProfId(prof.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#EBF3EE]/60 border-[#2C4A3B] shadow-sm'
                              : 'bg-white border-stone-200/80 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                                isSelected
                                  ? 'bg-[#2C4A3B] text-white'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {prof.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 text-sm sm:text-base">
                                {prof.name}
                              </p>
                              <p className="text-xs text-stone-500">{prof.specialty}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#2C4A3B]">Elegir</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Modalidad */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                    Modalidad
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                    {(['Online', 'Presencial'] as const).map((mod) => {
                      const active = modality === mod;
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => setModality(mod)}
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                            active
                              ? 'bg-[#2C4A3B] text-white shadow-sm'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {mod === 'Online' ? <Video size={16} /> : <MapPin size={16} />}
                          <span>
                            {mod === 'Online' ? 'Online (Google Meet)' : 'Consulta Presencial'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {modality === 'Presencial' && selectedProf?.presencialAddress && (
                    <p className="text-xs text-stone-600 mt-2 flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/70 px-3.5 py-2 rounded-xl">
                      <DoorOpen size={14} className="text-[#C87D65] shrink-0" />
                      <span>
                        <strong>Dirección:</strong> {selectedProf.presencialAddress}
                      </span>
                    </p>
                  )}
                </div>

                {/* 4. Días Disponibles */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                    Días Disponibles
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {availableDays.map((d) => {
                      const isSelected = currentDayObj?.iso === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => setSelectedDayIso(d.iso)}
                          className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-md'
                              : 'bg-white border-stone-200/80 text-stone-700'
                          }`}
                        >
                          <span className="text-[10px] uppercase block opacity-80">
                            {d.dayName}
                          </span>
                          <span className="text-lg font-bold block my-0.5">{d.dayNumber}</span>
                          <span className="text-[10px] uppercase block opacity-80">
                            {d.monthShort}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Horas Disponibles */}
                <div className="mb-8">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                    Horarios Disponibles ({currentDayObj?.fullLabel})
                  </label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-stone-100 text-xs text-stone-500 text-center">
                      No quedan bloques ni boxes disponibles este día. Selecciona otra fecha.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {availableTimeSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-[#EBF3EE] border-[#2C4A3B] text-[#2C4A3B] font-bold'
                                : 'bg-white border-stone-200 text-stone-600'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={availableTimeSlots.length === 0}
                  onClick={() => setStep('patient')}
                  className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Continuar</span>
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 'patient' && (
              <motion.div
                key="step-patient"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7]"
              >
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-5"
                >
                  <ChevronLeft size={15} />
                  <span>Volver a horarios</span>
                </button>

                <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D65] block mb-1">
                  Paso 2 de 3 · Identificación Clínica
                </span>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">
                  Tus datos de contacto
                </h2>

                {recognizedPatientBanner && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#2C4A3B]/30 text-xs font-bold text-[#2C4A3B] flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>{recognizedPatientBanner}</span>
                  </div>
                )}

                <form onSubmit={handleProceedToPaymentStep} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase block mb-1">
                        RUT (Autocompleta si ya eres paciente)
                      </label>
                      <input
                        required
                        type="text"
                        value={patientData.rut}
                        onChange={(e) => handleRutInputAndLookup(e.target.value)}
                        className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                        placeholder="18.456.789-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase block mb-1">
                        Nombre y Apellido
                      </label>
                      <div className="relative">
                        <User
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                        />
                        <input
                          required
                          type="text"
                          value={patientData.nombre}
                          onChange={(e) =>
                            setPatientData({ ...patientData, nombre: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                          placeholder="Ej. Camila Vergara"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase block mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                      />
                      <input
                        required
                        type="email"
                        value={patientData.email}
                        onChange={(e) =>
                          setPatientData({ ...patientData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                        placeholder="camila@ejemplo.cl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase block mb-1">
                      WhatsApp (+56 9)
                    </label>
                    <div className="flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:border-[#2C4A3B]">
                      <div className="px-4 py-3.5 bg-stone-50 border-r border-stone-200 text-sm font-semibold text-stone-600 flex items-center gap-1.5">
                        <Phone size={14} className="text-[#2C4A3B]" />
                        <span>+56 9</span>
                      </div>
                      <input
                        required
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{8}"
                        value={patientData.telefonoOchoDigitos}
                        onChange={handlePhoneInput}
                        className="w-full px-4 py-3.5 text-sm focus:outline-none"
                        placeholder="61699991"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={patientData.telefonoOchoDigitos.length < 8}
                    className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Continuar al Pago Seguro</span>
                    <ChevronRight size={18} />
                  </button>
                </form>
              </motion.div>
            )}

            {/* =========================================================
                PASO 3: PASARELA DE PAGOS CLÍNICA INTEGRADA
               ========================================================= */}
            {step === 'payment' && (
              <motion.div
                key="step-payment"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7] space-y-6"
              >
                <button
                  type="button"
                  onClick={() => setStep('patient')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900"
                >
                  <ChevronLeft size={15} />
                  <span>Volver a mis datos</span>
                </button>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D65] block mb-1">
                    Paso 3 de 3 · Pasarela de Pago Encriptada
                  </span>
                  <h2 className="text-2xl font-bold text-stone-900">
                    Confirma y abona tu sesión
                  </h2>
                </div>

                {/* Resumen de cobro */}
                <div className="p-5 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Paciente:</span>
                    <strong className="text-stone-900">
                      {patientData.nombre} ({patientData.rut})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Especialista:</span>
                    <strong className="text-stone-900">{selectedProf?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Fecha y Hora:</span>
                    <strong className="text-stone-900 capitalize">
                      {currentDayObj?.fullLabel} · {selectedTime} hrs
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/80 text-sm">
                    <span className="font-bold text-stone-700">Total a Pagar:</span>
                    <span className="text-lg font-bold text-[#2C4A3B]">
                      ${Number(currentServiceObj?.price ?? 45000).toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                </div>

                {/* Selector de Pasarela */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase text-stone-500 block">
                    Selecciona tu Medio de Pago
                  </label>

                  {(
                    [
                      {
                        id: 'webpay',
                        title: 'Webpay Plus (Transbank)',
                        desc: 'Tarjetas de Débito, Redcompra y Crédito en cuotas',
                      },
                      {
                        id: 'mercadopago',
                        title: 'Mercado Pago Checkout Pro',
                        desc: 'Dinero en cuenta Mercado Pago o tarjetas bancarias',
                      },
                      {
                        id: 'transferencia',
                        title: 'Transferencia Bancaria Instantánea (Khipu / Fintoc)',
                        desc: 'Conciliación automática con tu banco',
                      },
                    ] as const
                  ).map((pm) => {
                    const active = selectedPaymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          active
                            ? 'bg-[#EBF3EE]/70 border-[#2C4A3B] shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              active
                                ? 'bg-[#2C4A3B] text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-stone-900">{pm.title}</p>
                            <p className="text-[11px] text-stone-500">{pm.desc}</p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            active ? 'border-[#2C4A3B] bg-[#2C4A3B] text-white' : 'border-stone-300'
                          }`}
                        >
                          {active && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProcessPaymentAndConfirm}
                  className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock size={16} />
                  <span>
                    {isSubmitting
                      ? 'Verificando pago y asignando box...'
                      : `Pagar $${Number(currentServiceObj?.price ?? 45000).toLocaleString(
                          'es-CL'
                        )} y Agendar Cita`}
                  </span>
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 shadow-xl border border-[#E4ECE7] text-center space-y-6"
              >
                <div className="w-20 h-20 bg-[#EBF3EE] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} className="text-[#2C4A3B]" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase mb-2">
                    <ShieldCheck size={13} />
                    Pago Aprobado · Código {paymentTransactionCode}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                    ¡Cita Pagada y Agendada!
                  </h2>
                  <p className="text-stone-500 text-sm mt-2">
                    Tu sesión de <strong>{selectedService}</strong> (
                    {modality === 'Online' ? 'Online · Google Meet' : confirmedBoxName}) con{' '}
                    <strong>{selectedProf?.name}</strong> quedó confirmada para el{' '}
                    <strong>{currentDayObj?.fullLabel}</strong> a las{' '}
                    <strong>{selectedTime} hrs</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    <CalendarPlus size={16} />
                    <span>Agregar a Google Calendar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setStep('schedule')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                  >
                    <RotateCcw size={15} />
                    <span>Agendar otra sesión</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>
    </>
  );
}

export default function CentroBookingPage() {
  return (
    <main className="min-h-screen bg-[#F9F8F6] text-stone-800 flex flex-col justify-between relative overflow-hidden font-sans">
      <Suspense fallback={<BookingGlassSkeleton />}>
        <CentroBookingContent />
      </Suspense>
    </main>
  );
}