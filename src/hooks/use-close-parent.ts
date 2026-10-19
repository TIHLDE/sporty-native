import { useNavigation } from 'expo-router';

/** Lukker forelder-navigatoren, f.eks. hele "Gi bot"-modalen uansett hvilket steg man står på. */
export function useCloseParent() {
  const navigation = useNavigation();
  return () => navigation.getParent()?.goBack();
}
