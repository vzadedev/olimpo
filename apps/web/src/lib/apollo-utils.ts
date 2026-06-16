import type { ApolloError } from '@apollo/client';

export function getGraphQLErrorMessage(err: unknown, fallback = 'Erro inesperado') {
  if (err && typeof err === 'object' && 'graphQLErrors' in err) {
    const gqlErrs = (err as ApolloError).graphQLErrors;
    if (gqlErrs?.[0]?.message) return gqlErrs[0].message;
    const net = (err as ApolloError).networkError;
    if (net && typeof net === 'object' && 'message' in net) {
      return String((net as { message: string }).message);
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export const networkOnly = { fetchPolicy: 'network-only' as const };
