import {
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

function isUnauthorized(error: unknown) {
  return error instanceof AxiosError && error.response?.status === 401;
}

function handleGlobalError(error: unknown) {
  if (isUnauthorized(error)) {
    return;
  }

  console.error('[QueryError]', error);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
