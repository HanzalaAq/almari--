import { View, Text, ScrollView, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  favorite: 'heart',
  follow: 'person-add',
  offer: 'cash',
  message: 'chatbubble',
  comment: 'chatbubble-ellipses',
  order: 'receipt',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const { markAsRead, markAllAsRead } = useNotificationsStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleMarkAsRead = async (notification: any) => {
    if (notification.read) return;
    await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
    markAsRead(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || !notifications?.length) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    markAllAsRead();
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <Text className="text-xl font-bold text-brand">Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllAsRead} className="px-3 py-1.5 rounded-full bg-brand-light">
            <Text className="text-brand text-sm font-medium">Mark all as read</Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="p-4">
            <Text className="text-text-muted">Loading...</Text>
          </View>
        ) : !notifications || notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Ionicons name="notifications-off-outline" size={48} color="#999" />
            <Text className="text-text-muted mt-4 text-lg">No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const isUnread = !notification.read;
            const iconName = ICON_MAP[notification.type] || 'notifications';

            return (
              <Pressable
                key={notification.id}
                onPress={() => handleMarkAsRead(notification)}
                className={`flex flex-row items-start p-4 border-b border-gray-100 ${
                  isUnread ? 'bg-brand-light/30 border-l-4 border-l-brand' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name={iconName} size={20} color="#E85D2C" />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm ${isUnread ? 'font-bold text-text-primary' : 'text-text-primary'}`}
                  >
                    {notification.title}
                  </Text>
                  {notification.body && (
                    <Text className="text-text-secondary text-sm mt-0.5">{notification.body}</Text>
                  )}
                  <Text className="text-text-muted text-xs mt-1">{timeAgo(notification.created_at)}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
