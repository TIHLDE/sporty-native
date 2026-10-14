// Innlogging med TIHLDE: hvem som er logget inn, og innlogging/utlogging. Alle skjermene
// unntatt innloggingen krever at status er 'signedIn' (se Stack.Protected i src/app/_layout.tsx).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Me } from '@/data/types';
import { ApiError, api, setApiActAs, setOnSessionLost } from '@/lib/api';
import { getValidAccessToken, signInWithPhoton, signOutOfPhoton } from '@/lib/auth/photon';
import { unregisterPushToken } from '@/lib/notifications';

/** Sist innloggede bruker, så appen kan åpnes uten nett når tokenet fortsatt er gyldig. */
const USER_ID_KEY = 'sporty:user-id';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionValue {
  status: Status;
  /** Brukeren appen viser data for: den innloggede, eller den man har byttet til i utvikling. */
  userId: string;
  /** Åpner tihlde.org. Kaster en feil hvis innloggingen feilet. */
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Kun i utvikling: opptre som en annen bruker. Tømmer all hentet data. */
  switchUser: (userId: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<Status>('loading');
  const [ownUserId, setOwnUserId] = useState('');
  const [actAsUserId, setActAsUserId] = useState<string | null>(null);

  const signedOut = useCallback(() => {
    setApiActAs(null);
    setActAsUserId(null);
    queryClient.clear();
    AsyncStorage.removeItem(USER_ID_KEY).catch(() => {});
    setStatus('signedOut');
  }, []);

  /** Henter hvem vi er fra API-et (som også lager brukeren første gang). */
  const loadMe = useCallback(async () => {
    const me = await api<Me>('/me');
    queryClient.setQueryData(['me'], me);
    setOwnUserId(me.id);
    await AsyncStorage.setItem(USER_ID_KEY, me.id).catch(() => {});
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    setOnSessionLost(signedOut);
    (async () => {
      try {
        if (!(await getValidAccessToken())) return signedOut();
        await loadMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return signedOut();
        // Uten nett eller med Photon nede: slipp inn med sist kjente bruker hvis vi har en,
        // så prøver neste forespørsel å fornye igjen.
        const lastUserId = await AsyncStorage.getItem(USER_ID_KEY).catch(() => null);
        if (!lastUserId) return signedOut();
        setOwnUserId(lastUserId);
        setStatus('signedIn');
      }
    })();
  }, [signedOut, loadMe]);

  const signIn = useCallback(async () => {
    if (await signInWithPhoton()) await loadMe();
  }, [loadMe]);

  const signOut = useCallback(async () => {
    // Før tokenet slettes: avregistreringen er et vanlig API-kall og trenger innloggingen.
    await unregisterPushToken().catch(() => {});
    await signOutOfPhoton();
    signedOut();
  }, [signedOut]);

  const switchUser = useCallback(
    (userId: string) => {
      const next = userId === ownUserId ? null : userId;
      setApiActAs(next);
      queryClient.clear();
      setActAsUserId(next);
    },
    [ownUserId]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider
        value={{ status, userId: actAsUserId ?? ownUserId, signIn, signOut, switchUser }}>
        {children}
      </SessionContext.Provider>
    </QueryClientProvider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession må brukes inni <SessionProvider>');
  return session;
}
