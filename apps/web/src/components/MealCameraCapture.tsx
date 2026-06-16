'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, X } from 'lucide-react';
import { Sheet } from '@/components/ui/overlay';

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function MealCameraCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
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
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Permita acesso à câmera ou use a galeria.');
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    startCamera();
    return () => stopStream();
  }, [open, startCamera, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `meal-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title="Fotografar prato">
      <div className="relative aspect-[3/4] w-full bg-black">
        {error ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
            {error}
          </p>
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
        <div className="absolute bottom-0 left-0 flex w-full items-center justify-between p-4">
          <button
            type="button"
            onClick={() => setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'))}
            className="rounded-full bg-black/50 p-3 text-white"
          >
            <RotateCcw size={20} />
          </button>
          <button
            type="button"
            onClick={capture}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary text-black"
          >
            <Camera size={24} />
          </button>
          <button type="button" onClick={onClose} className="rounded-full bg-black/50 p-3 text-white">
            <X size={20} />
          </button>
        </div>
      </div>
    </Sheet>
  );
}
