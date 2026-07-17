import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export function WebNavbar() {
  const { user, logout } = useAuthStore();

  return (
    <View className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
      <View className="w-full px-8 py-4">
        <View className="flex flex-row items-center justify-between w-full">
          {/* Left: Logo */}
          <Link href="/" asChild>
            <Pressable className="flex flex-row items-center gap-2 mr-auto">
              <View className="w-10 h-10 bg-gradient-to-r from-brand to-orange-600 rounded-xl items-center justify-center">
                <Text className="text-white text-xl font-bold">A</Text>
              </View>
              <Text className="text-2xl font-bold bg-gradient-to-r from-brand to-orange-600 bg-clip-text text-transparent">Almari</Text>
            </Pressable>
          </Link>

          {/* Right: Navigation Items */}
          <View className="flex flex-row items-center gap-6 ml-auto">
            <Link href="/" asChild>
              <Pressable className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex flex-row items-center gap-2">
                <Ionicons name="home-outline" size={20} color="#1A1A1A" />
                <Text className="text-text-primary font-medium">Home</Text>
              </Pressable>
            </Link>
            <Link href="/search" asChild>
              <Pressable className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex flex-row items-center gap-2">
                <Ionicons name="search-outline" size={20} color="#1A1A1A" />
                <Text className="text-text-primary font-medium">Explore</Text>
              </Pressable>
            </Link>
            {user ? (
              <>
                <Link href="/sell" asChild>
                  <Pressable className="px-4 py-2 bg-gradient-to-r from-brand to-orange-600 rounded-xl flex flex-row items-center gap-2">
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text className="text-white font-semibold">Sell Now</Text>
                  </Pressable>
                </Link>
                <Link href="/messages" asChild>
                  <Pressable className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex flex-row items-center gap-2">
                    <Ionicons name="chatbubble-outline" size={20} color="#1A1A1A" />
                    <Text className="text-text-primary font-medium">Messages</Text>
                  </Pressable>
                </Link>
                <Link href="/orders" asChild>
                  <Pressable className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex flex-row items-center gap-2">
                    <Ionicons name="receipt-outline" size={20} color="#1A1A1A" />
                    <Text className="text-text-primary font-medium">Orders</Text>
                  </Pressable>
                </Link>
                <Link href="/profile" asChild>
                  <Pressable className="w-10 h-10 bg-gradient-to-br from-brand to-orange-600 rounded-full items-center justify-center">
                    <Ionicons name="person" size={20} color="white" />
                  </Pressable>
                </Link>
              </>
            ) : (
              <Link href="/login" asChild>
                <Pressable className="px-6 py-2.5 bg-gradient-to-r from-brand to-orange-600 rounded-xl shadow-lg shadow-brand/30 flex flex-row items-center gap-2">
                  <Text className="text-white font-semibold">Get Started</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </Link>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
