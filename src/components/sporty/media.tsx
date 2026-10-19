import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { FileText, Play } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { UploadedFile } from '@/data/types';
import { fileUrl } from '@/lib/api';
import { formatFileSize } from '@/lib/files';

const ROUNDED = { borderRadius: 16 };

/** Alle bilder og videoer i full bredde, til visningen av en kunngjøring. */
export function MediaGallery({ media }: { media: UploadedFile[] }) {
  return (
    <View className="gap-3">
      {media.map((file) =>
        file.kind === 'video' ? (
          <VideoItem key={file.id} file={file} />
        ) : (
          <Image
            key={file.id}
            source={{ uri: fileUrl(file.url) }}
            style={[{ width: '100%', aspectRatio: 4 / 3 }, ROUNDED]}
            contentFit="cover"
            transition={150}
          />
        )
      )}
    </View>
  );
}

function VideoItem({ file }: { file: UploadedFile }) {
  const player = useVideoPlayer(fileUrl(file.url));
  return (
    <VideoView
      player={player}
      style={[{ width: '100%', aspectRatio: 16 / 9, backgroundColor: 'black' }, ROUNDED]}
      nativeControls
      contentFit="contain"
    />
  );
}

/** Første bilde/video som forhåndsvisning på kortet, med "+n" hvis det er flere. */
export function MediaPreview({ media }: { media: UploadedFile[] }) {
  const first = media[0];
  if (!first) return null;

  return (
    <View className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: 16 / 9 }}>
      {first.kind === 'image' ? (
        <Image source={{ uri: fileUrl(first.url) }} style={{ flex: 1 }} contentFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <View className="size-12 items-center justify-center rounded-full bg-white/20">
            <Icon as={Play} size={22} className="text-white" fill="white" />
          </View>
        </View>
      )}
      {media.length > 1 && (
        <View className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1">
          <Text className="text-xs font-semibold text-white">+{media.length - 1}</Text>
        </View>
      )}
    </View>
  );
}

/** Vedlegg som åpnes i nettleseren i appen (PDF, dokumenter osv.). */
export function AttachmentList({ attachments }: { attachments: UploadedFile[] }) {
  return (
    <View className="bg-muted/60 rounded-2xl px-4">
      {attachments.map((file, index) => (
        <View key={file.id}>
          {index > 0 && <Separator />}
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(fileUrl(file.url))}
            className="flex-row items-center gap-3 py-3 active:opacity-70">
            <View className="bg-muted size-10 items-center justify-center rounded-lg">
              <Icon as={FileText} size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-medium" numberOfLines={1}>
                {file.fileName}
              </Text>
              <Text className="text-muted-foreground text-xs">
                {formatFileSize(file.sizeBytes)}
              </Text>
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
