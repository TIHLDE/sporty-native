import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, MapPin } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { DateTimeField } from '@/components/sporty/date-time-field';
import { DeleteEventButton } from '@/components/sporty/delete-event-button';
import { MapPreview } from '@/components/sporty/event-map';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useEventDraft } from '@/data/event-draft';
import { useCreateEvent, useEvent, useGroup, useUpdateEvent } from '@/data/hooks';
import type { Event } from '@/data/types';
import { useCloseParent } from '@/hooks/use-close-parent';
import { EVENT_TYPES } from '@/lib/events';

const HOUR = 60 * 60 * 1000;

/**
 * Steg 2: detaljene om arrangementet. Med `eventId` redigeres et eksisterende arrangement:
 * skjemaet fylles ut fra det og lagres med PUT.
 */
export default function ArrangementSkjemaScreen() {
  const { forGroupId, eventId } = useLocalSearchParams<{ forGroupId: string; eventId?: string }>();
  if (eventId) return <EditEvent eventId={eventId} />;
  return <EventForm groupId={forGroupId} />;
}

/** Henter arrangementet og fyller skjemaet før det vises. */
function EditEvent({ eventId }: { eventId: string }) {
  const event = useEvent(eventId);
  const { loadEvent, loadedEventId } = useEventDraft();
  const filled = loadedEventId === eventId;

  useEffect(() => {
    if (event.data && !filled) loadEvent(event.data);
  }, [event.data, filled, loadEvent]);

  return (
    <QueryState query={event}>
      {(data) => (filled ? <EventForm groupId={data.groupId} editing={data} /> : null)}
    </QueryState>
  );
}

function EventForm({ groupId, editing }: { groupId: string; editing?: Event }) {
  const group = useGroup(groupId).data;
  const { draft, update } = useEventDraft();
  const createEvent = useCreateEvent(groupId);
  const updateEvent = useUpdateEvent(editing?.id ?? '');
  const mutation = editing ? updateEvent : createEvent;
  const close = useCloseParent();

  const endError = draft.end && draft.end <= draft.start ? 'Sluttid må være etter starttid' : null;
  const deadlineError =
    draft.signupDeadline && draft.signupDeadline > draft.start
      ? 'Fristen må være før arrangementet starter'
      : null;
  const maxAttendees = draft.maxAttendees === null ? null : Number(draft.maxAttendees);
  const maxAttendeesError =
    maxAttendees !== null && !(Number.isInteger(maxAttendees) && maxAttendees > 0)
      ? 'Skriv et helt tall over 0'
      : null;
  const canSubmit = Boolean(
    draft.title.trim() && draft.location && !endError && !deadlineError && !maxAttendeesError
  );

  const setStart = (start: Date) => {
    // Flytt sluttiden med, så varigheten beholdes.
    const duration = draft.end ? draft.end.getTime() - draft.start.getTime() : 0;
    update({ start, end: draft.end ? new Date(start.getTime() + duration) : null });
  };

  const submit = () => {
    if (!draft.location) return;
    mutation.mutate(
      {
        title: draft.title.trim(),
        type: draft.type,
        opponent: draft.type === 'kamp' ? draft.opponent.trim() || null : null,
        start: draft.start.toISOString(),
        end: draft.end?.toISOString() ?? null,
        location: draft.location,
        description: draft.description.trim(),
        signupDeadline: draft.signupDeadline?.toISOString() ?? null,
        maxAttendees,
      },
      {
        onSuccess: close,
        onError: (error) =>
          Alert.alert(
            editing ? 'Kunne ikke lagre endringene' : 'Kunne ikke lage arrangement',
            error.message
          ),
      }
    );
  };

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: editing ? 'Rediger arrangement' : 'Nytt arrangement' }} />
      <FormScrollView
        contentContainerClassName="gap-6 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        {group && <Text className="text-muted-foreground text-sm">For {group.name}</Text>}

        <Field label="Arrangementets navn">
          <Input
            value={draft.title}
            onChangeText={(title) => update({ title })}
            placeholder="F.eks. Trening eller Kamp mot NTNUI"
          />
        </Field>

        <Field label="Type arrangement">
          <SegmentedControl
            values={EVENT_TYPES.map((t) => t.label)}
            selectedIndex={EVENT_TYPES.findIndex((t) => t.value === draft.type)}
            onChange={(event) =>
              update({ type: EVENT_TYPES[event.nativeEvent.selectedSegmentIndex].value })
            }
          />
        </Field>

        {draft.type === 'kamp' && (
          <Field label="Motstander (valgfritt)">
            <Input
              value={draft.opponent}
              onChangeText={(opponent) => update({ opponent })}
              placeholder="F.eks. NTNUI"
              maxLength={80}
            />
          </Field>
        )}

        <Field label="Starttid">
          <DateTimeField
            value={draft.start}
            onChange={setStart}
            // Et arrangement som allerede har startet kan fortsatt redigeres.
            minimumDate={editing ? undefined : new Date()}
          />
        </Field>

        <ToggleField
          label="Sluttid"
          enabled={draft.end !== null}
          onToggle={(on) =>
            update({ end: on ? new Date(draft.start.getTime() + 1.5 * HOUR) : null })
          }
          error={endError}>
          {draft.end && (
            <DateTimeField
              value={draft.end}
              onChange={(end) => update({ end })}
              minimumDate={draft.start}
            />
          )}
        </ToggleField>

        <Field label="Sted">
          <Link
            href={{ pathname: '/nytt-arrangement/sted', params: { forGroupId: groupId } }}
            asChild>
            <Pressable className="bg-muted/60 overflow-hidden rounded-2xl active:opacity-70">
              {draft.location && <MapPreview location={draft.location} />}
              <View className="flex-row items-center gap-3 px-4 py-3">
                <Icon as={MapPin} size={18} className="text-brand" />
                <Text
                  className={
                    draft.location ? 'flex-1 font-medium' : 'text-muted-foreground flex-1'
                  }>
                  {draft.location?.name ?? 'Velg sted'}
                </Text>
                <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
              </View>
            </Pressable>
          </Link>
        </Field>

        <Field label="Notat (valgfritt)">
          <Textarea
            value={draft.description}
            onChangeText={(description) => update({ description })}
            placeholder="Ekstra informasjon, f.eks. hva man skal ta med"
          />
        </Field>

        <ToggleField
          label="Påmeldingsfrist"
          enabled={draft.signupDeadline !== null}
          onToggle={(on) =>
            update({ signupDeadline: on ? new Date(draft.start.getTime() - 24 * HOUR) : null })
          }
          error={deadlineError}>
          {draft.signupDeadline && (
            <DateTimeField
              value={draft.signupDeadline}
              onChange={(signupDeadline) => update({ signupDeadline })}
              maximumDate={draft.start}
            />
          )}
        </ToggleField>

        <ToggleField
          label="Maks antall deltakere"
          enabled={draft.maxAttendees !== null}
          // Forslag: hele gruppen. Endres til antallet det er plass til.
          onToggle={(on) =>
            update({ maxAttendees: on ? String(group?.members.length ?? 20) : null })
          }
          error={maxAttendeesError}>
          {draft.maxAttendees !== null && (
            <>
              <Input
                value={draft.maxAttendees}
                onChangeText={(text) => update({ maxAttendees: text.replace(/\D/g, '') })}
                keyboardType="number-pad"
                placeholder="F.eks. 80"
                maxLength={5}
              />
              <Text className="text-muted-foreground text-xs">
                Når så mange har svart «Kommer», kan ingen flere melde seg på.
              </Text>
            </>
          )}
        </ToggleField>

        {editing && (
          <DeleteEventButton
            event={editing}
            onDeleted={() => {
              // Lukk skjemaet, og gå også tilbake fra arrangementssiden, som ikke finnes lenger.
              close();
              router.back();
            }}
          />
        )}
      </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          disabled={!canSubmit || mutation.isPending}
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}>
          <Text className="text-white">{editing ? 'Lagre endringer' : 'Lag arrangement'}</Text>
        </Button>
      </BottomBar>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      {children}
    </View>
  );
}

/** Valgfritt felt som skrus av og på med en bryter, f.eks. sluttid og påmeldingsfrist. */
function ToggleField({
  label,
  enabled,
  onToggle,
  error,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Label>
          {label} <Text className="text-muted-foreground text-sm">(valgfritt)</Text>
        </Label>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </View>
      {children}
      {error && <Text className="text-destructive text-sm">{error}</Text>}
    </View>
  );
}
