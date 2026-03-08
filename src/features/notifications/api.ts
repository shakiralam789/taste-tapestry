import { apiClient } from '@/lib/api-client';
import { Notification } from '@/types/notifications';

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications', {
    params: { limit },
  });
  return data ?? [];
}

export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data ?? { count: 0 };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const { data } = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
  return data;
}
