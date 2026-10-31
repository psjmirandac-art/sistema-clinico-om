'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, ShieldCheck, ChevronDown, Check, DoorClosed, 
  Users, Calendar, Settings, LogOut, Loader2, Plus, 
  Sparkles, TrendingUp, Clock, UserCheck, Search, Filter, 
  AlertCircle, CheckCircle2, X, Phone, Mail, Stethoscope, 
  UserPlus, RefreshCw, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Interfaces del Dominio Clínico
interface Center {
  id: string;
  name: string;
  slug: string;
  boxes_count: number;
}

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: 'admin' | 'terapeuta';
  status?: string;
  center_id: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string;
  appointment_time: string;
  box_number: number;
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
  professional_id: string;
  center_id: string;
  professionals?: {
    name: string;
    specialty: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Estados de Sesión y Sedes
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [centersList, setCentersList] = useState<Center[]>([]);
  const [activeCenter, setActiveCenter] = useState<Center | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Navegación por Módulos
  const [activeTab, setActiveTab] = useState<'boxes' | 'team' | 'appointments' | 'settings'>('boxes');

  // Datos Operativos del Centro Activo
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshingData, setRefreshingData] = useState(false);

  // Modales
  const [isAddTherapistOpen, setIsAddTherapistOpen] = useState(false);
  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistEmail, setNewTherapistEmail] = useState('');
  const [newTherapistSpecialty, setNewTherapistSpecialty] = useState('Psicología Clínica');
  const [newTherapistRole, setNewTherapistRole] = useState<'terapeuta' | 'admin'>('terapeuta');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filtros de Citas
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // 1. Cargar Sesión y Sedes Disponibles
  useEffect(() => {
    async function initAuthAndCenters() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        const email = session.user.email?.trim().toLowerCase();
        setUserEmail(email || null);

        const { data: profs, error } = await supabase
          .from('professionals')
          .select(`
            id,
            name,
            email,
            role,
            center_id,
            centers (
              id,
              name,
              slug,
              boxes_count
            )
          `)
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!profs || profs.length === 0) {
          router.push('/onboarding');
          return;
        }

        const validCenters: Center[] = profs
          .map((p: any) => p.centers)
          .filter(Boolean);

        // Deduplicar centros por ID
        const uniqueCenters = Array.from(
          new Map(validCenters.map((item) => [item.id, item])).values()
        );

        setCentersList(uniqueCenters);

        const savedCenterId = localStorage.getItem('kairos_active_center_id');
        const defaultCenter = uniqueCenters.find((c) => c.id === savedCenterId) || uniqueCenters[0];

        setActiveCenter(defaultCenter);
        if (defaultCenter) {
          localStorage.setItem('kairos_active_center_id', defaultCenter.id);
        }
      } catch (err) {
        console.error('Error inicializando suite admin:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuthAndCenters();
  }, [router]);

  // 2. Cargar Datos Operativos del Centro Activo
  const fetchCenterOperationalData = async (centerId: string) => {
    setRefreshingData(true);
    try {
      // Cargar Equipo de Profesionales
      const { data: teamData, error: teamErr } = await supabase
        .from('professionals')
        .select('*')
        .eq('center_id', centerId)
        .order('name', { ascending: true });

      if (teamErr) throw teamErr;
      setProfessionals(teamData || []);

      // Cargar Citas Médicas del Centro
      const { data: apptData, error: apptErr } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          patient_email,
          patient_phone,
          appointment_date,
          appointment_time,
          box_number,
          status,
          professional_id,
          center_id,
          professionals (
            name,
            specialty
          )
        `)
        .eq('center_id', centerId)
        .order('appointment_date', { ascending: false });

      if (!apptErr) {
        setAppointments((apptData as any) || []);
      }
    } catch (err) {
      console.error('Error cargando métricas operativas:', err);
    } finally {
      setRefreshingData(false);
    }
  };

  useEffect(() => {
    if (activeCenter?.id) {
      fetchCenterOperationalData(activeCenter.id);
    }
  }, [activeCenter?.id]);

  // Cambiar de Centro Activo
  const handleSelectCenter = (center: Center) => {
    setActiveCenter(center);
    localStorage.setItem('kairos_active_center_id', center.id);
    setIsSwitcherOpen(false);
  };

  // Crear Nuevo Profesional en la Sede
  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenter?.id) return;
    setModalLoading(true);
    setModalError(null);

    try {
      const payload = {
        name: newTherapistName.trim(),
        email: newTherapistEmail.trim().toLowerCase(),
        specialty: newTherapistSpecialty.trim(),
        role: newTherapistRole,
        center_id: activeCenter.id,
      };

      const { data, error } = await supabase
        .from('professionals')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setProfessionals((prev) => [...prev, data]);
      setIsAddTherapistOpen(false);
      setNewTherapistName('');
      setNewTherapistEmail('');
    } catch (err: any) {
      setModalError(err.message || 'No se pudo vincular al terapeuta.');
    } finally {
      setModalLoading(false);
    }
  };

  // Actualizar Estado de Cita Médica
  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((appt) => (appt.id === appointmentId ? { ...appt, status: newStatus } : appt))
      );
    } catch (err) {
      console.error('Error actualizando estado de cita:', err);
    }
  };

  // Métricas Computadas
  const metrics = useMemo(() => {
    const totalBoxes = activeCenter?.boxes_count || 1;
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter((a) => a.appointment_date === today);
    const occupiedBoxesCount = new Set(todayAppointments.map((a) => a.box_number)).size;
    const occupancyRate = Math.min(Math.round((occupiedBoxesCount / totalBoxes) * 100), 100);

    return {
      totalBoxes,
      todayCount: todayAppointments.length,
      occupancyRate,
      activeTeamCount: professionals.length,
    };
  }, [activeCenter, appointments, professionals]);

  // Citas Filtradas
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const matchesSearch =
        appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.professionals?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || appt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('kairos_active_center_id');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2C4A3B]" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans selection:bg-[#2C4A3B] selection:text-white pb-16">
      
      {/* 1. TOP NAVBAR MULTI-TENANT */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-[#2C4A3B] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck size={20} />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block leading-tight">
                  Kairós Clínico
                </span>
                <span className="text-xs font-semibold text-stone-700">Suite Profesional</span>
              </div>
            </div>

            <div className="h-6 w-px bg-stone-200 hidden sm:block" />

            {/* Selector Desplegable de Sedes */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-stone-100/80 hover:bg-stone-200/60 border border-stone-200 text-stone-900 transition-all text-xs font-bold shadow-2xs"
              >
                <Building2 size={15} className="text-[#2C4A3B]" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {activeCenter?.name || 'Seleccionar Sede'}
                </span>
                <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Tus Sedes Clínicas
                    </div>
                    {centersList.map((center) => (
                      <button
                        key={center.id}
                        type="button"
                        onClick={() => handleSelectCenter(center)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          activeCenter?.id === center.id
                            ? 'bg-[#F4F7F5] text-[#2C4A3B]'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 size={14} className="shrink-0 text-stone-400" />
                          <span className="truncate">{center.name}</span>
                        </div>
                        {activeCenter?.id === center.id && (
                          <Check size={14} className="text-[#2C4A3B] shrink-0" />
                        )}
                      </button>
                    ))}

                    <div className="pt-1.5 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => router.push('/onboarding')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#2C4A3B] hover:bg-[#F4F7F5] transition-colors"
                      >
                        <Plus size={14} /> Registrar Nueva Sede
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => activeCenter?.id && fetchCenterOperationalData(activeCenter.id)}
              disabled={refreshingData}
              className="h-9 w-9 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-center transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw size={15} className={refreshingData ? 'animate-spin text-[#2C4A3B]' : ''} />
            </button>
            <span className="text-xs text-stone-500 font-medium hidden md:inline-block truncate max-w-[180px]">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="h-9 w-9 rounded-xl border border-stone-200 text-stone-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* 2. BARRA DE CONTROL PRINCIPAL Y TABS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        
        {/* Banner de Sede Activa */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F7F5] text-[#2C4A3B] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Entorno Clínico Habilitado
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {activeCenter?.name}
            </h1>
            <p className="text-xs text-stone-500">
              Enlace de agendamiento de pacientes: <code className="text-[#2C4A3B] font-bold">kairosclinico.cl/agendar/{activeCenter?.slug}</code>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
            <div className="px-4 py-3 rounded-2xl bg-[#F9F8F6] border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Boxes</span>
              <span className="text-lg font-black text-stone-900">{metrics.totalBoxes}</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#F9F8F6] border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Equipo</span>
              <span className="text-lg font-black text-stone-900">{metrics.activeTeamCount}</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#F9F8F6] border border-stone-200 text-center">
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Ocupación</span>
              <span className="text-lg font-black text-[#2C4A3B]">{metrics.occupancyRate}%</span>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas de Navegación */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('boxes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'boxes'
                ? 'bg-[#2C4A3B] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            <DoorClosed size={15} /> Boxes y Ocupación
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'team'
                ? 'bg-[#2C4A3B] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            <Users size={15} /> Equipo Clínico ({professionals.length})
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-[#2C4A3B] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            <Calendar size={15} /> Agenda y Pacientes ({appointments.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-[#2C4A3B] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            <Settings size={15} /> Configuración de Sede
          </button>
        </div>

        {/* 3. VISTAS ACTIVAS */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: BOXES FÍSICOS Y ESTADO DE OCUPACIÓN */}
          {activeTab === 'boxes' && (
            <motion.div
              key="boxes-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: activeCenter?.boxes_count || 1 }).map((_, index) => {
                  const boxNum = index + 1;
                  const currentAppt = appointments.find((a) => a.box_number === boxNum && a.status === 'confirmada');

                  return (
                    <div
                      key={`box-${boxNum}`}
                      className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-2xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center font-bold text-sm">
                            B{boxNum}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-stone-900">Box Clínico {boxNum}</h3>
                            <span className="text-[11px] text-stone-400">Atención Presencial</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            currentAppt
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {currentAppt ? 'En Uso' : 'Disponible'}
                        </span>
                      </div>

                      <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                        {currentAppt ? (
                          <>
                            <div className="flex items-center justify-between text-stone-700 font-semibold">
                              <span className="truncate">{currentAppt.patient_name}</span>
                              <span className="text-[11px] text-stone-500">{currentAppt.appointment_time}</span>
                            </div>
                            <p className="text-[11px] text-stone-500">
                              Terapeuta: {currentAppt.professionals?.name || 'Asignado'}
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-stone-400 py-1">
                            <span>Sin sesión activa en este momento</span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 2: EQUIPO TERAPÉUTICO */}
          {activeTab === 'team' && (
            <motion.div
              key="team-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Directorio de Profesionales</h2>
                  <p className="text-xs text-stone-500">Terapeutas y administradores autorizados en esta sede.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTherapistOpen(true)}
                  className="h-10 px-4 bg-[#2C4A3B] text-white text-xs font-bold rounded-2xl hover:bg-[#233b2f] transition-all flex items-center gap-2 shadow-xs"
                >
                  <UserPlus size={14} /> Añadir Terapeuta
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {professionals.map((prof) => (
                    <div key={prof.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-center gap-3.5 truncate">
                        <div className="h-10 w-10 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {prof.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{prof.name}</h4>
                          <p className="text-[11px] text-stone-500 flex items-center gap-2">
                            <span>{prof.specialty}</span>
                            <span>•</span>
                            <span className="truncate">{prof.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          prof.role === 'admin' 
                            ? 'bg-[#F4F7F5] text-[#2C4A3B] border border-[#E4ECE7]' 
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {prof.role === 'admin' ? 'Director' : 'Terapeuta'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {professionals.length === 0 && (
                    <div className="p-12 text-center text-xs text-stone-400">
                      No hay profesionales registrados en esta sede todavía.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CITAS Y PACIENTES */}
          {activeTab === 'appointments' && (
            <motion.div
              key="appointments-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                  <input
                    type="text"
                    placeholder="Buscar por paciente o terapeuta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2C4A3B]/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 outline-none"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Listado de Citas */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {filteredAppointments.map((appt) => (
                    <div key={appt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">{appt.patient_name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            Box {appt.box_number}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {appt.appointment_date} a las {appt.appointment_time}</span>
                          <span>•</span>
                          <span>Dr(a). {appt.professionals?.name || 'No asignado'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={appt.status}
                          onChange={(e) => handleUpdateAppointmentStatus(appt.id, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none ${
                            appt.status === 'confirmada'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : appt.status === 'completada'
                              ? 'bg-stone-100 text-stone-600 border-stone-200'
                              : appt.status === 'cancelada'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <div className="p-12 text-center text-xs text-stone-400">
                      No se encontraron citas médicas registradas bajo estos criterios.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CONFIGURACIÓN DE SEDE */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-stone-900">Parámetros de la Sede</h2>
                <p className="text-xs text-stone-500">Configuración estructural del centro clínico activo.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Nombre Institucional
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeCenter?.name || ''}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Identificador Canónico (Slug)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={activeCenter?.slug || ''}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Capacidad de Salas Físicas (Boxes)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${activeCenter?.boxes_count || 1} Salas Habilitadas`}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* 4. MODAL PARA AÑADIR NUEVO TERAPEUTA */}
      <AnimatePresence>
        {isAddTherapistOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#F4F7F5] text-[#2C4A3B] flex items-center justify-center">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Añadir Profesional</h3>
                    <p className="text-[11px] text-stone-400">Vincular a {activeCenter?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddTherapistOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProfessional} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Dra. Camila Morales"
                    value={newTherapistName}
                    onChange={(e) => setNewTherapistName(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Correo Profesional *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="camila.morales@consulta.cl"
                    value={newTherapistEmail}
                    onChange={(e) => setNewTherapistEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Especialidad Médica
                  </label>
                  <input
                    type="text"
                    placeholder="Psiquiatría Adultos / Neuropsicología"
                    value={newTherapistSpecialty}
                    onChange={(e) => setNewTherapistSpecialty(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#2C4A3B]/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    Rol en la Plataforma
                  </label>
                  <select
                    value={newTherapistRole}
                    onChange={(e) => setNewTherapistRole(e.target.value as any)}
                    className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs outline-none font-semibold text-stone-700"
                  >
                    <option value="terapeuta">Terapeuta Clínico</option>
                    <option value="admin">Director / Administrador</option>
                  </select>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTherapistOpen(false)}
                    className="flex-1 h-11 border border-stone-200 text-stone-600 text-xs font-bold rounded-2xl hover:bg-stone-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 h-11 bg-[#2C4A3B] text-white text-xs font-bold rounded-2xl hover:bg-[#233b2f] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {modalLoading ? <Loader2 size={15} className="animate-spin" /> : 'Guardar Terapeuta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}