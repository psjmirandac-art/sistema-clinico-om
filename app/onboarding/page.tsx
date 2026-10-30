'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Palette, CheckCircle, ArrowRight, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OnboardingSaaS() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugError, setSlugError] = useState('');
  
  // Estado del Centro (Tenant)
  const [centerName, setCenterName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2C4A3B');
  const [accentColor, setAccentColor] = useState('#5F8575');
  
  // Estado del Administrador
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCenterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCenterName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    setSlugError(''); // Limpiamos el error al escribir
  };

  // Validación de URL en el Paso 1
  const validateAndProceed = async () => {
    if (!centerName || !slug) return;
    setLoading(true);
    setSlugError('');
    
    try {
      const { data, error: fetchError } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setSlugError(`La URL /${slug} ya está en uso. Por favor elige otra.`);
      } else {
        setStep(2);
      }
    } catch (err) {
      setSlugError('Error al verificar disponibilidad.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Intentamos crear la cuenta
      let { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      // Si el usuario ya existe, login silencioso
      if (authError && authError.message.includes('already registered')) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw new Error('El correo ya existe. Ingresa la contraseña correcta para vincularlo.');
        authData = loginData;
      } else if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

      // 2. Crear el Tenant (Centro)
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .insert([{ name: centerName, slug, primary_color: primaryColor, accent_color: accentColor }])
        .select()
        .single();

      if (centerError) throw new Error('Error al crear la clínica. Es posible que la URL haya sido tomada.');

      // 3. Vincular Perfil
      const { error: profError } = await supabase
        .from('professionals')
        .insert([{ center_id: centerData.id, name: adminName, email: email }]);

      if (profError) throw new Error('Error al vincular el perfil de administrador.');

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-stone-800 flex flex-col items-center justify-center p-4 selection:bg-[#E4ECE7]">
      
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <ShieldCheck className="text-[#2C4A3B]" size={24} />
        <span className="font-bold tracking-tight text-stone-900">Kairós Partners</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-8 sm:p-10 relative overflow-hidden"
      >
        {step < 4 && (
          <div className="flex justify-between mb-8 gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step >= s ? 'bg-[#2C4A3B]' : 'bg-stone-100'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <div className="w-12 h-12 bg-[#F4F7F5] rounded-xl flex items-center justify-center text-[#2C4A3B] mb-4 border border-[#E4ECE7]"><Building2 size={24} /></div>
                <h2 className="text-2xl font-bold text-stone-900">Tu Espacio Clínico</h2>
                <p className="text-sm text-stone-500 mt-1">Registra tu centro para obtener tu portal dedicado.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Nombre de la Clínica</label>
                  <input type="text" placeholder="Ej: Centro Vital" className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#5F8575]/20 outline-none transition-all" value={centerName} onChange={handleCenterNameChange} autoFocus />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">URL de tu Portal</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5F8575]/20 transition-all ${slugError ? 'border-red-300 ring-red-100' : 'border-stone-200'}`}>
                    <span className="px-3 text-sm text-stone-400 border-r border-stone-200 bg-stone-100">kairos.cl/</span>
                    <input type="text" className="w-full p-3.5 text-sm bg-transparent outline-none text-stone-600 font-medium" value={slug} onChange={(e) => {setSlug(e.target.value); setSlugError('');}} />
                  </div>
                  {slugError && <p className="text-[11px] text-red-500 mt-1.5 pl-1 flex items-center gap-1 font-medium"><AlertCircle size={12}/> {slugError}</p>}
                </div>
              </div>

              <button onClick={validateAndProceed} disabled={!centerName || !slug || loading} className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl flex justify-center items-center gap-2 disabled:opacity-70 hover:bg-[#233b2f] transition-colors">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continuar <ArrowRight size={16} /></>}
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div>
                <div className="w-12 h-12 bg-[#F4F7F5] rounded-xl flex items-center justify-center text-[#2C4A3B] mb-4 border border-[#E4ECE7]"><Palette size={24} /></div>
                <h2 className="text-2xl font-bold text-stone-900">Identidad Corporativa</h2>
                <p className="text-sm text-stone-500 mt-1">Personaliza los colores de tu portal de pacientes.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Color Principal</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="h-12 w-12 rounded-xl cursor-pointer border-0 bg-transparent p-0" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    <input type="text" className="flex-1 border border-stone-200 p-3 rounded-xl text-sm bg-stone-50 uppercase font-mono text-stone-600" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Color Secundario (Acentos)</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" className="h-12 w-12 rounded-xl cursor-pointer border-0 bg-transparent p-0" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                    <input type="text" className="flex-1 border border-stone-200 p-3 rounded-xl text-sm bg-stone-50 uppercase font-mono text-stone-600" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between" style={{ borderColor: primaryColor }}>
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>Vista Previa Botón</span>
                <div className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>Agendar Cita</div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"><ArrowLeft size={18} /></button>
                <button onClick={() => setStep(3)} className="flex-1 bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-[#233b2f] transition-colors">Continuar <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <div className="w-12 h-12 bg-[#F4F7F5] rounded-xl flex items-center justify-center text-[#2C4A3B] mb-4 border border-[#E4ECE7]"><User size={24} /></div>
                <h2 className="text-2xl font-bold text-stone-900">Cuenta de Director</h2>
                <p className="text-sm text-stone-500 mt-1">Crea tus credenciales de acceso al panel maestro.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Tu Nombre</label>
                  <input type="text" required className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Correo de Acceso</label>
                  <input type="email" required className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Contraseña Segura</label>
                  <input type="password" required minLength={6} className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 font-medium flex items-center gap-2"><AlertCircle size={14}/> {error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"><ArrowLeft size={18} /></button>
                  <button type="submit" disabled={loading} className="flex-1 bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-[#233b2f] transition-colors disabled:opacity-70">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar y Crear Clínica'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-[#F4F7F5] text-[#5F8575] rounded-full flex items-center justify-center mx-auto border border-[#E4ECE7] mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-stone-900">¡Bienvenido a Kairós!</h2>
              <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
                Tu centro <strong>{centerName}</strong> ha sido configurado exitosamente. Ya puedes acceder a tu panel de administración.
              </p>
              
              <div className="pt-6">
                <Link href="/admin" className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl flex justify-center items-center hover:bg-[#233b2f] transition-colors">
                  Ir a mi Panel de Control
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}