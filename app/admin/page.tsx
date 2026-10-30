'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Calendar, Users, Briefcase, Star, LogOut, ShieldCheck, 
  Plus, Mic, MicOff, Sparkles, FileText, Video, Trash2, Search, 
  X, Loader2, Printer, Lock, DoorOpen, UserPlus, Minus, Check, 
  MapPin, Wallet, TrendingUp, CreditCard, AlertCircle, 
  Megaphone, BarChart3, Link as LinkIcon, Settings, HelpCircle, Gift
} from 'lucide-react';
import { useTenant } from '@/providers/TenantProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Añadidos los nuevos módulos basados en el requerimiento
type TabType = 'inicio' | 'agenda' | 'pacientes' | 'servicios' | 'finanzas' | 'resenas' | 'equipo' | 'comunicaciones' | 'reportes' | 'documentos' | 'conexiones' | 'configuracion';

export default function AdminSuitePage() {
  const { center } = useTenant();

  // --- ESTADOS BÁSICOS ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);

  // --- DATOS MOCK/DB ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [boxesCount, setBoxesCount] = useState<number>(3);

  // (Estados de Ficha IA y Formularios omitidos para brevedad en esta refactorización arquitectónica, 
  // pero asume que la lógica de backend sigue viva. Nos enfocamos en la estructura del UI del Sidebar)
  
  useEffect(() => {
    async function initAuth() {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      if (activeSession?.user) await fetchDoctorProfile(activeSession.user);
      setAuthLoading(false);
    }
    initAuth();
  }, []);

  async function fetchDoctorProfile(user: any) {
    const { data: prof } = await supabase.from('professionals').select('*').eq('email', user.email).maybeSingle();
    setProfile({ ...prof, name: prof?.name || user.email?.split('@')[0], center_id: prof?.center_id || center?.id });
    // Aquí iría el fetch real a la DB para citas y terapeutas
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
    if (error) setAuthError('Credenciales inválidas.');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (authLoading) return <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center"><Loader2 className="animate-spin text-[#2C4A3B]" size={32} /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-sm border border-stone-100">
           <h1 className="font-bold text-xl mb-6 text-stone-900">Acceso Clínico</h1>
           <form onSubmit={handleLogin} className="space-y-4">
             <input type="email" placeholder="Correo" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full p-3 rounded-xl border bg-stone-50" />
             <input type="password" placeholder="Clave" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-3 rounded-xl border bg-stone-50" />
             <button type="submit" className="w-full bg-[#2C4A3B] text-white py-3 rounded-xl font-bold">Entrar</button>
           </form>
        </div>
      </div>
    );
  }

  // --- COMPONENTE DE BOTÓN DEL SIDEBAR ---
  const NavButton = ({ tab, icon: Icon, label, disabled = false }: { tab: TabType, icon: any, label: string, disabled?: boolean }) => (
    <button 
      onClick={() => !disabled && setActiveTab(tab)} 
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
        activeTab === tab 
          ? 'bg-[#2C4A3B] text-white font-semibold shadow-sm' 
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 font-medium'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={activeTab === tab ? 'text-white' : ''} />
        {label}
      </div>
      {disabled && <span className="text-[9px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      
      {/* SIDEBAR REFACTORIZADO Y ORDENADO */}
      <aside className="w-[280px] bg-white border-r border-stone-200/80 flex flex-col z-20 shrink-0">
        
        {/* Header Sede */}
        <div className="h-20 flex items-center px-6 border-b border-stone-100 shrink-0">
          <ShieldCheck size={24} className="text-[#2C4A3B] mr-3" />
          <div>
            <h1 className="font-bold text-stone-900 text-sm truncate w-44">{center?.name || 'Centro Clínico'}</h1>
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Portal Maestro</span>
          </div>
        </div>

        {/* Navegación Scrolleable */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          
          {/* Bloque 1: Operación Clínica */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Gestión Diaria</h2>
            <nav className="space-y-1">
              <NavButton tab="inicio" icon={Home} label="Inicio" />
              <NavButton tab="agenda" icon={Calendar} label="Agenda" />
              <NavButton tab="pacientes" icon={Users} label="Fichas IA" />
            </nav>
          </div>

          {/* Bloque 2: Crecimiento y Finanzas */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Negocio</h2>
            <nav className="space-y-1">
              <NavButton tab="finanzas" icon={Wallet} label="Finanzas y Paquetes" />
              <NavButton tab="servicios" icon={Briefcase} label="Servicios" />
              <NavButton tab="resenas" icon={Star} label="Evaluaciones" />
              <NavButton tab="reportes" icon={BarChart3} label="Reportes" disabled />
            </nav>
          </div>

          {/* Bloque 3: Infraestructura (Admin) */}
          {profile?.role === 'admin' && (
            <div>
              <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3">Infraestructura</h2>
              <nav className="space-y-1">
                <NavButton tab="equipo" icon={DoorOpen} label="Terapeutas y Boxes" />
                <NavButton tab="comunicaciones" icon={Megaphone} label="Comunicaciones" disabled />
                <NavButton tab="documentos" icon={FileText} label="Documentos" disabled />
                <NavButton tab="conexiones" icon={LinkIcon} label="Conexiones" disabled />
              </nav>
            </div>
          )}

          {/* Bloque 4: Sistema */}
          <div>
             <div className="h-px w-full bg-stone-100 my-4" />
             <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-stone-500 hover:bg-stone-50 font-medium">
                  <Gift size={18} /> Gana meses gratis
                </button>
                <NavButton tab="configuracion" icon={Settings} label="Configuración" disabled />
             </nav>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-stone-100 shrink-0">
          <div className="border border-stone-200/80 rounded-2xl p-3.5 flex items-center justify-between bg-stone-50/50">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-stone-900 truncate">{profile?.name}</p>
              <p className="text-[10px] font-semibold text-[#2C4A3B] uppercase mt-0.5">{profile?.role === 'admin' ? 'Administrador' : 'Terapeuta'}</p>
            </div>
            <button onClick={handleLogout} className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-8 shrink-0">
          <div className="bg-stone-100 border border-stone-200/80 text-stone-600 text-xs font-semibold px-3.5 py-1.5 rounded-xl">Sede: {center?.name || 'Kairós'}</div>
          <button onClick={() => setIsNewApptModalOpen(true)} className="bg-[#2C4A3B] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-90"><Plus size={16} /> Nueva Cita</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F9F8F6]">
          <AnimatePresence mode="wait">
            
            {/* VISTAS EXISTENTES */}
            {activeTab === 'inicio' && (
              <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col items-center justify-center text-center">
                 <h2 className="text-3xl font-bold text-stone-900">Bienvenido, {profile?.name}</h2>
                 <p className="text-stone-500 mt-2">Usa el menú lateral para navegar por los módulos operativos de tu clínica.</p>
              </motion.div>
            )}

            {/* PLACEHOLDER PARA NUEVOS MÓDULOS */}
            {['reportes', 'comunicaciones', 'documentos', 'conexiones', 'configuracion'].includes(activeTab) && (
              <motion.div key="placeholder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                 <div className="h-20 w-20 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-400">
                    <ShieldCheck size={40} />
                 </div>
                 <h2 className="text-2xl font-bold text-stone-900 capitalize">{activeTab}</h2>
                 <p className="text-stone-500 text-sm">Este módulo está en fase de desarrollo. Estará disponible en la próxima actualización de la arquitectura.</p>
              </motion.div>
            )}

            {/* (Aquí abajo mantienes el código de agenda, pacientes, finanzas, servicios, etc que ya teníamos funcionando en el Main) */}
            
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}