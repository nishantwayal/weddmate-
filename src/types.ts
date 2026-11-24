export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ur'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'or';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AppTab = 'home' | 'discover' | 'matches' | 'chat' | 'profile';

export type SubView =
  | 'main'
  | 'memories'
  | 'qr_studio'
  | 'planner'
  | 'website';

export type WeddingSide = "Bride's Side" | "Groom's Side" | 'Both Sides';
export type MemberSide = "Bride's Side" | "Groom's Side";
export type RelationshipIntention =
  | 'Marriage'
  | 'Serious Relationship'
  | 'Getting to Know People'
  | 'Open to Connection';

export type DurationPreset = '2_days' | '3_days' | '5_days' | 'custom';
export type PlanTier = 'Basic' | 'Premium' | 'Luxury';

export interface UserAccount {
  uid: string;
  email?: string;
  phone?: string;
  phoneVerified: boolean;
  ageConfirmed18Plus: boolean;
  acceptedTerms: boolean;
  matchmakingPaused: boolean;
  profileVisibility: 'wedding_only' | 'matches_only' | 'hidden';
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredLocations: string[];
  partnerPreferences: string;
  instagramId?: string;
  role: 'guest' | 'planner';
  blockedUserIds: string[];
  deletionRequested: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuestProfile {
  uid: string;
  fullName: string;
  age: number;
  gender: 'Woman' | 'Man' | 'Non-binary';
  city: string;
  profession: string;
  education: string;
  hobbies: string[];
  intention: RelationshipIntention;
  bio: string;
  weddingSide: WeddingSide;
  languages: string[];
  photos: string[];
  primaryPhoto: string;
  weddingIds: string[];
  optedInDiscover: boolean;
  visibility: 'visible' | 'paused' | 'hidden';
  identityVerified: boolean;
  mutualConsentVisible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  isDemo?: boolean;
}

export interface WeddingEvent {
  id: string;
  plannerUid: string;
  weddingName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  durationPreset: DurationPreset;
  expiresAtMs: number;
  qrCodeToken: string;
  joinPermission: 'open_qr' | 'approval_required' | 'invite_only';
  matchmakingEnabled: boolean;
  memoriesEnabled: boolean;
  memoriesUploadPermission: 'all_guests' | 'organizer_only';
  status: 'active' | 'expired';
  planTier: PlanTier;
  guestCount: number;
  optedInCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WeddingMember {
  uid: string;
  weddingId: string;
  side: MemberSide;
  optedInMatchmaking: boolean;
  fullName: string;
  city: string;
  status: 'active' | 'pending' | 'removed';
  joinedAt?: unknown;
}

export interface SwipeAction {
  fromUid: string;
  toUid: string;
  weddingId: string;
  action: 'like' | 'pass' | 'secret_crush' | 'super_like';
  createdAt?: unknown;
}

export interface MatchRecord {
  id: string;
  user1Uid: string;
  user2Uid: string;
  participants: string[];
  weddingId: string;
  weddingName: string;
  status: 'active' | 'unmatched';
  icebreakerPrompt?: string;
  lastMessagePreview?: string;
  contactShareConsentUser1?: boolean;
  contactShareConsentUser2?: boolean;
  matchedAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderUid: string;
  text?: string;
  imageDataUrl?: string;
  type: 'text' | 'image' | 'icebreaker';
  readBy: string[];
  createdAt?: unknown;
}

export type WeddingAlbum = 'Haldi' | 'Mehendi' | 'Sangeet' | 'Reception';

export interface WeddingMemory {
  id: string;
  weddingId: string;
  authorUid: string;
  authorName: string;
  mediaType: 'photo' | 'reel' | 'story';
  album: WeddingAlbum;
  mediaUrl: string;
  caption: string;
  allowDownload: boolean;
  featuredOnLiveWall: boolean;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  createdAt?: unknown;
}

export interface MemoryComment {
  id: string;
  memoryId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt?: unknown;
}

export interface SafetyReport {
  id: string;
  reporterUid: string;
  reportedUid: string;
  weddingId?: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewed';
  createdAt?: unknown;
}
