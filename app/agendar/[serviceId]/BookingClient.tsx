'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, ShieldCheck, CheckCircle2, User, 
  Mail, Phone, FileText, ArrowRight, ArrowLeft, Loader2,
  Sparkles, Check, ChevronLeft, ChevronRight, Video, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';

const AVAILABLE_HOURS = [
  '09:00', '10:00', '11:00', '12:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function BookingClient() {
  const params = useParams();
  const serviceId = (params?.serviceId as string) || '';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingService, setLoadingService] = useState(true);
  const [service, setService] = useState<any>(null);

  // Calendario y Horas
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date | null>(null);

  // Formulario de Admisión
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentRut, setDocumentRut] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+569');
  const [prevision, setPrevision] = useState('Fonasa');
  const [modality, setModality] = useState<'presencial' | 'online'>('presencial');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const today = new Date();
    setCurrentMonthDate(today);
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(ymd);

    async function loadService() {
      try {
        setLoadingService(true);
        if (serviceId) {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', serviceId)
            .maybeSingle();

          if (!error && data) {
            setService(data);
            return;
          }
        }

        // Fallback clínico si el servicio aún no tiene ID en BD
        setService({
          id: serviceId || 'default',
          name: 'Psicoterapia Individual Adultos',
          price: 35000,
          duration: 50,
          description: 'Espacio clínico de contención, diagnóstico y acompañamiento terapéutico confidencial.',
        });
      } catch (err) {
        console.error('Error cargando servicio:', err);
      } finally {
        setLoadingService(false);
      }
    }

    loadService();
  }, [serviceId]);

  const handleNextMonth = () => {
    if (!currentMonthDate) return;
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    if (!currentMonthDate) return;
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullName = `${firstName} ${lastName}`.trim();
    const payload = {
      patient_name: fullName,
      patient_email: email,
      patient_phone: phone,
      patient_rut: documentRut,
      patient_prevision: prevision,
      date: selectedDate,
      time: selectedTime,
      modality,
      notes: clinicalNotes,
      status: 'pendiente',
      price: service?.price || 35000,
      center_id: env.centerId,
    };

    try {
      await supabase.from('appointments').insert([payload]);
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error al registrar cita:', err);
      setBookingSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingService || !currentMonthDate) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={36} />
      </div>
    );
  }

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const rawFirstDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabecera de Confianza */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAE8E3] text-[#2C4A3B] text-xs font-semibold tracking-wide">
            <ShieldCheck size={16} /> Entorno Clínico Encriptado y Confidencial
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Agenda tu Sesión Terapéutica
          </h1>
          <p className="text-sm sm:text-base text-stone-500 max-w-xl mx-auto">
            Elige tu día, franja horaria preferida y completa tus datos de admisión médica para confirmar tu hora.
          </p>
        </header>

        {/* Indicador de Pasos */}
        <div className="grid grid-cols-3 max-w-md mx-auto text-center gap-2">
          {[
            { num: 1, label: 'Servicio' },
            { num: 2, label: 'Fecha y Hora' },
            { num: 3, label: 'Admisión' },
          ].map((s) => (
            <div key={s.num} className="space-y-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s.num ? 'bg-[#2C4A3B]' : 'bg-stone-200'
                }`} 
              />
              <span className={`text-[11px] font-bold ${
                step >= s.num ? 'text-[#2C4A3B]' : 'text-stone-400'
              }`}>
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-stone-200/70 p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <AnimatePresence mode="wait">
            
            {/* PASO 1: DETALLES DEL SERVICIO */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="bg-[#F4F7F5] border border-[#E4ECE7] p-6 sm:p-8 rounded-3xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#2C4A3B]">Prestación Seleccionada</span>
                      <h2 className="text-2xl font-bold text-stone-900 mt-1">{service?.name}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-[#2C4A3B] block">
                        ${Number(service?.price || 35000).toLocaleString('es-CL')}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">Reembolsable Isapre / Seguro</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {service?.description}
                  </p>

                  <div className="pt-4 border-t border-[#DDE5E0] flex items-center gap-6 text-xs text-stone-600 font-semibold">
                    <span className="flex items-center gap-2">
                      <Clock size={16} className="text-[#2C4A3B]" /> {service?.duration || 50} minutos
                    </span>
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#2C4A3B]" /> Ficha Clínica Digital
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                    Modalidad de Atención
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setModality('presencial')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        modality === 'presencial'
                          ? 'border-[#2C4A3B] bg-[#F4F7F5] shadow-xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                        <MapPin size={16} className="text-[#2C4A3B]" /> Presencial en Centro
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Atención directa en boxes clínicos equipados.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModality('online')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        modality === 'online'
                          ? 'border-[#2C4A3B] bg-[#F4F7F5] shadow-xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                        <Video size={16} className="text-[#2C4A3B]" /> Online (Google Meet)
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Enlace seguro enviado por WhatsApp y correo.</p>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-[#2C4A3B] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#233b2f] transition-all flex items-center gap-2 shadow-sm"
                  >
                    Seleccionar Fecha y Hora <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 2: SELECCIÓN DE FECHA Y HORA */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Calendario */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <h3 className="font-bold text-base text-stone-900 capitalize">
                        {monthNames[currentMonth]} {currentYear}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600">
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={handleNextMonth} className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10 rounded-xl bg-stone-50/30" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedTime('');
                            }}
                            className={`h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#2C4A3B] text-white shadow-xs scale-105'
                                : 'hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Franjas Horarias */}
                  <div className="lg:col-span-5 space-y-3">
                    <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider">
                      Horas Disponibles
                    </h3>
                    <p className="text-xs text-stone-500">
                      Fecha: <strong className="text-stone-800">{selectedDate || 'Selecciona un día'}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {AVAILABLE_HOURS.map((hr) => (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => setSelectedTime(hr)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedTime === hr
                              ? 'border-[#2C4A3B] bg-[#2C4A3B] text-white shadow-xs'
                              : 'border-stone-200 bg-white hover:border-[#2C4A3B] text-stone-800'
                          }`}
                        >
                          {hr} hrs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setStep(1)}
                    className="text-stone-600 px-6 py-3 rounded-2xl text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} /> Volver
                  </button>
                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(3)}
                    className="bg-[#2C4A3B] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#233b2f] transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar a Admisión <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: FORMULARIO DE ADMISIÓN */}
            {step === 3 && !bookingSuccess && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <form onSubmit={handleSubmitBooking} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Sofía"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">Apellido *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Valenzuela"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">RUT / Documento *</label>
                      <input
                        type="text"
                        required
                        placeholder="12.345.678-9"
                        value={documentRut}
                        onChange={(e) => setDocumentRut(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">Previsión Médica</label>
                      <select
                        value={prevision}
                        onChange={(e) => setPrevision(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      >
                        <option value="Fonasa">Fonasa</option>
                        <option value="Isapre">Isapre</option>
                        <option value="Particular">Particular</option>
                        <option value="Dipreca / Capredena">Dipreca / Capredena</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="paciente@correo.cl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">Teléfono (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+56912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Motivo de Consulta (Confidencial)</label>
                    <textarea
                      rows={2}
                      placeholder="Breve mención de los temas o síntomas que deseas abordar..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-stone-600 px-6 py-3 rounded-2xl text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5"
                    >
                      <ArrowLeft size={16} /> Volver a Horarios
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#2C4A3B] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-[#233b2f] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Registrando Cita...
                        </>
                      ) : (
                        <>
                          <Check size={16} /> Confirmar Reserva ({selectedDate} • {selectedTime} hrs)
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* CONFIRMACIÓN EXITOSA */}
            {bookingSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-5"
              >
                <div className="h-20 w-20 bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] rounded-3xl mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-stone-900">¡Tu Hora ha Sido Reservada!</h3>
                  <p className="text-sm text-stone-500 max-w-md mx-auto">
                    Hemos registrado tu cita para el <strong>{selectedDate} a las {selectedTime} hrs</strong>.
                    Te enviamos un correo con los detalles y nuestro asistente de WhatsApp te recordará 24 horas antes.
                  </p>
                </div>
                <div className="pt-4">
                  <a
                    href="/"
                    className="inline-block bg-[#2C4A3B] text-white px-8 py-3.5 rounded-2xl font-bold text-xs hover:bg-[#233b2f] transition-all"
                  >
                    Volver al Inicio
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}