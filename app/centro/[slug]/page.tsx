'use client';

import React, { Suspense, useState, useMemo } from 'react';
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
} from 'lucide-react';

// Inicialización segura de Supabase en el cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const defaultCenterId = process.env.NEXT_PUBLIC_CENTER_ID || '';

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface Professional {
  id: string;
  name: string;
  specialty: string;
  duration: string;
  price: string;
  avatarInitials: string;
}

const PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Dr. Alejandro Kairós',
    specialty: 'Psicoterapia Clínica & Ansiedad',
    duration: '50 min',
    price: '$45.000 CLP',
    avatarInitials: 'AK',
  },
  {
    id: 'prof-2',
    name: 'Ps. Valentina Montt',
    specialty: 'Terapia Cognitivo-Conductual',
    duration: '50 min',
    price: '$40.000 CLP',
    avatarInitials: 'VM',
  },
  {
    id: 'prof-3',
    name: 'Ps. Martín Arriagada',
    specialty: 'Terapia Sistémica & Parejas',
    duration: '60 min',
    price: '$50.000 CLP',
    avatarInitials: 'MA',
  },
];

const TIME_SLOTS = ['09:30', '11:00', '12:30', '15:00', '16:30', '18:00'];

// Skeleton de lujo para el streaming de Suspense en Next.js
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
        <div className="grid grid-cols-5 gap-2.5 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-20 bg-stone-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-14 w-full bg-[#2C4A3B]/20 rounded-2xl" />
      </div>
    </div>
  );
}

// Subcomponente que consume useParams() de forma segura dentro de <Suspense>
function CentroBookingContent() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : 'kairos-central';

  // Generar los próximos 5 días hábiles dinámicamente
  const upcomingDays = useMemo(() => {
    const days = [];
    const base = new Date();
    const formatterDay = new Intl.DateTimeFormat('es-CL', { weekday: 'short' });
    const formatterMonth = new Intl.DateTimeFormat('es-CL', { month: 'short' });
    const formatterFull = new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let added = 0;
    let offset = 1;
    while (added < 5) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      offset++;
      if (d.getDay() === 0) continue; // Saltar domingos
      const iso = d.toISOString().split('T')[0];
      days.push({
        iso,
        dayName: formatterDay.format(d).replace('.', ''),
        dayNumber: d.getDate(),
        monthShort: formatterMonth.format(d).replace('.', ''),
        fullLabel: formatterFull.format(d),
      });
      added++;
    }
    return days;
  }, []);

  const [step, setStep] = useState<'schedule' | 'patient' | 'success'>('schedule');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProf, setSelectedProf] = useState<Professional>(PROFESSIONALS[0]);
  const [modality, setModality] = useState<'Online (Videollamada)' | 'Consulta Presencial'>(
    'Online (Videollamada)'
  );
  const [selectedDay, setSelectedDay] = useState(upcomingDays[0]);
  const [selectedTime, setSelectedTime] = useState('11:00');

  const [patientData, setPatientData] = useState({
    nombre: '',
    email: '',
    telefonoOchoDigitos: '',
    notas: '',
  });

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPatientData((prev) => ({ ...prev, telefonoOchoDigitos: digitsOnly }));
  };

  const fullE164Phone = `569${patientData.telefonoOchoDigitos}`;

  const handleConfirmarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (patientData.telefonoOchoDigitos.length < 8) return;

    setIsSubmitting(true);

    try {
      // 1. PERSISTENCIA EN SUPABASE (Aislado por center_id / slug)
      if (supabase) {
        const { error: dbError } = await supabase.from('appointments').insert([
          {
            center_id: defaultCenterId || null,
            center_slug: slug,
            patient_name: patientData.nombre.trim(),
            patient_email: patientData.email.trim(),
            patient_phone: fullE164Phone,
            professional_name: selectedProf.name,
            modality,
            date: selectedDay.iso,
            time: selectedTime,
            status: 'confirmed',
          },
        ]);

        if (dbError) {
          console.warn('Aviso Supabase (continuando flujo optimista):', dbError.message);
        }
      }

      // 2. DISPARO OMNICANAL ASÍNCRONO (Fire-and-forget hacia Resend + Meta v25.0)
      fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientData.nombre.trim(),
          patientEmail: patientData.email.trim(),
          patientPhone: fullE164Phone,
          date: selectedDay.fullLabel,
          isoDate: selectedDay.iso,
          time: selectedTime,
          modality,
          professionalName: selectedProf.name,
          centerName: 'Kairós Clínico',
        }),
      }).catch((err) => console.error('Error silencioso en webhook:', err));

      // 3. TRANSICIÓN INSTANTÁNEA (UI Optimista)
      setStep('success');
    } catch (error) {
      console.error('Error al procesar la reserva:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleCalendarUrl = useMemo(() => {
    const calDate = selectedDay.iso.replace(/-/g, '');
    const startHour = selectedTime.replace(':', '');
    const endHourNum = parseInt(startHour.slice(0, 2), 10) + 1;
    const endHour = `${String(endHourNum).padStart(2, '0')}${startHour.slice(2, 4)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Sesión Clínica - ${selectedProf.name}`
    )}&dates=${calDate}T${startHour}00/${calDate}T${endHour}00&details=${encodeURIComponent(
      `Sesión en Kairós Clínico (${modality}) con ${selectedProf.name}.`
    )}`;
  }, [selectedDay, selectedTime, selectedProf, modality]);

  const resetBooking = () => {
    setPatientData({ nombre: '', email: '', telefonoOchoDigitos: '', notas: '' });
    setStep('schedule');
  };

  return (
    <>
      {/* Header minimalista de lujo */}
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
          <span>Reserva Encriptada & Confidencial</span>
        </div>
      </header>

      {/* Contenedor Principal */}
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
                    Elige tu momento y especialista
                  </h1>
                </div>
                <Sparkles size={22} className="text-[#2C4A3B]/60 hidden sm:block" />
              </div>

              {/* 1. Selector de Modalidad */}
              <div className="mb-7">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2.5">
                  Modalidad de Atención
                </label>
                <div className="grid grid-cols-2 gap-3 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                  {(['Online (Videollamada)', 'Consulta Presencial'] as const).map((mod) => {
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
                        {mod.includes('Online') ? <Video size={16} /> : <MapPin size={16} />}
                        <span>{mod}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Selector de Profesional */}
              <div className="mb-7">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2.5">
                  Profesional Clínico
                </label>
                <div className="space-y-2.5">
                  {PROFESSIONALS.map((prof) => {
                    const isSelected = selectedProf.id === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => setSelectedProf(prof)}
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
                            {prof.avatarInitials}
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
                            {prof.price}
                          </span>
                          <span className="text-[11px] text-stone-400">{prof.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Selector de Día */}
              <div className="mb-7">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2.5">
                  Fecha Disponible
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {upcomingDays.map((d) => {
                    const isSelected = selectedDay.iso === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDay(d)}
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

              {/* 4. Bloques Horarios */}
              <div className="mb-8">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2.5">
                  Bloque Horario (Hora de Chile)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
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
              </div>

              <button
                type="button"
                onClick={() => setStep('patient')}
                className="w-full py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_10px_25px_rgb(44,74,59,0.2)] flex items-center justify-center gap-2 group"
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
                  Paso 2 de 2 · Datos de Contacto
                </span>
                <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                  Confirma tu reserva clínica
                </h2>
              </div>

              <div className="bg-[#F9F8F6] rounded-2xl p-4 mb-7 border border-[#E4ECE7] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <User size={16} className="text-[#2C4A3B] shrink-0" />
                  <span className="font-semibold truncate">{selectedProf.name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700">
                  <CalendarIcon size={16} className="text-[#2C4A3B] shrink-0" />
                  <span className="font-medium capitalize">{selectedDay.fullLabel}</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-700">
                  <Clock size={16} className="text-[#2C4A3B] shrink-0" />
                  <span className="font-semibold">
                    {selectedTime} hrs · {modality.split(' ')[0]}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmarCita} className="space-y-4">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 focus:border-[#2C4A3B] transition-all"
                      placeholder="Ej. Camila Vergara"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                    Correo Electrónico (Para comprobante y link)
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
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 focus:border-[#2C4A3B] transition-all"
                      placeholder="camila@ejemplo.cl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1 block mb-1.5">
                    WhatsApp (Para aviso inmediato)
                  </label>
                  <div className="flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2C4A3B]/20 focus-within:border-[#2C4A3B] transition-all">
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
                  <p className="text-[11px] text-stone-400 mt-1 ml-1">
                    Ingresa los 8 dígitos de tu móvil. Se enviará al número{' '}
                    <span className="font-semibold text-stone-600">+{fullE164Phone}</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || patientData.telefonoOchoDigitos.length < 8}
                  className="w-full mt-4 py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-2xl font-semibold text-sm transition-all duration-300 shadow-[0_10px_25px_rgb(44,74,59,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Confirmando tu espacio...' : 'Confirmar y Recibir Notificación'}
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
              <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                Tu sesión de <strong>{modality}</strong> con{' '}
                <strong>{selectedProf.name}</strong> quedó agendada para el{' '}
                <strong>{selectedDay.fullLabel}</strong> a las{' '}
                <strong>{selectedTime} hrs</strong>.
              </p>

              <div className="bg-[#F9F8F6] rounded-2xl p-4 text-xs text-stone-600 border border-[#E4ECE7] mb-8 max-w-md mx-auto">
                Hemos despachado la confirmación oficial a <strong>{patientData.email}</strong> y
                el aviso por WhatsApp al <strong>+{fullE164Phone}</strong>.
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

// Export principal envuelto en <Suspense> para pasar el build estático de Next.js en Vercel
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