import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Camera, ImagePlus, Minus, Plus, X } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { UserAvatar } from '@/components/sporty/user-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useGiveFines, useGroup, useLaws } from '@/data/hooks';
import { useCloseParent } from '@/hooks/use-close-parent';
import { formatFineCount, formatLaw } from '@/lib/fines';

const MAX_COUNT = 20;

/** Steg 4: antall, begrunnelse og valgfritt bilde. */
export default function GiBotDetaljerScreen() {
  const params = useLocalSearchParams<{ groupId: string; lawId: string; userIds: string }>();
  const law = useLaws(params.groupId).data?.find((l) => l.id === params.lawId);
  const group = useGroup(params.groupId).data;
  const members = group?.members ?? [];
  // tihlde.org tar bare imot bilder som en offentlig lenke, og bildet ligger bare på telefonen.
  const fromTihlde = group?.fines.source === 'tihlde';
  const selectedIds = params.userIds.split(',');
  const users = members.map((m) => m.user).filter((user) => selectedIds.includes(user.id));

  // Antallet lovverket foreslår for paragrafen, til brukeren endrer det selv.
  const [chosenCount, setCount] = useState<number | null>(null);
  const count = chosenCount ?? Math.min(Math.max(law?.defaultCount ?? 1, 1), MAX_COUNT);
  const [reason, setReason] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const giveFines = useGiveFines();
  // Samme id for alle forsøk med dette skjemaet, så serveren ikke gir bøtene to ganger.
  const [requestId] = useState(() => Crypto.randomUUID());
  // Låses med en gang, før knappen rekker å bli deaktivert ved neste tegning (dobbelttrykk).
  const submitting = useRef(false);
  const close = useCloseParent();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Mangler tilgang',
        'Gi Sporty tilgang til kameraet i innstillingene for å ta bilde.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = () => {
    if (submitting.current) return;
    submitting.current = true;
    giveFines.mutate(
      {
        requestId,
        groupId: params.groupId,
        lawId: params.lawId,
        userIds: selectedIds,
        count,
        reason: reason.trim(),
        // Bildet ligger foreløpig bare lokalt på telefonen. Opplasting til server kommer senere.
        imageUri: fromTihlde ? null : imageUri,
      },
      {
        onSuccess: close,
        onError: (error) => {
          submitting.current = false;
          Alert.alert('Kunne ikke gi bot', error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1">
      <FormScrollView
        contentContainerClassName="gap-7 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        <View className="bg-brand/15 gap-1 rounded-2xl p-4">
          {law && <Text className="font-semibold">{formatLaw(law)}</Text>}
          <Text>
            {selectedIds.length} {selectedIds.length === 1 ? 'bruker' : 'brukere'} valgt
          </Text>
          {fromTihlde && (
            <Text className="text-muted-foreground text-sm">
              Boten gis på tihlde.org og venter på godkjenning fra botsjefen.
            </Text>
          )}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold">Valgte brukere</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-4">
            {users.map((user) => (
              <View key={user.id} className="w-16 items-center gap-1.5">
                <UserAvatar user={user} className="size-14" />
                <Text className="text-xs" numberOfLines={1}>
                  {user.name.split(' ')[0]}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold">Antall bøter</Text>
          <View className="flex-row items-center gap-6">
            <StepButton icon={Minus} disabled={count <= 1} onPress={() => setCount(count - 1)} />
            <Text className="min-w-8 text-center text-3xl font-bold">{count}</Text>
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

        {!fromTihlde && (
          <View className="gap-3">
            <Text className="text-lg font-semibold">Bilde (valgfritt)</Text>
            {imageUri ? (
              <View>
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16 }}
                />
                <Pressable
                  onPress={() => setImageUri(null)}
                  hitSlop={8}
                  className="absolute right-3 top-3 size-8 items-center justify-center rounded-full bg-black/60">
                  <Icon as={X} size={16} className="text-white" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <ImageTile icon={ImagePlus} label="Velg bilde" onPress={pickImage} />
                <ImageTile icon={Camera} label="Ta bilde" onPress={takePhoto} />
              </View>
            )}
          </View>
        )}
      </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          disabled={!reason.trim() || giveFines.isPending}
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}>
          <Text className="text-white">
            Gi {formatFineCount(count)}
            {selectedIds.length > 1 ? ` til ${selectedIds.length} brukere` : ''}
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
      onPress={onPress}>
      <Icon as={icon} size={22} />
    </Button>
  );
}

function ImageTile({
  icon,
  label,
  onPress,
}: {
  icon: typeof Camera;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-muted/60 flex-1 items-center gap-2 rounded-2xl py-6 active:opacity-70">
      <Icon as={icon} size={28} className="text-brand" />
      <Text>{label}</Text>
    </Pressable>
  );
}
