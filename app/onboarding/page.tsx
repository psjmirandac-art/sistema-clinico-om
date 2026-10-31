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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detectar sesión previa en el navegador
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setActiveUser(session.user);
          setEmail(session.user.email || '');
          setDirectorName(session.user.user_metadata?.full_name || '');
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
    setDirectorName('');
    setErrorMessage(null);
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con Google.');
      setGoogleLoading(false);
    }
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

      // Registrar nuevo usuario si no hay sesión previa
      if (!userId) {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Debes completar el correo y la contraseña.');
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
              'Este correo ya existe en Supabase Auth. Ve a Supabase -> Authentication -> Users para eliminarlo o inicia sesión con su contraseña.'
            );
            setLoading(false);
            return;
          }
          throw authError;
        }

        userId = authData.user?.id;
      }

      if (!userId) {
        throw new Error('No se pudo verificar la sesión del director.');
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

      // Crear el registro en professionals vinculado al nuevo centro
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
        <Loader2 className="animate-spin text-[#2C4A3B]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans text-stone-800">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200/80 space-y-5"
      >
        {/* Barra de progreso superior */}
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#2C4A3B]' : 'bg-stone-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step === 2 ? 'bg-[#2C4A3B]' : 'bg-stone-200'}`} />
        </div>

        {/* Cabecera con icono */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center shrink-0">
            {step === 1 ? <Building2 size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 leading-tight">
              {step === 1 ? 'Tu Centro Clínico' : 'Director Clínico'}
            </h1>
            <p className="text-[11px] text-stone-500">
              {step === 1 ? 'Configura tu espacio y salas de atención' : 'Configura tu acceso al panel y fichas'}
            </p>
          </div>
        </div>

        {/* Banner de sesión activa detectada */}
        {activeUser && (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Sesión Activa</span>
              <p className="font-semibold text-stone-800 truncate">{activeUser.email}</p>
            </div>
            <button
              type="button"
              onClick={handleForceLogout}
              className="text-red-600 hover:text-red-700 font-semibold text-[11px] flex items-center gap-1 shrink-0 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={12} /> Salir
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* PASO 1: DATOS DEL CENTRO */}
          {step === 1 && (
            <motion.form 
              key="step1" 
              initial={{ opacity: 0, x: -8 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 8 }} 
              onSubmit={handleNextStep} 
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Nombre del Centro o Consulta *
                </label>
                <input 
                  type="text" 
                  required 
                  autoComplete="off"
                  placeholder="Ej: Centro Clínico Los Aromos" 
                  value={centerName} 
                  onChange={e => {
                    setCenterName(e.target.value);
                    setCenterSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }} 
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Enlace Identificador (Slug)
                </label>
                <input 
                  type="text" 
                  autoComplete="off"
                  placeholder="centro-los-aromos" 
                  value={centerSlug} 
                  onChange={e => setCenterSlug(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Boxes de Consulta Físicos
                </label>
                <select 
                  value={boxesCount} 
                  onChange={e => setBoxesCount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20 font-medium" 
                >
                  <option value={1}>1 Box (Consulta Unipersonal)</option>
                  <option value={2}>2 Boxes de Atención</option>
                  <option value={3}>3 Boxes de Atención</option>
                  <option value={4}>4 Boxes de Atención</option>
                  <option value={5}>5+ Boxes (Sede Amplia)</option>
                </select>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full h-11 bg-[#2C4A3B] text-white font-bold text-xs rounded-xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                Continuar a Director Clínico <ArrowRight size={14} />
              </button>
            </motion.form>
          )}

          {/* PASO 2: DATOS DEL DIRECTOR CLÍNICO */}
          {step === 2 && (
            <motion.div
              key="step2" 
              initial={{ opacity: 0, x: 8 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -8 }} 
              className="space-y-4"
            >
              {/* Botón de Autenticación con Google */}
              {!activeUser && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading}
                    className="w-full h-11 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-2xs hover:bg-stone-50 transition-all disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loader2 size={16} className="animate-spin text-stone-500" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Continuar con Google</span>
                  </button>

                  <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <div className="h-px flex-1 bg-stone-200" />
                    <span>o con correo institucional</span>
                    <div className="h-px flex-1 bg-stone-200" />
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3" autoComplete="off">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Tu Nombre y Apellido *
                  </label>
                  <input 
                    type="text" 
                    required 
                    autoComplete="off"
                    placeholder="Ej: Lic. Martín Contreras" 
                    value={directorName} 
                    onChange={e => setDirectorName(e.target.value)} 
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Especialidad
                  </label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    placeholder="Psicología Clínica / Psiquiatría" 
                    value={specialty} 
                    onChange={e => setSpecialty(e.target.value)} 
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                  />
                </div>

                {!activeUser && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                        Correo de Acceso *
                      </label>
                      <input 
                        type="email" 
                        required 
                        autoComplete="new-password"
                        placeholder="director@micentro.cl" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                        Contraseña Segura *
                      </label>
                      <input 
                        type="password" 
                        required 
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20" 
                      />
                    </div>
                  </>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span className="flex-1">{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setErrorMessage(null); setStep(1); }} 
                    className="h-11 px-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center shrink-0"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 h-11 bg-[#2C4A3B] text-white font-bold text-xs rounded-xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Creando Centro...
                      </>
                    ) : (
                      'Finalizar y Crear Centro'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}