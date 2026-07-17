import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
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
  status: 'pending' | 'shipped' | 'delivered' | 'confirmed' | 'cancelled';
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
        query = query.in('status', ['pending', 'shipped', 'delivered']);
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'confirmed');
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

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      return;
    }
  };

  const renderOrderCard = (order: Order) => {
    const isSeller = user?.id === order.seller_id;
    const canMarkShipped = isSeller && order.status === 'pending';
    const canMarkReceived = !isSeller && order.status === 'shipped';
    const canConfirmReturn = !isSeller && order.type === 'rent' && order.status === 'delivered';

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
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
              onPress={() => updateOrderStatus(order.id, 'shipped')}
              className="flex-1 bg-brand rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Mark Shipped</Text>
            </Pressable>
          )}
          {canMarkReceived && (
            <Pressable
              onPress={() => updateOrderStatus(order.id, 'delivered')}
              className="flex-1 bg-brand rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Mark Received</Text>
            </Pressable>
          )}
          {canConfirmReturn && (
            <Pressable
              onPress={() => updateOrderStatus(order.id, 'confirmed')}
              className="flex-1 bg-green-500 rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Confirm Return</Text>
            </Pressable>
          )}
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

      {/* Admin Auto-Release Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <Pressable
          onPress={async () => {
            // Call the auto-release function
            const { error } = await supabase.rpc('process_auto_release');
            if (error) {
              console.error('Auto-release error:', error);
            } else {
              alert('Auto-release processed successfully');
            }
          }}
          className="bg-gray-800 rounded-lg py-3 items-center"
        >
          <Text className="text-white font-medium">Process Auto-Release (Admin)</Text>
        </Pressable>
      </View>
    </View>
  );
}
