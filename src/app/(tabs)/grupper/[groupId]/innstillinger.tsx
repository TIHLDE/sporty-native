import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, useLocalSearchParams } from 'expo-router';
import { ChevronRight, FileSpreadsheet, ImagePlus, Trophy, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useGroup, useUpdateGroup } from '@/data/hooks';
import type { GroupDetails } from '@/data/types';
import { fileUrl, uploadFile } from '@/lib/api';
import { shareCsvExport } from '@/lib/export';

/**
 * Innstillinger for gruppen (⋯ på gruppesiden). Sub-/admin har tilgang. Navn, beskrivelse og
 * forsidebilde kan bare endres av admin, og bare admin kan endre roller.
 */
export default function InnstillingerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(data) => <Settings group={data} />}</QueryState>;
}

function Settings({ group }: { group: GroupDetails }) {
  const isAdmin = group.myRole === 'admin';

  return (
    <FormScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-8 p-4 pb-16">
      {isAdmin && <GroupDetailsSection group={group} />}

      <Section title="Medlemmer">
        <Link href={`/grupper/${group.id}/roller`} asChild>
          <Row icon={Users} label="Roller" detail={isAdmin ? undefined : 'Bare visning'} />
        </Link>
      </Section>

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
    </FormScrollView>
  );
}

/** (Admin) Gruppenavn, beskrivelse og forsidebilde. */
function GroupDetailsSection({ group }: { group: GroupDetails }) {
  const updateGroup = useUpdateGroup(group.id);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [uploadingCover, setUploadingCover] = useState(false);
  const changed = name.trim() !== group.name || description.trim() !== group.description;

  const save = () =>
    updateGroup.mutate(
      { name: name.trim(), description: description.trim() },
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
