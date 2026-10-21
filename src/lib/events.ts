import type { EventType, Location } from '@/data/types';

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'trening', label: 'Trening' },
  { value: 'kamp', label: 'Kamp' },
  { value: 'sosialt', label: 'Sosialt' },
  { value: 'annet', label: 'Annet' },
];

export const EVENT_TYPE_LABEL = Object.fromEntries(
  EVENT_TYPES.map(({ value, label }) => [value, label])
) as Record<EventType, string>;

/**
 * Stedet delt i navn og adresse. For en ren adresse er adressen alt som trengs («Skansegata 20,
 * 7014 Trondheim»). Har stedet et eget navn, kommer adressen under. Eldre arrangementer har bare
 * navnet.
 */
export function locationLines(location: Location): { title: string; address: string | null } {
  if (!location.address) return { title: location.name, address: null };
  if (location.address.startsWith(location.name)) return { title: location.address, address: null };
  return { title: location.name, address: location.address };
}

/**
 * Linjen under navnet når man velger sted: adressen uten gatenavnet hvis navnet er gateadressen
 * («Skansegata 20» over «7014 Trondheim»), ellers hele adressen.
 */
export function placeDetail(location: Location) {
  if (!location.address.startsWith(location.name)) return location.address;
  return location.address.slice(location.name.length).replace(/^,\s*/, '');
}

/** Stedet på én linje, f.eks. til kalenderen. */
export function locationLabel(location: Location) {
  const { title, address } = locationLines(location);
  return address ? `${title}, ${address}` : title;
}
