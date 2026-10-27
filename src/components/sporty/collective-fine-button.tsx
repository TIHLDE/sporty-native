import { Gavel } from 'lucide-react-native';
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
import { useCollectiveFine } from '@/data/hooks';
import type { Event } from '@/data/types';
import { formatFineCount } from '@/lib/fines';
import { cn } from '@/lib/utils';

const COLLECTIVE_FINE_COUNT = 1;

/**
 * Om sub-/admin kan gi fellesbot nå. Det går først når man ikke lenger kan svare: etter fristen,
 * eller når arrangementet har startet hvis det ikke har noen frist. Og bare én gang.
 */
export function canGiveCollectiveFine(event: Event, unansweredCount: number, now = new Date()) {
  const answeringClosed = new Date(event.signupDeadline ?? event.start) <= now;
  return event.canGiveFines && answeringClosed && unansweredCount > 0 && !event.collectiveFineGiven;
}

/** «Gi fellesbot» til alle som ikke har svart, etter en bekreftelse. Brukes på arrangementet og på kortet. */
export function CollectiveFineButton({
  eventId,
  count,
  className,
}: {
  eventId: string;
  count: number;
  className?: string;
}) {
  const collectiveFine = useCollectiveFine(eventId);

  const give = () =>
    collectiveFine.mutate(undefined, {
      onSuccess: ({ count: given }) =>
        Alert.alert(
          'Fellesbot gitt',
          `${given} ${given === 1 ? 'medlem' : 'medlemmer'} fikk 1 bot.`
        ),
      onError: (error) => Alert.alert('Kunne ikke gi fellesbot', error.message),
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            // dark: også, ellers vinner den grå kanten fra outline-varianten i mørk modus.
            'border-destructive dark:border-destructive rounded-full',
            className
          )}>
          <Icon as={Gavel} size={16} className="text-destructive" />
          <Text className="text-destructive">Gi fellesbot ({count})</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gi fellesbot?</AlertDialogTitle>
          <AlertDialogDescription>
            {count} medlemmer som ikke har svart får {formatFineCount(COLLECTIVE_FINE_COUNT)} hver.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Avbryt</Text>
          </AlertDialogCancel>
          <AlertDialogAction className="bg-destructive" onPress={give}>
            <Text className="text-white">Gi fellesbot</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
