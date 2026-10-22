// Lager src/data/emojis.json til emoji-velgeren fra emojibase-data (norske navn og søkeord).
// Kjør på nytt etter oppdatering av emojibase-data: `node scripts/generate-emojis.mjs`.

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const read = (file) =>
  JSON.parse(readFileSync(require.resolve(`emojibase-data/nb/${file}`), 'utf8'));
const data = read('data.json');
const messages = read('messages.json');

/** Nyere emojier enn dette vises som tomme ruter på iOS 16.3 / Android 13 og eldre. */
const MAX_VERSION = 15;
/** Gruppe 2 er hudfarger og hårtyper, som ikke er emojier i seg selv. */
const COMPONENT_GROUP = 2;

const groups = messages.groups
  .filter((g) => g.order !== COMPONENT_GROUP)
  .map((g) => ({
    // «smilefjes og følelser» → «Smilefjes og følelser»
    label: g.message[0].toUpperCase() + g.message.slice(1),
    // [emoji, søketekst]
    emojis: data
      .filter((e) => e.group === g.order && e.version <= MAX_VERSION)
      .sort((a, b) => a.order - b.order)
      .map((e) => [e.emoji, [e.label, ...(e.tags ?? [])].join(' ').toLowerCase()]),
  }));

writeFileSync(new URL('../src/data/emojis.json', import.meta.url), JSON.stringify({ groups }));
console.log(
  `${groups.reduce((n, g) => n + g.emojis.length, 0)} emojier i ${groups.length} grupper`
);
