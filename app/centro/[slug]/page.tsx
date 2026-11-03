'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Descomenta según tu setup

export default function CentroBookingPage({ params }: { params: { slug: string } }) {
  // const supabase = createClientComponentClient();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    // Datos hardcodeados para el ejemplo visual. En producción vendrían de la selección previa.
    fecha: '15 de Noviembre, 2026', 
    hora: '14:30',
    profesional: 'Dr. Alejandro Kairós'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. GUARDAR EN SUPABASE (Descomenta y adapta a tu tabla)
      /* 
      const { error } = await supabase.from('appointments').insert([{
        patient_name: formData.nombre,
        patient_email: formData.email,
        patient_phone: formData.telefono,
        date: formData.fecha,
        time: formData.hora,
        professional_name: formData.profesional,
        center_slug: params.slug
      }]);
      if (error) throw error;
      */

      // 2. DISPARAR WEBHOOK EN SEGUNDO PLANO (Fire-and-forget)
      fetch('/api/notificaciones/confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.nombre,
          patientEmail: formData.email,
          patientPhone: formData.telefono, 
          date: formData.fecha,
          time: formData.hora,
          professionalName: formData.profesional,
          centerName: "Kairós Clínico" 
        }),
      }).catch(err => console.error('Error silencioso en webhook Meta/Resend:', err));

      // 3. UI OPTIMISTA: Mostrar éxito de inmediato
      setStep('success');

    } catch (error) {
      console.error("Error al guardar la cita:", error);
      alert('Hubo un problema al agendar tu cita. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans text-stone-800">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E4ECE7]"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Confirma tu cita</h1>
              <p className="text-sm text-stone-500">Ingresa tus datos para finalizar la reserva.</p>
            </div>

            {/* Resumen de la cita (Glassmorphism sutil) */}
            <div className="bg-stone-50/50 rounded-2xl p-4 mb-8 border border-stone-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Calendar size={16} className="text-[#2C4A3B]" />
                <span className="font-medium">{formData.fecha}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Clock size={16} className="text-[#2C4A3B]" />
                <span className="font-medium">{formData.hora} hrs</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <User size={16} className="text-[#2C4A3B]" />
                <span className="font-medium">{formData.profesional}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmarCita} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    required
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 focus:border-[#2C4A3B] transition-all"
                    placeholder="Ej. Camila Vergara"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 focus:border-[#2C4A3B] transition-all"
                    placeholder="camila@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider ml-1">Teléfono (WhatsApp)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    required
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 focus:border-[#2C4A3B] transition-all"
                    placeholder="569XXXXXXXX"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-4 px-6 bg-[#2C4A3B] hover:bg-[#233B2F] text-white rounded-xl font-medium transition-all duration-300 shadow-[0_8px_20px_rgb(44,74,59,0.15)] disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? 'Procesando reserva...' : 'Agendar Cita'}
                {!isSubmitting && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E4ECE7] text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={40} className="text-emerald-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-stone-900 mb-3">¡Reserva Confirmada!</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              Tu cita con {formData.profesional} ha sido agendada para el <strong>{formData.fecha}</strong> a las <strong>{formData.hora} hrs</strong>.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-500 border border-stone-100">
              Te hemos enviado un comprobante a tu correo y un mensaje a tu WhatsApp con los detalles.
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 text-sm font-medium text-[#2C4A3B] hover:text-[#233B2F] transition-colors"
            >
              Volver al inicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}