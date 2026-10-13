// Dev-innlogging: hvilken bruker appen later som den er. Byttes ut med TIHLDE-innlogging senere.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { setApiUserId } from '@/lib/api';

/** Samme som DEFAULT_USER_ID i prisma/seed-data.ts. */
const DEFAULT_USER_ID = 'u1';

setApiUserId(DEFAULT_USER_ID);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

interface SessionValue {
  userId: string;
  /** Bytter bruker og tømmer all hentet data, så alt hentes på nytt som den nye brukeren. */
  switchUser: (userId: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);

  const switchUser = (nextUserId: string) => {
    setApiUserId(nextUserId);
    queryClient.clear();
    setUserId(nextUserId);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ userId, switchUser }}>{children}</SessionContext.Provider>
    </QueryClientProvider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession må brukes inni <SessionProvider>');
  return session;
}
