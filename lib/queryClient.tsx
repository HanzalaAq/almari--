import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

let client: QueryClient | undefined = undefined;

export function useQueryClient() {
  const [queryClient] = useState(() => {
    if (!client) {
      client = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      });
    }
    return client;
  });

  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
