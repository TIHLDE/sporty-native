# Sporty Native

Mobilappen til Sporty, for TIHLDE sine idrettslag. Backend og database er **Sporty v3**, som både appen og nettsiden bruker. Denne repoen inneholder bare appen.

## Stack

- Expo (React Native)
  - Expo Router
  - NativeWind (Tailwind)
  - React Native Reusables (shadcn-komponenter)
- TanStack Query
- Innlogging med TIHLDE (Photon, OAuth)
- ESLint + Prettier
- Bun

Backend (API, database, synk med tihlde.org, push) ligger i Sporty v3.

## Kom i gang

1. Start Sporty v3 (backend og database). I Sporty v3-mappen:
   ```bash
   bun run dev
   ```
   Første gang: kopier `.env.example` til `.env` der, og fyll inn testdata med `bun run db:seed`.
2. Kopier `.env.example` til `.env` her, og fyll inn `EXPO_PUBLIC_PHOTON_CLIENT_ID` (klienten «Sporty Native» på tihlde.org).
3. Installer og start appen:
   ```bash
   bun install
   bunx expo start --tunnel
   ```

I utvikling sender Expo-dev-serveren alle `/api`-forespørsler videre til Sporty v3 (`SPORTY_API_URL`, standard `http://localhost:3001`), så telefonen bare trenger å nå Expo-serveren. I ferdige builds peker `EXPO_PUBLIC_API_URL` rett på Sporty v3.

## Struktur

```
sporty-native/
├── src/
│   ├── app/               # Skjermer og ruter (Expo Router)
│   │   ├── (tabs)/        # Fanene: Hjem, Varsler, Grupper, Meldinger, Profil
│   │   └── api/           # Kun i utvikling: sender /api videre til Sporty v3
│   ├── components/
│   │   ├── ui/            # Delte shadcn-komponenter (React Native Reusables)
│   │   └── sporty/        # Sporty-komponenter (kort, rader, banner …)
│   ├── data/              # Typer, React Query-hooks og innlogging
│   └── lib/               # Hjelpere (API-klient, TIHLDE-innlogging, varsler, datoer)
└── assets/                # Ikoner, bilder og splash
```

## Kommandoer

| Kommando | Hva den gjør |
|---|---|
| `bunx expo start --tunnel` | Starter appen (tunnel trengs på f.eks. eduroam) |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript |

Når du stopper dev-serveren, vent noen sekunder før du starter den igjen, ellers får tunnelen ny adresse, og den nye adressen må legges til som redirect URI på tihlde.org (den står nederst på innloggingsskjermen).
