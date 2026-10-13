import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { formatDateTimeShort } from '@/lib/dates';
import { ACCENT } from '@/lib/theme';

export interface DateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

/**
 * Dato + tid på Android. Det finnes ingen kombinert velger der, så først åpnes en datodialog og
 * deretter en tidsdialog. iOS har sin egen variant i date-time-field.ios.tsx.
 */
export function DateTimeField(props: DateTimeFieldProps) {
  return <AndroidDateTimeField {...props} />;
}

function AndroidDateTimeField({ value, onChange, minimumDate, maximumDate }: DateTimeFieldProps) {
  const [step, setStep] = useState<'date' | 'time' | null>(null);

  return (
    <>
      <Pressable
        onPress={() => setStep('date')}
        className="border-input bg-background dark:bg-input/30 h-10 justify-center rounded-md border px-3 active:opacity-70">
        <Text>{formatDateTimeShort(value)}</Text>
      </Pressable>

      {step === 'date' && (
        <DateTimePicker
          value={value}
          mode="date"
          presentation="dialog"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={ACCENT}
          onDismiss={() => setStep(null)}
          onValueChange={(_, date) => {
            const next = new Date(value);
            next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
            onChange(next);
            setStep('time');
          }}
        />
      )}
      {step === 'time' && (
        <DateTimePicker
          value={value}
          mode="time"
          presentation="dialog"
          is24Hour
          accentColor={ACCENT}
          onDismiss={() => setStep(null)}
          onValueChange={(_, date) => {
            const next = new Date(value);
            next.setHours(date.getHours(), date.getMinutes(), 0, 0);
            onChange(next);
            setStep(null);
          }}
        />
      )}
    </>
  );
}
