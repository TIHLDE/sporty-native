# Changelog

Alle merkbare endringer i Sporty dokumenteres her. Nyeste øverst.

## Kategorier

- **✨ Feature**: ny funksjonalitet
- **🐛 Fix**: feilretting
- **♻️ Endret**: endring i eksisterende funksjonalitet (oppførsel, UI, refaktorering)
- **🗑️ Fjernet**: funksjonalitet som er tatt bort
- **🔒 Sikkerhet**: sikkerhetsrelaterte endringer

## Mal

Kopier denne blokken til toppen av listen under, og ta bare med kategoriene som er i bruk:

```md
## YYYY-MM-DD

### ✨ Feature

- Kort beskrivelse av hva som er nytt

### 🐛 Fix

- Kort beskrivelse av hva som ble fikset
```

---

## 2026-10-14

### ✨ Feature

- **Logg inn med TIHLDE**: innlogging via Photon (OAuth2/OIDC som offentlig klient med PKCE, samme oppsett som TIHLDE-appen). Ny innloggingsskjerm med TIHLDE-logo, «Logg inn med TIHLDE» og «Glemt passord?». Tokens lagres kryptert på telefonen (`expo-secure-store`) og fornyes automatisk
- **Innlogging kreves for alt**: alle skjermer ligger bak `Stack.Protected`, og API-et krever `Authorization: Bearer <token>` på alle ruter unntatt helsesjekk og opplastede filer. Første innlogging kobler TIHLDE-kontoen til en bruker med samme e-post, eller lager en ny (`User.photonId`)
- **Idrettslag fra tihlde.org**: når appen henter `/me` (innlogging og oppstart), hentes gruppene brukeren er med i fra Photon (`groups/mine`). «Idrettslag (IdKom)» (type `SPORTSTEAM`) og «Interessegrupper – Idrettsgrupper» (`INTERESTGROUP` + `IDRETTSGRUPPE`) blir grupper i Sporty (`Group.photonSlug`). Hele medlemslisten hentes (`groups/:slug/members`, maks hvert 5. minutt per gruppe), også medlemmer som ikke har logget inn ennå. De kobles til ved første innlogging, og e-post er derfor valgfritt på brukere. Leder på tihlde.org blir admin, vanlige medlemmer beholder rollen de har fått i Sporty, og den som ikke lenger er med i gruppen på tihlde.org fjernes
- **Bøter fra tihlde.org**: for lag fra tihlde.org er tihlde.org kilden for bøtene. Bøter-fanen viser lagets bøter derfra med status (venter, ubetalt, betalt, avvist), og alle medlemmer ser alle, som på tihlde.org. «Gi bot» bruker lovverket fra tihlde.org (med foreslått antall) og lager boten der, der den venter på godkjenning. Alle medlemmer kan gi bot. Botsjefen og lederne godkjenner, markerer som betalt eller avviser ved å trykke på en bot. Fellesbot og «Ubetalte bøter» på profilen bruker også tihlde.org. Grupper laget i Sporty beholder Sporty sitt eget botsystem
- **Gruppelogoer fra tihlde.org**: lag fra tihlde.org bruker logoen derfra som gruppebilde (grupperlisten, profilen, «Gi bot» o.l.) og i banneret på gruppesiden. Grupper uten logo beholder skjoldet i gruppefargen
- **Bøter i sider og detaljside**: Bøter-fanen henter 25 bøter om gangen med «Last inn flere» nederst, og «Ubetalt i laget» regnes for hele laget (fra tihlde.org sin statistikk). Trykk på en bot for detaljer: paragraf, begrunnelse, hvem som ga den, når, forsvar og bilde (private bilder fra tihlde.org hentes med innloggingen). Botsjefen og lederne godkjenner, markerer som betalt eller avviser derfra
- **Undergrupper** (admin i hovedgruppen): Undergrupper → ＋ for å lage en ny med navn, farge, beskrivelse, posisjoner av/på og medlemmer fra hovedgruppen. Under Innstillinger i undergruppen kan admin endre navn og farge, velge medlemmer og slette undergruppen
- **Egne posisjoner per gruppe** (admin): Innstillinger → Posisjoner → slå på og lag listen selv (legg til, gi nytt navn, flytt opp/ned, slett), så hver idrett kan ha sine egne. Sub-/admin setter posisjonen til spillerne som før. Grupper som brukte de faste fotballposisjonene får dem som startliste, og spillerne beholder posisjonen sin
- **Fjernet fra gruppen = fjernet fra alt**: den som tas ut av en gruppe (eller går ut av laget på tihlde.org) fjernes også fra undergruppene, svarene på kommende arrangementer og varslene derfra. Bøter, betalinger og tidligere oppmøte beholdes
- **Logg ut** i Profilinnstillinger: fjerner push-tokenet og påminnelsene fra telefonen og trekker tilbake innloggingen hos Photon

### ♻️ Endret

- **Synk med tihlde.org** skjer også når grupperlisten hentes (høyst hvert andre minutt per bruker), ikke bare ved oppstart. Trekk ned på Grupper for å få med endringer fra tihlde.org
- **Sub-/admin i hovedgruppen** ser nå innstillinger og kan styre undergruppene også når de ikke selv er med i dem
- **Bytt bruker** (kun utvikling) krever nå innlogging og `ALLOW_DEV_USER_SWITCH=true` på serveren, og sendes som `x-act-as`

### 🐛 Fix

- **Lag arrangement i undergruppe** ga en tom side for sub-/admin i hovedgruppen som ikke selv er med i undergruppen. Valget bruker nå rollen i hovedgruppen også
- **Betalinger i undergrupper** kan nå lages og styres av sub-/admin i hovedgruppen, som arrangementer, kunngjøringer og avstemninger
- **For mange kall til tihlde.org (429)**: innloggingen sjekkes nå lokalt (signaturen på JWT-en mot Photon sine nøkler, med `jose`), så tihlde.org bare spørres første gang noen logger inn. Hurtigminne og synk-tidspunkter deles mellom alle API-rutene (`src/server/shared.ts`), og `/me` synker høyst hvert andre minutt. Tokens laget for andre apper på tihlde.org avvises
- **Bøter kunne gis to ganger**: «Gi bot» sender med en id per utfylte skjema, og serveren gir bøtene bare én gang per id (tabellen `FineRequest`), også ved dobbelttrykk eller nytt forsøk etter nettfeil, og også for bøter på tihlde.org. Fellesbot kan bare gis én gang per arrangement (`Event.collectiveFineAt`), og knappen forsvinner etterpå
- **Inaktive medlemmer fikk bøter**: de kan ikke velges i «Gi bot» (vises som «Inaktiv»), serveren avviser dem, og fellesbot hopper over dem. Inaktive står heller ikke under «Ikke svart» på arrangementer og får ikke påminnelser om svarfristen

### 🔒 Sikkerhet

- Dev-innloggingen med `x-user-id` er fjernet, og brukerlista (`/api/users`) krever innlogging

## 2026-10-13

### ✨ Feature

- **Styling**: NativeWind v4 (Tailwind v3) og React Native Reusables (shadcn-lignende komponenter i `src/components/ui/`)
- **Fanelinje**: Hjem, Varsler, Grupper, Meldinger og Profil med `NativeTabs` (liquid glass på iOS, Material 3 på Android), med merker for uleste varsler og meldinger
- **Hjem**: kommende arrangementer gruppert per uke, kunngjøringer og «Gi bot»-knapp for sub-/admin
- **Grupper**: rutenett med gruppene man er med i, og gruppeside i Spond-stil med banner, Medlemmer, Undergrupper, gruppevarsler og faner for Arrangementer, Kunngjøringer, Avstemninger, Bøter, Betalinger og Filer
- **Arrangementer**: kort i Spond-stil, detaljside med kart (`react-native-maps`), veibeskrivelse, svar (Kommer / Kommer ikke) og deltakerlister. Åpnes i fanen man står i
- **Lag arrangement** (sub-/admin): ＋ → Arrangement → velg gruppe eller undergruppe → navn, type (Trening, Kamp, Sosialt, Annet), start, valgfri slutt, sted, notat og valgfri påmeldingsfrist
- **Rediger arrangement** (sub-/admin): «Rediger» på arrangementssiden frem til arrangementet er ferdig. Samme skjema som når man lager det, svarene beholdes, og medlemmene får varsel om endringen
- **Slett arrangement** (sub-/admin): nederst i redigeringsskjemaet (penn-ikonet), med bekreftelse. Kommende arrangementer varsles som avlyst. Bøter som er gitt for arrangementet beholdes
- **Motstander** på kamper: eget felt når typen er Kamp, vises som «mot …» på kortet og arrangementssiden
- **Gruppeinnstillinger** (⋯ på gruppesiden, sub-/admin): gruppenavn, forsidebilde og beskrivelse (admin), roller (admin endrer, subadmin ser), og eksport av oppmøtehistorikk og kampresultater som CSV via delingsarket
- **Forsidebilde** på grupper vises i banneret i stedet for gruppefargen
- **Roller**: admin kan gjøre medlemmer til admin, subadmin eller medlem. Gruppen må alltid ha minst én admin
- **Kampresultat** (sub-/admin): registreres på kamper som har startet, og vises med seier/uavgjort/tap på arrangementssiden
- **Stedsvelger**: gruppens nylig brukte steder, felles forslag i Trondheim og søk i OpenStreetMap
- **Bøter**: telles i antall (ikke kroner). «Gi bot»-flyt: gruppe → lov (§-paragraf) → én eller flere brukere → antall, begrunnelse og valgfritt bilde
- **Fellesbot** (sub-/admin): én bot til alle som ikke har svart, tilgjengelig etter påmeldingsfristen (eller når arrangementet har startet hvis det ikke har frist)
- **Betalinger** (sub-/admin): post en betalingsoppfordring med beløp, Vipps-nummer og frist. Betaling skjer i Vipps, medlemmene markerer selv «Jeg har betalt»
- **Kunngjøringer** (sub-/admin): tittel, beskrivelse, bilder og video, vedlegg og av/på for kommentarer. Egen visning med kommentarfelt
- **Opplasting**: filer lagres i `storage/uploads/` og beskrives i `Upload`-tabellen. Støtter Range-forespørsler for video
- **Meldinger**: gruppechat for hver gruppe og undergruppe (lages automatisk, alle medlemmer har tilgang) og direktemeldinger til alle man deler en gruppe med («Ny melding»). Full historikk lagres i databasen og hentes 30 om gangen når man scroller opp. Datoskiller, sammenslåtte meldinger fra samme person, uleste per samtale og på fanelinjen, og lest-markering når samtalen åpnes. Nye meldinger hentes hvert 3. sekund mens samtalen er åpen
- **Varsler**: lages automatisk ved nye arrangementer, svar, bøter, betalinger og kunngjøringer. Kan markeres som lest
- **Push-varsel ved bot**: den som får bot (også fellesbot) får push via Expo Push Service. Enheten registrerer push-tokenet sitt på brukeren (`PushToken`-tabellen). Krever development build og EAS-prosjekt (`extra.eas.projectId`)
- **Påminnelser**: lokalt varsel 1 time før hvert arrangement, og 1 time før påmeldingsfristen hvis man ikke har svart. Planlegges på telefonen og oppdateres når arrangementer eller svar endres, så de virker også i Expo Go. Trykk på varselet åpner arrangementet
- **Test varsler** (kun i utvikling): Profil → Utvikling → Test varsler viser hvert varsel med en gang (eller etter 5 sekunder), sender ekte push til deg selv og lister de planlagte påminnelsene
- **Profilinnstillinger** (Profil → Profilinnstillinger):
  - **Pushvarsler**: hovedbryter og egne brytere for bot, 1 time før arrangement og 1 time før påmeldingsfrist. Lagres på brukeren (`NotificationSettings`-tabellen), og serveren sender bare bot-push til dem som har det på. Viser beskjed med snarvei til telefonens innstillinger hvis varsler ikke er tillatt
  - **Kalender**: velg standardkalender (ber om kalendertilgang), og synkroniser aksepterte og/eller ubesvarte arrangementer dit med `expo-calendar`. Arrangementene oppdateres når de endres, og fjernes hvis man svarer «Kommer ikke». Valgene lagres på telefonen. Krever development build
  - **Logg ut** er flyttet hit fra profilsiden
- **Avstemninger** (sub-/admin): ＋ → Avstemning → spørsmål, valgfri beskrivelse, alternativer, flervalg, skjulte stemmer, frist og av/på for kommentarer
- **Stemming**: ett trykk ved ett valg, eller velg flere og «Lagre stemme». Stemmen kan endres eller fjernes frem til fristen. Skjulte resultater vises for medlemmer først etter fristen, sub-/admin ser dem hele tiden
- **Kommentarer** på avstemninger, med samme kommentarfelt som kunngjøringer
- **Stillinger** (Keeper, Back, Midtstopper, Midtbane, Ving, Spiss) slås på per gruppe (`usesPositions`), foreløpig for Herrer 11'er. Medlemmer-siden grupperes etter stilling, og sub-/admin setter stillingen ved å trykke på en spiller
- **Inaktive medlemmer** (sub-/admin): trykk på et medlem under Medlemmer (eller «Gjør inaktiv» i stillingsarket) og skriv en begrunnelse. Lagres per gruppe på medlemskapet (`inactiveSince`, `inactiveReason`). Alle ser «Inaktiv»-merket, men bare medlemmet selv og sub-/admin ser begrunnelsen. Medlemmet ser den på profilen sin. Kan gjøres aktiv igjen fra samme ark
- **Database**: PostgreSQL i Docker (`docker-compose.yml`, port 5433) med Prisma 7 (`prisma/schema.prisma`), migreringer og seed-data
- **API**: Expo Router API-ruter i `src/app/api/` med tilgangssjekk på serveren. Appen henter data med React Query (`src/data/hooks.ts`)
- **Dev-innlogging**: Profil → Utvikling → Bytt bruker, for å teste som admin, subadmin eller medlem
- **Utseende**: Profil → Utseende → Automatisk, Lys eller Mørk. Valget huskes mellom hver gang appen åpnes
- **Skript**: `db:up`, `db:down`, `db:migrate`, `db:seed`, `db:reset` og `db:studio`. `postinstall` kjører `prisma generate`

### ♻️ Endret

- `app.json`: `web.output` er `"server"`, som kreves for API-ruter på SDK 57
- `app.json`: tillatelsestekster for kamera og bilder (`expo-image-picker`)
- ＋ på gruppesiden åpner et ark med Arrangement, Kunngjøring, Avstemning og Betaling
- Generert Prisma-kode (`src/server/generated/`) ignoreres av ESLint og git
- Undergruppene til Pythons Herrer heter nå Herrer 11'er (`herrer-11`) og Herrer 7'er (`herrer-7`)
- Fanelinjen skjules på skjermer med kommentarfelt (kunngjøring og avstemning)
- Bøter gjelder alltid hele gruppen: Gi bot viser bare hovedgrupper, undergrupper har ikke Bøter-fanen, og fellesbot for et arrangement i en undergruppe gis i hovedgruppen (krever sub-/admin der)
- Sub-/admin i hovedgruppen kan redigere og slette arrangementer i undergruppene
- Primærfargen er TIHLDE-blå (`#1c458a` i lys modus, `#1b61e4` i mørk modus), samme som TIHLDE-nettsiden. `brand` følger `primary`. Resten av fargene er nøytrale
- Fanelinjen bruker systemets farger, som TIHLDE Native, og krymper når man scroller ned

### 🐛 Fix

- Tastaturet dekket knappen nederst i skjemaene (arrangement, kunngjøring, avstemning, betaling, Gi bot) og kommentarfeltet. Bunnlinjen følger nå tastaturet med `react-native-keyboard-controller`, som også regner riktig i modaler
- Fristen på betalinger velges med dato og tid, som resten av appen, og valideres på serveren

### 🗑️ Fjernet

- Expo-malens Home- og Explore-skjermer og web-navbaren (`app-tabs.web.tsx`)
- Eksempelarrangementer i seed-dataene. Arrangementer lages nå i appen

### 🔒 Sikkerhet

- `.env` er lagt til i `.gitignore`, og `.env.example` følger med i repoet
- `DATABASE_URL` brukes bare på serveren og har aldri prefikset `EXPO_PUBLIC_`
- Kjent mangel: dev-innloggingen (`x-user-id`-header) og åpne fil-URL-er må byttes ut med ekte innlogging og signerte URL-er før lansering
