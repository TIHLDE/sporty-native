import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export function EmptyState({ text }: { text: string }) {
  return (
    <View className="items-center py-10">
      <Text className="text-muted-foreground text-center">{text}</Text>
    </View>
  );
}
