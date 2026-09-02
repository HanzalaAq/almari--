import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { WebNavbar } from '../../components/layout/WebNavbar';

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
  const { user, isAuthLoading } = useAuthStore();
  const { markAsRead, markAllAsRead } = useNotificationsStore();
  const [actionError, setActionError] = useState('');

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F9F9' }}>
        <ActivityIndicator size="large" color="#007782" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const { data: notifications, isLoading, isError, refetch } = useQuery({
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
    setActionError('');
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
    if (error) {
      setActionError('Could not mark as read');
      return;
    }
    markAsRead(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || !notifications?.length) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setActionError('');
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    if (error) {
      setActionError('Could not mark all as read');
      return;
    }
    markAllAsRead();
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <View className="flex-1 bg-white">
      {Platform.OS === 'web' && <WebNavbar />}
      <View className="p-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <Text className="text-xl font-bold text-brand">Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllAsRead} className="px-3 py-1.5 rounded-full bg-brand-light">
            <Text className="text-brand text-sm font-medium">Mark all as read</Text>
          </Pressable>
        )}
      </View>

      {actionError ? (
        <View className="mx-4 mt-2 p-3 bg-red-50 rounded-lg flex flex-row items-center">
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
          <Text className="text-red-600 text-sm ml-2 flex-1">{actionError}</Text>
          <Pressable onPress={() => setActionError('')}>
            <Ionicons name="close" size={16} color="#DC2626" />
          </Pressable>
        </View>
      ) : null}

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#007782" />
            <Text className="text-text-muted mt-3">Loading notifications…</Text>
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Ionicons name="cloud-offline-outline" size={48} color="#999" />
            <Text className="text-text-primary mt-4 text-lg font-semibold">Could not load notifications</Text>
            <Text className="text-text-muted mt-1 text-sm">Check your connection and try again.</Text>
            <Pressable onPress={() => refetch()} className="mt-4 px-5 py-2.5 bg-brand rounded-lg">
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
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
