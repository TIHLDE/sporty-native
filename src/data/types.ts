// Formen på dataene API-et sender til appen (DTO-er). Datamodellen i databasen ligger i
// prisma/schema.prisma. Datoer er ISO-strenger, slik de kommer over nettverket.

export type Role = 'admin' | 'subadmin' | 'member';

export type Position = 'keeper' | 'back' | 'midtstopper' | 'midtbane' | 'ving' | 'spiss';

export type Answer = 'kommer' | 'kommer_ikke';
export type AttendanceStatus = Answer | 'ubesvart';

export interface User {
  id: string;
  name: string;
  email: string;
}

/** Hvilke push-varsler og påminnelser brukeren vil ha. Lagres på brukeren i databasen. */
export interface NotificationSettings {
  /** Hovedbryteren. Når den er av, sendes ingen varsler uansett de andre valgene. */
  pushEnabled: boolean;
  pushFines: boolean;
  pushEventReminders: boolean;
  pushSignupReminders: boolean;
}

export interface Group {
  id: string;
  name: string;
  /** Hex-farge som brukes til logo og banner. */
  color: string;
  description: string;
  parentId: string | null;
  /** Om medlemmene har stillinger (keeper, back, ...), f.eks. på 11'er. */
  usesPositions: boolean;
  /** Relativ URL til forsidebildet, eller null (da brukes gruppefargen). */
  coverUrl: string | null;
  /** Den innloggede brukerens rolle i gruppen. */
  myRole: Role | null;
}

export interface Member {
  user: User;
  role: Role;
  /** Bare satt i grupper med usesPositions. */
  position: Position | null;
  /** Undergruppene medlemmet er med i, f.eks. ["Herrer 11'er"]. Tom i undergrupper. */
  subgroupNames: string[];
}

export interface GroupDetails extends Group {
  subgroups: Group[];
  members: Member[];
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export type EventType = 'trening' | 'kamp' | 'sosialt' | 'annet';

export interface Event {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  type: EventType;
  /** Laget man spiller mot. Bare for kamper. */
  opponent: string | null;
  /** Notat med ekstra informasjon. */
  description: string;
  location: Location;
  start: string;
  end: string | null;
  /** Etter fristen kan man ikke lenger svare. */
  signupDeadline: string | null;
  /** Resultat for kamper (egne mål og motstanderens), eller null hvis ikke registrert. */
  ourScore: number | null;
  theirScore: number | null;
  /** Svar per bruker. Medlemmer som mangler her har ikke svart. */
  attendance: Record<string, Answer>;
  /** Alle medlemmer i gruppen, for å regne ut hvem som ikke har svart. */
  memberIds: string[];
  /** Om den innloggede brukeren kan redigere og slette (sub-/admin her eller i hovedgruppen). */
  canManage: boolean;
  /** Om den innloggede brukeren kan gi fellesbot (sub-/admin i hovedgruppen). */
  canGiveFines: boolean;
}

export interface UploadedFile {
  id: string;
  kind: 'image' | 'video' | 'file';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Relativ API-sti, gjøres om til full URL med `fileUrl()` i appen. */
  url: string;
}

export interface Announcement {
  id: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  allowComments: boolean;
  commentCount: number;
  /** Bilder og video. */
  media: UploadedFile[];
  /** Andre vedlegg (PDF, dokumenter osv.). */
  attachments: UploadedFile[];
}

export interface Comment {
  id: string;
  author: User;
  body: string;
  createdAt: string;
}

export interface AnnouncementDetails extends Announcement {
  comments: Comment[];
}

export interface PollOption {
  id: string;
  label: string;
  /** null når resultatet er skjult for den innloggede brukeren. */
  voteCount: number | null;
}

export interface Poll {
  id: string;
  groupId: string;
  question: string;
  description: string;
  createdByName: string | null;
  createdAt: string;
  closesAt: string;
  closed: boolean;
  allowMultiple: boolean;
  hideVotes: boolean;
  allowComments: boolean;
  commentCount: number;
  options: PollOption[];
  /** Alternativene den innloggede brukeren har stemt på. */
  myOptionIds: string[];
  /** Hvor mange som har stemt. null når resultatet er skjult. */
  voterCount: number | null;
  /** Skjulte stemmer vises for sub-/admin, og for alle etter fristen. */
  resultsVisible: boolean;
}

export interface PollDetails extends Poll {
  comments: Comment[];
}

/** En paragraf i gruppens botregler, f.eks. "§1.00 Oppmøte". */
export interface Law {
  id: string;
  groupId: string;
  paragraph: string;
  title: string;
  description: string;
}

export interface Fine {
  id: string;
  groupId: string;
  law: Pick<Law, 'paragraph' | 'title'>;
  user: User;
  givenByName: string;
  reason: string;
  /** Antall bøter. Bøter telles, de har ikke et kronebeløp. */
  count: number;
  imageUri: string | null;
  paid: boolean;
  /** Fellesbot gitt til alle som ikke svarte på et arrangement. */
  collective: boolean;
  createdAt: string;
}

/**
 * Betalingsoppfordring som sub-/admin poster. Selve betalingen skjer utenfor appen (Vipps e.l.),
 * medlemmene markerer bare selv at de har betalt.
 */
export interface PaymentRequest {
  id: string;
  groupId: string;
  createdByName: string;
  title: string;
  description: string;
  amount: number;
  vippsNumber: string;
  dueDate: string;
  createdAt: string;
  paidUserIds: string[];
  memberCount: number;
  canManage: boolean;
}

export interface GroupFile {
  id: string;
  groupId: string;
  name: string;
  kind: 'pdf' | 'image' | 'document';
  sizeKb: number;
  uploadedAt: string;
}

export type NotificationType = 'event' | 'attendance' | 'fine' | 'announcement' | 'poll' | 'payment';

export interface Notification {
  id: string;
  groupId: string | null;
  type: NotificationType;
  text: string;
  createdAt: string;
  read: boolean;
  href: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  group: Pick<Group, 'id' | 'name' | 'color'> | null;
  /** Den andre personen i en samtale mellom to. */
  otherUser: User | null;
  lastMessage: { senderId: string; senderName: string; body: string; sentAt: string } | null;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  body: string;
  sentAt: string;
}

/** Én side med meldinger, nyeste først. `nextCursor` henter eldre meldinger. */
export interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
}

export interface ConversationDetails {
  id: string;
  title: string;
  group: Pick<Group, 'id' | 'name' | 'color'> | null;
  otherUser: User | null;
  memberCount: number;
}

export interface UnreadCounts {
  notifications: number;
  messages: number;
}

// Forespørsler (request bodies)

export interface GiveFinesInput {
  groupId: string;
  lawId: string;
  userIds: string[];
  count: number;
  reason: string;
  imageUri: string | null;
}

export interface Place extends Location {
  id: string | null;
  address: string;
}

export interface CreateEventInput {
  title: string;
  type: EventType;
  opponent: string | null;
  start: string;
  end: string | null;
  location: Location;
  description: string;
  signupDeadline: string | null;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  allowComments: boolean;
  /** Opplastinger fra POST /api/uploads, i den rekkefølgen de skal vises. */
  uploadIds: string[];
}

export interface CreatePollInput {
  question: string;
  description: string;
  options: string[];
  allowMultiple: boolean;
  hideVotes: boolean;
  allowComments: boolean;
  closesAt: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  /** Id fra POST /api/uploads, eller null for å fjerne forsidebildet. */
  coverUploadId?: string | null;
}

export interface CreatePaymentInput {
  title: string;
  description: string;
  amount: number;
  vippsNumber: string;
  dueDate: string;
}
