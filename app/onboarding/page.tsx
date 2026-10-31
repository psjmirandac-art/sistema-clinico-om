'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Building2, User, Mail, Lock, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle, LogOut 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OnboardingCenterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Paso 1: Datos del Centro Clínico
  const [centerName, setCenterName] = useState('');
  const [centerSlug, setCenterSlug] = useState('');
  const [boxesCount, setBoxesCount] = useState(2);

  // Paso 2: Datos del Director Clínico
  const [directorName, setDirectorName] = useState('');
  const [specialty, setSpecialty] = useState('Psicología Clínica');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detectar sesión previa en el navegador
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setActiveUser(session.user);
        }
      } catch (err) {
        console.error('Error revisando sesión:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkCurrentSession();
  }, []);

  const handleForceLogout = async () => {
    await supabase.auth.signOut();
    setActiveUser(null);
    setEmail('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim()) {
      setErrorMessage('Ingresa el nombre de tu centro o consulta.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      let userId = activeUser?.id;

      // Registrar nuevo usuario si no hay sesión o si se ingresó un correo diferente al activo
      if (!userId || (activeUser && activeUser.email !== email)) {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Debes completar el correo y contraseña.');
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              full_name: directorName,
              specialty: specialty,
            },
          },
        });

        if (authError) {
          if (authError.message.toLowerCase().includes('already registered')) {
            setErrorMessage(
              'Este correo ya tiene una cuenta en el sistema. Inicia sesión con su contraseña o pulsa "Cerrar sesión activa" para usar otro correo.'
            );
            setLoading(false);
            return;
          }
          throw authError;
        }

        userId = authData.user?.id;
      }

      if (!userId) {
        throw new Error('No se pudo verificar la identidad del usuario.');
      }

      // Crear nuevo Centro en la tabla centers
      const slugVal = (centerSlug || centerName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

      const { data: newCenter, error: centerError } = await supabase
        .from('centers')
        .insert([
          {
            name: centerName.trim(),
            slug: slugVal,
            boxes_count: boxesCount,
          },
        ])
        .select()
        .single();

      if (centerError) throw centerError;

      // Crear el registro del Director Clínico vinculado al nuevo centro
      const { error: profError } = await supabase.from('professionals').insert([
        {
          name: directorName || 'Director Clínico',
          email: (activeUser ? activeUser.email : email).trim().toLowerCase(),
          specialty: specialty,
          role: 'admin',
          center_id: newCenter.id,
          status: 'activo',
        },
      ]);

      if (profError) throw profError;

      router.push('/admin');
    } catch (err: any) {
      console.error('Error al registrar centro:', err);
      setErrorMessage(err.message || 'Ocurrió un error al crear el centro.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size="{32}"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans text-stone-800">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 space-y-6"
      >
        {/* Barra de progreso */}
        <div className="flex items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#2C4A3B]' : 'bg-stone-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#2C4A3B]' : 'bg-stone-200'}`} />
        </div>

        {/* Icono de Seguridad */}
        <div className="h-12 w-12 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center">
          {step === 1 ? <Building2 size="{22}"/> : <ShieldCheck size="{22}"/>}
        </div>

        {/* Aviso de sesión detectada */}
        {activeUser && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-2xl text-xs space-y-2">
            <p className="text-amber-900 font-medium leading-relaxed">
              Sesión activa detectada: <strong>{activeUser.email}</strong>.
            </p>
            <button
              type="button"
              onClick={handleForceLogout}
              className="text-amber-800 underline font-bold flex items-center gap-1 hover:text-amber-950"
            >
              <LogOut size="{13}"/> Cerrar sesión para registrar otro correo
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* PASO 1: DATOS DEL CENTRO */}
          {step === 1 && (
            <motion.form 
              key="step1" 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }} 
              onSubmit={handleNextStep} 
              className="space-y-4"
            >
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Tu Centro Clínico</h1>
                <p className="text-xs text-stone-400 mt-0.5">Configura el espacio donde operará tu equipo y boxes.</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Nombre del Centro / Consulta *
                </label>
                <input 
                  type="text" 
                  required 
                  autoComplete="off"
                  placeholder="Ej: Centro Terapéutico Los Andes" 
                  value={centerName} 
                  onChange={e => {
                    setCenterName(e.target.value);
                    setCenterSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Identificador URL (Slug)
                </label>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="centro-los-andes" 
                  value={centerSlug} 
                  onChange={e => setCenterSlug(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Cantidad Inicial de Boxes Físicos
                </label>
                <select 
                  value={boxesCount} 
                  onChange={e => setBoxesCount(Number(e.target.value))}
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                >
                  <option value={1}>1 Box de Atención</option>
                  <option value={2}>2 Boxes Activos</option>
                  <option value={3}>3 Boxes Activos</option>
                  <option value={4}>4 Boxes Activos</option>
                  <option value={5}>5+ Boxes (Clínica Grande)</option>
                </select>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="shrink-0" size="{15}"/>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-[#2C4A3B] text-white font-bold text-xs py-4 rounded-2xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                Continuar a Director Clínico <ArrowRight size="{15}"/>
              </button>
            </motion.form>
          )}

          {/* PASO 2: DATOS DEL DIRECTOR CLÍNICO */}
          {step === 2 && (
            <motion.form 
              key="step2" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              onSubmit={handleRegister} 
              className="space-y-4"
              autoComplete="off"
            >
              <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Cuenta de Director Clínico</h1>
                <p className="text-xs text-stone-400 mt-0.5">Configura tu acceso al panel maestro y fichas con IA.</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Tu Nombre y Apellido *
                </label>
                <input 
                  type="text" 
                  required 
                  autoComplete="off"
                  placeholder="Ej: Sofía Valdés" 
                  value={directorName} 
                  onChange={e => setDirectorName(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Especialidad
                </label>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="Psicología Clínica / Psiquiatría" 
                  value={specialty} 
                  onChange={e => setSpecialty(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Correo de Acceso *
                </label>
                <input 
                  type="email" 
                  required 
                  autoComplete="new-password"
                  placeholder="nuevo.director@correo.cl" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Contraseña Segura *
                </label>
                <input 
                  type="password" 
                  required 
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="shrink-0" size="{15}"/>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="p-3.5 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <ArrowLeft size="{16}"/>
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-[#2C4A3B] text-white font-bold text-xs py-4 rounded-2xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size="{15}"/> Creando Centro...
                    </>
                  ) : (
                    'Finalizar y Crear Centro'
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}