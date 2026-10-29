'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  CalendarHeart, Clock, User, Phone, Mail, 
  CreditCard, Loader2, CheckCircle, AlertCircle, ChevronLeft
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, setHours, setMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Generamos los próximos 14 días para el calendario
const today = startOfToday();
const next14Days = Array.from({ length: 14 }).map((_, i) => addDays(today, i));
// Horario de atención estándar: 9:00 a 18:00
const availableHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function BookingCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.serviceId as string;

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    telefono: ''
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, message: string }>({ type: null, message: '' });

  // Cargar horas ocupadas al cambiar el día
  useEffect(() => {
    async function fetchBookedSlots() {
      setLoadingSlots(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('start_time')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .eq('consent_accepted', true); // Solo contamos citas válidas

      if (!error && data) {
        // Extraemos solo las horas que ya están tomadas
        const hours = data.map(appt => parseISO(appt.start_time).getHours().toString());
        setBookedSlots(hours);
      }
      setLoadingSlots(false);
    }
    
    fetchBookedSlots();
    setSelectedTime(null); // Resetear hora al cambiar de día
  }, [selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTime === null) return;
    
    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    // Construir la fecha exacta de inicio y fin
    const startDateTime = setMinutes(setHours(selectedDate, selectedTime), 0);
    const endDateTime = setMinutes(setHours(selectedDate, selectedTime + 1), 0);

    const { error } = await supabase.from('appointments').insert([{
      service_id: serviceId,
      patient_name: formData.nombre,
      patient_rut: formData.rut,
      patient_email: formData.email,
      patient_phone: formData.telefono,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      consent_accepted: true,
      modality: 'Presencial' // O el valor por defecto que manejes
    }]);

    if (error) {
      setStatus({ type: 'error', message: 'Error al reservar. Es posible que el horario ya fue tomado.' });
      setIsSubmitting(false);
    } else {
      setStatus({ type: 'success', message: '¡Reserva confirmada con éxito!' });
      setTimeout(() => router.push('/portal-pacientes'), 2500);
    }
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-4 font-sans text-stone-800 selection:bg-[#E4ECE7]">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-white text-[#5F8575] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-2 border border-stone-100">
            <CalendarHeart strokeWidth={1.5} size={30} />
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">Agenda tu sesión</h1>
          <p className="text-stone-500">Selecciona el mejor horario para ti y completa tus datos.</p>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden">
          
          {/* STEP CONTROLLER */}
          <div className="flex border-b border-stone-100">
            <div className={`flex-1 text-center py-4 text-sm font-semibold transition-colors ${step === 1 ? 'text-[#2C4A3B] border-b-2 border-[#5F8575]' : 'text-stone-400'}`}>
              1. Fecha y Hora
            </div>
            <div className={`flex-1 text-center py-4 text-sm font-semibold transition-colors ${step === 2 ? 'text-[#2C4A3B] border-b-2 border-[#5F8575]' : 'text-stone-400'}`}>
              2. Tus Datos
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              
              {/* --- STEP 1: CALENDARIO Y HORAS --- */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  
                  {/* Selector de Fecha Horizontal */}
                  <div>
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Selecciona un día</h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                      {next14Days.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        // Excluir domingos si lo deseas (date.getDay() !== 0)
                        if (date.getDay() === 0) return null; 

                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`snap-start shrink-0 w-[72px] h-[90px] rounded-2xl flex flex-col items-center justify-center border transition-all
                              ${isSelected 
                                ? 'bg-[#5F8575] border-[#5F8575] text-white shadow-md' 
                                : 'bg-white border-stone-200 text-stone-600 hover:border-[#5F8575] hover:bg-[#F4F7F5]'
                              }
                            `}
                          >
                            <span className="text-[11px] font-semibold uppercase opacity-80">
                              {format(date, 'EEE', { locale: es })}
                            </span>
                            <span className="text-2xl font-bold mt-1">
                              {format(date, 'd')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de Horas */}
                  <div>
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      <span>Horarios Disponibles</span>
                      {loadingSlots && <Loader2 size={14} className="animate-spin text-[#5F8575]" />}
                    </h3>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableHours.map(hour => {
                        const isBooked = bookedSlots.includes(hour.toString());
                        const isSelected = selectedTime === hour;
                        
                        return (
                          <button
                            key={hour}
                            disabled={isBooked || loadingSlots}
                            onClick={() => setSelectedTime(hour)}
                            className={`py-3 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-1.5
                              ${isBooked 
                                ? 'bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed line-through' 
                                : isSelected
                                  ? 'bg-[#2C4A3B] border-[#2C4A3B] text-white shadow-md'
                                  : 'bg-white border-stone-200 text-stone-700 hover:border-[#5F8575] hover:bg-[#F4F7F5]'
                              }
                            `}
                          >
                            <Clock size={14} className={isSelected ? 'text-white' : 'text-stone-400'} />
                            {`${hour}:00`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => setStep(2)} 
                      disabled={selectedTime === null}
                      className="w-full py-4 bg-[#2C4A3B] text-white font-semibold rounded-xl hover:bg-[#233b2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Continuar al siguiente paso
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 2: FORMULARIO PACIENTE --- */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  
                  <div className="bg-[#F4F7F5] p-4 rounded-xl border border-[#E4ECE7] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#5F8575] font-bold uppercase tracking-widest">Resumen de Cita</p>
                      <p className="text-sm font-semibold text-[#2C4A3B] mt-1 capitalize">
                        {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime}:00 hrs
                      </p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-[#5F8575] hover:text-[#2C4A3B] text-sm font-semibold underline underline-offset-4">
                      Cambiar
                    </button>
                  </div>

                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">RUT</label>
                        <div className="relative">
                          <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input required type="text" placeholder="12.345.678-9" className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input required type="text" placeholder="Juan Pérez" className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input required type="email" placeholder="correo@ejemplo.com" className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Teléfono</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input required type="tel" placeholder="+569 1234 5678" className="w-full pl-10 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {status.type && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`flex items-start gap-2 p-3 rounded-xl text-sm overflow-hidden ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}>
                        {status.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                        <p className="leading-relaxed font-medium">{status.message}</p>
                      </motion.div>
                    )}

                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setStep(1)} className="px-5 py-4 border border-stone-200 text-stone-600 font-semibold rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center">
                        <ChevronLeft size={20} />
                      </button>
                      <button type="submit" disabled={isSubmitting || status.type === 'success'} className="flex-1 bg-[#2C4A3B] text-white font-semibold py-4 rounded-xl transition-all hover:bg-[#233b2f] hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 size={20} className="animate-spin text-[#E4ECE7]" /> : 'Confirmar Reserva'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}