import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TenantProvider } from '@/providers/TenantProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#F9F8F6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kairosclinico.cl'),
  title: {
    default: 'Kairós Clínico | Suite de Gestión y Agendamiento en Salud Mental',
    template: '%s | Kairós Clínico',
  },
  description:
    'Plataforma integral de gestión clínica, agenda y boxes para profesionales e instituciones de salud mental.',
  applicationName: 'Kairós Clínico',
  authors: [{ name: 'Kairós Clínico SpA' }],
  keywords: [
    'Salud Mental',
    'Psicología',
    'Psiquiatría',
    'Ficha Clínica',
    'Agendamiento Médico',
    'Chile',
  ],
  openGraph: {
    title: 'Kairós Clínico | Salud Mental',
    description: 'Gestión clínica y agendamiento confidencial.',
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
    <html lang="es" className={`${inter.variable} antialiased scroll-smooth`}>
      <head>
        {/* Token oficial verificado de Google Search Console */}
        <meta
          name="google-site-verification"
          content="MNXfBwnUPhzNZFeIaqVabUDrRtZ7oR34psCaWjBmHXs"
        />
      </head>
      <body className="min-h-screen bg-[#F9F8F6] text-stone-800 selection:bg-[#2C4A3B] selection:text-white">
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}