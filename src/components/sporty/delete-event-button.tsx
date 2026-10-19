import { Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDeleteEvent } from '@/data/hooks';
import type { Event } from '@/data/types';

/** (Sub-/admin) Slett arrangementet, med bekreftelse først. Ligger i redigeringsskjemaet. */
export function DeleteEventButton({ event, onDeleted }: { event: Event; onDeleted: () => void }) {
  const deleteEvent = useDeleteEvent(event.id);

  const remove = () =>
    deleteEvent.mutate(undefined, {
      onSuccess: onDeleted,
      onError: (error) => Alert.alert('Kunne ikke slette arrangementet', error.message),
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="rounded-full" disabled={deleteEvent.isPending}>
          <Icon as={Trash2} size={16} className="text-destructive" />
          <Text className="text-destructive">Slett arrangement</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slette «{event.title}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Arrangementet og alle svarene slettes, og medlemmene får beskjed om at det er avlyst.
            Bøter som er gitt for det beholdes. Dette kan ikke angres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Avbryt</Text>
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive" onPress={remove}>
            <Text className="text-white">Slett</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
