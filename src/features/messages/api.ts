import { apiClient } from "@/lib/api-client";
import type { Conversation, Message } from "@/types/messages";

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>(
    "/messages/conversations",
  );
  return data;
}

export async function getOrCreateConversation(
  targetUserId: string,
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>(
    "/messages/conversations",
    { targetUserId },
  );
  return data;
}

export async function getMessages(
  conversationId: string,
  limit = 20,
  before?: string,
): Promise<Message[]> {
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;
  const { data } = await apiClient.get<Message[]>(
    `/messages/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}

export async function getTotalUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(
    "/messages/total-unread",
  );
  return data.count;
}

export async function clearConversation(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/messages/conversations/${id}/clear`,
  );
  return data;
}

export async function muteConversation(id: string): Promise<{ isMuted: boolean }> {
  const { data } = await apiClient.post<{ isMuted: boolean }>(
    `/messages/conversations/${id}/mute`,
  );
  return data;
}
