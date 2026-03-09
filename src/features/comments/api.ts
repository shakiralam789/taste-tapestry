import { apiClient } from '@/lib/api-client';
import { Comment } from '@/types/comments';

export async function getCommentsByCapsule(capsuleId: string): Promise<Comment[]> {
  const { data } = await apiClient.get<Comment[]>(`/comments/capsule/${capsuleId}`);
  return data ?? [];
}

export async function createComment(data: {
  content: string;
  capsuleId: string;
  parentId?: string;
}): Promise<Comment> {
  const { data: comment } = await apiClient.post<Comment>('/comments', data);
  return comment;
}

export async function addCommentReaction(commentId: string, type: string): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/comments/${commentId}/react`, { type });
  return data;
}

export async function removeCommentReaction(commentId: string, type: string): Promise<Comment> {
  const { data } = await apiClient.delete<Comment>(`/comments/${commentId}/react`, {
    data: { type },
  });
  return data;
}

export async function updateComment(id: string, content: string): Promise<Comment> {
  const { data } = await apiClient.patch<Comment>(`/comments/${id}`, { content });
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/comments/${id}`);
}
