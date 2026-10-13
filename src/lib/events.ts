import type { EventType } from '@/data/types';

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'trening', label: 'Trening' },
  { value: 'kamp', label: 'Kamp' },
  { value: 'sosialt', label: 'Sosialt' },
  { value: 'annet', label: 'Annet' },
];

export const EVENT_TYPE_LABEL = Object.fromEntries(
  EVENT_TYPES.map(({ value, label }) => [value, label])
) as Record<EventType, string>;
