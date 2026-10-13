import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, environment, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';
import { View } from 'react-native';

import { ACCENT } from '@/lib/theme';

import type { DateTimeFieldProps } from './date-time-field';

/**
 * Dato + tid med SwiftUI sin kompakte velger. Bruker primitivene direkte (ikke drop-in-komponenten)
 * for å skjule den tomme etiketten og la velgeren måle sin egen bredde, ellers havner den utenfor
 * skjermen eller helt til høyre.
 */
export function DateTimeField({ value, onChange, minimumDate, maximumDate }: DateTimeFieldProps) {
  return (
    <View className="items-start">
      <Host matchContents>
        <DatePicker
          selection={value}
          displayedComponents={['date', 'hourAndMinute']}
          range={minimumDate || maximumDate ? { start: minimumDate, end: maximumDate } : undefined}
          onDateChange={onChange}
          modifiers={[
            datePickerStyle('compact'),
            labelsHidden(),
            tint(ACCENT),
            environment('locale', 'nb-NO'),
          ]}
        />
      </Host>
    </View>
  );
}
