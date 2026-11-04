'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Mic,
  DoorOpen,
  Wallet,
  Mail,
  KeyRound,
  X,
  Search,
  ChevronRight,
  HeartHandshake,
  LogIn,
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface RegisteredTenantCenter {
  id: string;
  slug: string;
  brandName: string;
  accountType: 'independiente' | 'centro';
  adminEmail: string;
  boxesCount: number;
  boxesList: string[];
  logoUrl?: string;
  createdAt: string;
}

const DEFAULT_TENANT_CENTERS: RegisteredTenantCenter[] = [
  {
    id: 'ten-1',
    slug: 'centro-om',
    brandName: 'Centro OM',
    accountType: 'centro',
    adminEmail: 'direccion@centroom.cl',
    boxesCount: 2,
    boxesList: ['Box 1', 'Box 2'],
    createdAt: '2026-10-01',
  },
];

function slugifyCenterName(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
}

export default function KairosLandingAndAuthPage() {
  const router = useRouter();

  const [selectedProfileType, setSelectedProfileType] = useState<'independiente' | 'centro'>('centro');
  const [tenantCenters, setTenantCenters] = useState<RegisteredTenantCenter[]>(DEFAULT_TENANT_CENTERS);
  const [activeCenterName, setActiveCenterName] = useState<string>('');

  const [authModalMode, setAuthModalMode] = useState<null | 'login' | 'register' | 'patient_portal'>(null);

  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [selectedTenantSlugForLogin, setSelectedTenantSlugForLogin] = useState<string>('centro-om');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [registerForm, setRegisterForm] = useState({
    accountType: 'centro' as 'independiente' | 'centro',
    brandName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    password: '',
    boxesCount: 4,
    address: '',
  });

  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');

  // 1. Obtener Centros REALES desde Supabase al cargar la página
  useEffect(() => {
    const fetchCenters = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('centers').select('*');
      if (!error && data && data.length > 0) {
        const mappedCenters: RegisteredTenantCenter[] = data.map((c: any) => ({
          id: c.id,
          slug: c.slug,
          brandName: c.brand_name,
          accountType: c.account_type || 'centro',
          adminEmail: c.admin_email || '',
          boxesCount: c.boxes_count || 1,
          boxesList: Array.from({ length: c.boxes_count || 1 }, (_, i) => `Box ${i + 1}`),
          logoUrl: c.logo_url,
          createdAt: c.created_at,
        }));
        setTenantCenters(mappedCenters);
        if (mappedCenters.length > 0) {
          setSelectedTenantSlugForLogin(mappedCenters[0].slug);
        }
      }
    };
    fetchCenters();

    const savedCurrentBrand = localStorage.getItem('kairos_center_brand_v3');
    if (savedCurrentBrand) {
      setActiveCenterName(savedCurrentBrand);
    }
  }, []);

  const handleBrandNameChangeInRegister = (val: string) => {
    setRegisterForm((prev) => ({
      ...prev,
      brandName: val,
      slug: slugifyCenterName(val) || 'mi-centro',
    }));
  };

  const activateCenterSessionAndRedirect = (center: RegisteredTenantCenter) => {
    localStorage.setItem('kairos_center_brand_v3', center.brandName);
    localStorage.setItem('kairos_center_brand_v2', center.brandName);
    localStorage.setItem('kairos_center_boxes_v3', JSON.stringify(center.boxesList));
    localStorage.setItem('kairos_active_tenant_slug', center.slug);
    router.push('/admin');
  };

  const handleCenterLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const matchedCenter =
        tenantCenters.find(
          (c) =>
            c.adminEmail.toLowerCase() === loginEmail.trim().toLowerCase() ||
            c.slug === selectedTenantSlugForLogin
        ) ?? tenantCenters[0];

      if (supabase && loginEmail && loginPassword) {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (error) throw error;
      }

      activateCenterSessionAndRedirect(matchedCenter);
    } catch (err: any) {
      setAuthError(err.message || 'Verifica tus credenciales.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleOAuthLogin = async () => {
    setIsAuthenticating(true);
    const chosenCenter =
      tenantCenters.find((c) => c.slug === selectedTenantSlugForLogin) ??
      tenantCenters[0];

    localStorage.setItem('kairos_center_brand_v3', chosenCenter.brandName);
    localStorage.setItem('kairos_center_boxes_v3', JSON.stringify(chosenCenter.boxesList));
    localStorage.setItem('kairos_active_tenant_slug', chosenCenter.slug);

    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (!error) return;
    }

    router.push('/admin');
  };

  const handleRegisterNewCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.brandName.trim()) return;
    setIsAuthenticating(true);
    setAuthError('');

    const boxTotal =
      registerForm.accountType === 'independiente'
        ? 1
        : Math.max(1, Math.min(25, Number(registerForm.boxesCount) || 4));

    const generatedBoxes =
      boxTotal === 1
        ? ['Box Principal · Consulta']
        : Array.from({ length: boxTotal }, (_, i) => `Box ${i + 1}`);

    const cleanSlug =
      slugifyCenterName(registerForm.slug || registerForm.brandName) ||
      `centro-${Date.now()}`;

    const newTenant: RegisteredTenantCenter = {
      id: `ten-${Date.now()}`,
      slug: cleanSlug,
      brandName: registerForm.brandName.trim(),
      accountType: registerForm.accountType,
      adminEmail: registerForm.adminEmail.trim(),
      boxesCount: boxTotal,
      boxesList: generatedBoxes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (supabase && registerForm.adminEmail && registerForm.password) {
      try {
        const { error: authErr } = await supabase.auth.signUp({
          email: registerForm.adminEmail.trim(),
          password: registerForm.password,
          options: {
            data: {
              center_name: newTenant.brandName,
              center_slug: newTenant.slug,
              account_type: newTenant.accountType,
            },
          },
        });

        if (authErr) throw authErr;

        const { error: insertErr } = await supabase.from('centers').insert([{
          id: newTenant.id,
          slug: newTenant.slug,
          brand_name: newTenant.brandName,
          account_type: newTenant.accountType,
          admin_email: newTenant.adminEmail,
          boxes_count: newTenant.boxesCount,
        }]);

        if (insertErr) throw insertErr;

      } catch (err: any) {
        setAuthError(err.message || 'Error al registrar el centro.');
        setIsAuthenticating(false);
        return;
      }
    }

    const nextTenants = [newTenant, ...tenantCenters.filter((c) => c.slug !== newTenant.slug)];
    setTenantCenters(nextTenants);
    activateCenterSessionAndRedirect(newTenant);
  };

  const filteredPatientCenters = useMemo(() => {
    const q = patientSearchQuery.toLowerCase().trim();
    if (!q) return tenantCenters;
    return tenantCenters.filter(
      (c) => c.brandName.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [tenantCenters, patientSearchQuery]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-[#2C4A3B]/15 selection:text-[#2C4A3B]">
      <div className="pointer-events-none fixed -top-48 -left-48 w-[520px] h-[520px] rounded-full bg-[#2C4A3B]/6 blur-3xl" />
      <div className="pointer-events-none fixed top-1/3 -right-48 w-[480px] h-[480px] rounded-full bg-[#C87D65]/8 blur-3xl" />

      <div className="sticky top-4 z-40 px-4 sm:px-6 w-full max-w-6xl mx-auto">
        <header className="bg-white/85 backdrop-blur-2xl border border-[#E4ECE7] rounded-[1.75rem] px-5 sm:px-7 py-3.5 shadow-[0_12px_40px_rgb(28,25,23,0.05)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1E3329] text-white flex items-center justify-center shadow-sm border border-[#2C4A3B]">
              <ShieldCheck size={20} className="text-emerald-300" />
            </div>
            <div>
              <span className="text-sm font-bold text-stone-900 tracking-tight block leading-none">Kairós</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold block mt-1">Plataforma Clínica</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setAuthModalMode('patient_portal')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#2C4A3B] hover:bg-[#F9F8F6] transition-all"
            >
              Soy Paciente
            </button>
            <button
              type="button"
              onClick={() => { setAuthError(''); setAuthModalMode('login'); }}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-[#2C4A3B] text-stone-800 text-xs font-bold transition-all shadow-2xs"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setRegisterForm((prev) => ({ ...prev, accountType: selectedProfileType }));
                setAuthModalMode('register');
              }}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#2C4A3B] hover:bg-[#1E3329] text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <span>Crear Cuenta</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </header>
      </div>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 z-10 space-y-16">
        <section className="text-center max-w-3xl mx-auto space-y-6">
          {activeCenterName ? (
            <motion.button
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#EBF3EE] border border-[#2C4A3B]/25 text-xs font-bold text-[#2C4A3B] hover:bg-[#dbeadd] transition-all shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sesión activa: {activeCenterName} · Entrar a mi Panel</span>
              <ChevronRight size={14} />
            </motion.button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-[#E4ECE7] text-[11px] font-bold uppercase tracking-[0.14em] text-stone-600 shadow-2xs">
              <Sparkles size={13} className="text-[#2C4A3B]" />
              <span>Para Profesionales Independientes y Centros de Salud</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl font-bold text-stone-900 tracking-tight leading-[1.08]">
            Tu consulta o centro clínico, <span className="text-[#2C4A3B] block sm:inline">en piloto automático.</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-500 max-w-2xl mx-auto leading-relaxed">
            Agenda sincronizada con Google Calendar y Meet, escucha clínica ambiental con IA Grok, matriz de ocupación de boxes físicos, liquidación de comisiones y reagendamiento con regla de 24 horas.
          </p>

          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/60 border border-[#E4ECE7] backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelectedProfileType('independiente')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedProfileType === 'independiente' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <User size={15} className="text-[#2C4A3B]" />
                <span>Soy Profesional Independiente</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProfileType('centro')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedProfileType === 'centro' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Building2 size={15} className="text-[#2C4A3B]" />
                <span>Represento un Centro Clínico</span>
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch max-w-5xl mx-auto">
          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => setSelectedProfileType('independiente')}
            className={`rounded-[2.2rem] p-8 sm:p-10 transition-all cursor-pointer flex flex-col justify-between border ${
              selectedProfileType === 'independiente'
                ? 'bg-white border-[#2C4A3B] ring-4 ring-[#2C4A3B]/10 shadow-[0_25px_70px_rgb(44,74,59,0.10)]'
                : 'bg-white/85 border-[#E4ECE7] opacity-90 hover:opacity-100 shadow-sm'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] flex items-center justify-center text-[#2C4A3B]">
                  <User size={22} />
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#F9F8F6] border border-[#E4ECE7] text-[10px] font-bold uppercase tracking-widest text-stone-600">Consulta Individual</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Profesional Independiente</h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
                  Diseñado para psicólogos, psiquiatras y terapeutas que atienden en su propia consulta online o presencial.
                </p>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-stone-700 pt-2">
                {['Link propio de agendamiento y carátula con tu foto', 'Escucha ambiental con IA Grok que resume la sesión en la ficha', 'Horarios flexibles por día con corte de colación', 'Sincronización con Google Calendar y Google Meet'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="text-[#2C4A3B] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-8 border-t border-[#E4ECE7] space-y-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setRegisterForm(prev => ({ ...prev, accountType: 'independiente', boxesCount: 1 })); setAuthModalMode('register'); }}
                className="w-full py-4 px-6 rounded-2xl bg-[#2C4A3B] hover:bg-[#1E3329] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Crear mi Consulta Independiente</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => setSelectedProfileType('centro')}
            className={`rounded-[2.2rem] p-8 sm:p-10 transition-all cursor-pointer flex flex-col justify-between border bg-[#1E3329] text-white ${
              selectedProfileType === 'centro'
                ? 'border-emerald-400/50 ring-4 ring-[#2C4A3B]/20 shadow-[0_25px_70px_rgb(30,51,41,0.28)]'
                : 'border-[#2C4A3B] opacity-95'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300">
                  <Building2 size={22} />
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-emerald-200">Multi-Profesional & Boxes</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Registra tu Centro Clínico</h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                  Para centros médicos y psicológicos con múltiples terapeutas, boxes físicos de atención y dirección clínica.
                </p>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-stone-200 pt-2">
                {['Mapa en vivo de Ocupación de Boxes por terapeuta y horario', 'Liquidación automática: % Comisión, Arriendo Fijo o Pago por Box', 'Reporte ejecutivo de % Retención Clínica y % Abandono (No-Show)', 'Carátula propia con el Logo y Nombre de tu Centro'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8 mt-8 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setRegisterForm(prev => ({ ...prev, accountType: 'centro', boxesCount: 4 })); setAuthModalMode('register'); }}
                className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Registrar mi Centro Clínico</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 border border-[#E4ECE7] shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
              <Mic size={20} />
            </div>
            <h3 className="font-bold text-base text-stone-900">Escucha Ambiental IA</h3>
            <p className="text-xs text-stone-500 leading-relaxed">La inteligencia artificial escucha la sesión en silencio y redacta el resumen evolutivo estructurado directo en la ficha clínica.</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 border border-[#E4ECE7] shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
              <DoorOpen size={20} />
            </div>
            <h3 className="font-bold text-base text-stone-900">Control de Boxes</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Visualiza qué terapeuta ocupa cada box hora por hora, configura cortes de colación y asigna salas de Google Meet.</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 border border-[#E4ECE7] shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF3EE] text-[#2C4A3B] flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h3 className="font-bold text-base text-stone-900">Liquidación y Reportes</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Calcula el líquido por profesional descontando arriendo fijo o porcentaje, y mide la tasa de retención o abandono.</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[#E4ECE7] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] flex items-center justify-center text-[#2C4A3B] shrink-0">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900">¿Eres paciente y buscas agendar tu sesión?</h3>
                <p className="text-xs text-stone-500 mt-0.5">Accede a la carátula oficial de tu centro clínico para reservar hora.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAuthModalMode('patient_portal')}
              className="px-5 py-3 rounded-2xl bg-[#F9F8F6] hover:bg-[#EBF3EE] border border-[#E4ECE7] text-stone-800 hover:text-[#2C4A3B] text-xs font-bold transition-all inline-flex items-center gap-2"
            >
              <span>Buscar mi Centro</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#E4ECE7] py-6 text-center text-xs text-stone-400">
        Kairós Clínico · Infraestructura Multi-Centro de Salud Mental
      </footer>

      {/* =========================================================
          MODAL: INICIAR SESIÓN
         ========================================================= */}
      <AnimatePresence>
        {authModalMode === 'login' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.2rem] max-w-md w-full p-7 sm:p-8 border border-[#E4ECE7] shadow-2xl space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C87D65] block">Acceso Multi-Centro</span>
                  <h3 className="text-xl font-bold text-stone-900 mt-0.5">Iniciar Sesión en mi Centro</h3>
                </div>
                <button type="button" onClick={() => setAuthModalMode(null)} className="p-2 rounded-full hover:bg-stone-100 text-stone-500"><X size={18} /></button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F9F8F6] border border-[#E4ECE7] space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2C4A3B] block">Selecciona tu Centro Registrado</label>
                <select
                  value={selectedTenantSlugForLogin}
                  onChange={(e) => {
                    setSelectedTenantSlugForLogin(e.target.value);
                    const found = tenantCenters.find((c) => c.slug === e.target.value);
                    if (found) setLoginEmail(found.adminEmail);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800"
                >
                  {tenantCenters.map((c) => (
                    <option key={c.id} value={c.slug}>{c.brandName}</option>
                  ))}
                </select>
              </div>

              <button type="button" onClick={handleGoogleOAuthLogin} className="w-full py-3.5 px-4 rounded-xl bg-[#F9F8F6] hover:bg-[#EBF3EE] border border-[#E4ECE7] text-stone-800 font-bold flex items-center justify-center gap-2 transition-all">
                <LogIn size={15} className="text-[#2C4A3B]" />
                <span>Continuar con Cuenta Google del Centro</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-[10px] uppercase text-stone-400 font-bold">O con tu correo administrativo</span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              <form onSubmit={handleCenterLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input required type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="direccion@tucentro.cl" className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#2C4A3B]" />
                  </div>
                </div>
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">Contraseña</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input required type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#2C4A3B]" />
                  </div>
                </div>
                {authError && <p className="text-rose-600 font-semibold text-[11px]">{authError}</p>}
                <button type="submit" disabled={isAuthenticating} className="w-full py-3.5 bg-[#2C4A3B] hover:bg-[#1E3329] text-white rounded-xl font-bold shadow-md transition-all">
                  {isAuthenticating ? 'Abriendo panel del centro...' : 'Entrar al Panel del Centro'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL 2: REGISTRAR CENTRO / CONSULTA
         ========================================================= */}
      <AnimatePresence>
        {authModalMode === 'register' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.2rem] max-w-lg w-full p-7 sm:p-8 border border-[#E4ECE7] shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C87D65] block">Alta Instantánea</span>
                  <h3 className="text-xl font-bold text-stone-900 mt-0.5">Configura tu Centro o Consulta</h3>
                </div>
                <button type="button" onClick={() => setAuthModalMode(null)} className="p-2 rounded-full hover:bg-stone-100 text-stone-500"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F9F8F6] p-1.5 rounded-2xl border border-[#E4ECE7]">
                <button type="button" onClick={() => setRegisterForm(p => ({ ...p, accountType: 'centro', boxesCount: 4 }))} className={`py-2.5 rounded-xl font-bold transition-all ${registerForm.accountType === 'centro' ? 'bg-[#2C4A3B] text-white' : 'text-stone-600'}`}>Centro Clínico</button>
                <button type="button" onClick={() => setRegisterForm(p => ({ ...p, accountType: 'independiente', boxesCount: 1 }))} className={`py-2.5 rounded-xl font-bold transition-all ${registerForm.accountType === 'independiente' ? 'bg-[#2C4A3B] text-white' : 'text-stone-600'}`}>Consulta Independiente</button>
              </div>

              <form onSubmit={handleRegisterNewCenterSubmit} className="space-y-3.5">
                <div>
                  <label className="font-bold uppercase text-stone-500 block mb-1">Nombre Oficial del Centro</label>
                  <input required type="text" value={registerForm.brandName} onChange={(e) => handleBrandNameChangeInRegister(e.target.value)} placeholder="Ej. Centro Clínico Sanhattan" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-semibold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">URL Pública</label>
                    <div className="flex items-center rounded-xl border border-stone-200 bg-[#F9F8F6] px-3 py-2.5">
                      <span className="text-stone-400 text-[11px]">/centro/</span>
                      <input required type="text" value={registerForm.slug} onChange={(e) => setRegisterForm({ ...registerForm, slug: slugifyCenterName(e.target.value) })} className="bg-transparent font-bold text-[#2C4A3B] focus:outline-none w-full" />
                    </div>
                  </div>
                  {registerForm.accountType === 'centro' && (
                    <div>
                      <label className="font-bold uppercase text-stone-500 block mb-1">Cantidad de Boxes Físicos</label>
                      <input type="number" min={1} max={25} value={registerForm.boxesCount} onChange={(e) => setRegisterForm({ ...registerForm, boxesCount: Number(e.target.value) })} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-bold" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">Correo Administrador</label>
                    <input required type="email" value={registerForm.adminEmail} onChange={(e) => setRegisterForm({ ...registerForm, adminEmail: e.target.value })} placeholder="admin@miclinica.cl" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200" />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-stone-500 block mb-1">Contraseña</label>
                    <input required type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200" />
                  </div>
                </div>
                {authError && <p className="text-rose-600 font-semibold text-[11px]">{authError}</p>}
                <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-[#2C4A3B] hover:bg-[#1E3329] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2">
                  <span>Crear Centro y Entrar al Panel</span> <ArrowRight size={15} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MODAL 3: PORTAL DE PACIENTES (SELECCIÓN DE CENTRO)
         ========================================================= */}
      <AnimatePresence>
        {authModalMode === 'patient_portal' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.2rem] max-w-md w-full p-7 sm:p-8 border border-[#E4ECE7] shadow-2xl space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C87D65] block">Portal de Pacientes</span>
                  <h3 className="text-xl font-bold text-stone-900 mt-0.5">Elige tu Centro o Especialista</h3>
                </div>
                <button type="button" onClick={() => setAuthModalMode(null)} className="p-2 rounded-full hover:bg-stone-100 text-stone-500"><X size={18} /></button>
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="text" value={patientSearchQuery} onChange={(e) => setPatientSearchQuery(e.target.value)} placeholder="Buscar por nombre del centro clínico..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-[#F9F8F6] focus:outline-none focus:border-[#2C4A3B]" />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredPatientCenters.length === 0 ? (
                  <p className="text-stone-400 text-center py-4">No encontramos centros con ese nombre.</p>
                ) : (
                  filteredPatientCenters.map((center) => (
                    <button
                      key={center.id}
                      type="button"
                      onClick={() => {
                        localStorage.setItem('kairos_center_brand_v3', center.brandName);
                        localStorage.setItem('kairos_center_boxes_v3', JSON.stringify(center.boxesList));
                        router.push(`/centro/${center.slug}`);
                      }}
                      className="w-full text-left p-4 rounded-2xl border border-[#E4ECE7] hover:border-[#2C4A3B] bg-[#F9F8F6] hover:bg-[#EBF3EE]/50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2C4A3B] text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                          {center.logoUrl ? <img src={center.logoUrl} alt={center.brandName} className="w-full h-full object-cover" /> : center.brandName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-stone-900">{center.brandName}</p>
                          <p className="text-[11px] text-stone-500">kairosclinico.cl/centro/{center.slug}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-stone-400 group-hover:text-[#2C4A3B] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}