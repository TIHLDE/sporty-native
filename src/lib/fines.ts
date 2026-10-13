/** "1 bot", "2 bøter" */
export function formatFineCount(count: number) {
  return `${count} ${count === 1 ? 'bot' : 'bøter'}`;
}

/** "§1.00 — Oppmøte" */
export function formatLaw(law: { paragraph: string; title: string }) {
  return `§${law.paragraph} — ${law.title}`;
}
