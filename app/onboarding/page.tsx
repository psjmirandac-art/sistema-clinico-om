'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, User, Palette, CheckCircle, ArrowRight, 
  ArrowLeft, Loader2, ShieldCheck, AlertCircle, DoorOpen 
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function OnboardingSaaS() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugError, setSlugError] = useState('');

  // Modalidad: Profesional Independiente vs Centro Clínico
  const [accountType, setAccountType] = useState<'independiente' | 'centro'>('independiente');
  const [boxesCount, setBoxesCount] = useState<number>(1);

  const [centerName, setCenterName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2C4A3B');
  const [accentColor, setAccentColor] = useState('#5F8575');

  const [adminName, setAdminName] = useState('');
  const [specialty, setSpecialty] = useState('Psicología Clínica');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Detecta si el usuario hizo clic en "Independiente" o "Centro" desde la portada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('type');
      if (t === 'centro') {
        setAccountType('centro');
        setBoxesCount(4);
      } else if (t === 'independiente') {
        setAccountType('independiente');
        setBoxesCount(1);
      }
    }
  }, []);

  const handleSelectAccountType = (type: 'independiente' | 'centro') => {
    setAccountType(type);
    setBoxesCount(type === 'independiente' ? 1 : 4);
  };

  const handleCenterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCenterName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    setSlugError('');
  };

  const validateAndProceed = async () => {
    if (!centerName || !slug) return;
    setLoading(true);
    setSlugError('');

    try {
      const { data } = await supabase
        .from('centers')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setSlugError(`La URL /${slug} ya está en uso. Por favor elige otra.`);
      } else {
        if (accountType === 'independiente' && !adminName) {
          setAdminName(centerName);
        }
        setStep(2);
      }
    } catch {
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError && authError.message.includes('already registered')) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw new Error('El correo ya existe. Ingresa la contraseña correcta para vincularlo.');
        authData = loginData;
      } else if (authError) {
        throw new Error(`Auth Error: ${authError.message}`);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Sesión no iniciada. Verifica tener desactivado "Confirm Email" en Supabase.');

      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .insert([{ 
          name: centerName, 
          slug, 
          primary_color: primaryColor, 
          accent_color: accentColor,
          boxes_count: accountType === 'independiente' ? 1 : boxesCount
        }])
        .select()
        .single();

      if (centerError) throw new Error(`DB Error (Centers): ${centerError.message}`);

      const { error: profError } = await supabase
        .from('professionals')
        .insert([{ 
          center_id: centerData.id, 
          name: adminName || centerName, 
          email: email,
          specialty: specialty,
          role: 'admin'
        }]);

      if (profError) throw new Error(`DB Error (Profs): ${profError.message}`);

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans text-stone-800 flex flex-col items-center justify-center p-4 selection:bg-[#E4ECE7]">
      
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <ShieldCheck className="text-[#2C4A3B]" size={24} />
        <span className="font-bold tracking-tight text-stone-900">Kairós Partners</span>
      </Link>

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
                <h2 className="text-2xl font-bold text-stone-900">Configura tu Cuenta</h2>
                <p className="text-sm text-stone-500 mt-1">Elige cómo trabajas para adaptar tu panel clínico.</p>
              </div>

              {/* Selector Independiente vs Centro */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectAccountType('independiente')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    accountType === 'independiente' 
                      ? 'border-[#2C4A3B] bg-[#F4F7F5]/80 shadow-2xs' 
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <User size={18} className="text-[#2C4A3B] mb-1.5" />
                  <p className="font-bold text-xs text-stone-900">Independiente</p>
                  <p className="text-[10px] text-stone-500">Atiendo por mi cuenta</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAccountType('centro')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    accountType === 'centro' 
                      ? 'border-[#2C4A3B] bg-[#F4F7F5]/80 shadow-2xs' 
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Building2 size={18} className="text-[#2C4A3B] mb-1.5" />
                  <p className="font-bold text-xs text-stone-900">Centro Clínico</p>
                  <p className="text-[10px] text-stone-500">Equipo y varios boxes</p>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">
                    {accountType === 'independiente' ? 'Tu Nombre Profesional o Consulta' : 'Nombre de la Clínica / Centro'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={accountType === 'independiente' ? 'Ej: Ps. Camila Rojas' : 'Ej: Centro Clínico Vital'} 
                    className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#5F8575]/20 outline-none transition-all" 
                    value={centerName} 
                    onChange={handleCenterNameChange} 
                    autoFocus 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">
                    Link de tu Agenda y Vitrina
                  </label>
                  <div className={`flex items-center border rounded-xl overflow-hidden bg-stone-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5F8575]/20 transition-all ${slugError ? 'border-red-300 ring-red-100' : 'border-stone-200'}`}>
                    <span className="px-3 text-sm text-stone-400 border-r border-stone-200 bg-stone-100">kairos.cl/</span>
                    <input type="text" className="w-full p-3.5 text-sm bg-transparent outline-none text-stone-600 font-medium" value={slug} onChange={(e) => {setSlug(e.target.value); setSlugError('');}} />
                  </div>
                  {slugError && <p className="text-[11px] text-red-500 mt-1.5 pl-1 flex items-center gap-1 font-medium"><AlertCircle size={12}/> {slugError}</p>}
                </div>

                {accountType === 'centro' && (
                  <div>
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block flex items-center gap-1">
                      <DoorOpen size={12} /> Cantidad de Boxes Físicos del Centro
                    </label>
                    <input 
                      type="number" 
                      min={1} 
                      max={30} 
                      value={boxesCount} 
                      onChange={(e) => setBoxesCount(Number(e.target.value))}
                      className="w-full border border-stone-200 p-3 rounded-xl text-sm bg-stone-50 outline-none"
                    />
                  </div>
                )}
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
                <h2 className="text-2xl font-bold text-stone-900">Identidad Visual</h2>
                <p className="text-sm text-stone-500 mt-1">Personaliza los colores que verán tus pacientes al agendar.</p>
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
                <h2 className="text-2xl font-bold text-stone-900">
                  {accountType === 'independiente' ? 'Tus Credenciales Clínicas' : 'Cuenta de Director Clínico'}
                </h2>
                <p className="text-sm text-stone-500 mt-1">Configura tu acceso al panel maestro y fichas con IA.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Tu Nombre y Apellido</label>
                  <input type="text" required className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Especialidad</label>
                  <input type="text" required className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Correo de Acceso</label>
                  <input type="email" required className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1 block">Contraseña Segura</label>
                  <input type="password" required minLength={6} className="w-full border border-stone-200 p-3.5 rounded-xl text-sm bg-stone-50 focus:bg-white outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {error && <p className="text-[11px] text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 font-medium flex items-start gap-2"><AlertCircle size={14} className="shrink-0 mt-0.5"/> <span>{error}</span></p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="px-4 py-3 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"><ArrowLeft size={18} /></button>
                  <button type="submit" disabled={loading} className="flex-1 bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl flex justify-center items-center gap-2 hover:bg-[#233b2f] transition-colors disabled:opacity-70">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (accountType === 'independiente' ? 'Crear mi Consulta' : 'Finalizar y Crear Centro')}
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
              <h2 className="text-3xl font-bold text-stone-900">¡Todo listo!</h2>
              <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
                Tu espacio <strong>{centerName}</strong> ha sido configurado exitosamente. Ya puedes entrar a tu panel clínico.
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