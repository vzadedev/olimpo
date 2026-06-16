'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReelDeepLinkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/reels?reel=${id}`);
  }, [id, router]);

  return <p className="p-4 text-muted-foreground">Abrindo reel...</p>;
}
