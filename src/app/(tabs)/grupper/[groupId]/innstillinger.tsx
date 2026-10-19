import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router, useLocalSearchParams } from 'expo-router';
import {
  ChevronRight,
  FileSpreadsheet,
  ImagePlus,
  ListOrdered,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, View } from 'react-native';

import { ColorPicker } from '@/components/sporty/color-picker';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteGroup, useGroup, useUpdateGroup } from '@/data/hooks';
import type { GroupDetails } from '@/data/types';
import { fileUrl, uploadFile } from '@/lib/api';
import { shareCsvExport } from '@/lib/export';
import { ACCENT } from '@/lib/theme';

/**
 * Innstillinger for gruppen (⋯ på gruppesiden). Sub-/admin har tilgang. Navn, farge, beskrivelse,
 * forsidebilde, posisjoner og roller kan bare endres av admin. Admin i hovedgruppen styrer også
 * undergruppene: medlemmer, posisjoner og sletting.
 */
export default function InnstillingerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(data) => <Settings group={data} />}</QueryState>;
}

function Settings({ group }: { group: GroupDetails }) {
  const isAdmin = group.canAdmin;
  const isSubgroup = Boolean(group.parentId);

  return (
    <FormScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-8 p-4 pb-16">
      {isAdmin && <GroupDetailsSection group={group} />}

      <Section title="Medlemmer">
        {isAdmin && isSubgroup && (
          <>
            <Link href={`/grupper/${group.id}/velg-medlemmer`} asChild>
              <Row icon={UserPlus} label="Velg medlemmer" detail={`${group.members.length}`} />
            </Link>
            <Separator />
          </>
        )}
        <Link href={`/grupper/${group.id}/roller`} asChild>
          <Row icon={Users} label="Roller" detail={isAdmin ? undefined : 'Bare visning'} />
        </Link>
      </Section>

      {isAdmin && <PositionsSection group={group} />}

      <Section title="Eksport">
        <ExportRow
          icon={FileSpreadsheet}
          label="Eksporter oppmøtehistorikk"
          path={`/groups/${group.id}/export/attendance`}
        />
        <Separator />
        <ExportRow
          icon={Trophy}
          label="Eksporter resultater"
          path={`/groups/${group.id}/export/results`}
        />
      </Section>

      {isAdmin && isSubgroup && <DeleteSubgroup group={group} />}
    </FormScrollView>
  );
}

/** (Admin) Slå posisjoner av og på, og gå til posisjonslisten. */
function PositionsSection({ group }: { group: GroupDetails }) {
  const updateGroup = useUpdateGroup(group.id);
  const toggle = (usesPositions: boolean) =>
    updateGroup.mutate(
      { usesPositions },
      { onError: (error) => Alert.alert('Kunne ikke lagre', error.message) }
    );

  return (
    <Section title="Posisjoner">
      <View className="flex-row items-center gap-3 py-3">
        <View className="flex-1">
          <Text>Bruk posisjoner</Text>
          <Text className="text-muted-foreground text-xs">
            Medlemmer-siden grupperes etter posisjon, og sub-/admin setter posisjonen til hver
            spiller
          </Text>
        </View>
        <Switch
          value={group.usesPositions}
          onValueChange={toggle}
          disabled={updateGroup.isPending}
          trackColor={{ true: ACCENT }}
        />
      </View>
      {group.usesPositions && (
        <>
          <Separator />
          <Link href={`/grupper/${group.id}/posisjoner`} asChild>
            <Row
              icon={ListOrdered}
              label="Rediger posisjoner"
              detail={`${group.positions.length}`}
            />
          </Link>
        </>
      )}
    </Section>
  );
}

/** (Admin) Slett undergruppen med alt i den. Hovedgrupper hentes fra tihlde.org og slettes ikke. */
function DeleteSubgroup({ group }: { group: GroupDetails }) {
  const deleteGroup = useDeleteGroup(group.id);
  const confirm = () =>
    Alert.alert(
      `Slette ${group.name}?`,
      'Arrangementer, kunngjøringer, avstemninger, filer og chatten i undergruppen slettes for godt. Medlemmene blir værende i hovedgruppen.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () =>
            deleteGroup.mutate(undefined, {
              onSuccess: () => router.dismissTo(`/grupper/${group.parentId}`),
              onError: (error) => Alert.alert('Kunne ikke slette', error.message),
            }),
        },
      ]
    );

  return (
    <View className="bg-muted/60 rounded-2xl px-4">
      <Pressable
        disabled={deleteGroup.isPending}
        onPress={confirm}
        className="flex-row items-center gap-3 py-3.5 active:opacity-70">
        <Icon as={Trash2} size={18} className="text-destructive" />
        <Text className="text-destructive flex-1">Slett undergruppe</Text>
        {deleteGroup.isPending && <ActivityIndicator size="small" />}
      </Pressable>
    </View>
  );
}

/** (Admin) Gruppenavn, farge, beskrivelse og forsidebilde. */
function GroupDetailsSection({ group }: { group: GroupDetails }) {
  const updateGroup = useUpdateGroup(group.id);
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [description, setDescription] = useState(group.description);
  const [uploadingCover, setUploadingCover] = useState(false);
  const changed =
    name.trim() !== group.name || color !== group.color || description.trim() !== group.description;

  const save = () =>
    updateGroup.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        // Eldre grupper kan ha en farge som ikke er i velgeren, så den sendes bare når den endres.
        ...(color !== group.color ? { color } : {}),
      },
      {
        onSuccess: () => Alert.alert('Lagret', 'Endringene er lagret.'),
        onError: (error) => Alert.alert('Kunne ikke lagre', error.message),
      }
    );

  // Forsidebildet lagres med en gang det er valgt.
  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingCover(true);
    try {
      const uploaded = await uploadFile({
        uri: asset.uri,
        name: asset.fileName ?? 'forsidebilde.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      await updateGroup.mutateAsync({ coverUploadId: uploaded.id });
    } catch (error) {
      Alert.alert('Kunne ikke lagre bildet', (error as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () =>
    updateGroup.mutate(
      { coverUploadId: null },
      { onError: (error) => Alert.alert('Kunne ikke fjerne bildet', error.message) }
    );

  return (
    <View className="gap-5">
      <Text className="text-muted-foreground text-sm font-medium">Gruppe</Text>

      <Field label="Gruppenavn">
        <Input value={name} onChangeText={setName} maxLength={60} />
      </Field>

      <Field label="Farge">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Field label="Forsidebilde">
        <View
          className="overflow-hidden rounded-2xl"
          style={{ aspectRatio: 16 / 9, backgroundColor: group.color }}>
          {group.coverUrl && (
            <Image
              source={{ uri: fileUrl(group.coverUrl) }}
              style={{ flex: 1 }}
              contentFit="cover"
            />
          )}
          {uploadingCover && (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color="white" />
            </View>
          )}
        </View>
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onPress={pickCover}
            disabled={uploadingCover}>
            <Icon as={ImagePlus} size={16} />
            <Text>{group.coverUrl ? 'Bytt bilde' : 'Velg bilde'}</Text>
          </Button>
          {group.coverUrl && (
            <Button
              variant="ghost"
              className="rounded-full"
              onPress={removeCover}
              disabled={uploadingCover}>
              <Text className="text-destructive">Fjern</Text>
            </Button>
          )}
        </View>
      </Field>

      <Field label="Gruppebeskrivelse">
        <Textarea value={description} onChangeText={setDescription} maxLength={1000} />
      </Field>

      <Button
        className="bg-brand active:bg-brand/80 rounded-full"
        disabled={!changed || !name.trim() || updateGroup.isPending}
        onPress={save}>
        <Text className="text-white">Lagre endringer</Text>
      </Button>
    </View>
  );
}

function ExportRow({ icon, label, path }: { icon: typeof Users; label: string; path: string }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await shareCsvExport(path);
    } catch (error) {
      Alert.alert('Eksporten feilet', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <Row icon={icon} label={label} onPress={run} busy={busy} />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-muted-foreground text-sm font-medium">{title}</Text>
      <View className="bg-muted/60 rounded-2xl px-4">{children}</View>
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

function Row({
  icon,
  label,
  detail,
  busy,
  ...props
}: {
  icon: typeof Users;
  label: string;
  detail?: string;
  busy?: boolean;
} & React.ComponentProps<typeof Pressable>) {
  return (
    <Pressable
      disabled={busy}
      className="flex-row items-center gap-3 py-3.5 active:opacity-70"
      {...props}>
      <Icon as={icon} size={18} />
      <Text className="flex-1">{label}</Text>
      {detail && <Text className="text-muted-foreground text-sm">{detail}</Text>}
      {busy ? (
        <ActivityIndicator size="small" />
      ) : (
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      )}
    </Pressable>
  );
}
