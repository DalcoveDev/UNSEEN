export type CreativeCategory =
  | 'Graphic Design'
  | 'UI/UX'
  | 'Photography'
  | 'Architecture'
  | 'Development'
  | 'Illustration'
  | 'Writing'
  | 'Video'
  | 'Art'
  | 'Other';

export const CREATIVE_CATEGORIES: CreativeCategory[] = [
  'Graphic Design',
  'UI/UX',
  'Photography',
  'Architecture',
  'Development',
  'Illustration',
  'Writing',
  'Video',
  'Art',
  'Other',
];

export type PrimaryTab = 'explore' | 'community' | 'publish' | 'profile';

export const PRIMARY_TABS: PrimaryTab[] = ['explore', 'community', 'publish', 'profile'];

export interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  disciplines: CreativeCategory[];
  avatarUrl?: string;
  location?: string;
  isSample?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: CreativeCategory;
  imageUrl: string;
  externalUrl?: string;
  creatorId: string;
  createdAt: string;
  aspectHint?: 'portrait' | 'landscape' | 'square';
  likesCount: number;
  isSample?: boolean;
}

export interface ProjectDraft {
  id: string;
  title: string;
  description: string;
  category: CreativeCategory;
  imageUrl: string;
  externalUrl: string;
  updatedAt: string;
}

export interface UserAccount extends CreatorProfile {
  email: string;
  onboardingComplete: boolean;
  savedProjectIds: string[];
  likedProjectIds: string[];
}

export interface Community {
  id: string;
  name: string;
  category: CreativeCategory;
  description: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  messageCount: number;
  lastMessageText: string | null;
  lastMessageAt: string;
}

export interface CommunityMessage {
  id: string;
  clientMsgId?: string;
  communityId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface DirectParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface DirectMessage {
  id: string;
  clientMsgId?: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface DirectConversation {
  id: string;
  participantIds: string[];
  participants: DirectParticipant[];
  updatedAt: string;
  messages: DirectMessage[];
}
