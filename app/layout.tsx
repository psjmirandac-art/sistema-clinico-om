import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { TenantProvider } from '@/providers/TenantProvider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#2C4A3B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kairosclinico.cl'),
  title: {
    default: 'Kairós Clínico | Suite de Gestión en Salud Mental',
    template: '%s | Kairós Clínico',
  },
  description:
    'Plataforma integral y confidencial de agendamiento, fichas clínicas con IA y administración para profesionales de la salud mental.',
  applicationName: 'Kairós Clínico',
  authors: [{ name: 'Kairós Clínico' }],
  keywords: [
    'salud mental',
    'agenda psicológica',
    'fichas clínicas',
    'psicoterapia',
    'gestión de boxes',
    'chile',
  ],
  alternates: {
    canonical: 'https://www.kairosclinico.cl',
  },
  openGraph: {
    title: 'Kairós Clínico | Suite de Gestión en Salud Mental',
    description:
      'Agendamiento profesional, asignación dinámica de salas y resúmenes clínicos estructurados con IA.',
    url: 'https://www.kairosclinico.cl',
    siteName: 'Kairós Clínico',
    locale: 'es_CL',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} font-sans`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#F9F8F6] text-stone-800 antialiased selection:bg-[#2C4A3B] selection:text-white">
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}