'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Obtenemos el ID del centro directamente desde las variables de entorno
const ENV_CENTER_ID = process.env.NEXT_PUBLIC_CENTER_ID || '';

export default function Agenda() {
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [centersList, setCentersList] = useState<any[]>([]);
  const [boxesList, setBoxesList] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<any[]>([]);

  // Inicializamos el centro con la variable de entorno, ocultando la selección al paciente
  const [selectedCenter, setSelectedCenter] = useState(ENV_CENTER_ID);
  const [selectedProf, setSelectedProf] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  const [formData, setFormData] = useState({ name: '', rut: '', email: '', phone: '', address: '', reason: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const standardTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  useEffect(() => {
    async function loadInitialData() {
      const [{ data: profs }, { data: servs }, { data: cents }, { data: boxs }] = await Promise.all([
        supabase.from('professionals').select('*').order('name'),
        supabase.from('services').select('*'),
        supabase.from('centers').select('*').order('name'),
        supabase.from('boxes').select('*')
      ]);
      
      if (profs) setProfessionalsList(profs);
      if (servs) setServicesList(servs);
      if (cents) {
        setCentersList(cents);
        // Respaldo por si la variable de entorno no está configurada aún
        if (!ENV_CENTER_ID && cents.length > 0) {
          setSelectedCenter(cents[0].id);
        }
      }
      if (boxs) setBoxesList(boxs);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadBusySlots() {
      if (!selectedDate || !selectedCenter) return;
      const startOfDay = new Date(`${selectedDate}T00:00:00-03:00`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59-03:00`).toISOString();
      const { data } = await supabase.rpc('get_busy_slots', { target_center: selectedCenter, start_day: startOfDay, end_day: endOfDay });
      if (data) setBusySlots(data);
    }
    loadBusySlots();
  }, [selectedDate, selectedCenter]);

  const filteredProfs = professionalsList.filter(p => p.center_id === selectedCenter);
  const filteredServices = servicesList.filter(s => s.professional_id === selectedProf);

  const availableTimes = standardTimes.filter(time => {
    if (!selectedDate || !selectedProf) return false;
    const timeISO = new Date(`${selectedDate}T${time}:00-03:00`).toISOString();
    // Bloquear si el profesional ya tiene cita a esa hora
    return !busySlots.some(slot => new Date(slot.start_time).toISOString() === timeISO && slot.professional_id === selectedProf);
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) return;
    setLoading(true); setStatus('Procesando reserva...');
    
    const startDateTime = new Date(`${selectedDate}T${selectedTime}:00-03:00`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
    
    // Obtener el Box Oficial asignado al Profesional
    const professionalData = professionalsList.find(p => p.id === selectedProf);
    const assignedBoxId = professionalData?.default_box_id;

    if (!assignedBoxId) {
      setStatus('Error: Este profesional aún no tiene un box de atención asignado en el sistema.');
      setLoading(false); return;
    }

    const { error } = await supabase.from('appointments').insert([{
      center_id: selectedCenter,
      box_id: assignedBoxId,
      professional_id: selectedProf,
      service_id: selectedService,
      patient_name: formData.name,
      patient_rut: formData.rut,
      patient_email: formData.email,
      patient_phone: formData.phone,
      patient_address: formData.address,
      patient_reason: formData.reason,
      start_time: startDateTime,
      end_time: endDateTime,
      consent_accepted: true
    }]);

    if (!error) {
      setStatus('¡Hora agendada con éxito! Revisa tu correo.');
      setFormData({ name: '', rut: '', email: '', phone: '', address: '', reason: '' });
      setConsentAccepted(false); setSelectedDate(''); setSelectedTime(''); setSelectedService(''); setSelectedProf('');
      setBusySlots([...busySlots, { start_time: startDateTime, box_id: assignedBoxId, professional_id: selectedProf }]);
    } else {
      setStatus('Error al agendar. Intenta nuevamente.');
    }
    setLoading(false);
  };

  // Extraemos el nombre del centro para mostrarlo en el título
  const centerName = centersList.find(c => c.id === selectedCenter)?.name || '';

  return (
    <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center font-sans py-10 text-slate-900">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Reserva de Horas</h1>
          <p className="text-slate-500 mt-2">Agendamiento clínico oficial {centerName ? `- ${centerName}` : ''}</p>
        </div>
        
        <form onSubmit={handleSchedule} className="space-y-6">
          
          {selectedCenter && (
            <div className="animate-fade-in"><label className="block text-sm font-semibold text-slate-700 mb-2">1. Profesional</label>
              <select required className="w-full border border-slate-300 p-3 rounded-lg bg-white" value={selectedProf} onChange={(e) => { setSelectedProf(e.target.value); setSelectedService(''); setSelectedDate(''); setSelectedTime(''); }}>
                <option value="" disabled>Elegir especialista...</option>{filteredProfs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {selectedProf && (
            <div className="animate-fade-in"><label className="block text-sm font-semibold text-slate-700 mb-2">2. Servicio</label>
              <select required className="w-full border border-slate-300 p-3 rounded-lg bg-white" value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setSelectedDate(''); setSelectedTime(''); }}>
                <option value="" disabled>Elegir terapia...</option>{filteredServices.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price.toLocaleString('es-CL')}</option>)}
              </select>
            </div>
          )}

          {selectedService && (
            <div className="animate-fade-in"><label className="block text-sm font-semibold text-slate-700 mb-2">3. Fecha</label>
              <input type="date" required className="w-full border border-slate-300 p-3 rounded-lg bg-white" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} />
            </div>
          )}

          {selectedDate && (
            <div className="animate-fade-in"><label className="block text-sm font-semibold text-slate-700 mb-2">4. Horas Disponibles</label>
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.length === 0 ? <p className="col-span-3 text-slate-500 text-sm">Sin horas libres este día.</p> : 
                  availableTimes.map(time => (<button key={time} type="button" onClick={() => setSelectedTime(time)} className={`p-3 text-sm font-bold rounded-lg border transition-all ${selectedTime === time ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 hover:border-slate-400'}`}>{time}</button>))
                }
              </div>
            </div>
          )}

          {selectedTime && (
            <div className="space-y-4 pt-6 border-t border-slate-200 animate-fade-in">
              <label className="block text-sm font-bold text-slate-800 mb-2">5. Datos de Contacto</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre completo" required className="w-full border p-3 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="text" placeholder="RUT (Ej: 12.345.678-9)" required className="w-full border p-3 rounded-lg" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} />
                <input type="email" placeholder="Correo electrónico" required className="w-full border p-3 rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="tel" placeholder="Teléfono" required className="w-full border p-3 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input type="checkbox" id="consent" required className="mt-1 h-4 w-4" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} />
                <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">Autorizo el tratamiento de mis datos personales según la <strong>Ley 21.719</strong>.</label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-lg hover:bg-slate-800">
                {loading ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </div>
          )}
          {status && <div className="p-4 rounded-lg text-center font-bold bg-slate-100">{status}</div>}
        </form>
      </div>
    </main>
  );
}