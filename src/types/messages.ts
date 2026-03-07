export interface Conversation {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  // Enriched by backend
  lastMessage: Message | null;
  unreadCount: number;
  mutedBy: string[];
  clearedAt: Record<string, string>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "file";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
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
