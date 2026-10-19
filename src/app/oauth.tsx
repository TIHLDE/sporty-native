import { Redirect } from 'expo-router';

/** Tilbake fra innloggingen på tihlde.org. Selve koden håndteres i src/lib/auth/photon.ts. */
export default function OAuthRedirect() {
  return <Redirect href="/" />;
}
