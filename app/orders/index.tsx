import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';

interface Order {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string;
  seller_id: string;
  buyer_id: string;
  type: 'buy' | 'rent' | 'exchange';
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'cancelled' | 'refunded';
  total_amount: number;
  created_at: string;
  rental_start_date?: string;
  rental_end_date?: string;
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'rentals' | 'exchanges'>('active');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('orders')
        .select('*')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.in('status', ['pending_payment', 'paid', 'shipped', 'delivered', 'disputed']);
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'completed');
      } else if (activeTab === 'rentals') {
        query = query.eq('type', 'rent');
      } else if (activeTab === 'exchanges') {
        query = query.eq('type', 'exchange');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  const orderAction = async (orderId: string, action: 'ship' | 'received' | 'confirm' | 'cancel' | 'issue') => {
    const { error } = await supabase.rpc('order_action', {
      p_order_id: orderId,
      p_action: action,
      p_tracking_number: action === 'ship' ? `MANUAL-${orderId.slice(0, 8)}` : null,
      p_carrier: action === 'ship' ? 'manual' : null,
    });

    if (error) {
      Alert.alert('Could not update order', error.message);
      return;
    }
  };

  const renderOrderCard = (order: Order) => {
    const isSeller = user?.id === order.seller_id;
    const canMarkShipped = isSeller && order.status === 'paid';
    const canMarkReceived = !isSeller && order.status === 'shipped';
    const canConfirm = !isSeller && order.status === 'delivered';
    const canRaiseIssue = !isSeller && order.status === 'delivered';

    return (
      <View key={order.id} className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <View className="flex flex-row mb-3">
          <View className="w-20 h-20 bg-gray-200 rounded-lg mr-3" />
          <View className="flex-1">
            <Text className="font-semibold text-text-primary mb-1">{order.listing_title}</Text>
            <Text className="text-brand font-bold">PKR {order.total_amount.toLocaleString()}</Text>
            <Text className="text-text-secondary text-sm capitalize">{order.type}</Text>
          </View>
        </View>

        <View className="flex flex-row items-center justify-between mb-3">
          <View className={`px-3 py-1 rounded-full ${
            order.status === 'pending_payment' || order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
            order.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <Text className="text-sm font-medium capitalize">{order.status}</Text>
          </View>
          <Text className="text-text-muted text-sm">
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
        </View>

        {order.type === 'rent' && order.rental_start_date && (
          <View className="bg-gray-50 rounded-lg p-3 mb-3">
            <Text className="text-text-secondary text-sm">
              Rental: {new Date(order.rental_start_date).toLocaleDateString()} - {new Date(order.rental_end_date!).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View className="flex flex-row gap-2">
          {canMarkShipped && (
            <Pressable
              onPress={() => orderAction(order.id, 'ship')}
              className="flex-1 bg-brand rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Mark Shipped</Text>
            </Pressable>
          )}
          {canMarkReceived && (
            <Pressable
              onPress={() => orderAction(order.id, 'received')}
              className="flex-1 bg-brand rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Mark Received</Text>
            </Pressable>
          )}
          {canConfirm && (
            <Pressable
              onPress={() => orderAction(order.id, 'confirm')}
              className="flex-1 bg-green-500 rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Everything is OK</Text>
            </Pressable>
          )}
          {canRaiseIssue && <Pressable onPress={() => orderAction(order.id, 'issue')} className="flex-1 border border-red-500 rounded-lg py-2 items-center"><Text className="text-red-600 font-medium">I have an issue</Text></Pressable>}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-brand mb-4">Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['active', 'completed', 'rentals', 'exchanges'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`mr-3 px-4 py-2 rounded-full ${
                activeTab === tab ? 'bg-brand text-white' : 'bg-gray-100 text-text-primary'
              }`}
            >
              <Text className="font-medium capitalize">{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <Text className="text-text-muted">Loading...</Text>
          </View>
        ) : orders?.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-text-muted">No orders found</Text>
          </View>
        ) : (
          orders?.map(renderOrderCard)
        )}
      </ScrollView>

    </View>
  );
}
