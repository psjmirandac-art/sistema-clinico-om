'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Users, Briefcase, DollarSign, Star, Bookmark, 
  Home, LogOut, Plus, ChevronLeft, ChevronRight, Video, FileText, 
  Mic, Save, CheckCircle, AlertCircle, Trash2, Edit, Check, X,
  ShieldCheck, Eye, EyeOff, Loader2, CalendarHeart, RefreshCw
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// --- CONFIGURACIÓN SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);
const ENV_CENTER_ID = process.env.NEXT_PUBLIC_CENTER_ID || '';

// --- COMPONENTE TOAST PREMIUM ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success'|'error'|'info', onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
    className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border ${
      type === 'success' ? 'bg-[#F4F7F5] border-[#E4ECE7] text-[#2C4A3B]' :
      type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
      'bg-white border-stone-200 text-stone-700'
    }`}
  >
    {type === 'success' && <CheckCircle size={20} className="text-[#5F8575]" />}
    {type === 'error' && <AlertCircle size={20} className="text-red-500" />}
    <p className="text-sm font-medium pr-4">{message}</p>
    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={16} /></button>
  </motion.div>
);

export default function AdminPanel() {
  // --- ESTADOS CORE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error'|'info' } | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  const [activeTab, setActiveTab] = useState('inicio'); 
  const [userRole, setUserRole] = useState<'admin' | 'profesional'>('admin');
  const [currentProfId, setCurrentProfId] = useState<string>('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [adminCenterId, setAdminCenterId] = useState<string>(ENV_CENTER_ID);
  
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  
  // --- ESTADOS FORMULARIOS DE CREACIÓN ---
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newProfId, setNewProfId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProfName, setNewProfName] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');
  const [newProfBoxId, setNewProfBoxId] = useState('');
  const [isCreatingProf, setIsCreatingProf] = useState(false);

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    supabase.auth.getSession().then(({ data: { session } }) => { 
      setSession(session); 
      if (session) loadData(session); 
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { 
      setSession(session); 
      if (session) loadData(session); 
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(currentSession = session) {
    const [profs, servs, cents, boxs, apps, revs] = await Promise.all([
      supabase.from('professionals').select('*').order('name'),
      supabase.from('services').select('*').order('created_at', { ascending: false }),
      supabase.from('centers').select('*').order('name'),
      supabase.from('boxes').select('*'),
      supabase.from('appointments').select('*').order('start_time', { ascending: true }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false })
    ]);
    
    const profList = profs.data || [];
    setProfessionals(profList);
    
    if (currentSession?.user?.email) {
      const me = profList.find(p => p.email.toLowerCase() === currentSession.user.email.toLowerCase());
      if (me) { setUserRole('profesional'); setCurrentProfId(me.id); } else { setUserRole('admin'); setCurrentProfId(''); }
    }
    
    if (servs.data) setServices(servs.data);
    if (cents.data) { 
      setCenters(cents.data); 
      if (!ENV_CENTER_ID && cents.data.length > 0) setAdminCenterId(cents.data[0].id); 
    }
    if (boxs.data) setBoxes(boxs.data);
    if (apps.data) setAppointments(apps.data);
    if (revs.data) setReviews(revs.data);
  }

  // --- FILTROS Y VARIABLES CALCULADAS ---
  const visibleProfessionals = professionals.filter(p => p.center_id === adminCenterId && (userRole === 'admin' || p.id === currentProfId));
  const visibleAppointments = appointments.filter(a => a.center_id === adminCenterId && (userRole === 'admin' || a.professional_id === currentProfId));
  const activeAppointments = visibleAppointments.filter(a => a.consent_accepted !== false);
  const visibleServices = services.filter(s => visibleProfessionals.some(vp => vp.id === s.professional_id));
  const visibleBoxes = boxes.filter(b => b.center_id === adminCenterId);
  const visibleReviews = reviews.filter(r => visibleProfessionals.some(vp => vp.id === r.professional_id));
  
  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconocido';
  const getServicePrice = (id: string) => services.find(s => s.id === id)?.price || 0;
  const getBoxName = (id: string) => boxes.find(b => b.id === id)?.name || 'Box No Asignado';
  
  // Lógica de finanzas simple
  const currentMonthAppointments = activeAppointments.filter(app => {
    const appDate = new Date(app.start_time); const now = new Date();
    return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear() && !app.patient_name.startsWith('[BLOQUEO]');
  });
  const totalIncome = currentMonthAppointments.reduce((sum, app) => sum + getServicePrice(app.service_id), 0);
  let gananciaCentro = totalIncome * 0.3; // Ejemplo: 30% para la clínica
  let gananciaProfesionales = totalIncome * 0.7; // Ejemplo: 70% para terapeutas

  const formatShortDate = (dateString: string) => dateString ? format(new Date(dateString), "dd MMM yyyy", { locale: es }) : '';

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); setLoading(true); setError(''); 
    const { error } = await supabase.auth.signInWithPassword({ email, password }); 
    if (error) setError('Credenciales incorrectas'); 
    setLoading(false); 
  };
  
  const handleLogout = async () => await supabase.auth.signOut();
  
  const handleCreateService = async (e: React.FormEvent) => { 
    e.preventDefault(); setIsCreating(true); 
    const finalProfIdForService = userRole === 'profesional' ? currentProfId : newProfId;
    const { error } = await supabase.from('services').insert([{ name: newName, price: Number(newPrice), professional_id: finalProfIdForService }]); 
    if (!error) { setNewName(''); setNewPrice(''); setNewProfId(''); loadData(); showToast('Servicio creado con éxito', 'success'); } 
    setIsCreating(false); 
  };
  
  const handleDeleteService = async (id: string) => { 
    if (!confirm('¿Eliminar servicio?')) return; 
    const { error } = await supabase.from('services').delete().eq('id', id); 
    if (!error) { loadData(); showToast('Servicio eliminado', 'info'); } 
  };

  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault(); setIsCreatingProf(true);
    const { error } = await supabase.from('professionals').insert([{
      name: newProfName, email: newProfEmail, center_id: adminCenterId, default_box_id: newProfBoxId || null
    }]);
    if (!error) {
      showToast('Profesional vinculado al sistema', 'success');
      setNewProfName(''); setNewProfEmail(''); setNewProfBoxId(''); loadData();
    } else {
      showToast('Error al vincular: ' + error.message, 'error');
    }
    setIsCreatingProf(false);
  };

  const fadeIn: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } };

  // ==========================================
  // RENDER: PANEL LOGUEADO
  // ==========================================
  if (session) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] font-sans text-stone-800 flex selection:bg-[#E4ECE7]">
        <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
        
        {/* SIDEBAR PREMIUM */}
        <aside className="w-[260px] bg-white border-r border-stone-100 hidden md:flex flex-col justify-between sticky top-0 h-screen z-20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div>
            <div className="p-6 border-b border-stone-50 flex items-center gap-3">
              <div className="h-10 w-10 bg-[#2C4A3B] text-white rounded-xl flex items-center justify-center font-black shadow-md"><ShieldCheck size={22} strokeWidth={1.5} /></div>
              <div>
                <h1 className="font-bold text-stone-900 text-sm leading-tight tracking-tight">Centro OM</h1>
                <span className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">Portal Clínico</span>
              </div>
            </div>
            
            <nav className="p-4 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase px-3 mb-2 tracking-wider mt-2">Gestión Diaria</p>
              <button onClick={() => setActiveTab('inicio')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'inicio' ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
                <Home size={18} strokeWidth={activeTab === 'inicio' ? 2 : 1.5} /> Inicio
              </button>
              
              <p className="text-[10px] font-bold text-stone-400 uppercase px-3 mt-8 mb-2 tracking-wider">Módulos Clínicos</p>
              <button onClick={() => setActiveTab('terapias')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'terapias' ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
                <Briefcase size={18} strokeWidth={activeTab === 'terapias' ? 2 : 1.5} /> Terapias y Servicios
              </button>
              
              {userRole === 'admin' && (
                <button onClick={() => setActiveTab('equipo')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'equipo' ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
                  <Bookmark size={18} strokeWidth={activeTab === 'equipo' ? 2 : 1.5} /> Equipo y Boxes
                </button>
              )}
              
              {userRole === 'admin' && (
                <button onClick={() => setActiveTab('finanzas')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'finanzas' ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
                  <DollarSign size={18} strokeWidth={activeTab === 'finanzas' ? 2 : 1.5} /> Finanzas del Mes
                </button>
              )}
              
              <button onClick={() => setActiveTab('resenas')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'resenas' ? 'bg-[#F4F7F5] text-[#2C4A3B]' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}>
                <Star size={18} strokeWidth={activeTab === 'resenas' ? 2 : 1.5} /> Reseñas Pacientes
              </button>
            </nav>
          </div>
          
          <div className="p-4 border-t border-stone-100">
            <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between group">
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-stone-800 truncate">{session.user.email.split('@')[0]}</p>
                <p className="text-[10px] text-stone-500 font-medium">{userRole === 'admin' ? 'Director(a)' : 'Terapeuta'}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><LogOut size={16} /></button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
          <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 h-16 px-6 flex items-center justify-between sticky top-0 z-10">
            <span className="bg-stone-50 border border-stone-100 rounded-lg py-1.5 px-3 text-xs font-semibold text-stone-600">Sede: {centers.find(c => c.id === adminCenterId)?.name || '...'}</span>
          </header>

          <main className="p-6 lg:p-10 max-w-[1400px] w-full mx-auto">
            
            {/* VISTA 1: INICIO */}
            {activeTab === 'inicio' && (
               <div className="flex flex-col items-center pt-8 pb-20 px-4">
                 <h2 className="text-3xl font-medium text-stone-900 mb-8 tracking-tight text-center">Hola, {session.user.email.split('@')[0]}</h2>
                 <p className="text-stone-500 mb-6 text-center text-sm">Bienvenido(a) a tu panel de control clínico.</p>
               </div>
            )}

            {/* VISTA 2: TERAPIAS Y SERVICIOS */}
            {activeTab === 'terapias' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Terapias y Servicios</h2>
                <div className="bg-white border border-stone-100 p-6 sm:p-8 rounded-[2rem] shadow-sm">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-5">Nuevo Servicio</h3>
                  <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Profesional</label>
                      <select required disabled={userRole === 'profesional'} className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={userRole === 'profesional' ? currentProfId : newProfId} onChange={e => setNewProfId(e.target.value)}>
                        {userRole === 'profesional' ? <option value={currentProfId}>{getProfName(currentProfId)}</option> : <><option value="" disabled>Seleccionar...</option>{visibleProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</>}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Nombre del Servicio</label>
                      <input required type="text" placeholder="Ej: Psicoterapia Adultos" className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Valor ($)</label>
                      <input required type="number" placeholder="Ej: 35000" className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                    </div>
                    <div className="md:col-span-4 mt-2">
                      <button type="submit" disabled={isCreating} className="bg-[#2C4A3B] hover:bg-[#233b2f] text-white font-medium py-3.5 px-8 rounded-xl flex items-center gap-2">
                        {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Crear Servicio
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white border border-stone-100 rounded-[2rem] shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-[#F9F8F6] border-b border-stone-100 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                      <tr><th className="px-6 py-5">Servicio</th><th className="px-6 py-5">Profesional</th><th className="px-6 py-5">Valor</th><th className="px-6 py-5 text-center">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {visibleServices.map(s => (
                        <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-stone-900">{s.name}</td>
                          <td className="px-6 py-4 text-stone-500">{getProfName(s.professional_id)}</td>
                          <td className="px-6 py-4 font-bold text-[#5F8575]">${s.price?.toLocaleString('es-CL')}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleDeleteService(s.id)} className="text-red-500 hover:bg-red-50 text-xs font-semibold px-4 py-2 rounded-xl">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* VISTA 3: EQUIPO Y BOXES */}
            {activeTab === 'equipo' && userRole === 'admin' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Equipo Clínico</h2>

                <div className="bg-white border border-stone-100 p-6 sm:p-8 rounded-[2rem] shadow-sm">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-5">Vincular Profesional</h3>
                  <form onSubmit={handleCreateProf} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Nombre Completo</label>
                      <input required type="text" placeholder="Dra. Ana Silva" className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={newProfName} onChange={e => setNewProfName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Correo Electrónico</label>
                      <input required type="email" placeholder="ana@centro.cl" className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={newProfEmail} onChange={e => setNewProfEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest pl-1 mb-1.5">Box Fijo</label>
                      <select className="w-full border border-stone-200 rounded-xl p-3.5 text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={newProfBoxId} onChange={e => setNewProfBoxId(e.target.value)}>
                        <option value="">Sin box fijo</option>
                        {visibleBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={isCreatingProf} className="bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl hover:bg-[#233b2f] flex items-center justify-center gap-2">
                       {isCreatingProf ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>} Agregar
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleProfessionals.map(p => (
                    <div key={p.id} className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                       <div className="w-14 h-14 rounded-full bg-[#F4F7F5] flex items-center justify-center text-[#2C4A3B] font-bold text-xl border border-[#E4ECE7]">
                         {p.name.charAt(0)}
                       </div>
                       <div>
                         <h4 className="font-semibold text-stone-900">{p.name}</h4>
                         <p className="text-[13px] text-stone-500 mb-1">{p.email}</p>
                         <span className="inline-block text-[10px] uppercase tracking-widest font-bold bg-stone-50 text-stone-400 px-2.5 py-1 rounded-md border border-stone-100">
                           {getBoxName(p.default_box_id)}
                         </span>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* VISTA 4: FINANZAS */}
            {activeTab === 'finanzas' && userRole === 'admin' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Finanzas del Mes</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#2C4A3B] text-white rounded-[2rem] p-8 shadow-lg">
                    <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-2">Ingreso Total</p>
                    <h3 className="text-4xl font-bold tracking-tight">${totalIncome.toLocaleString('es-CL')}</h3>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm">
                    <p className="text-stone-400 text-[11px] font-bold uppercase tracking-widest mb-2">Margen Clínica (30%)</p>
                    <h3 className="text-4xl font-bold text-[#5F8575] tracking-tight">${gananciaCentro.toLocaleString('es-CL')}</h3>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-[2rem] p-8 shadow-sm">
                    <p className="text-stone-400 text-[11px] font-bold uppercase tracking-widest mb-2">Pago a Equipo (70%)</p>
                    <h3 className="text-4xl font-bold text-stone-800 tracking-tight">${gananciaProfesionales.toLocaleString('es-CL')}</h3>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VISTA 5: RESEÑAS */}
            {activeTab === 'resenas' && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-6">
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">Reseñas de Pacientes</h2>
                {visibleReviews.length === 0 ? (
                   <div className="text-center py-16 text-stone-400">No hay reseñas registradas aún.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleReviews.map(r => (
                      <div key={r.id} className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-stone-900">{r.patient_name || 'Paciente Anónimo'}</h4>
                            <p className="text-xs text-stone-400">{formatShortDate(r.created_at)}</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < r.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed italic">"{r.comment}"</p>
                        <div className="mt-auto pt-4 border-t border-stone-50 text-[11px] font-bold uppercase tracking-widest text-stone-400">
                          Dr/a: {getProfName(r.professional_id)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGIN (Mantenido intacto)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans selection:bg-[#E4ECE7]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 bg-[#2C4A3B] text-white rounded-2xl flex items-center justify-center shadow-md"><ShieldCheck strokeWidth={1.5} size={28} /></div>
          <div><h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Acceso Clínico</h1></div>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input type="email" required placeholder="Correo" className="w-full border border-stone-200 py-3.5 px-4 rounded-xl text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" required placeholder="Contraseña" className="w-full border border-stone-200 py-3.5 px-4 rounded-xl text-sm bg-stone-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-[#5F8575]/20" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full bg-[#2C4A3B] text-white font-medium py-3.5 rounded-xl hover:bg-[#233b2f] flex justify-center">{loading ? <Loader2 className="animate-spin" /> : 'Ingresar'}</button>
        </form>
      </motion.div>
    </div>
  );
}