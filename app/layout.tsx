import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { TenantProvider } from '@/providers/TenantProvider';
import './globals.css';

// Fuente premium geométrica y legible, ideal para salud y finanzas
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kairós | Salud Mental Integral',
  description: 'Sistema de agendamiento clínico y portal de pacientes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${jakarta.variable} font-sans scroll-smooth`}>
      <body className="bg-[#F9F8F6] text-stone-800 antialiased selection:bg-[#E4ECE7] selection:text-[#2C4A3B]">
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}