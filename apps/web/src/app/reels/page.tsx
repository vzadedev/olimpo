'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Music, Disc, Dumbbell } from 'lucide-react';
import type { ReelEntry } from '@gymrank/types';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { REELS } from '@/lib/graphql';

function Reel({ reel, isActive }: { reel: ReelEntry; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const videoSrc = mediaUrl(reel.videoUrl);
  const handle = reel.instagramUsername
    ? `@${reel.instagramUsername}`
    : reel.userName || reel.userEmail.split('@')[0];

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  if (!videoSrc) return null;

  return (
    <div className="relative h-screen w-full snap-start bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        playsInline
        muted
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="rounded-full bg-black/50 p-4 backdrop-blur-md">
            <div className="ml-1 h-8 w-8 border-y-[16px] border-l-[24px] border-y-transparent border-l-white/80" />
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full p-4 pt-12 flex justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-xl font-bold text-white shadow-sm">Reels</h1>
        <button type="button" className="text-white">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-6">
        <button
          type="button"
          className="flex flex-col items-center group"
          onClick={() => setIsLiked(!isLiked)}
        >
          <div className="rounded-full bg-black/40 p-3 backdrop-blur-sm">
            <Heart
              size={28}
              className={cn(
                'transition-colors',
                isLiked ? 'fill-primary text-primary' : 'text-white',
              )}
            />
          </div>
          <span className="mt-1 text-xs font-semibold text-white">
            {Math.round(reel.weight)}kg
          </span>
        </button>

        <button type="button" className="flex flex-col items-center group">
          <div className="rounded-full bg-black/40 p-3 backdrop-blur-sm">
            <MessageCircle size={28} className="text-white" />
          </div>
          <span className="mt-1 text-xs font-semibold text-white">{reel.gymName}</span>
        </button>

        <button type="button" className="flex flex-col items-center group">
          <div className="rounded-full bg-black/40 p-3 backdrop-blur-sm">
            <Share2 size={28} className="text-white" />
          </div>
          <span className="mt-1 text-xs font-semibold text-white">Share</span>
        </button>

        <div
          className="mt-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-black p-2 animate-spin"
          style={{ animationDuration: '4s' }}
        >
          <Disc size={24} className="text-primary" />
        </div>
      </div>

      <div className="absolute bottom-20 left-0 z-10 w-3/4 p-4 pb-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <h3 className="mb-2 text-lg font-bold text-white drop-shadow-md">{handle}</h3>
        <p className="mb-2 flex items-center gap-2 text-sm text-white/90 drop-shadow-md">
          <Dumbbell size={14} className="text-primary" />
          {reel.exerciseName} — <span className="font-bold text-primary">{reel.weight}kg</span>
        </p>
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 w-max backdrop-blur-md">
          <Music size={14} className="text-primary" />
          <span className="text-xs font-medium text-white truncate max-w-[150px]">
            {reel.gymName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useQuery<{ getReels: ReelEntry[] }>(REELS);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
    setActiveIndex(index);
  };

  const reels = data?.getReels ?? [];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Carregando reels...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-destructive px-6 text-center">
        Erro ao carregar reels
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-center px-6">
        <p className="text-lg font-bold text-white">Nenhum reel ainda</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Envie um levantamento com vídeo para aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 z-50 h-full w-full snap-y snap-mandatory overflow-y-auto bg-black hide-scrollbar"
    >
      {reels.map((reel, index) => (
        <Reel key={reel.id} reel={reel} isActive={index === activeIndex} />
      ))}
    </div>
  );
}
