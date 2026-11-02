'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, MessageCircle, Plus, Trash2, Save, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ReminderRule {
  id: string;
  channel: 'email' | 'whatsapp';
  time_before: number;
  time_unit: 'hours' | 'days';
}

export default function ComunicacionesTab({ centerId }: { centerId?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Canales globales
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Reglas dinámicas
  const [rules, setRules] = useState<ReminderRule[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      if (!centerId) return;
      setIsLoading(true);
      try {
        // En producción, esto leería de una tabla reminder_settings
        const { data, error } = await supabase
          .from('reminder_settings')
          .select('*')
          .eq('center_id', centerId)
          .order('time_before', { ascending: false });
          
        if (!error && data && data.length > 0) {
          setRules(data);
        } else {
          // Valores por defecto si es una clínica nueva
          setRules([
            { id: `rule-${Date.now()}-1`, channel: 'email', time_before: 24, time_unit: 'hours' },
            { id: `rule-${Date.now()}-2`, channel: 'whatsapp', time_before: 2, time_unit: 'hours' }
          ]);
        }
      } catch (err) {
        console.error('Error cargando reglas:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [centerId]);

  const addRule = () => {
    const newRule: ReminderRule = {
      id: `rule-${Date.now()}`,
      channel: 'whatsapp',
      time_before: 1,
      time_unit: 'hours'
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, field: keyof ReminderRule, value: any) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
  };

  const handleSave = async () => {
    if (!centerId) return;
    setIsSaving(true);
    try {
      // 1. Borramos las reglas anteriores de este centro (estrategia replace)
      await supabase.from('reminder_settings').delete().eq('center_id', centerId);
      
      // 2. Insertamos las nuevas
      const payload = rules.map(r => ({
        center_id: centerId,
        channel: r.channel,
        time_before: r.time_before,
        time_unit: r.time_unit
      }));
      
      if (payload.length > 0) {
        const { error } = await supabase.from('reminder_settings').insert(payload);
        if (error) throw error;
      }
      
      // Feedback visual (puedes conectarlo a tu toast global)
      alert('Reglas de comunicación actualizadas con éxito.');
    } catch (error) {
      console.error('Error guardando reglas:', error);
      alert('Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
      </div>
    );
  }

  return (
    <motion.div key="comunicaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-[90rem] mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5F8575]">Automatización IA</span>
          <h2 className="text-2xl font-bold text-stone-900 mt-0.5">Motor de Recordatorios</h2>
          <p className="text-sm text-stone-500 mt-1">Configura cuándo y por dónde se notifica a los pacientes antes de su sesión.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#2C4A3B] text-white px-6 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 hover:bg-[#233b2f] shadow-xs transition-all disabled:opacity-70"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
          Guardar Configuración
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: ESTADO DE CANALES */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-xs space-y-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Bell size={18} className="text-[#2C4A3B]"/> Canales Activos
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${whatsappEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-400'}`}>
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">WhatsApp IA</h4>
                    <p className="text-[10px] text-stone-500">Tasa de apertura del 98%</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2C4A3B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${emailEnabled ? 'bg-blue-100 text-blue-600' : 'bg-stone-200 text-stone-400'}`}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">Correo Electrónico</h4>
                    <p className="text-[10px] text-stone-500">Notificaciones formales (Resend)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2C4A3B]"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F4F7F5] rounded-3xl p-6 border border-[#E4ECE7]">
            <ShieldCheck size={24} className="text-[#2C4A3B] mb-3" />
            <h4 className="font-bold text-stone-900 text-sm mb-1">Privacidad Clínica</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Los recordatorios automáticos no incluyen detalles del diagnóstico ni motivo de consulta, cumpliendo con los estándares de confidencialidad médica.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: REGLAS DE TIEMPO */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Clock size={18} className="text-[#2C4A3B]"/> Secuencia de Envíos
            </h3>
            <button 
              onClick={addRule}
              className="text-xs font-bold text-[#2C4A3B] bg-[#F4F7F5] px-3 py-1.5 rounded-xl hover:bg-[#E4ECE7] transition-colors flex items-center gap-1"
            >
              <Plus size={14}/> Añadir Regla
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {rules.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="text-sm font-semibold text-stone-500">No hay recordatorios configurados.</p>
                  <p className="text-xs text-stone-400 mt-1">Los pacientes no recibirán notificaciones de sus citas.</p>
                </motion.div>
              ) : (
                rules.map((rule, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={rule.id} 
                    className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-stone-200 p-3 sm:p-4 rounded-2xl group hover:border-[#2C4A3B]/30 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 text-stone-400 font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 w-full">
                      <span className="text-xs font-bold text-stone-500 w-full sm:w-auto text-left">Enviar un</span>
                      <select 
                        value={rule.channel} 
                        onChange={(e) => updateRule(rule.id, 'channel', e.target.value)}
                        className="w-full sm:w-auto bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 cursor-pointer"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Correo</option>
                      </select>
                      
                      <input 
                        type="number" 
                        min="1"
                        value={rule.time_before}
                        onChange={(e) => updateRule(rule.id, 'time_before', parseInt(e.target.value) || 1)}
                        className="w-full sm:w-20 bg-white border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 text-center"
                      />
                      
                      <select 
                        value={rule.time_unit} 
                        onChange={(e) => updateRule(rule.id, 'time_unit', e.target.value)}
                        className="w-full sm:w-auto bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#2C4A3B]/20 cursor-pointer"
                      >
                        <option value="hours">Horas antes</option>
                        <option value="days">Días antes</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => removeRule(rule.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 w-full sm:w-auto flex justify-center mt-2 sm:mt-0"
                      title="Eliminar regla"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}