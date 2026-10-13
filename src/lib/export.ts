import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { downloadText } from './api';

/**
 * Laster ned en CSV-eksport fra API-et, lagrer den midlertidig og åpner delingsarket, så den kan
 * åpnes i Excel/Numbers, lagres i Filer eller sendes videre.
 */
export async function shareCsvExport(path: string) {
  const { fileName, text } = await downloadText(path);
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(text);

  if (!(await Sharing.isAvailableAsync()))
    throw new Error('Deling er ikke tilgjengelig på denne enheten');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: fileName,
  });
}
