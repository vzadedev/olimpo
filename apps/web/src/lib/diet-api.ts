'use client';

import { compressImageToBase64 } from '@/lib/image';
import { API_URL } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

/** OLIMPO — análise de prato via API REST */
export async function analyzeMealImage(
  file: File,
  userNote?: string,
  mealType?: string,
): Promise<Record<string, unknown>> {
  const token = useAuthStore.getState().token;
  const { base64, mediaType } = await compressImageToBase64(file, 800 * 1024, 0.65);

  const res = await fetch(`${API_URL}/api/diet/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      imageBase64: base64,
      mediaType,
      userNote,
      mealType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao analisar imagem');
  }

  return res.json();
}
