import { View, Text, ScrollView, Pressable, Image, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  name: string;
  city: string;
  photo_url?: string;
  rating?: number;
  stats?: {
    listings_count: number;
    sold_count: number;
    rented_count: number;
    exchanged_count: number;
  };
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
  condition: string;
  category: string;
  size?: string;
  created_at: string;
}

export default function ProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user, profile, logout, setProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editPhoto, setEditPhoto] = useState<string | null>(profile?.photo_url || null);

  const isOwnProfile = !username || username === user?.id;
  const targetUserId = isOwnProfile ? user?.id : username;

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!targetUserId,
  });

  const { data: listings } = useQuery({
    queryKey: ['user-listings', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!targetUserId,
  });

  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      const total = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      return total * 0.9;
    },
    enabled: isOwnProfile && !!user?.id,
  });

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName,
          city: editCity,
          photo_url: editPhoto,
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({
        ...profile,
        name: editName,
        city: editCity,
        photo_url: editPhoto,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleWithdraw = () => {
    router.push('/orders');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditPhoto(result.assets[0].uri);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New': return '#10B981';
      case 'Like New': return '#34D399';
      case 'Good': return '#60A5FA';
      case 'Fair': return '#F59E0B';
      default: return '#9CA3AF';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const displayProfile = isOwnProfile ? profile : userProfile;

  if (!displayProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cover Banner */}
      <View style={styles.coverBanner} />
      
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {isEditing ? (
            <TouchableOpacity onPress={pickImage} style={styles.editAvatarButton}>
              {editPhoto ? (
                <Image source={{ uri: editPhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#8B9393" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder}>
              {displayProfile.photo_url ? (
                <Image source={{ uri: displayProfile.photo_url }} style={styles.avatar} cache="force-cache" />
              ) : (
                <Text style={styles.avatarText}>
                  {displayProfile.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput
              style={styles.editNameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
            />
          ) : (
            <Text style={styles.profileName}>{displayProfile.name}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.editCityInput}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City"
            />
          ) : (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#8B9393" />
              <Text style={styles.locationText}>{displayProfile.city}</Text>
            </View>
          )}

          {displayProfile.rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.ratingText}>{displayProfile.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {isOwnProfile ? (
          <View style={styles.actionButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={18} color="#090A0A" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    logout();
                    router.replace('/(auth)/login');
                  }}
                  style={styles.logoutButton}
                >
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <Link href={`/messages?user=${displayProfile.id}`} asChild>
            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      {/* Wallet (Own Profile Only) */}
      {isOwnProfile && (
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Ionicons name="wallet-outline" size={24} color="#FF7A1A" />
            <Text style={styles.walletTitle}>Wallet Balance</Text>
          </View>
          <Text style={styles.walletBalance}>
            PKR {walletBalance?.toLocaleString() || '0'}
          </Text>
          <TouchableOpacity onPress={handleWithdraw} style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>View sales</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {displayProfile.stats?.listings_count || listings?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {displayProfile.stats?.sold_count || 0}
            </Text>
            <Text style={styles.statLabel}>Sold</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {displayProfile.stats?.rented_count || 0}
            </Text>
            <Text style={styles.statLabel}>Rented</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {displayProfile.stats?.exchanged_count || 0}
            </Text>
            <Text style={styles.statLabel}>Exchanged</Text>
          </View>
        </View>
      </View>

      {/* Active Listings */}
      <View style={styles.listingsCard}>
        <Text style={styles.sectionTitle}>Active Listings</Text>
        {listings?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#8B9393" />
            <Text style={styles.emptyText}>No active listings</Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {listings?.map((item) => {
              const conditionColor = getConditionColor(item.condition);
              return (
                <Link key={item.id} href={`/listing/${item.id}`} asChild>
                  <TouchableOpacity style={styles.listingCard} activeOpacity={0.7}>
                    <View style={styles.listingImageContainer}>
                      <Image
                        source={{ uri: item.images[0] || 'https://via.placeholder.com/300x400' }}
                        style={styles.listingImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingPrice}>
                        PKR {item.price.toLocaleString()}
                      </Text>
                      <Text style={styles.listingTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.listingMeta}>
                        <View style={[styles.conditionBadge, { backgroundColor: conditionColor + '20' }]}>
                          <Text style={[styles.conditionText, { color: conditionColor }]}>
                            {item.condition}
                          </Text>
                        </View>
                        <Text style={styles.listingLocation}>
                          {item.city}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        )}
      </View>

      {isOwnProfile && (
        <Link href="/orders" asChild>
          <TouchableOpacity style={styles.orderHistoryButton}>
            <Ionicons name="receipt-outline" size={20} color="#090A0A" />
            <Text style={styles.orderHistoryText}>View Order History</Text>
            <Ionicons name="chevron-forward" size={20} color="#8B9393" />
          </TouchableOpacity>
        </Link>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B9393',
  },
  coverBanner: {
    height: 120,
    backgroundColor: '#FF7A1A',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatarContainer: {
    position: 'absolute',
    left: 16,
    top: 60,
  },
  editAvatarButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF7A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 112,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#090A0A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#8B9393',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#090A0A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF7A1A',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#090A0A',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    paddingVertical: 12,
  },
  editButtonText: {
    color: '#090A0A',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A1A',
    borderRadius: 20,
    paddingVertical: 12,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#090A0A',
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#090A0A',
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: '#FF7A1A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#090A0A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF7A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8B9393',
  },
  listingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B9393',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listingCard: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  listingImageContainer: {
    aspectRatio: 3/4,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingInfo: {
    padding: 12,
    gap: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#090A0A',
  },
  listingTitle: {
    fontSize: 14,
    color: '#090A0A',
    lineHeight: 18,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listingLocation: {
    fontSize: 12,
    color: '#8B9393',
  },
  orderHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  orderHistoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#090A0A',
    marginLeft: 12,
  },
  editNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#090A0A',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  editCityInput: {
    fontSize: 14,
    color: '#8B9393',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
});
