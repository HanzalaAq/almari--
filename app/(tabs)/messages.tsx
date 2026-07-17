import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_photo?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  listing_id?: string;
  listing_title?: string;
  listing_image?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user?.id,
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !selectedConversation) return;

      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content,
      });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', selectedConversation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      setMessageText('');
    },
  });

  useEffect(() => {
    // Subscribe to new messages
    if (selectedConversation) {
      const subscription = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation, queryClient]);

  if (Platform.OS === 'web') {
    // Web: Two-panel layout
    return (
      <View className="flex-1 flex flex-row h-screen">
        {/* Conversation List */}
        <View className="w-80 border-r border-gray-200 bg-white">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-brand">Messages</Text>
          </View>
          <ScrollView>
            {isLoading ? (
              <View className="p-4">
                <Text className="text-text-muted">Loading...</Text>
              </View>
            ) : conversations?.length === 0 ? (
              <View className="p-4">
                <Text className="text-text-muted">No conversations yet</Text>
              </View>
            ) : (
              conversations?.map((conv) => (
                <Pressable
                  key={conv.id}
                  onPress={() => setSelectedConversation(conv.id)}
                  className={`p-4 border-b border-gray-100 ${
                    selectedConversation === conv.id ? 'bg-brand-light' : ''
                  }`}
                >
                  <View className="flex flex-row items-center mb-2">
                    <View className="w-10 h-10 bg-brand rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold">
                        {conv.other_user_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-text-primary">{conv.other_user_name}</Text>
                      <Text className="text-text-secondary text-sm">
                        {conv.last_message.substring(0, 30)}...
                      </Text>
                    </View>
                    {conv.unread_count > 0 && (
                      <View className="bg-brand rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs">{conv.unread_count}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* Chat Thread */}
        <View className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              <View className="p-4 border-b border-gray-200 bg-white">
                <Text className="font-semibold text-text-primary">Chat</Text>
              </View>
              <ScrollView className="flex-1 p-4">
                {messages?.map((msg) => (
                  <View
                    key={msg.id}
                    className={`mb-3 p-3 rounded-lg max-w-md ${
                      msg.sender_id === user?.id
                        ? 'bg-brand self-end ml-auto'
                        : 'bg-white self-start'
                    }`}
                  >
                    <Text
                      className={
                        msg.sender_id === user?.id ? 'text-white' : 'text-text-primary'
                      }
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View className="p-4 bg-white border-t border-gray-200 flex flex-row gap-3">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-text-primary"
                  placeholder="Type a message..."
                  value={messageText}
                  onChangeText={setMessageText}
                />
                <Pressable
                  onPress={() => sendMessage.mutate(messageText)}
                  className="bg-brand px-6 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Send</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-muted">Select a conversation to start chatting</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Mobile: Stack navigation
  if (selectedConversation) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="p-4 border-b border-gray-200 bg-white flex flex-row items-center">
          <Pressable onPress={() => setSelectedConversation(null)} className="mr-3">
            <Text className="text-brand text-xl">←</Text>
          </Pressable>
          <Text className="font-semibold text-text-primary">Chat</Text>
        </View>
        <ScrollView className="flex-1 p-4">
          {messages?.map((msg) => (
            <View
              key={msg.id}
              className={`mb-3 p-3 rounded-lg ${
                msg.sender_id === user?.id ? 'bg-brand self-end ml-auto' : 'bg-white self-start'
              }`}
            >
              <Text className={msg.sender_id === user?.id ? 'text-white' : 'text-text-primary'}>
                {msg.content}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View className="p-4 bg-white border-t border-gray-200 flex flex-row gap-3">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-text-primary"
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
          />
          <Pressable
            onPress={() => sendMessage.mutate(messageText)}
            className="bg-brand px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Send</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-brand">Messages</Text>
      </View>
      {isLoading ? (
        <View className="p-4">
          <Text className="text-text-muted">Loading...</Text>
        </View>
      ) : conversations?.length === 0 ? (
        <View className="p-4">
          <Text className="text-text-muted">No conversations yet</Text>
        </View>
      ) : (
        conversations?.map((conv) => (
          <Pressable
            key={conv.id}
            onPress={() => setSelectedConversation(conv.id)}
            className="p-4 border-b border-gray-100"
          >
            <View className="flex flex-row items-center mb-2">
              <View className="w-12 h-12 bg-brand rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold text-lg">
                  {conv.other_user_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">{conv.other_user_name}</Text>
                <Text className="text-text-secondary text-sm">
                  {conv.last_message.substring(0, 40)}...
                </Text>
              </View>
              {conv.unread_count > 0 && (
                <View className="bg-brand rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-sm">{conv.unread_count}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
