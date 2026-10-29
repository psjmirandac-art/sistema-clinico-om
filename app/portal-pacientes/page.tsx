import Link from 'next/link';
import { UserCircle, Lock, ArrowLeft } from 'lucide-react';

export default function PortalPacientesLogin() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Botón para regresar */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal de Pacientes</h1>
          <p className="text-slate-500 text-sm mt-2">
            Ingresa con tu RUT para gestionar tus citas, ver tus pagos y acceder a tus enlaces de telemedicina.
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">RUT</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="12.345.678-9" 
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <div className="text-right mt-1">
              <Link href="#" className="text-xs text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>
          </div>

          <button 
            type="button" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-blue-200 mt-2"
          >
            Ingresar a mi portal
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
          ¿No tienes cuenta o eres paciente nuevo? <br/>
          <Link href="/agendar" className="text-blue-600 font-semibold hover:underline mt-1 inline-block">
            Agenda tu primera sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}