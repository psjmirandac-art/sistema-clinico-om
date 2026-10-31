import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Ignoramos rutas internas de Next.js, APIs y archivos estáticos
     * para que el middleware no bloquee el rendimiento de la app.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Definimos nuestros dominios maestros (donde vive la landing principal y el login)
  const mainDomains = ['localhost:3000', 'kairosclinico.cl', 'www.kairosclinico.cl'];
  
  // Si el host NO está en la lista de dominios principales, es un subdominio (Tenant)
  const isSubdomain = !mainDomains.includes(hostname);

  if (isSubdomain) {
    // Extraemos "recovery" de "recovery.kairosclinico.cl"
    const subdomain = hostname.split('.')[0];
    
    // Reescribimos la petición silenciosamente hacia nuestra carpeta de clínicas
    // El paciente seguirá viendo "recovery.kairosclinico.cl" en su navegador
    return NextResponse.rewrite(new URL(`/centro/${subdomain}${url.pathname}`, req.url));
  }

  // Si es el dominio principal, dejamos que Next.js siga su curso normal
  return NextResponse.next();
}