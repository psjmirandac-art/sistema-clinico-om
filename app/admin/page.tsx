'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Video,
  MapPin,
  ShieldCheck,
  CalendarPlus,
  RotateCcw,
  Stethoscope,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID || 'kairos-main';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface ProfessionalConfig {
  id: string;
  name: string;
  specialty: string;
  rut: string;
  email: string;
  avatar: string;
  workingDays: number[];
  startHour: string;
  endHour: string;
  modalityMode: 'Ambas (Híbrido)' | 'Solo Online' | 'Solo Presencial';
  presencialAddress: string;
  onlineRoomUrl: string;
  basePrice: number;
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

const DEFAULT_PROFESSIONALS: ProfessionalConfig[] = [
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

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function BookingGlassSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 z-10 my-auto">
      <div className="bg-white/85 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.05)] border border-[#E4ECE7] animate-pulse">
        <div className="h-3 w-36 bg-stone-200/80 rounded-full mb-3" />
        <div className="h-8 w-72 bg-stone-200 rounded-xl mb-8" />
        <div className="h-12 w-full bg-[#F9F8F6] rounded-2xl mb-7 border border-[#E4ECE7]" />
        <div className="space-y-3 mb-7">
          <div className="h-20 w-full bg-stone-100/80 rounded-2xl" />
          <div className="h-20 w-full bg-stone-100/80 rounded-2xl" />
        </div>
        <div className="h-14 w-full bg-[#2C4A3B]/20 rounded-2xl" />
      </div>
    </div>
  );
}

function CentroBookingContent() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : 'kairos-central';

  const [professionals, setProfessionals] = useState<ProfessionalConfig[]>(DEFAULT_PROFESSIONALS);
  const [existingApts, setExistingApts] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [anchorDateIso, setAnchorDateIso] = useState<string>('2026-11-03T12:00:00');

  // Hidratar reloj y datos sincronizados desde /admin
  useEffect(() => {
    setAnchorDateIso(new Date().toISOString());
    const savedProfs = localStorage.getItem('kairos_profs_prod');
    const savedApts = localStorage.getItem('kairos_apts_prod');
    const savedBlocks = localStorage.getItem('kairos_blocks_prod');
    if (savedProfs) setProfessionals(JSON.parse(savedProfs));
    if (savedApts) setExistingApts(JSON.parse(savedApts));
    if (savedBlocks) setBlockedSlots(JSON.parse(savedBlocks));
  }, []);

  const [step, setStep] = useState<'schedule' | 'patient' | 'success'>('schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProfId, setSelectedProfId] = useState<string>(DEFAULT_PROFESSIONALS[0].id);
  const selectedProf = useMemo(
    () => professionals.find((p) => p.id === selectedProfId) || professionals[0],
    [professionals, selectedProfId]
  );

  const [selectedService, setSelectedService] = useState(CLINICAL_SERVICES[0].name);
  const [modality, setModality] = useState<'Online' | 'Presencial'>('Online');

  // Ajustar modalidad automáticamente si el profesional elegido es "Solo Online" o "Solo Presencial"
  useEffect(() => {
    if (!selectedProf) return;
    if (selectedProf.modalityMode === 'Solo Online') setModality('Online');
    if (selectedProf.modalityMode === 'Solo Presencial') setModality('Presencial');
  }, [selectedProf]);

  // Generar los próximos 6 días hábiles en los que atiende el profesional seleccionado
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
      const dayOfWeek = d.getDay(); // 0 = Dom, 1 = Lun ... 6 = Sáb
      if (dayOfWeek === 0) continue;
      if (selectedProf && !selectedProf.workingDays.includes(dayOfWeek)) continue;

      const iso = formatIsoDate(d);
      days.push({
        iso,
        dayName: shortNames[dayOfWeek],
        dayNumber: String(d.getDate()).padStart(2, '0'),
        monthShort: monthNames[d.getMonth()],
        fullLabel: `${shortNames[dayOfWeek]} ${d.getDate()} de ${monthNames[d.getMonth()]}`,
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
    () => availableDays.find((d) => d.iso === selectedDayIso) || availableDays[0],
    [availableDays, selectedDayIso]
  );

  // Filtrar horas del profesional ocultando las que ya están ocupadas o bloqueadas en /admin
  const availableTimeSlots = useMemo(() => {
    if (!selectedProf || !currentDayObj) return ['10:00', '11:00', '16:00'];
    const rangeHours = ALL_HOURS.filter(
      (h) => h >= selectedProf.startHour && h <= selectedProf.endHour
    );
    return rangeHours.filter((hour) => {
      const isBooked = existingApts.some(
        (a) =>
          a.professionalId === selectedProf.id &&
          a.isoDate === currentDayObj.iso &&
          a.time === hour
      );
      const isBlocked = blockedSlots.some(
        (b) =>
          b.professionalId === selectedProf.id &&
          b.isoDate === currentDayObj.iso &&
          b.time === hour
      );
      return !isBooked && !isBlocked;
    });
  }, [selectedProf, currentDayObj, existingApts, blockedSlots]);

  const [selectedTime, setSelectedTime] = useState<string>('10:00');

  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, selectedTime]);

  const [patientData, setPatientData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefonoOchoDigitos: '',
  });

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
        CLINICAL_SERVICES.find((s) => s.name === selectedService) || CLINICAL_SERVICES[0];

      const newApt = {
        id: `apt-${Date.now()}`,
        patientName: patientData.nombre.trim(),
        patientRUT: patientData.rut.trim() || 'Sin RUT',
        patientEmail: patientData.email.trim(),
        patientPhone: fullE164Phone,
        professionalId: selectedProf.id,
        serviceName: selectedService,
        modality,
        isoDate: currentDayObj.iso,
        time: selectedTime,
        price: svcObj.price,
        paymentStatus: 'Pendiente',
        clinicalStatus: 'Confirmada',
      };

      // 1. Guardar en el store compartido con /admin para que aparezca de inmediato en la agenda
      const updatedApts = [...existingApts, newApt];
      setExistingApts(updatedApts);
      localStorage.setItem('kairos_apts_prod', JSON.stringify(updatedApts));

      // 2. Guardar en Supabase si está activo
      if (supabase) {
        await supabase.from('appointments').insert([
          {
            center_id: defaultCenterId,
            center_slug: slug,
            patient_name: newApt.patientName,
            patient_email: newApt.patientEmail,
            patient_phone: newApt.patientPhone,
            professional_name: selectedProf.name,
            modality: newApt.modality,
            date: newApt.isoDate,
            time: newApt.time,
            status: 'confirmed',
          },
        ]);
      }

      // 3. Disparar correo de confirmación en segundo plano con dirección presencial o sala online
      const locationAddress =
        modality === 'Presencial'
          ? selectedProf.presencialAddress
          : selectedProf.onlineRoomUrl;

      const adminEmailCopy = localStorage.getItem('kairos_admin_email_prod') || '';

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
          modality: modality === 'Presencial' ? 'Consulta Presencial' : 'Online (Videollamada)',
          locationAddress,
          professionalName: selectedProf.name,
          centerName: 'Kairós Clínico',
          overrideAdminEmail: adminEmailCopy,
        }),
      }).catch((err) => console.error('Aviso silencioso correo:', err));

      setStep('success');
    } catch (error) {
      console.error('Error al procesar la reserva:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleCalendarUrl = useMemo(() => {
    const calDate = (currentDayObj?.iso || '2026-11-03').replace(/-/g, '');
    const startHour = (selectedTime || '10:00').replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;
    const locationAddress =
      modality === 'Presencial'
        ? selectedProf?.presencialAddress
        : selectedProf?.onlineRoomUrl;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${selectedService} - ${selectedProf?.name}`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Sesión en Kairós Clínico (${modality}) con ${selectedProf?.name}. Ubicación/Acceso: ${locationAddress}`
    )}&location=${encodeURIComponent(locationAddress || '')}`;
  }, [currentDayObj, selectedTime, selectedProf, modality, selectedService]);

  const resetBooking = () => {
    setPatientData({ nombre: '', rut: '', email: '', telefonoOchoDigitos: '' });
    setStep('schedule');
  };

  return (
    <>
      <header className="w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center font-semibold tracking-wider text-sm shadow-sm">
            K
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-stone-400 font-semibold block">
              Espacio Terapéutico
            </span>
            <h2 className="text-base font-bold text-stone-900 tracking-tight capitalize">
              {slug.replace(/-/g, ' ')}
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#E4ECE7] text-xs text-stone-600">
          <ShieldCheck size={14} className="text-[#2C4A3B]" />
          <span>Reserva Encriptada & Sincronizada</span>
        </div>
      </header>

      <section className="w-full max-w-2xl mx-auto px-4 py-6 z-10 my-auto">
        <AnimatePresence mode="wait">
          {step === 'schedule' && (
            <motion.div
              key="step-schedule"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7]"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D65] block mb-1">
                    Paso 1 de 2 · Configuración de Sesión
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                    Reserva tu hora clínica
                  </h1>
                </div>
                <Sparkles size={22} className="text-[#2C4A3B]/60 hidden sm:block" />
              </div>

              {/* 1. Servicio Clínico */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                  Servicio Clínico
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
                    {CLINICAL_SERVICES.map((svc) => (
                      <option key={svc.name} value={svc.name}>
                        {svc.name} · {svc.duration} (${svc.price.toLocaleString('es-CL')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Profesional Clínico */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                  Profesional Clínico
                </label>
                <div className="space-y-2.5">
                  {professionals.map((prof) => {
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
                        <div className="text-right">
                          <span className="text-xs font-semibold text-[#2C4A3B] block">
                            {prof.modalityMode}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {prof.startHour} a {prof.endHour}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Modalidad (Online vs Presencial con Dirección) */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-2 gap-3 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                  {(['Online', 'Presencial'] as const).map((mod) => {
                    const disabled =
                      (mod === 'Online' && selectedProf?.modalityMode === 'Solo Presencial') ||
                      (mod === 'Presencial' && selectedProf?.modalityMode === 'Solo Online');
                    const active = modality === mod;
                    return (
                      <button
                        key={mod}
                        type="button"
                        disabled={disabled}
                        onClick={() => setModality(mod)}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          active
                            ? 'bg-[#2C4A3B] text-white shadow-sm'
                            : disabled
                            ? 'opacity-40 cursor-not-allowed text-stone-400'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {mod === 'Online' ? <Video size={16} /> : <MapPin size={16} />}
                        <span>{mod === 'Online' ? 'Online (Videollamada)' : 'Consulta Presencial'}</span>
                      </button>
                    );
                  })}
                </div>
                {modality === 'Presencial' && selectedProf && (
                  <p className="text-xs text-stone-600 mt-2 flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/70 px-3.5 py-2 rounded-xl">
                    <MapPin size={14} className="text-[#C87D65] shrink-0" />
                    <span>
                      <strong>Dirección de consulta:</strong> {selectedProf.presencialAddress}
                    </span>
                  </p>
                )}
              </div>

              {/* 4. Día Disponible */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                  Días de Atención Disponibles
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
                            ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-md scale-[1.02]'
                            : 'bg-white border-stone-200/80 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase tracking-wider font-semibold block ${
                            isSelected ? 'text-emerald-100' : 'text-stone-400'
                          }`}
                        >
                          {d.dayName}
                        </span>
                        <span className="text-lg font-bold block my-0.5">{d.dayNumber}</span>
                        <span
                          className={`text-[10px] uppercase block ${
                            isSelected ? 'text-emerald-100' : 'text-stone-400'
                          }`}
                        >
                          {d.monthShort}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Bloques Horarios Libres */}
              <div className="mb-8">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
                  Horarios Libres ({currentDayObj?.fullLabel})
                </label>
                {availableTimeSlots.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-stone-100 text-xs text-stone-500 text-center">
                    No quedan bloques disponibles para este día. Por favor selecciona otra fecha.
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
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
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
                className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_10px_25px_rgb(44,74,59,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                <span>Continuar con mis datos</span>
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </motion.div>
          )}

          {step === 'patient' && (
            <motion.div
              key="step-patient"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-10 shadow-[0_20px_60px_rgb(44,74,59,0.06)] border border-[#E4ECE7]"
            >
              <button
                type="button"
                onClick={() => setStep('schedule')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 mb-5 transition-colors"
              >
                <ChevronLeft size={15} />
                <span>Modificar horario o especialista</span>
              </button>

              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D65] block mb-1">
                  Paso 2 de 2 · Datos del Paciente
                </span>
                <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                  Confirma tu reserva clínica
                </h2>
              </div>

              <div className="bg-[#F9F8F6] rounded-2xl p-4 mb-7 border border-[#E4ECE7] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Especialista:</span>
                  <strong className="text-stone-900">{selectedProf?.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Servicio y Modalidad:</span>
                  <strong className="text-[#2C4A3B]">
                    {selectedService} ({modality})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Fecha y Hora:</span>
                  <strong className="text-stone-900 capitalize">
                    {currentDayObj?.fullLabel} · {selectedTime} hrs
                  </strong>
                </div>
                {modality === 'Presencial' && (
                  <div className="pt-1 border-t border-stone-200/70 text-stone-600">
                    <strong>Dirección:</strong> {selectedProf?.presencialAddress}
                  </div>
                )}
              </div>

              <form onSubmit={handleConfirmarCita} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                      Nombre y Apellido
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                      />
                      <input
                        required
                        type="text"
                        value={patientData.nombre}
                        onChange={(e) =>
                          setPatientData({ ...patientData, nombre: e.target.value })
                        }
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                        placeholder="Ej. Camila Vergara"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                      RUT del Paciente
                    </label>
                    <input
                      required
                      type="text"
                      value={patientData.rut}
                      onChange={(e) =>
                        setPatientData({ ...patientData, rut: e.target.value })
                      }
                      className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                      placeholder="Ej. 18.456.789-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                    Correo Electrónico (Para comprobante oficial)
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      required
                      type="email"
                      value={patientData.email}
                      onChange={(e) =>
                        setPatientData({ ...patientData, email: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#2C4A3B]"
                      placeholder="camila@ejemplo.cl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                    Teléfono Móvil (WhatsApp)
                  </label>
                  <div className="flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:border-[#2C4A3B]">
                    <div className="pl-4 pr-3 py-3.5 bg-stone-50 border-r border-stone-200 flex items-center gap-1.5 text-sm font-semibold text-stone-600 select-none">
                      <Phone size={15} className="text-[#2C4A3B]" />
                      <span>+56 9</span>
                    </div>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      value={patientData.telefonoOchoDigitos}
                      onChange={handlePhoneInput}
                      className="w-full px-4 py-3.5 text-sm focus:outline-none bg-transparent tracking-wider font-medium"
                      placeholder="61699991"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || patientData.telefonoOchoDigitos.length < 8}
                  className="w-full mt-4 py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_10px_25px_rgb(44,74,59,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Confirmando tu espacio...' : 'Confirmar Reserva Clínica'}
                  {!isSubmitting && <ChevronRight size={18} />}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 shadow-[0_20px_60px_rgb(44,74,59,0.08)] border border-[#E4ECE7] text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                className="w-20 h-20 bg-[#EBF3EE] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2C4A3B]/15"
              >
                <CheckCircle2 size={40} className="text-[#2C4A3B]" />
              </motion.div>

              <span className="text-xs font-bold uppercase tracking-widest text-[#2C4A3B] block mb-2">
                Espacio Confirmado
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
                Te esperamos, {patientData.nombre.split(' ')[0]}
              </h2>
              <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto mb-6">
                Tu sesión de <strong>{selectedService}</strong> ({modality}) con{' '}
                <strong>{selectedProf?.name}</strong> quedó agendada para el{' '}
                <strong>{currentDayObj?.fullLabel}</strong> a las{' '}
                <strong>{selectedTime} hrs</strong>.
              </p>

              <div className="bg-[#F9F8F6] rounded-2xl p-4 text-xs text-stone-600 border border-[#E4ECE7] mb-8 max-w-md mx-auto space-y-1.5 text-left">
                <p>
                  <strong>Comprobante enviado a:</strong> {patientData.email}
                </p>
                <p>
                  <strong>
                    {modality === 'Presencial' ? 'Dirección Presencial:' : 'Acceso Online:'}
                  </strong>{' '}
                  {modality === 'Presencial'
                    ? selectedProf?.presencialAddress
                    : selectedProf?.onlineRoomUrl}
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
                  onClick={resetBooking}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all"
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
    <main className="min-h-screen bg-[#F9F8F6] text-stone-800 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#2C4A3B]/15 selection:text-[#2C4A3B]">
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 rounded-full bg-[#2C4A3B]/5 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#C87D65]/10 blur-3xl" />

      <Suspense fallback={<BookingGlassSkeleton />}>
        <CentroBookingContent />
      </Suspense>

      <footer className="w-full text-center py-6 text-xs text-stone-400 z-10">
        Kairós Clínico · Infraestructura de Salud Mental
      </footer>
    </main>
  );
}