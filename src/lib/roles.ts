import type { Role } from '@/data/types';

export const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full tilgang, også gruppeinnstillinger og roller',
  },
  {
    value: 'subadmin',
    label: 'Subadmin',
    description: 'Lager arrangementer, kunngjøringer og avstemninger, og gir bøter',
  },
  { value: 'member', label: 'Medlem', description: 'Vanlig medlem' },
];

export const ROLE_LABEL = Object.fromEntries(
  ROLES.map(({ value, label }) => [value, label])
) as Record<Role, string>;
