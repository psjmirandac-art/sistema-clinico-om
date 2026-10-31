import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad y Confidencialidad Médica | Kairós Clínico',
  description: 'Tratamiento de datos personales y secreto médico en cumplimiento con las leyes chilenas 19.628 y 20.584.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navegación y Cabecera */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-[#2C4A3B] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2C4A3B] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Privacidad y Protección de Datos
              </h1>
              <p className="text-xs text-stone-500">Kairós Clínico • Actualizado a octubre 2026</p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Contenido Legal */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-10 shadow-xs space-y-6 text-sm text-stone-600 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Lock size={16} className="text-[#2C4A3B]" /> 1. Marco Regulatorio y Secreto Profesional
            </h2>
            <p>
              Kairós Clínico opera como infraestructura digital confidencial para profesionales e instituciones
              de la salud mental. El tratamiento de los datos clínicos y de contacto se rige bajo la 
              <strong> Ley N° 19.628</strong> sobre Protección de la Vida Privada y la 
              <strong> Ley N° 20.584</strong> que regula los derechos y deberes que tienen las personas en relación 
              con acciones vinculadas a su atención en salud en la República de Chile.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Database size={16} className="text-[#2C4A3B]" /> 2. Autenticación y Cuentas de Acceso
            </h2>
            <p>
              Cuando un profesional o administrador accede utilizando su cuenta de Google, Kairós Clínico únicamente
              recopila el nombre de usuario y su dirección de correo electrónico validada para verificar la identidad
              y habilitar el panel de gestión médica. En ningún caso se solicitan accesos a contraseñas personales,
              contactos privados o correos electrónicos ajenos a la prestación del servicio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <UserCheck size={16} className="text-[#2C4A3B]" /> 3. Aislamiento Multi-Tenant
            </h2>
            <p>
              Cada consulta o centro médico dispone de un entorno aislado lógicamente identificado por su 
              código de centro (<code>center_id</code>). Ningún profesional ni centro colaborador puede visualizar, 
              transferir ni compartir expedientes clínicos o fichas asistenciales pertenecientes a otra institución.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-stone-100">
            <h2 className="text-base font-bold text-stone-900">4. Contacto Institucional</h2>
            <p>
              Para ejercer los derechos de acceso, rectificación o eliminación de credenciales de usuario,
              puede dirigirse formalmente al administrador de la plataforma mediante 
              <strong className="text-stone-900"> contacto@kairosclinico.cl</strong>.
            </p>
          </section>

        </div>

        <footer className="text-center text-xs text-stone-400">
          © 2026 Kairós Clínico. Todos los derechos reservados.
        </footer>

      </div>
    </div>
  );
}