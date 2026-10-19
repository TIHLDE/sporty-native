import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { useCloseParent } from '@/hooks/use-close-parent';

/** "Avbryt" i headeren på flertrinns-modaler. Lukker hele modalen, uansett steg. */
export function CancelButton() {
  const close = useCloseParent();
  return (
    <Pressable onPress={close} hitSlop={8} className="px-1">
      <Text>Avbryt</Text>
    </Pressable>
  );
}
