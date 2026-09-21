import { View, Text, ScrollView, Pressable, Image, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { user, profile, logout, setProfile, isAuthLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editPhoto, setEditPhoto] = useState<string | null>(profile?.photo_url || null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingListing, setIsDeletingListing] = useState(false);

  const confirmDeleteListing = async () => {
    if (!deleteTarget) return;
    setIsDeletingListing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Sign in required', 'Please sign in to delete this ad.');
        return;
      }
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['user-listings', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['home-listings'] });
      queryClient.invalidateQueries({ queryKey: ['catalogue'] });
      queryClient.invalidateQueries({ queryKey: ['listing', deleteTarget.id] });
      setDeleteTarget(null);
      Alert.alert('Deleted', 'Your ad has been deleted.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not delete ad');
    } finally {
      setIsDeletingListing(false);
    }
  };

  const isOwnProfile = !username || username === user?.id;
  const targetUserId = isOwnProfile ? user?.id : username;

  const { data: userProfile, isLoading, isError, refetch } = useQuery({
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
        .eq('status', 'completed');

      if (error) throw error;
      const total = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      return total * 0.9;
    },
    enabled: isOwnProfile && !!user?.id,
  });

  // Compute stats from actual data
  const { data: soldCount } = useQuery({
    queryKey: ['user-sold-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', targetUserId)
        .eq('status', 'completed');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!targetUserId,
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
        id: profile?.id || user?.id || '',
        name: editName,
        city: editCity,
        photo_url: editPhoto,
      });
      setIsEditing(false);
      // Invalidate profile cache so it refetches
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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

  // Route protection for own profile (must be called after all hooks)
  if (isOwnProfile && !isAuthLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007782" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>Could not load profile</Text>
        <Pressable onPress={() => refetch()} style={{ backgroundColor: '#007782', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const displayProfile = isOwnProfile ? (userProfile || profile) : userProfile;

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
                <Image source={{ uri: displayProfile.photo_url }} style={styles.avatar} />
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
                  onPress={async () => {
                    await logout();
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
              {listings?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {soldCount || 0}
            </Text>
            <Text style={styles.statLabel}>Sold</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              0
            </Text>
            <Text style={styles.statLabel}>Rented</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              0
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
                <View key={item.id} style={{ position: 'relative' }}>
                  <Link href={`/listing/${item.id}`} asChild>
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

                  {isOwnProfile && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setDeleteTarget({ id: item.id, title: item.title });
                      }}
                      style={styles.cardDeleteBtn}
                      accessibilityLabel="Delete listing"
                    >
                      <Ionicons name="trash-outline" size={15} color="#D64C5B" />
                    </TouchableOpacity>
                  )}
                </View>
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

      {/* Delete Listing Confirmation Modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="trash-outline" size={24} color="#D64C5B" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete this ad?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={styles.deleteCancelBtn}
                disabled={isDeletingListing}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteListing}
                style={styles.deleteConfirmBtn}
                disabled={isDeletingListing}
              >
                {isDeletingListing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  coverBanner: {
    height: 160,
    backgroundColor: '#007782',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#007782',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  profileHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: -60,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarContainer: {
    position: 'absolute',
    left: '50%',
    top: -50,
    transform: [{ translateX: -50 }],
  },
  editAvatarButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#009494',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007782',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#007782',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 14,
  },
  editButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 14,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007782',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#007782',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -1,
  },
  withdrawButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#007782',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  listingsCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listingCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  listingImageContainer: {
    aspectRatio: 3/4,
    backgroundColor: '#F3F4F6',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingInfo: {
    padding: 14,
    gap: 6,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listingLocation: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  orderHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHistoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  editNameInput: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007782',
    textAlign: 'center',
    minWidth: 150,
  },
  editCityInput: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
    borderBottomWidth: 2,
    borderBottomColor: '#007782',
    textAlign: 'center',
    minWidth: 120,
  },
  cardDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FDE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  deleteModalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteCancelText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
