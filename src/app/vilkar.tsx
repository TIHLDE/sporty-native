import { ScrollView } from 'react-native';

import { TermsText } from '@/components/sporty/terms-gate';

/** Brukervilkårene, så de kan leses etter at de er godtatt. */
export default function VilkarScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="p-4 pb-16">
      <TermsText />
    </ScrollView>
  );
}
