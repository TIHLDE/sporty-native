import { Image as ImageIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Fine } from '@/data/types';
import { formatRelative } from '@/lib/dates';
import { formatFineCount, formatLaw } from '@/lib/fines';

import { UserAvatar } from './user-row';

export function FineRow({ fine }: { fine: Fine }) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <UserAvatar user={fine.user} />
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{fine.user.name}</Text>
        <Text className="text-sm font-medium">{formatLaw(fine.law)}</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="flex-1 text-sm">{fine.reason}</Text>
          {fine.imageUri && <Icon as={ImageIcon} size={14} className="text-muted-foreground" />}
        </View>
        <Text className="text-muted-foreground text-xs">
          {fine.collective ? 'Fellesbot' : `Fra ${fine.givenByName}`} · {formatRelative(fine.createdAt)}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="font-semibold">{formatFineCount(fine.count)}</Text>
        <Badge variant={fine.paid ? 'secondary' : 'outline'}>
          <Text>{fine.paid ? 'Betalt' : 'Ubetalt'}</Text>
        </Badge>
      </View>
    </View>
  );
}
