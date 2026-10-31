'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, 
  Loader2, AlertCircle, Building2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redireccionar si ya existe sesión activa
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await routeUserByRole(session.user.id);
        }
      } catch (err) {
        console.error('Error revisando autenticación:', err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkExistingAuth();
  }, []);

  // Determinar si va a /admin o a /onboarding según pertenencia a un centro
  const routeUserByRole = async (userId: string) => {
    const { data: professional, error } = await supabase
      .from('professionals')
      .select('center_id, role')
      .eq('email', (await supabase.auth.getUser()).data.user?.email)
      .maybeSingle();

    if (professional?.center_id) {
      router.push('/admin');
    } else {
      router.push('/onboarding');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/admin`
        : 'https://www.kairosclinico.cl/auth/callback?next=/admin';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión con Google.');
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales incorrectas. Comprueba tu correo y contraseña.');
        }
        throw error;
      }

      if (data.user) {
        await routeUserByRole(data.user.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión.');
      setLoading(false);
    }
  };

  if (checkingSession) {
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
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200/80 space-y-6"
      >
        {/* Cabecera de Marca */}
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#F4F7F5] border border-[#E4ECE7] text-[#2C4A3B] flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight leading-tight">
              Portal Clínico
            </h1>
            <p className="text-xs text-stone-500">
              Acceso seguro para terapeutas y directores
            </p>
          </div>
        </div>

        {/* Acceso con Google */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-11 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-2xs hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin text-stone-500" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Entrar con Google</span>
          </button>

          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <div className="h-px flex-1 bg-stone-200" />
            <span>o con credenciales institucionales</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
        </div>

        {/* Formulario de Email y Clave */}
        <form onSubmit={handleEmailLogin} className="space-y-3.5" autoComplete="on">
          <div>
            <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="profesional@micentro.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20 transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#2C4A3B] text-white font-bold text-xs rounded-xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Validando acceso...
              </>
            ) : (
              <>
                Ingresar a la Suite <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Pie de navegación a registro */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>¿Eres un centro nuevo?</span>
          <Link
            href="/onboarding"
            className="font-bold text-[#2C4A3B] hover:underline flex items-center gap-1"
          >
            <Building2 size={13} /> Crear Centro Clínico
          </Link>
        </div>
      </motion.div>
    </div>
  );
}