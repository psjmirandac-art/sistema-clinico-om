'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz'; // Necesitaremos esta librería para forzar la zona horaria

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function WorkshopContent() {
  const params = useParams();
  const workshopId = params.workshopId as string;

  const [workshop, setWorkshop] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [center, setCenter] = useState<any>(null);
  const [registrationsCount, setRegistrationsCount] = useState(0);

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, text: string }>({ type: null, text: '' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function loadWorkshopData() {
      if (!workshopId) return;

      const { data: wsData, error: wsError } = await supabase.from('workshops').select('*').eq('id', workshopId).single();
      
      if (wsError || !wsData) {
        setInitialLoading(false);
        return;
      }

      setWorkshop(wsData);
      
      const [{ data: prof }, { data: cent }, { count }] = await Promise.all([
        supabase.from('professionals').select('*').eq('id', wsData.professional_id).single(),
        supabase.from('centers').select('*').eq('id', wsData.center_id).single(),
        supabase.from('workshop_registrations').select('*', { count: 'exact', head: true }).eq('workshop_id', workshopId)
      ]);

      if (prof) setProfessional(prof);
      if (cent) setCenter(cent);
      if (count !== null) setRegistrationsCount(count);
      
      setInitialLoading(false);
    }
    loadWorkshopData();
  }, [workshopId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setStatus({ type: 'error', text: 'Debes aceptar el consentimiento de privacidad.' });
      return;
    }
    setLoading(true);
    setStatus({ type: null, text: '' });

    if (registrationsCount >= workshop.max_capacity) {
      setStatus({ type: 'error', text: 'Lo sentimos, este taller ya completó sus cupos.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('workshop_registrations').insert([{
      workshop_id: workshop.id,
      patient_name: formData.name,
      patient_phone: formData.phone,
      consent_accepted: true
    }]);

    if (!error) {
      setStatus({ type: 'success', text: '¡Inscripción exitosa! Te esperamos en el taller.' });
      setFormData({ name: '', phone: '' });
      setConsentAccepted(false);
      setRegistrationsCount(prev => prev + 1);
    } else {
      setStatus({ type: 'error', text: 'Error al registrarse. Intenta nuevamente.' });
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#5F8575] mb-4" size={32} />
        <span className="text-stone-500 font-medium text-sm">Cargando información del taller...</span>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-[2rem] text-center shadow-sm border border-stone-100 max-w-sm">
          <AlertCircle className="mx-auto text-stone-300 mb-3" size={32} />
          <h2 className="text-stone-800 font-semibold mb-1">Taller no encontrado</h2>
          <p className="text-stone-500 text-sm">El enlace podría estar roto o el taller fue cancelado.</p>
        </div>
      </div>
    );
  }

  // FIX TIMEZONE: Forzamos la fecha del taller a la zona horaria de Chile
  const chileTimeZone = 'America/Santiago';
  const zonedDate = toZonedTime(new Date(workshop.start_time), chileTimeZone);
  
  const isFull = registrationsCount >= workshop.max_capacity;

  return (
    <main className="min-h-screen bg-[#F9F8F6] p-4 flex items-center justify-center font-sans selection:bg-[#E4ECE7]">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-stone-100"
      >
        
        {/* Header Visual */}
        <div className="mb-8 text-center bg-[#F4F7F5] p-8 rounded-[2rem] border border-[#E4ECE7]">
          <span className="bg-[#2C4A3B] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
            Taller Grupal
          </span>
          <h1 className="text-2xl font-bold text-stone-900 mt-4 leading-tight">{workshop.title}</h1>
          <p className="text-stone-500 font-medium mt-2 text-sm">Facilitado por {professional?.name}</p>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-[#5F8575] font-semibold">
            <MapPin size={14} />
            <span>{center?.name}</span>
          </div>
          <p className="text-[#2C4A3B] font-bold text-2xl mt-5 tracking-tight">${workshop.price.toLocaleString('es-CL')}</p>
        </div>

        {/* Detalles Taller */}
        <div className="mb-8 bg-stone-50 p-5 rounded-2xl border border-stone-100 text-sm text-stone-700 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-stone-400 shrink-0" />
            <div>
              <p className="font-semibold text-stone-800 capitalize">{format(zonedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
              <p className="text-stone-500 mt-0.5">{format(zonedDate, 'HH:mm')} hrs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
            <Users className="w-5 h-5 text-stone-400 shrink-0" />
            <p className="text-stone-600">
              <strong className="text-stone-800">{workshop.max_capacity - registrationsCount}</strong> de {workshop.max_capacity} cupos disponibles
            </p>
          </div>
          {workshop.description && (
            <div className="pt-3 border-t border-stone-100">
              <p className="text-stone-500 leading-relaxed text-[13px]">{workshop.description}</p>
            </div>
          )}
        </div>

        {/* Formulario / Estado */}
        {isFull ? (
          <div className="p-4 bg-stone-50 text-stone-500 border border-stone-200 rounded-xl text-center font-medium text-sm">
            Este taller ha alcanzado su capacidad máxima.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                placeholder="Ej: Juan Pérez" 
                className="w-full pl-4 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-300" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1">Teléfono</label>
              <input 
                type="tel" 
                required 
                placeholder="+569 1234 5678" 
                className="w-full pl-4 pr-4 py-3.5 border border-stone-200 rounded-xl text-sm bg-stone-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-[#5F8575]/20 focus:border-[#5F8575]/30 text-stone-800 placeholder:text-stone-300" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <div className="flex items-start gap-3 bg-[#F4F7F5] p-4 rounded-xl border border-[#E4ECE7] mt-2">
              <input 
                type="checkbox" 
                id="consent" 
                required 
                className="mt-0.5 h-4 w-4 text-[#5F8575] rounded border-stone-300 focus:ring-[#5F8575]" 
                checked={consentAccepted} 
                onChange={e => setConsentAccepted(e.target.checked)} 
              />
              <label htmlFor="consent" className="text-[11px] text-stone-600 leading-relaxed font-medium">
                Autorizo el tratamiento confidencial de mis datos para la gestión de este taller conforme a la <strong>Ley 21.719</strong>.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || status.type === 'success'} 
              className="w-full bg-[#2C4A3B] text-white font-medium py-4 rounded-xl transition-all hover:bg-[#233b2f] hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none flex justify-center items-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin text-[#E4ECE7]" /> : 'Confirmar Inscripción'}
            </button>
          </form>
        )}

        <AnimatePresence mode="wait">
          {status.type && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-start gap-2 p-4 rounded-xl text-sm overflow-hidden mt-6 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-[#F4F7F5] text-[#2C4A3B]'}`}
            >
              {status.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
              <p className="leading-relaxed font-medium">{status.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

export default function WorkshopRegistration() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-[#5F8575] mb-4" size={32} />
        <span className="text-stone-500 font-medium text-sm">Preparando formulario...</span>
      </div>
    }>
      <WorkshopContent />
    </Suspense>
  );
}