import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { API_URL } from './config';

const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('gymrank-auth');
      if (stored) token = JSON.parse(stored).state?.token ?? null;
    } catch {
      token = null;
    }
  }
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
