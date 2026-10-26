// Skjemaet for nytt arrangement deles mellom stegene i modalen (skjema og stedsvelger),
// så stedet man velger på en egen skjerm havner tilbake i skjemaet.

import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import type { Event, EventType, Location } from './types';

export interface EventDraft {
  title: string;
  type: EventType;
  /** Bare brukt for kamper. */
  opponent: string;
  start: Date;
  /** null = ingen sluttid. */
  end: Date | null;
  location: Location | null;
  description: string;
  /** null = ingen påmeldingsfrist. */
  signupDeadline: Date | null;
  /** null = ingen grense. Tekst, så feltet kan være tomt mens man skriver. */
  maxAttendees: string | null;
}

/** I morgen kl. 18:00, en fornuftig standard for treninger. */
function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date;
}

/** Skjemaet fylt ut fra et eksisterende arrangement, for redigering. */
export function draftFromEvent(event: Event): EventDraft {
  return {
    title: event.title,
    type: event.type,
    opponent: event.opponent ?? '',
    start: new Date(event.start),
    end: event.end ? new Date(event.end) : null,
    location: event.location,
    description: event.description,
    signupDeadline: event.signupDeadline ? new Date(event.signupDeadline) : null,
    maxAttendees: event.maxAttendees === null ? null : String(event.maxAttendees),
  };
}

const DraftContext = createContext<{
  draft: EventDraft;
  update: (changes: Partial<EventDraft>) => void;
  /** Fyller skjemaet fra et eksisterende arrangement (redigering). */
  loadEvent: (event: Event) => void;
  /** Id-en til arrangementet skjemaet er fylt fra, eller null for et nytt arrangement. */
  loadedEventId: string | null;
} | null>(null);

export function EventDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<EventDraft>(() => ({
    title: '',
    type: 'trening',
    opponent: '',
    start: defaultStart(),
    end: null,
    location: null,
    description: '',
    signupDeadline: null,
    maxAttendees: null,
  }));

  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const update = (changes: Partial<EventDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const loadEvent = (event: Event) => {
    setDraft(draftFromEvent(event));
    setLoadedEventId(event.id);
  };

  return (
    <DraftContext.Provider value={{ draft, update, loadEvent, loadedEventId }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useEventDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useEventDraft må brukes inni <EventDraftProvider>');
  return context;
}
