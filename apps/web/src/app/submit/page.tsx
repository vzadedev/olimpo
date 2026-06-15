import { Suspense } from 'react';
import { SubmitForm } from './SubmitForm';

export default function SubmitPage() {
  return (
    <Suspense fallback={<p className="text-white/60">Carregando...</p>}>
      <SubmitForm />
    </Suspense>
  );
}
