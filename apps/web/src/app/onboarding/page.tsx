'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-end bg-background overflow-hidden p-6">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-20%] h-[60vh] w-[140vw] rounded-full bg-gradient-to-b from-primary/20 to-transparent blur-3xl" />
        <div className="absolute top-[10%] left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full border border-primary/20" />
        <div className="absolute top-[15%] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full border-[10px] border-primary/40 shadow-[0_0_50px_rgba(214,248,0,0.2)]" />
        {/* Placeholder for athlete image overlay */}
        <div className="absolute top-[5%] left-1/2 h-[500px] w-[300px] -translate-x-1/2 bg-[url('/placeholder-athlete.png')] bg-contain bg-center bg-no-repeat opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 w-full mb-12"
      >
        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white">
          Transform Your Body, <br />
          <span className="text-primary">Transform</span> Your Life
        </h1>
        <p className="mb-8 text-base text-muted-foreground leading-relaxed">
          Every workout brings you closer to a stronger, healthier version of yourself.
        </p>

        <Link
          href="/register"
          className="group flex w-full items-center justify-between rounded-full border border-primary/30 bg-transparent p-2 pl-6 font-bold text-primary transition-all hover:bg-primary/10 active:scale-95"
        >
          <span className="text-lg">Criar conta</span>
        </Link>
        <Link
          href="/login"
          className="group mt-3 flex w-full items-center justify-center text-sm text-muted-foreground"
        >
          Já tenho conta
        </Link>
      </motion.div>
    </div>
  );
}
