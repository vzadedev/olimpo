'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, MapPin, QrCode, Camera, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AccessPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Mocking the geolocation distance checking
  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        setStep(2);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="pt-4 pb-20 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground transition-transform active:scale-95">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Check-in</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 relative flex h-32 w-32 items-center justify-center rounded-full bg-surface">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary"
              />
              <MapPin size={48} className="text-primary z-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verificando Localização</h2>
            <p className="text-muted-foreground">Aguarde enquanto verificamos se você está a menos de 100m da academia.</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            <div className="mb-4 flex items-center gap-2 text-primary font-medium">
               <CheckCircle2 size={20} /> Localização Confirmada!
            </div>
            
            <div className="bg-surface w-full aspect-square rounded-3xl border-2 border-dashed border-primary/50 flex flex-col items-center justify-center p-8 mb-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('/placeholder-qr-scan.png')] bg-cover opacity-20 mix-blend-screen mix-blend-overlay"></div>
               <QrCode size={64} className="text-primary/80 mb-4" />
               <p className="text-white/80 font-medium relative z-10 text-sm">Aponte a câmera para o QR Code no equipamento do exercício.</p>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full rounded-full bg-primary py-4 font-bold text-black shadow-[0_0_20px_rgba(214,248,0,0.2)] transition active:scale-95"
            >
              Simular Leitura (Demo)
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mb-6 h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
              <Camera size={48} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Equipamento Liberado!</h2>
            <p className="text-muted-foreground mb-8">Prepare-se. O aplicativo gravará seu levantamento para enviar ao Leaderboard e ao Reels.</p>

            <Link
              href="/reels"
              className="w-full block rounded-full bg-primary py-4 font-bold text-black shadow-[0_0_20px_rgba(214,248,0,0.2)]"
            >
              Iniciar Gravação
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
