import type { Position } from '@/data/types';

/** Rekkefølgen stillingene vises i, bakfra og frem på banen. */
export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'keeper', label: 'Keeper' },
  { value: 'back', label: 'Back' },
  { value: 'midtstopper', label: 'Midtstopper' },
  { value: 'midtbane', label: 'Midtbane' },
  { value: 'ving', label: 'Ving' },
  { value: 'spiss', label: 'Spiss' },
];

export const POSITION_LABEL = Object.fromEntries(
  POSITIONS.map(({ value, label }) => [value, label])
) as Record<Position, string>;
