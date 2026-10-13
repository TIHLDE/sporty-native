import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText, ImagePlus, Paperclip, Play, RotateCw, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAnnouncement, useGroup } from '@/data/hooks';
import type { UploadedFile } from '@/data/types';
import { uploadFile } from '@/lib/api';
import { formatFileSize } from '@/lib/files';

/** En valgt fil som lastes opp med en gang den velges, så publisering går raskt. */
interface PendingFile {
  key: string;
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadedFile['kind'];
  status: 'uploading' | 'done' | 'error';
  uploaded?: UploadedFile;
}

/** (Sub-/admin) Publiser en kunngjøring til alle i gruppen. */
export default function NyKunngjoringScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId).data;
  const createAnnouncement = useCreateAnnouncement(groupId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [files, setFiles] = useState<PendingFile[]>([]);

  const media = files.filter((f) => f.kind !== 'file');
  const attachments = files.filter((f) => f.kind === 'file');
  const uploading = files.some((f) => f.status === 'uploading');
  const failed = files.some((f) => f.status === 'error');
  const canSubmit = Boolean(title.trim()) && !uploading && !failed && !createAnnouncement.isPending;

  const patch = (key: string, changes: Partial<PendingFile>) =>
    setFiles((current) => current.map((f) => (f.key === key ? { ...f, ...changes } : f)));

  const startUpload = (file: PendingFile) => {
    patch(file.key, { status: 'uploading' });
    uploadFile(file)
      .then((uploaded) => patch(file.key, { status: 'done', uploaded }))
      .catch(() => patch(file.key, { status: 'error' }));
  };

  const addFiles = (picked: Omit<PendingFile, 'key' | 'status'>[]) => {
    const pending = picked.map((p, i) => ({
      ...p,
      key: `${Date.now()}-${i}`,
      status: 'uploading' as const,
    }));
    setFiles((current) => [...current, ...pending]);
    pending.forEach(startUpload);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    addFiles(
      result.assets.map((a) => {
        const kind = a.type === 'video' ? 'video' : 'image';
        return {
          uri: a.uri,
          name: a.fileName ?? (kind === 'video' ? 'video.mp4' : 'bilde.jpg'),
          mimeType: a.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
          sizeBytes: a.fileSize ?? 0,
          kind,
        };
      })
    );
  };

  const pickAttachments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    addFiles(
      result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? 'application/octet-stream',
        sizeBytes: a.size ?? 0,
        kind: 'file' as const,
      }))
    );
  };

  const remove = (key: string) => setFiles((current) => current.filter((f) => f.key !== key));

  const submit = () =>
    createAnnouncement.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        allowComments,
        // Bilder/video først, så vedlegg, i den rekkefølgen de ble valgt.
        uploadIds: [...media, ...attachments].map((f) => f.uploaded!.id),
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke publisere', error.message),
      }
    );

  return (
    <View className="flex-1">
      <FormScrollView
        contentContainerClassName="gap-6 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        {group && (
          <Text className="text-muted-foreground text-sm">
            Alle i {group.name} får varsel om kunngjøringen.
          </Text>
        )}

        <Field label="Tittel">
          <Input value={title} onChangeText={setTitle} placeholder="F.eks. Nye drakter er kommet" />
        </Field>

        <Field label="Beskrivelse">
          <Textarea
            value={body}
            onChangeText={setBody}
            placeholder="Hva vil du si til gruppen?"
            className="min-h-32"
          />
        </Field>

        <Field label="Bilder og video (valgfritt)">
          {media.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {media.map((file) => (
                <MediaThumb
                  key={file.key}
                  file={file}
                  onRemove={() => remove(file.key)}
                  onRetry={() => startUpload(file)}
                />
              ))}
            </View>
          )}
          <PickButton icon={ImagePlus} label="Legg til bilder eller video" onPress={pickMedia} />
        </Field>

        <Field label="Vedlegg (valgfritt)">
          {attachments.map((file) => (
            <AttachmentRow
              key={file.key}
              file={file}
              onRemove={() => remove(file.key)}
              onRetry={() => startUpload(file)}
            />
          ))}
          <PickButton icon={Paperclip} label="Legg til vedlegg" onPress={pickAttachments} />
        </Field>

        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Label>Tillat kommentarer</Label>
            <Text className="text-muted-foreground text-xs">
              Medlemmene kan svare under kunngjøringen
            </Text>
          </View>
          <Switch checked={allowComments} onCheckedChange={setAllowComments} />
        </View>
      </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          disabled={!canSubmit}
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}>
          <Text className="text-white">
            {uploading ? 'Laster opp …' : failed ? 'Noen filer feilet' : 'Publiser'}
          </Text>
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

function PickButton({
  icon,
  label,
  onPress,
}: {
  icon: typeof Paperclip;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border-border flex-row items-center justify-center gap-2 rounded-2xl border border-dashed py-4 active:opacity-70">
      <Icon as={icon} size={18} className="text-brand" />
      <Text className="text-brand font-medium">{label}</Text>
    </Pressable>
  );
}

function StatusOverlay({ file, onRetry }: { file: PendingFile; onRetry: () => void }) {
  if (file.status === 'uploading') return <ActivityIndicator color="white" />;
  if (file.status === 'error') {
    return (
      <Pressable onPress={onRetry} hitSlop={8} className="items-center gap-1">
        <Icon as={RotateCw} size={18} className="text-white" />
        <Text className="text-xs text-white">Prøv igjen</Text>
      </Pressable>
    );
  }
  return null;
}

function MediaThumb({
  file,
  onRemove,
  onRetry,
}: {
  file: PendingFile;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <View className="size-24 overflow-hidden rounded-xl bg-black">
      <Image source={{ uri: file.uri }} style={{ flex: 1 }} contentFit="cover" />
      <View className="absolute inset-0 items-center justify-center bg-black/30">
        {file.status === 'done' && file.kind === 'video' ? (
          <Icon as={Play} size={20} className="text-white" fill="white" />
        ) : (
          <StatusOverlay file={file} onRetry={onRetry} />
        )}
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        className="absolute right-1 top-1 size-6 items-center justify-center rounded-full bg-black/60">
        <Icon as={X} size={14} className="text-white" />
      </Pressable>
    </View>
  );
}

function AttachmentRow({
  file,
  onRemove,
  onRetry,
}: {
  file: PendingFile;
  onRemove: () => void;
  onRetry: () => void;
}) {
  return (
    <View className="bg-muted/60 flex-row items-center gap-3 rounded-xl px-3 py-2.5">
      <Icon as={FileText} size={20} />
      <View className="flex-1">
        <Text className="font-medium" numberOfLines={1}>
          {file.name}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {file.status === 'uploading'
            ? 'Laster opp …'
            : file.status === 'error'
              ? 'Opplasting feilet'
              : formatFileSize(file.sizeBytes)}
        </Text>
      </View>
      {file.status === 'uploading' && <ActivityIndicator size="small" />}
      {file.status === 'error' && (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Icon as={RotateCw} size={18} />
        </Pressable>
      )}
      <Pressable onPress={onRemove} hitSlop={8}>
        <Icon as={X} size={18} className="text-muted-foreground" />
      </Pressable>
    </View>
  );
}
