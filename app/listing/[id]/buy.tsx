import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../store/useAuthStore';

type Listing = { id: string; title: string; price: number; user_id: string; status: string };
type Address = { id: string; full_name: string; street: string; city: string; province: string; is_default: boolean };
const buyerFee = (price: number) => Math.round((price * .05 + 70) * 100) / 100;

export default function BuyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { data: listing, isLoading } = useQuery({ queryKey: ['checkout-listing', id], queryFn: async () => { const { data, error } = await supabase.from('listings').select('id,title,price,user_id,status').eq('id', id).single(); if (error) throw error; return data as Listing; } });
  const { data: addresses = [] } = useQuery({ queryKey: ['checkout-addresses', user?.id], enabled: !!user?.id, queryFn: async () => { const { data, error } = await supabase.from('shipping_addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false }); if (error) throw error; return data as Address[]; } });
  const addressId = selectedAddress || addresses[0]?.id;
  const protection = listing ? buyerFee(Number(listing.price)) : 0;
  const shipping = 250;
  const total = listing ? Number(listing.price) + protection + shipping : 0;

  const checkout = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!addressId) { Alert.alert('Delivery address needed', 'Add a delivery address before checking out.', [{ text: 'Add address', onPress: () => router.push('/addresses') }, { text: 'Cancel', style: 'cancel' }]); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc('create_marketplace_order', { p_listing_id: id, p_address_id: addressId, p_shipping_method: 'standard', p_shipping_fee: shipping });
    setLoading(false);
    if (error) { Alert.alert('Checkout unavailable', error.message); return; }
    Alert.alert('Order reserved', 'Your order is protected. Connect your payment provider to capture the payment, then track delivery from Orders.', [{ text: 'View order', onPress: () => router.replace('/orders') }]);
  };

  if (isLoading || !listing) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#007782" /></View>;
  return <ScrollView className="flex-1 bg-white"><View className="p-6 max-w-2xl w-full self-center"><Text className="text-2xl font-bold text-text-primary">Checkout</Text><Text className="text-text-secondary mt-1 mb-6">Review your delivery and protected payment.</Text>
    <View className="bg-surface rounded-xl p-4 mb-5"><Text className="font-bold text-text-primary mb-3">Order summary</Text><Row label={listing.title} value={`PKR ${Number(listing.price).toLocaleString()}`} /><Row label="Buyer Protection" value={`PKR ${protection.toLocaleString()}`} /><Row label="Standard delivery" value={`PKR ${shipping.toLocaleString()}`} /><View className="border-t border-border mt-3 pt-3"><Row label="Total" value={`PKR ${total.toLocaleString()}`} strong /></View></View>
    <Text className="font-bold text-text-primary mb-2">Delivery address</Text>{addresses.length ? <><Pressable onPress={() => router.push('/addresses')} className="mb-2"><Text className="text-brand font-semibold">Manage addresses</Text></Pressable>{addresses.map(address => <Pressable key={address.id} onPress={() => setSelectedAddress(address.id)} className={`p-4 rounded-xl border mb-2 ${addressId === address.id ? 'border-brand bg-brand-light' : 'border-border bg-white'}`}><Text className="font-semibold text-text-primary">{address.full_name}</Text><Text className="text-text-secondary text-sm mt-1">{address.street}, {address.city}, {address.province}</Text></Pressable>)}</> : <Pressable onPress={() => router.push('/addresses')} className="p-4 rounded-xl border border-dashed border-brand mb-5"><Text className="text-brand font-semibold">Add a delivery address</Text></Pressable>}
    <View className="bg-brand-light rounded-xl p-4 mt-3 mb-5"><Text className="font-bold text-brand mb-1">Buyer Protection included</Text><Text className="text-text-secondary text-sm leading-5">Payment is held until delivery. If an item is damaged, missing, or significantly not as described, report an issue within 2 days of delivery.</Text></View>
    <Pressable onPress={checkout} disabled={loading || !addressId} className={`rounded-full py-4 items-center ${loading || !addressId ? 'bg-gray-300' : 'bg-brand'}`}><Text className="text-white font-bold text-base">{loading ? 'Creating protected order…' : `Continue to payment · PKR ${total.toLocaleString()}`}</Text></Pressable><Pressable onPress={() => router.back()} className="py-4 items-center"><Text className="text-text-secondary">Cancel</Text></Pressable>
  </View></ScrollView>;
}
function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <View className="flex-row justify-between mb-2"><Text className={strong ? 'font-bold text-text-primary' : 'text-text-secondary'} numberOfLines={1}>{label}</Text><Text className={strong ? 'font-bold text-text-primary' : 'text-text-secondary'}>{value}</Text></View>; }
