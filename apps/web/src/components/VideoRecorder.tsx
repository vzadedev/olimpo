'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Square, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_SECONDS = 60;

type Props = {
  onVideoReady: (file: File) => void;
  onCancel: () => void;
};

export function VideoRecorder({ onVideoReady, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Permita acesso à câmera e ao microfone');
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!previewUrl) startCamera();
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewUrl, startCamera, stopStream]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `levantamento-${Date.now()}.webm`, {
        type: 'video/webm',
      });
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
    };
    recorder.start(250);
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) {
          stopRecording();
          return MAX_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (previewUrl && previewFile) {
    return (
      <div className="space-y-4">
        <video src={previewUrl} controls className="w-full rounded-xl" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setPreviewFile(null);
              setSeconds(0);
            }}
            className="flex-1 rounded-xl border border-border py-3"
          >
            Gravar de novo
          </button>
          <button
            type="button"
            onClick={() => onVideoReady(previewFile)}
            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-black"
          >
            Usar vídeo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[9/16] max-h-[60vh] overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {recording && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {formatTime(seconds)}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface"
        >
          <RotateCcw size={20} />
        </button>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-black"
          >
            <Video size={28} />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white"
          >
            <Square size={24} fill="currentColor" />
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Máximo {MAX_SECONDS}s · {formatTime(seconds)} / {formatTime(MAX_SECONDS)}
      </p>
    </div>
  );
}
