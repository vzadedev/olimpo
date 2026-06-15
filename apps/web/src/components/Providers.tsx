'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo';
import { Toaster } from '@/components/Toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </ApolloProvider>
  );
}
