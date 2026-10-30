import * as Crypto from "expo-crypto";
import { useLocalSearchParams, Stack } from "expo-router";
import { Check, Minus, Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import { Alert, Pressable, View } from "react-native";

import { BottomBar } from "@/components/sporty/bottom-bar";
import { FormScrollView } from "@/components/sporty/form-scroll-view";
import { UserAvatar } from "@/components/sporty/user-row";
import { DateTimeField } from "@/components/sporty/date-time-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/sporty/empty-state";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { QueryState } from "@/components/sporty/query-state";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { useGiveNonSnitchFines, useGroup, useLaws, useNonSnitches } from "@/data/hooks";
import { useCloseParent } from "@/hooks/use-close-parent";
import { formatFineCount, formatLaw } from "@/lib/fines";
import type { Law, NonSnitch } from "@/data/types";

const MAX_COUNT = 20;

/** Snitches: gi bøter til alle som ikke har snitchet (gitt bot) siden valgt dato. */
export default function SnitchesScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  const [date, setDate] = useState(new Date());
  const nonSnitches = useNonSnitches(groupId, date);
  const laws = useLaws(groupId);

  if (group.data && !group.data.canManage) {
    return (
      <EmptyState text="Bare sub-/admin kan gi snitch-bøter" />
    );
  }

  return (
    <QueryState query={nonSnitches}>
      {(data) => (
        <NonSnitchList
          groupId={groupId}
          date={date}
          setDate={setDate}
          nonSnitches={data}
          laws={laws.data ?? []}
        />
      )}
    </QueryState>
  );
}

function NonSnitchList({
  groupId,
  date,
  setDate,
  nonSnitches,
  laws,
}: {
  groupId: string;
  date: Date;
  setDate: (date: Date) => void;
  nonSnitches: NonSnitch[];
  laws: Law[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  // Alle er valgt med mindre brukeren fjerner noen.
  const selected = selectedIds ?? nonSnitches.map((s) => s.id);
  const [lawId, setLawId] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [reason, setReason] = useState("");
  const giveNonSnitchFines = useGiveNonSnitchFines();
  // Samme id for alle forsøk med dette skjemaet, så serveren ikke gir bøtene to ganger.
  const [requestId] = useState(() => Crypto.randomUUID());
  // Låses med en gang, før knappen rekker å bli deaktivert ved neste tegning (dobbelttrykk).
  const submitting = useRef(false);
  const close = useCloseParent();

  const toggle = (id: string) => {
    const base = selectedIds ?? nonSnitches.map((s) => s.id);
    setSelectedIds(
      base.includes(id) ? base.filter((s) => s !== id) : [...base, id],
    );
  };

  const submit = () => {
    if (submitting.current || !lawId) return;
    submitting.current = true;
    giveNonSnitchFines.mutate(
      {
        requestId,
        groupId,
        since: date.toISOString(),
        lawId,
        count,
        reason: reason.trim(),
      },
      {
        onSuccess: (result) => {
          Alert.alert(
            "Ferdig",
            `${result.count} som ikke hadde snitchet fikk bøter.`,
          );
          close();
        },
        onError: (error) => {
          submitting.current = false;
          Alert.alert("Kunne ikke gi bøter", error.message);
        },
      },
    );
  };

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: "Snitches don't get stitches" }} />
      <FormScrollView
        contentContainerClassName="gap-7 mt-16 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-3">
          <Text className="text-lg font-semibold">
            Får bøter ({selected.length} valgt)
          </Text>
          {nonSnitches.length === 0 && (
            <EmptyState text="Alle har gitt bøter siden denne datoen 🎉" />
          )}
          {nonSnitches.map((nonSnitch) => (
            <Pressable
              key={nonSnitch.id}
              onPress={() => toggle(nonSnitch.id)}
              className="flex-row items-center gap-3 py-2 active:opacity-70"
            >
              <Checkbox
                checked={selected.includes(nonSnitch.id)}
                onCheckedChange={() => toggle(nonSnitch.id)}
              />
              <UserAvatar user={nonSnitch} className="size-10" />
              <Text className="flex-1">{nonSnitch.name}</Text>
              <Text className="text-muted-foreground text-sm">
                {nonSnitch.finesReceived} bøter
              </Text>
            </Pressable>
          ))}
          <Separator />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold">Paragraf *</Text>
          {laws.map((law) => (
            <Pressable
              key={law.id}
              onPress={() => setLawId(law.id)}
              className="flex-row items-center gap-3 py-2 active:opacity-70"
            >
              <Icon
                as={Check}
                size={18}
                className={lawId === law.id ? "text-brand" : "text-transparent"}
              />
              <View className="flex-1 gap-0.5">
                <Text className="font-medium">{formatLaw(law)}</Text>
                {law.description && (
                  <Text
                    className="text-muted-foreground text-sm"
                    numberOfLines={1}
                  >
                    {law.description}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold">Antall bøter</Text>
          <View className="flex-row items-center gap-6">
            <StepButton
              icon={Minus}
              disabled={count <= 1}
              onPress={() => setCount(count - 1)}
            />
            <Text className="min-w-8 text-center text-3xl font-bold">
              {count}
            </Text>
            <StepButton
              icon={Plus}
              disabled={count >= MAX_COUNT}
              onPress={() => setCount(count + 1)}
            />
          </View>
        </View>

        <View className="gap-3">
          <Label nativeID="begrunnelse" className="text-lg font-semibold">
            Begrunnelse *
          </Label>
          <Textarea
            aria-labelledby="begrunnelse"
            value={reason}
            onChangeText={setReason}
            placeholder="Beskriv hvorfor boten gis..."
            className="min-h-28"
          />
        </View>
      </FormScrollView>

      <BottomBar>
        {/* Datovelgeren ligger fast ved send-knappen: alltid synlig og lett å nå med tommelen. */}
        <View className="flex-row items-center justify-between gap-3 pb-3">
          <View className="flex-1 gap-0.5">
            <Text className="font-medium">Ikke gitt bot etter</Text>
            <Text className="text-muted-foreground text-xs">
              Alle etter dette tidspunktet får bøter
            </Text>
          </View>
          <DateTimeField
            value={date}
            onChange={setDate}
            maximumDate={new Date()}
          />
        </View>
        <Button
          size="lg"
          disabled={
            !lawId ||
            !reason.trim() ||
            selected.length === 0 ||
            giveNonSnitchFines.isPending
          }
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}
        >
          <Text className="text-white">
            Gi {formatFineCount(count)} til {selected.length} som ikke har
            snitchet
          </Text>
        </Button>
      </BottomBar>
    </View>
  );
}

function StepButton({
  icon,
  disabled,
  onPress,
}: {
  icon: typeof Plus;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="size-14 rounded-2xl"
      disabled={disabled}
      onPress={onPress}
    >
      <Icon as={icon} size={22} />
    </Button>
  );
}
