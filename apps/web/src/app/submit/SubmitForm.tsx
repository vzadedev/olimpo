'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import type { Exercise } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { API_URL } from '@/lib/config';
import { CREATE_SUBMISSION, EXERCISES } from '@/lib/graphql';

export function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gymId = searchParams.get('gymId') ?? '';
  const paramExerciseId = searchParams.get('exerciseId') ?? '';
  const token = useAuthStore((s) => s.token);

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('5');
  const [file, setFile] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoError, setGeoError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: exercisesData } = useQuery<{ exercises: Exercise[] }>(EXERCISES);
  const exercises = exercisesData?.exercises ?? [];
  const [selectedExerciseId, setSelectedExerciseId] = useState(paramExerciseId);

  useEffect(() => {
    if (paramExerciseId) setSelectedExerciseId(paramExerciseId);
    else if (!selectedExerciseId && exercises[0]) setSelectedExerciseId(exercises[0].id);
  }, [paramExerciseId, exercises, selectedExerciseId]);

  const exerciseId = selectedExerciseId || exercises[0]?.id;

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
      () => setGeoError('Permita acesso à localização para enviar'),
      { enableHighAccuracy: true },
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !exerciseId || !gymId) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }
    if (latitude === null || longitude === null) {
      toast.warning('Localização necessária para enviar');
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
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();

      await createSubmission({
        variables: {
          input: {
            weight: parseFloat(weight),
            reps: parseInt(reps, 10),
            videoUrl: url,
            gymId,
            exerciseId,
            latitude,
            longitude,
          },
        },
      });

      toast.success('Treino registrado com sucesso!');
      router.push(`/gym/${gymId}/exercise/${exerciseId}`);
    } catch (err: unknown) {
      const gqlError =
        err &&
        typeof err === 'object' &&
        'graphQLErrors' in err &&
        Array.isArray((err as { graphQLErrors: { message: string }[] }).graphQLErrors)
          ? (err as { graphQLErrors: { message: string }[] }).graphQLErrors[0]?.message
          : null;
      toast.error(gqlError ?? 'Erro ao enviar submissão');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="px-2">
      <h1 className="mb-6 text-2xl font-bold">Registrar treino</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Peso (kg)</label>
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
          <label className="mb-2 block text-sm text-muted-foreground">Vídeo</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            required
          />
        </div>

        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          {latitude !== null ? (
            <p className="text-primary">
              📍 Localização OK ({latitude.toFixed(4)}, {longitude?.toFixed(4)})
            </p>
          ) : geoError ? (
            <p className="text-destructive">{geoError}</p>
          ) : (
            <p className="text-muted-foreground">Obtendo localização...</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || latitude === null}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar treino'}
        </button>
      </form>
    </div>
  );
}
