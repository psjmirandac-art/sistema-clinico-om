import { Suspense } from 'react';
import BookingClient from './BookingClient';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Reservar Sesión Clínica | Kairós',
  description: 'Agenda tu consulta de salud mental de forma confidencial, rápida y segura.',
};

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#2C4A3B]" size={36} />
        </div>
      }
    >
      <BookingClient />
    </Suspense>
  );
}