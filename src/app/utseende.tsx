import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import {
  APPEARANCE_OPTIONS,
  setAppearancePreference,
  useAppearancePreference,
} from '@/data/appearance';

/** Velg lyst, mørkt eller automatisk utseende. */
export default function UtseendeScreen() {
  const preference = useAppearancePreference();

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4" className="pb-2">
        Utseende
      </Text>
      {APPEARANCE_OPTIONS.map((option, index) => (
        <View key={option.value}>
          {index > 0 && <Separator />}
          <Pressable
            onPress={() => {
              setAppearancePreference(option.value);
              router.back();
            }}
            className="flex-row items-center gap-3 py-3.5 active:opacity-70">
            <View className="flex-1">
              <Text className="font-medium">{option.label}</Text>
              <Text className="text-muted-foreground text-sm">{option.description}</Text>
            </View>
            {preference === option.value && <Icon as={Check} size={18} className="text-brand" />}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
