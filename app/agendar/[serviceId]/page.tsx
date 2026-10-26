'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function DirectBookingContent() {
  const params = useParams();
  const serviceId = params.serviceId;

  const [service, setService] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [centersList, setCentersList] = useState<any[]>([]);
  const [boxesList, setBoxesList] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);

  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', reason: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const standardTimes = ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    async function loadServiceData() {
      if (!serviceId) return;
      
      const { data: servData } = await supabase.from('services').select('*').eq('id', serviceId).single();
      if (servData) {
        setService(servData);
        const { data: profData } = await supabase.from('professionals').select('*').eq('id', servData.professional_id).single();
        if (profData) setProfessional(profData);
      }

      const [{ data: cents }, { data: boxs }] = await Promise.all([
        supabase.from('centers').select('*').order('name'),
        supabase.from('boxes').select('*')
      ]);
      if (cents) setCentersList(cents);
      if (boxs) setBoxesList(boxs);
    }
    loadServiceData();
  }, [serviceId]);

  useEffect(() => {
    async function loadBusySlots() {
      if (!selectedDate || !selectedCenter) return;
      const startOfDay = new Date(`${selectedDate}T00:00:00-03:00`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59-03:00`).toISOString();
      
      const { data } = await supabase.rpc('get_busy_slots', {
        target_center: selectedCenter,
        start_day: startOfDay,
        end_day: endOfDay
      });
      if (data) setBusySlots(data);
    }
    loadBusySlots();
  }, [selectedDate, selectedCenter]);

  const boxesInCenter = boxesList.filter(b => b.center_id === selectedCenter);
  const totalBoxes = boxesInCenter.length;

  const availableTimes = standardTimes.filter(time => {
    if (!selectedDate || totalBoxes === 0 || !professional) return false;
    const timeISO = new Date(`${selectedDate}T${time}:00-03:00`).toISOString();
    const isProfTaken = busySlots.some(slot => new Date(slot.start_time).toISOString() === timeISO && slot.professional_id === professional.id);
    if (isProfTaken) return false;
    const takenBoxesCount = busySlots.filter(slot => new Date(slot.start_time).toISOString() === timeISO).length;
    return takenBoxesCount < totalBoxes;
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setStatus('Debes aceptar el consentimiento de privacidad.');
      return;
    }
    setLoading(true); setStatus('Procesando reserva...');
    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00-03:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
    
    const takenBoxesIds = busySlots
      .filter(slot => new Date(slot.start_time).toISOString() === startDateTime)
      .map(slot => slot.box_id);
    const availableBox = boxesInCenter.find(b => !takenBoxesIds.includes(b.id));

    if (!availableBox) {
      setStatus('Lo sentimos, esa hora acaba de ser tomada.');
      setLoading(false); return;
    }

    const { error } = await supabase.from('appointments').insert([{
      center_id: selectedCenter,
      box_id: availableBox.id,
      professional_id: professional.id,
      service_id: service.id,
      patient_name: formData.name,
      patient_phone: formData.phone,
      patient_reason: formData.reason,
      start_time: startDateTime,
      end_time: endDateTime,
      consent_accepted: true
    }]);

    if (!error) {
      setStatus('¡Cita agendada con éxito!');
      setFormData({ name: '', phone: '', reason: '' });
      setConsentAccepted(false);
      setSelectedDate(''); setSelectedTime(''); setSelectedCenter('');
      setBusySlots([...busySlots, { start_time: startDateTime, box_id: availableBox.id, professional_id: professional.id }]);
    } else {
      setStatus('Error al agendar. Intenta nuevamente.');
    }
    setLoading(false);
  };

  if (!service || !professional) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">Cargando enlace de reserva...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        
        <div className="mb-8 text-center bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/60">
          <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Reserva Directa</span>
          <h1 className="text-2xl font-extrabold text-slate-800 mt-3">{service.name}</h1>
          <p className="text-slate-600 font-medium mt-1">Con {professional.name}</p>
          <p className="text-indigo-600 font-bold text-lg mt-2">${service.price.toLocaleString('es-CL')}</p>
        </div>

        <form onSubmit={handleSchedule} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">1. Selecciona la Sede</label>
            <select required className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 text-slate-900 font-medium transition-all" 
              value={selectedCenter} 
              onChange={(e) => { setSelectedCenter(e.target.value); setSelectedDate(''); setSelectedTime(''); }}>
              <option value="" disabled>Elige el centro de atención...</option>
              {centersList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCenter && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">2. Fecha de la sesión</label>
              <input type="date" required className="w-full border border-slate-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 bg-slate-50 font-medium transition-all" 
                value={selectedDate} 
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} />
            </div>
          )}

          {selectedDate && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">3. Horarios disponibles</label>
              {availableTimes.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm font-medium text-center">No hay horas libres este día. Selecciona otra fecha.</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableTimes.map(time => (
                    <button key={time} type="button" onClick={() => setSelectedTime(time)}
                      className={`p-3 text-sm font-bold rounded-xl border transition-all ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTime && (
            <div className="space-y-4 pt-6 border-t border-slate-100 animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">4. Tus Datos Confidenciales</label>
              <input type="text" placeholder="Nombre completo" required className="w-full border border-slate-200 p-3.5 rounded-xl text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-600 font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="Teléfono de contacto" required className="w-full border border-slate-200 p-3.5 rounded-xl text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-600 font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <textarea placeholder="Motivo de consulta (Confidencial - Opcional)" className="w-full border border-slate-200 p-3.5 rounded-xl text-slate-900 bg-slate-50 focus:ring-2 focus:ring-indigo-600 h-24 resize-none font-medium" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input type="checkbox" id="consent" required className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} />
                <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">
                  Autorizo el tratamiento confidencial de mis datos conforme a la <strong>Ley 21.719</strong> y <strong>Ley 20.584</strong>.
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold text-base py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50">
                {loading ? 'Procesando...' : '🔒 Confirmar Reserva'}
              </button>
            </div>
          )}
          
          {status && <div className={`p-4 rounded-xl text-center font-semibold text-sm ${status.includes('éxito') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>{status}</div>}
        </form>
      </div>
    </main>
  );
}

// Wrapper de Suspense requerido por Next.js
export default function DirectServiceBooking() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">Preparando enlace...</div>}>
      <DirectBookingContent />
    </Suspense>
  );
}