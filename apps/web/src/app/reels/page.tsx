'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Music,
  Disc,
  Dumbbell,
  Share2,
} from 'lucide-react';
import type { ReelEntry } from '@gymrank/types';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import {
  RECORD_REEL_VIEW,
  REELS,
  TOGGLE_REEL_LIKE,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { getGraphQLErrorMessage } from '@/lib/apollo-utils';
import { ReelShareSheet } from '@/components/ReelShareSheet';
import { ReelCommentsSheet } from '@/components/ReelCommentsSheet';
import { ReelReportModal } from '@/components/ReelReportModal';
import { Sheet } from '@/components/ui/overlay';

const viewCooldown = new Set<string>();

function Reel({
  reel,
  isActive,
  onMenu,
}: {
  reel: ReelEntry & { viewCount?: number; commentCount?: number; likeCount?: number; likedByMe?: boolean; userId?: string };
  isActive: boolean;
  onMenu: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(reel.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(reel.likeCount ?? 0);
  const [viewCount, setViewCount] = useState(reel.viewCount ?? 0);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [recordView] = useMutation(RECORD_REEL_VIEW);
  const [toggleLike] = useMutation(TOGGLE_REEL_LIKE);

  useEffect(() => {
    setIsLiked(reel.likedByMe ?? false);
    setLikeCount(reel.likeCount ?? 0);
  }, [reel.likedByMe, reel.likeCount]);

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
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleEnded = useCallback(async () => {
    const key = reel.id;
    if (viewCooldown.has(key)) return;
    viewCooldown.add(key);
    setTimeout(() => viewCooldown.delete(key), 30_000);

    try {
      const { data } = await recordView({ variables: { submissionId: reel.id } });
      if (data?.recordReelView?.viewCount != null) {
        setViewCount(data.recordReelView.viewCount);
      }
    } catch {
      /* ignore */
    }
  }, [reel.id, recordView]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleLike = async () => {
    try {
      const { data } = await toggleLike({ variables: { submissionId: reel.id } });
      if (data?.toggleReelLike) {
        setIsLiked(data.toggleReelLike.liked);
        setLikeCount(data.toggleReelLike.likeCount);
      }
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao curtir'));
    }
  };

  if (!videoSrc) return null;

  return (
    <>
      <div className="relative h-screen w-full snap-start bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          loop={false}
          playsInline
          muted
          onClick={togglePlay}
          onEnded={handleEnded}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {!isPlaying && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="rounded-full bg-black/50 p-4 backdrop-blur-md">
              <div className="ml-1 h-8 w-8 border-y-[16px] border-l-[24px] border-y-transparent border-l-white/80" />
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full p-4 pt-12 flex justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <h1 className="text-xl font-bold text-white drop-shadow-md">Reels</h1>
          <button type="button" className="text-white hover:bg-white/20 p-1 rounded-full transition-colors" onClick={onMenu}>
            <MoreVertical size={24} className="drop-shadow-md" />
          </button>
        </div>

        <div className="absolute bottom-28 right-4 z-10 flex flex-col items-center gap-6">
          <button type="button" className="group flex flex-col items-center" onClick={handleLike}>
            <div className="rounded-full bg-black/40 p-3.5 backdrop-blur-md transition-transform group-hover:scale-105 active:scale-95 border border-white/10">
              <Heart size={28} className={cn('transition-all', isLiked ? 'fill-primary text-primary scale-110 drop-shadow-[0_0_8px_rgba(214,248,0,0.6)]' : 'text-white')} />
            </div>
            <span className="mt-1 text-[13px] font-bold text-white drop-shadow-md">{likeCount}</span>
          </button>

          <button type="button" className="group flex flex-col items-center" onClick={() => setCommentsOpen(true)}>
            <div className="rounded-full bg-black/40 p-3.5 backdrop-blur-md transition-transform group-hover:scale-105 active:scale-95 border border-white/10">
              <MessageCircle size={28} className="text-white drop-shadow-md" />
            </div>
            <span className="mt-1 text-[13px] font-bold text-white drop-shadow-md">{reel.commentCount ?? 0}</span>
          </button>

          <button type="button" className="group flex flex-col items-center" onClick={() => setShareOpen(true)}>
            <div className="rounded-full bg-black/40 p-3.5 backdrop-blur-md transition-transform group-hover:scale-105 active:scale-95 border border-white/10">
              <Share2 size={28} className="text-white drop-shadow-md" />
            </div>
            <span className="mt-1 text-[13px] font-bold text-white drop-shadow-md">Share</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="rounded-full bg-black/40 p-3.5 backdrop-blur-md border border-white/10">
              <Eye size={28} className="text-white drop-shadow-md" />
            </div>
            <span className="mt-1 text-[13px] font-bold text-white drop-shadow-md">{viewCount}</span>
          </div>

          <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-primary bg-black p-2 animate-[spin_4s_linear_infinite] shadow-[0_0_15px_rgba(214,248,0,0.4)]">
            <Disc size={26} className="text-primary" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 z-10 w-full p-4 pb-36 bg-gradient-to-t from-black via-black/70 to-transparent">
          <div className="w-4/5 pr-2">
            <Link href={`/profile/${reel.userId}`} className="mb-2 block text-lg font-bold text-white drop-shadow-md hover:text-primary">
              {handle}
            </Link>
            <p className="mb-3 flex items-center gap-2 text-[15px] text-white/90 drop-shadow-md">
              <Dumbbell size={16} className="text-primary" />
              {reel.exerciseName} — <span className="font-extrabold text-primary">{reel.weight}kg</span>
            </p>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 w-max backdrop-blur-md border border-white/10">
              <Music size={14} className="text-white" />
              <span className="text-xs font-medium text-white truncate max-w-[180px]">{reel.gymName}</span>
            </div>
          </div>
        </div>
      </div>

      <ReelShareSheet reelId={reel.id} open={shareOpen} onClose={() => setShareOpen(false)} />
      <ReelCommentsSheet submissionId={reel.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </>
  );
}

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuReelId, setMenuReelId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useQuery<{ getReels: ReelEntry[] }>(REELS, {
    variables: { mineOnly: false },
  });

  const handleScroll = () => {
    if (!containerRef.current) return;
    const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
    setActiveIndex(index);
  };

  const reels = data?.getReels ?? [];
  const menuReel = reels.find((r) => r.id === menuReelId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Carregando destaques...
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
        <p className="text-lg font-bold text-white">Nenhum destaque ainda</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Registre um levantamento com vídeo e entre no feed da competição.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 z-50 h-full w-full snap-y snap-mandatory overflow-y-auto bg-black hide-scrollbar"
      >
        {reels.map((reel, index) => (
          <Reel
            key={reel.id}
            reel={reel}
            isActive={index === activeIndex}
            onMenu={() => setMenuReelId(reel.id)}
          />
        ))}
      </div>

      <ReelReportModal
        submissionId={menuReelId ?? ''}
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setMenuReelId(null);
        }}
      />

      <Sheet
        open={!!menuReelId && !reportOpen}
        onClose={() => setMenuReelId(null)}
        title="Opções"
      >
        <div className="space-y-2 px-4 pb-safe">
          <button
            type="button"
            className="w-full rounded-xl py-3 text-left font-medium text-destructive"
            onClick={() => setReportOpen(true)}
          >
            Denunciar vídeo
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-border py-3 font-medium"
            onClick={() => setMenuReelId(null)}
          >
            Cancelar
          </button>
        </div>
      </Sheet>
    </>
  );
}
