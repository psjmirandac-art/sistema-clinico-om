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

// Verifica si una hora cae dentro de los múltiples tramos horarios del día (respetando la colación)
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

  // Identidad de la Carátula sincronizada con /admin (V7)
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

  const [step, setStep] = useState<'schedule' | 'patient' | 'success'>('schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProfId, setSelectedProfId] = useState<string>('prof-1');
  const selectedProf = useMemo(
    () => activeProfs.find((p) => p.id === selectedProfId) ?? activeProfs[0],
    [activeProfs, selectedProfId]
  );

  const [selectedService, setSelectedService] = useState<string>(
    'Psicoterapia Individual Adulto'
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

  // Calcula horarios disponibles respetando múltiples bloques (colación) y disponibilidad de Box en el centro
  const availableTimeSlots = useMemo(() => {
    if (!selectedProf || !currentDayObj) return ['10:00', '11:00', '16:00'];
    const dayCfg = selectedProf.scheduleByDay?.[currentDayObj.dow];

    return FULL_DAY_HOURS.filter((hour) => {
      // 1. Verificar que esté dentro de los tramos del día (ej: 09:00-14:00 o 16:00-21:00)
      if (!isHourInsideDayBlocks(dayCfg, hour)) return false;

      // 2. Verificar que el profesional no tenga cita ni bloqueo a esa hora
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

      // 3. Si la cita es Presencial, verificar que quede al menos 1 Box libre en el centro a esa hora
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

  // Autocompletar datos si el paciente ya existe en el directorio o fue importado desde Excel/CSV
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
        setRecognizedPatientBanner(`¡Hola de nuevo, ${found.patientName.split(' ')[0]}! Autocompletamos tus datos.`);
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

  const handleConfirmarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.telefonoOchoDigitos.length < 8 || !currentDayObj) return;

    setIsSubmitting(true);

    try {
      const svcObj =
        activeServices.find((s) => s.name === selectedService) ?? activeServices[0];

      // Determinar el Box físico libre si es Presencial
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

      // Generar sala Google Meet si es Online
      let assignedMeetUrl = '';
      try {
        const gRes = await fetch('/api/google/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: googleAccessToken,
            summary: `${selectedService} - ${selectedProf.name} (${centerBrandName})`,
            description: `Sesión en ${centerBrandName} con ${selectedProf.name}`,
            isoDate: currentDayObj.iso,
            time: selectedTime,
            durationMinutes: svcObj?.durationMinutes ?? 50,
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

      // Asegurar que el paciente quede en el Directorio Independiente V7
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
        price: svcObj?.price ?? 45000,
        paymentStatus: 'Pendiente',
        clinicalStatus: 'Confirmada',
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

        {!isPatientGoogleLogged && (
          <button
            type="button"
            onClick={handlePatientGoogleSignIn}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-[#E4ECE7] text-xs font-bold text-stone-700 hover:border-[#2C4A3B] transition-all shadow-2xs"
          >
            <LogIn size={14} className="text-[#2C4A3B]" />
            <span>Continuar con Google</span>
          </button>
        )}
      </header>

      <section className="w-full max-w-2xl mx-auto px-4 py-6 z-10 my-auto">
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
                    {centerBrandName}
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

              {/* 3. Modalidad con textos limpios */}
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

              {/* 5. Horas Disponibles (Respeta corte de colación y disponibilidad de Box) */}
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

              <h2 className="text-2xl font-bold text-stone-900 mb-4">
                Tus datos de contacto
              </h2>

              {recognizedPatientBanner && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#2C4A3B]/30 text-xs font-bold text-[#2C4A3B] flex items-center gap-2">
                  <UserCheck size={16} />
                  <span>{recognizedPatientBanner}</span>
                </div>
              )}

              <form onSubmit={handleConfirmarCita} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase block mb-1">
                      RUT (Si ya eres paciente, autocompleta tus datos)
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
                  disabled={isSubmitting || patientData.telefonoOchoDigitos.length < 8}
                  className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Agendando cita...' : 'Agendar Cita'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 shadow-xl border border-[#E4ECE7] text-center"
            >
              <div className="w-20 h-20 bg-[#EBF3EE] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-[#2C4A3B]" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                ¡Cita Agendada en {centerBrandName}!
              </h2>
              <p className="text-stone-500 text-sm mb-6">
                Tu sesión de <strong>{selectedService}</strong> (
                {modality === 'Online' ? 'Online · Google Meet' : confirmedBoxName}) con{' '}
                <strong>{selectedProf?.name}</strong> quedó confirmada para el{' '}
                <strong>{currentDayObj?.fullLabel}</strong> a las{' '}
                <strong>{selectedTime} hrs</strong>.
              </p>

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