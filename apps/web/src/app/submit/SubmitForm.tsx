'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import type { Exercise, Gym } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { API_URL } from '@/lib/config';
import { VideoRecorder } from '@/components/VideoRecorder';
import {
  CREATE_SUBMISSION,
  EXERCISE_WORKOUTS,
  EXERCISES,
  GYM_EXERCISES,
  GYMS,
  ME,
  RANKING,
  REELS,
} from '@/lib/graphql';
import {
  MAX_DISTANCE_METERS,
  distanceInMeters,
  formatDistanceMessage,
} from '@/lib/geo';

export function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gymId = searchParams.get('gymId') ?? '';
  const paramExerciseId = searchParams.get('exerciseId') ?? '';
  const token = useAuthStore((s) => s.token);

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('5');
  const [file, setFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<'none' | 'gallery' | 'record'>('none');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoError, setGeoError] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedGymId, setSelectedGymId] = useState(gymId);
  const effectiveGymId = selectedGymId || gymId;

  const { data: gymsData } = useQuery<{ gyms: Gym[] }>(GYMS);
  const gyms = gymsData?.gyms ?? [];
  const gym = gyms.find((g) => g.id === effectiveGymId);

  useEffect(() => {
    if (!gymId && gyms[0] && !selectedGymId) {
      setSelectedGymId(gyms[0].id);
    }
  }, [gymId, gyms, selectedGymId]);

  const { data: exercisesData } = useQuery<{ exercises: Exercise[] }>(EXERCISES);
  const exercises = exercisesData?.exercises ?? [];
  const [selectedExerciseId, setSelectedExerciseId] = useState(paramExerciseId);

  useEffect(() => {
    if (paramExerciseId) setSelectedExerciseId(paramExerciseId);
    else if (!selectedExerciseId && exercises[0]) setSelectedExerciseId(exercises[0].id);
  }, [paramExerciseId, exercises, selectedExerciseId]);

  const exerciseId = selectedExerciseId || exercises[0]?.id;

  const distanceMeters = useMemo(() => {
    if (!gym || latitude === null || longitude === null) return null;
    return distanceInMeters(latitude, longitude, gym.latitude, gym.longitude);
  }, [gym, latitude, longitude]);

  const isWithinRange =
    distanceMeters !== null && distanceMeters <= MAX_DISTANCE_METERS;

  const [createSubmission] = useMutation(CREATE_SUBMISSION);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => setGeoError('Permita a localização para validar sua submissão na academia'),
      { enableHighAccuracy: true },
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !exerciseId || !effectiveGymId) {
      toast.warning('Preencha todos os campos para competir');
      return;
    }
    if (latitude === null || longitude === null) {
      toast.warning('Ative a localização para validar sua submissão na academia');
      return;
    }
    if (!isWithinRange) {
      toast.error(
        distanceMeters !== null
          ? formatDistanceMessage(distanceMeters)
          : 'Você precisa estar na academia para registrar',
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Falha no upload');
      const { url } = await uploadRes.json();

      const { data } = await createSubmission({
        variables: {
          input: {
            weight: parseFloat(weight),
            reps: parseInt(reps, 10),
            videoUrl: url,
            gymId: effectiveGymId,
            exerciseId,
            latitude,
            longitude,
          },
        },
        refetchQueries: [
          { query: EXERCISE_WORKOUTS, variables: { gymId: effectiveGymId, exerciseId } },
          { query: RANKING, variables: { gymId: effectiveGymId, exerciseId } },
          { query: GYM_EXERCISES, variables: { gymId: effectiveGymId } },
          { query: REELS },
          { query: ME },
        ],
        awaitRefetchQueries: true,
      });

      if (!data?.createSubmission?.id) {
        throw new Error('Resposta inválida ao registrar levantamento');
      }

      toast.success('Levantamento registrado! Confira sua posição no ranking.');
      router.push(`/gym/${effectiveGymId}/exercise/${exerciseId}`);
    } catch (err: unknown) {
      const gqlError =
        err &&
        typeof err === 'object' &&
        'graphQLErrors' in err &&
        Array.isArray((err as { graphQLErrors: { message: string }[] }).graphQLErrors)
          ? (err as { graphQLErrors: { message: string }[] }).graphQLErrors[0]?.message
          : null;
      toast.error(gqlError ?? 'Erro ao registrar levantamento');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (videoMode === 'record') {
    return (
      <div className="px-2">
        <h1 className="mb-4 text-2xl font-bold">Gravar levantamento</h1>
        <VideoRecorder
          onCancel={() => setVideoMode('none')}
          onVideoReady={(videoFile) => {
            setFile(videoFile);
            setVideoMode('none');
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-2">
      <h1 className="mb-6 text-2xl font-bold">Provar seu valor</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {gyms.length > 0 && (
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Academia</label>
            <select
              value={effectiveGymId}
              onChange={(e) => setSelectedGymId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione a academia</option>
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Carga (kg)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-4 text-3xl font-black text-primary outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
            required
          />
        </div>

        {exercises.length > 0 && (
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Exercício</label>
            <select
              value={exerciseId ?? ''}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Repetições</label>
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-xl font-bold outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Vídeo do levantamento</label>
          {file && (
            <p className="mb-2 text-sm text-primary">✓ {file.name}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVideoMode('record')}
              className="rounded-xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary"
            >
              Gravar agora
            </button>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-border bg-surface py-3 text-sm font-semibold">
              Escolher da galeria
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          {latitude !== null && distanceMeters !== null ? (
            isWithinRange ? (
              <p className="text-primary">
                📍 Localização validada · {Math.round(distanceMeters)} m da academia
              </p>
            ) : (
              <p className="text-destructive">{formatDistanceMessage(distanceMeters)}</p>
            )
          ) : geoError ? (
            <p className="text-destructive">{geoError}</p>
          ) : (
            <p className="text-muted-foreground">Obtendo localização...</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isWithinRange || !file}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar para o ranking'}
        </button>
      </form>
    </div>
  );
}
