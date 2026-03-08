import { User } from './wishbook';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: User;
  capsuleId: string;
  parentId?: string | null;
  replies?: Comment[];
  reactions: { type: string; userId: string }[];
  mentions?: CommentMention[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentMention {
  id: string;
  commentId: string;
  mentionedUserId: string;
  mentionedUser: User;
  createdAt: string;
}
