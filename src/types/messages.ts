export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  // Enriched by backend
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  typing: boolean;
}

export interface ReadEvent {
  conversationId: string;
  userId: string;
  messageIds: string[];
}

export interface OnlineEvent {
  userId: string;
}
