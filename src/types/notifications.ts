import { User } from './wishbook';

export enum NotificationType {
  MENTION = 'MENTION',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_REPLY = 'NEW_REPLY',
  REACTION = 'REACTION',
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actor: User;
  type: NotificationType;
  content?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
