import { router } from "expo-router";
import { ChevronRight, Lock, Sparkles } from "lucide-react-native";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { EmptyState } from "@/components/sporty/empty-state";
import { QueryState } from "@/components/sporty/query-state";
import { UserAvatar } from "@/components/sporty/user-row";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useGroupStats } from "@/data/hooks";
import type {
  AdminStats,
  GroupDetails,
  GroupStats,
  MatchResult,
  MyStats,
  StatsPerson,
  TeamStats,
} from "@/data/types";
import { cn } from "@/lib/utils";

type StatsView = "meg" | "laget" | "admin";

/** Gruppens farge, brukt i stedet for den blå hovedfargen i hele fanen. */
const AccentContext = createContext<string>("#3768e8");
const useAccent = () => useContext(AccentContext);

export const WEEKDAYS = [
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lørdag",
  "søndag",
];
const monthFormat = new Intl.DateTimeFormat("nb-NO", { month: "short" });

/** Plassering der like verdier deler plass: 5, 3, 3, 2 gir 1, 2, 2, 4. */
export const withRanks = (people: StatsPerson[]) =>
  people.map((person) => ({
    person,
    rank: 1 + people.filter((p) => p.value > person.value).length,
  }));

/** Hele listene som kan åpnes fra kortene på «Laget». */
export const STATS_LISTS = {
  scorers: { title: "Toppscorere", unit: "mål" },
  trainings: { title: "Flest treninger", unit: undefined },
} as const;
export type StatsList = keyof typeof STATS_LISTS;

/** «71 %», eller «-» når det ikke finnes noe å regne på. */
export const percent = (rate: number | null) =>
  rate === null ? "-" : `${Math.round(rate * 100)} %`;
const monthLabel = (month: string) =>
  monthFormat.format(new Date(`${month}-15T12:00:00`)).replace(".", "");
/** «1,4 d» fra og med ett døgn, ellers «5 t». */
const duration = (hours: number | null) =>
  hours === null
    ? "-"
    : hours >= 24
      ? `${(hours / 24).toFixed(1).replace(".", ",")} d`
      : `${Math.round(hours)} t`;

/**
 * Statistikk-fanen i gruppen: «Meg», «Laget» og (for sub-/admin) «Admin», per semester eller for
 * alle år. Oppmøte er påmelding («Kommer») på arrangementer som har vært.
 */
export function StatsTab({ group }: { group: GroupDetails }) {
  const [period, setPeriod] = useState<string | null>(null);
  const [view, setView] = useState<StatsView | null>(null);
  const stats = useGroupStats(group.id, period);

  return (
    <AccentContext.Provider value={group.color}>
      <QueryState query={stats}>
        {(data) => {
          const views: { value: StatsView; label: string }[] = [
            ...(data.me ? [{ value: "meg" as const, label: "Meg" }] : []),
            { value: "laget", label: "Laget" },
            ...(data.admin
              ? [{ value: "admin" as const, label: "Admin" }]
              : []),
          ];
          const shown = views.some((v) => v.value === view)
            ? view!
            : views[0].value;
          return (
            <View
              className={cn("gap-4", stats.isPlaceholderData && "opacity-60")}
            >
              <Segmented options={views} value={shown} onChange={setView} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {data.periods.map((p) => (
                    <Pill
                      key={p.id}
                      label={p.label}
                      selected={p.id === data.period.id}
                      onPress={() => setPeriod(p.id)}
                    />
                  ))}
                </View>
              </ScrollView>
              {data.team.events.total === 0 ? (
                <EmptyState
                  text={`Ingen arrangementer som har vært i ${data.period.label}`}
                />
              ) : shown === "meg" && data.me ? (
                <MeView stats={data} me={data.me} groupId={group.id} />
              ) : shown === "admin" && data.admin ? (
                <AdminView admin={data.admin} />
              ) : (
                <TeamView
                  team={data.team}
                  period={data.period.label}
                  onOpenMatches={() =>
                    router.push({
                      pathname: "/grupper/[groupId]/kamper",
                      params: { groupId: group.id, period: data.period.id },
                    })
                  }
                  onOpenList={(list) =>
                    router.push({
                      pathname: "/statistikk-liste",
                      params: {
                        groupId: group.id,
                        period: data.period.id,
                        list,
                      },
                    })
                  }
                />
              )}
            </View>
          );
        }}
      </QueryState>
    </AccentContext.Provider>
  );
}

function MeView({
  stats,
  me,
  groupId,
}: {
  stats: GroupStats;
  me: MyStats;
  groupId: string;
}) {
  const accent = useAccent();
  const rate =
    me.attendance.total > 0 ? me.attendance.count / me.attendance.total : null;
  const highest = Math.max(
    ...me.monthly.map((m) => (m.total ? m.count / m.total : 0)),
    0.01,
  );

  return (
    <View className="gap-3">
      <Card>
        <Text className="text-muted-foreground text-sm font-medium">
          Oppmøte
        </Text>
        <View className="flex-row items-baseline gap-2.5">
          <Text className="text-5xl font-extrabold">{percent(rate)}</Text>
          <Text className="text-sm">
            {me.attendance.count} av {me.attendance.total} arrangementer
          </Text>
        </View>
        <Progress value={rate ?? 0} />
        <Text className="text-muted-foreground text-xs">
          Lagets snitt: {percent(stats.team.attendanceRate)}
          {me.rank ? ` · nr. ${me.rank} på laget` : ""}
        </Text>
      </Card>

      <View className="flex-row gap-2.5">
        <Tile
          label="Treninger"
          value={me.trainings.count}
          total={me.trainings.total}
        />
        <Tile
          label="Kamper"
          value={me.matches.count}
          total={me.matches.total}
        />
        <Tile label="Mål" value={me.goals} />
      </View>

      {me.monthly.length > 1 && (
        <Card>
          <Text className="font-semibold">Oppmøte per måned</Text>
          <View
            accessible
            accessibilityLabel={me.monthly
              .map(
                (m) =>
                  `${monthLabel(m.month)} ${percent(m.total ? m.count / m.total : null)}`,
              )
              .join(", ")}
            className="border-border h-28 flex-row items-end gap-3 border-b"
          >
            {me.monthly.map((m) => {
              const value = m.total ? m.count / m.total : 0;
              return (
                <View
                  key={m.month}
                  className="h-full flex-1 items-center justify-end gap-1"
                >
                  <Text className="text-[11px]">{percent(value)}</Text>
                  <View
                    className="w-full max-w-10 rounded-t"
                    style={{
                      height: `${Math.max((value / highest) * 75, 2)}%`,
                      backgroundColor: accent,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <View className="flex-row gap-3">
            {me.monthly.map((m) => (
              <Text
                key={m.month}
                className="text-muted-foreground flex-1 text-center text-[11px]"
              >
                {monthLabel(m.month)}
              </Text>
            ))}
          </View>
        </Card>
      )}

      <View className="flex-row gap-2.5">
        <Tile label="Bøter" value={me.fines} />
        <Tile
          label="Avbud"
          value={me.absences.count}
          detail={
            me.absences.count
              ? `${me.absences.withReason} med begrunnelse`
              : undefined
          }
        />
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/oppsummering",
            params: { groupId, period: stats.period.id },
          })
        }
        className="bg-muted/60 flex-row items-center justify-center gap-2 rounded-full py-3 active:opacity-70"
      >
        <Icon as={Sparkles} size={16} color={accent} />
        <Text className="font-medium">
          Se oppsummering for {stats.period.label}
        </Text>
      </Pressable>
    </View>
  );
}

function TeamView({
  team,
  period,
  onOpenList,
  onOpenMatches,
}: {
  team: TeamStats;
  period: string;
  onOpenList: (list: StatsList) => void;
  onOpenMatches: () => void;
}) {
  const change =
    team.attendanceRate !== null && team.previousAttendanceRate !== null
      ? Math.round((team.attendanceRate - team.previousAttendanceRate) * 100)
      : null;
  const { matches } = team;
  const hasMatches = matches.wins + matches.draws + matches.losses > 0;

  return (
    <View className="gap-3">
      <View className="flex-row gap-2.5">
        <Tile
          label="Snitt oppmøte"
          text={percent(team.attendanceRate)}
          detail={
            change === null
              ? undefined
              : change === 0
                ? "Som semesteret før"
                : `${change > 0 ? "↑" : "↓"} ${Math.abs(change)} % fra semesteret før`
          }
        />
        <Tile
          label="Arrangementer"
          value={team.events.total}
          detail={`${team.events.trening} treninger · ${team.events.kamp} kamper`}
        />
      </View>

      {hasMatches && (
        <Pressable
          onPress={onOpenMatches}
          accessibilityRole="button"
          accessibilityHint="Viser alle kampene og resultatene mot hver motstander"
          className="active:opacity-80"
        >
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold">Kamper</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground text-sm">
                  Mål {matches.goalsFor}-{matches.goalsAgainst}
                </Text>
                <Icon
                  as={ChevronRight}
                  size={16}
                  className="text-muted-foreground"
                />
              </View>
            </View>
            <View className="flex-row">
              {[
                ["Seier", matches.wins],
                ["Uavgjort", matches.draws],
                ["Tap", matches.losses],
              ].map(([label, value]) => (
                <View key={label} className="flex-1 items-center">
                  <Text className="text-2xl font-extrabold">{value}</Text>
                  <Text className="text-muted-foreground text-xs">{label}</Text>
                </View>
              ))}
            </View>
            <View
              className="flex-row items-center gap-1.5"
              accessible
              accessibilityLabel={`Form siste kamper: ${matches.form.join(", ")}`}
            >
              <Text className="text-muted-foreground mr-1 text-xs">Form</Text>
              {matches.form.map((result, index) => (
                <ResultBadge key={index} result={result} />
              ))}
            </View>
          </Card>
        </Pressable>
      )}

      {team.scorers.length > 0 && (
        <PeopleCard list="scorers" people={team.scorers} onOpen={onOpenList} />
      )}
      {team.trainings.some((p) => p.value > 0) && (
        <PeopleCard
          list="trainings"
          people={team.trainings}
          onOpen={onOpenList}
        >
          {team.bestSlot && (
            <Text className="text-muted-foreground pt-1 text-xs">
              Best oppmøte i {period.toLowerCase()}:{" "}
              {WEEKDAYS[team.bestSlot.weekday]}er kl.{" "}
              {String(team.bestSlot.hour).padStart(2, "0")}:00 (
              {percent(team.bestSlot.rate)})
            </Text>
          )}
        </PeopleCard>
      )}
    </View>
  );
}

function AdminView({ admin }: { admin: AdminStats }) {
  const { payments } = admin;
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-1.5 self-end">
        <Icon as={Lock} size={13} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-xs">Bare sub-/admin</Text>
      </View>

      <Card>
        <Text className="font-semibold">Svar-disiplin</Text>
        <View className="flex-row gap-2.5">
          <Tile
            inner
            label="Ikke svart"
            text={percent(admin.unansweredRate)}
            detail="av alle som var ventet"
          />
          <Tile
            inner
            label="Fellesbøter"
            value={admin.collectiveFines.events}
            detail={`${admin.collectiveFines.fines} bøter totalt`}
          />
        </View>
        {admin.leastResponsive.length > 0 && (
          <>
            <Text className="pt-1 text-sm font-medium">Svarer sjeldnest</Text>
            {admin.leastResponsive.map((p) => (
              <PersonRow
                key={p.user.id}
                person={p}
                text={`${p.value} av ${p.total} ubesvart`}
              />
            ))}
          </>
        )}
      </Card>

      <Card>
        <Text className="font-semibold">Betalinger</Text>
        <View className="flex-row gap-2.5">
          <Tile
            inner
            label="Betalt innen frist"
            text={percent(payments.onTimeRate)}
          />
          <Tile
            inner
            label="Snitt til godkjent"
            text={duration(payments.avgApprovalHours)}
          />
        </View>
        {payments.open.map((p) => (
          <View key={p.id} className="gap-1.5">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text className="flex-1 text-sm font-medium" numberOfLines={1}>
                {p.title}
              </Text>
              <Text className="text-muted-foreground text-xs">
                {p.approved} av {p.memberCount} betalt
                {p.pending ? ` · ${p.pending} venter` : ""}
              </Text>
            </View>
            <Progress
              value={p.memberCount ? p.approved / p.memberCount : 0}
              thin
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Topp tre på kortet. Trykk for hele listen. */
function PeopleCard({
  list,
  people,
  onOpen,
  children,
}: {
  list: StatsList;
  people: StatsPerson[];
  onOpen: (list: StatsList) => void;
  children?: ReactNode;
}) {
  const { title } = STATS_LISTS[list];
  return (
    <Pressable
      onPress={() => onOpen(list)}
      accessibilityRole="button"
      accessibilityHint={`Viser hele listen, ${people.length} personer`}
      className="active:opacity-80"
    >
      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold">{title}</Text>
          <View className="flex-row items-center">
            <Text className="text-muted-foreground text-sm">Se alle</Text>
            <Icon
              as={ChevronRight}
              size={16}
              className="text-muted-foreground"
            />
          </View>
        </View>
        {withRanks(people)
          .slice(0, 3)
          .map(({ person, rank }) => (
            <PersonRow
              key={person.user.id}
              rank={rank}
              person={person}
              text={statsValue(list, person)}
            />
          ))}
        {children}
      </Card>
    </Pressable>
  );
}

/** S, U eller T i en farget rute. Bokstaven bærer betydningen, fargen er bare støtte. */
export function ResultBadge({ result }: { result: MatchResult }) {
  return (
    <View
      className={cn(
        "size-7 items-center justify-center rounded-lg",
        result === "S" && "bg-green-600/25",
        result === "U" && "bg-muted",
        result === "T" && "bg-red-600/25",
      )}
    >
      <Text className="text-xs font-bold">{result}</Text>
    </View>
  );
}

/** «5 mål» eller «19 / 21». */
export function statsValue(list: StatsList, person: StatsPerson) {
  const { unit } = STATS_LISTS[list];
  return unit ? `${person.value} ${unit}` : `${person.value} / ${person.total}`;
}

export function PersonRow({
  person,
  text,
  rank,
}: {
  person: StatsPerson;
  text: string;
  rank?: number;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      {rank !== undefined && (
        <Text className="text-muted-foreground w-6 text-sm font-semibold">
          {rank}
        </Text>
      )}
      <UserAvatar user={person.user} className="size-7" />
      <Text className="flex-1 text-sm" numberOfLines={1}>
        {person.user.name}
      </Text>
      <Text className="text-sm font-bold">{text}</Text>
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View className="bg-muted/60 gap-3 rounded-2xl p-4">{children}</View>;
}

/** Et tall med etikett. `inner` er for fliser inni et kort (litt lysere bakgrunn). */
function Tile({
  label,
  value,
  total,
  text,
  detail,
  inner,
}: {
  label: string;
  value?: number;
  total?: number;
  text?: string;
  detail?: string;
  inner?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-1 gap-0.5 rounded-2xl p-3.5",
        inner ? "bg-muted" : "bg-muted/60",
      )}
    >
      <Text className="text-muted-foreground text-xs">{label}</Text>
      <Text className="text-2xl font-bold">
        {text ?? value}
        {total !== undefined && (
          <Text className="text-muted-foreground text-sm font-medium">
            {" "}
            / {total}
          </Text>
        )}
      </Text>
      {detail && (
        <Text className="text-muted-foreground text-xs">{detail}</Text>
      )}
    </View>
  );
}

function Progress({ value, thin }: { value: number; thin?: boolean }) {
  const accent = useAccent();
  return (
    <View
      className={cn(
        "bg-muted overflow-hidden rounded-full",
        thin ? "h-1.5" : "h-2",
      )}
    >
      <View
        className="h-full rounded-full"
        style={{
          width: `${Math.min(Math.max(value, 0), 1) * 100}%`,
          backgroundColor: accent,
        }}
      />
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = useAccent();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      className={cn(
        "h-8 justify-center rounded-full border px-3.5 active:opacity-70",
        !selected && "border-border",
      )}
      style={
        selected ? { backgroundColor: accent, borderColor: accent } : undefined
      }
    >
      <Text
        className={cn(
          "text-sm",
          selected ? "font-semibold text-white" : "font-medium",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  if (options.length < 2) return null;
  return (
    <View className="bg-muted/60 flex-row gap-1 rounded-full p-1">
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          className={cn(
            "h-9 flex-1 items-center justify-center rounded-full",
            o.value === value && "bg-muted",
          )}
        >
          <Text
            className={cn(
              "text-sm",
              o.value === value
                ? "font-semibold"
                : "text-muted-foreground font-medium",
            )}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
