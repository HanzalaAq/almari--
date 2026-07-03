'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Send, ArrowLeft, MessageCircle, Search, MessageSquare } from 'lucide-react';
import Image from 'next/image';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_photo: string | null;
  other_user_city: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  listing_id: string | null;
  listing_title: string | null;
  listing_image: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_photo: string | null;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const conversationId = searchParams.get('conversation');
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      fetchConversations(currentUser.id);
    };
    
    fetchUser();
  }, [supabase, router]);
  
  const fetchConversations = async (userId: string) => {
    // Fetch conversations with last message and unread count
    const { data, error } = await supabase
      .rpc('get_user_conversations', { user_id: userId });
    
    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [conversationId, conversations]);
  
  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', user.id);
    
    // Fetch messages
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      // Add sender info
      const messagesWithSender = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', msg.sender_id)
            .single();
          return {
            ...msg,
            sender_name: senderData?.name || 'Unknown',
            sender_photo: senderData?.photo_url,
          };
        })
      );
      setMessages(messagesWithSender);
    }
    
    // Subscribe to new messages
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: senderData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', newMsg.sender_id)
            .single();
          
          setMessages(prev => [
            ...prev,
            {
              ...newMsg,
              sender_name: senderData?.name || 'Unknown',
              sender_photo: senderData?.photo_url,
            },
          ]);
          
          // Refresh conversations to update last message
          fetchConversations(user.id);
        }
      )
      .subscribe();
    
    channelRef.current = channel;
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          read: false,
        });
      
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleStartConversation = async (listingId: string, sellerId: string) => {
    if (!user) return;
    
    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user_id.eq.${user.id},other_user_id.eq.${sellerId}),and(user_id.eq.${sellerId},other_user_id.eq.${user.id})`)
      .eq('listing_id', listingId)
      .single();
    
    if (existingConv) {
      router.push(`/messages?conversation=${existingConv.id}`);
      return;
    }
    
    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        other_user_id: sellerId,
        listing_id: listingId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
    } else if (newConv) {
      router.push(`/messages?conversation=${newConv.id}`);
    }
  };
  
  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listing_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-light">
          <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex">
            {/* Conversations List Skeleton */}
            <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-medium flex flex-col">
              <div className="p-4 border-b border-gray-medium">
                <Skeleton variant="text" className="h-6 w-32 mb-4" />
                <Skeleton variant="rectangular" className="h-10 w-full rounded-lg" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-gray-medium">
                    <div className="flex items-start gap-3">
                      <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" className="h-4 w-3/4" />
                        <Skeleton variant="text" className="h-3 w-1/2" />
                        <Skeleton variant="text" className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Area Skeleton */}
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <Skeleton variant="circular" className="w-16 h-16 mx-auto mb-4" />
                <Skeleton variant="text" className="h-6 w-48 mx-auto mb-2" />
                <Skeleton variant="text" className="h-4 w-64 mx-auto" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light">
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex">
        {/* Conversations List */}
        <div className={`${
          isMobile && selectedConversation ? 'hidden' : 'block'
        } w-full md:w-80 lg:w-96 bg-white border-r border-gray-medium flex flex-col`}>
          <div className="p-4 border-b border-gray-medium">
            <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-dark" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Start browsing to connect with sellers"
                  actionLabel="Browse Listings"
                  actionHref="/"
                />
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full min-h-[72px] p-4 border-b border-gray-medium hover:bg-gray-50 transition-fast text-left ${
                    selectedConversation?.id === conv.id ? 'bg-brand-light border-l-4 border-brand' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-light overflow-hidden flex-shrink-0">
                        {conv.other_user_photo ? (
                          <Image
                            src={conv.other_user_photo}
                            alt={conv.other_user_name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                            {conv.other_user_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-foreground truncate">{conv.other_user_name}</h3>
                        <span className="text-xs text-gray-dark">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </span>
                      </div>
                      {conv.listing_title && (
                        <p className="text-xs text-gray-dark truncate mb-1">{conv.listing_title}</p>
                      )}
                      <p className="text-sm text-gray-dark truncate">{conv.last_message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Chat Thread */}
        <div className={`${
          isMobile && !selectedConversation ? 'hidden' : 'block'
        } flex-1 flex flex-col bg-white`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-medium flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-gray-light rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-gray-light overflow-hidden">
                  {selectedConversation.other_user_photo ? (
                    <Image
                      src={selectedConversation.other_user_photo}
                      alt={selectedConversation.other_user_name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                      {selectedConversation.other_user_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{selectedConversation.other_user_name}</h2>
                  {selectedConversation.listing_title && (
                    <p className="text-sm text-gray-dark">{selectedConversation.listing_title}</p>
                  )}
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-dark py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] px-4 py-2 ${
                        msg.sender_id === user.id
                          ? 'ml-auto bg-brand text-white rounded-[18px_18px_4px_18px]'
                          : 'mr-auto bg-gray-100 text-text-primary rounded-[18px_18px_18px_4px]'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user.id ? 'text-orange-100' : 'text-gray-dark'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="sticky bottom-0 p-4 border-t border-gray-medium bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-dark mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
                <p className="text-gray-dark">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
