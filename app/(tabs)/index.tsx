import { View, Text, ScrollView, Pressable, Image, Platform, TextInput, StyleSheet, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useCallback, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase/client';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { WebFooter } from '../../components/layout/WebFooter';

type Listing = { id: string; title: string; price: number; images: string[]; city: string; condition: string; category: string; size?: string; brand?: string; created_at: string; is_rentable: boolean; users?: { name?: string; photo_url?: string } };

const CATEGORIES = [
  { name: 'Women', icon: 'woman-outline' as const }, { name: 'Men', icon: 'man-outline' as const },
  { name: 'Kids', icon: 'teddy-bear' as const, material: true }, { name: 'Traditional', icon: 'shirt-outline' as const },
  { name: 'Western', icon: 'sparkles-outline' as const }, { name: 'Accessories', icon: 'diamond-outline' as const },
];

const formatPrice = (price: number) => `PKR ${Number(price || 0).toLocaleString()}`;

const fallbackListings: Listing[] = [
  {
    id: 'fallback-1',
    title: 'Floral Maxi Dress',
    price: 1800,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
    city: 'Karachi',
    condition: 'Like New',
    category: 'Western',
    size: 'M',
    brand: 'Zara',
    created_at: new Date().toISOString(),
    is_rentable: true,
    users: { name: 'Sample Seller', photo_url: '' },
  },
  {
    id: 'fallback-2',
    title: 'Embroidered Lawn Suit',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
    city: 'Lahore',
    condition: 'New',
    category: 'Traditional',
    size: 'M',
    brand: 'Khaadi',
    created_at: new Date().toISOString(),
    is_rentable: true,
    users: { name: 'Sample Seller', photo_url: '' },
  },
  {
    id: 'fallback-3',
    title: 'Classic White Shirt',
    price: 1200,
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
    city: 'Islamabad',
    condition: 'Good',
    category: 'Western',
    size: 'M',
    brand: 'Van Heusen',
    created_at: new Date().toISOString(),
    is_rentable: true,
    users: { name: 'Sample Seller', photo_url: '' },
  },
  {
    id: 'fallback-4',
    title: 'Leather Handbag',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
    city: 'Karachi',
    condition: 'Like New',
    category: 'Accessories',
    size: 'One Size',
    brand: 'Unknown',
    created_at: new Date().toISOString(),
    is_rentable: true,
    users: { name: 'Sample Seller', photo_url: '' },
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addItem } = useRecentlyViewedStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isCompact = width < 740;

  const { data: listings = fallbackListings, isLoading, refetch } = useQuery({
    queryKey: ['home-listings', selectedCategory],
    queryFn: async () => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const useFallback = !supabaseUrl || supabaseUrl.includes('your-project');

      if (useFallback) {
        return selectedCategory === 'All'
          ? fallbackListings
          : fallbackListings.filter((item) => item.category === selectedCategory);
      }

      try {
        let query = supabase.from('listings').select('*, users!listings_user_id_fkey(name, photo_url)').eq('status', 'active').order('created_at', { ascending: false }).limit(48);
        if (selectedCategory !== 'All') query = query.eq('category', selectedCategory);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as Listing[];
      } catch (error) {
        return selectedCategory === 'All'
          ? fallbackListings
          : fallbackListings.filter((item) => item.category === selectedCategory);
      }
    },
  });

  const search = () => router.push({ pathname: '/search', params: searchQuery.trim() ? { q: searchQuery.trim() } : {} });
  const openListing = useCallback((item: Listing) => addItem({ id: item.id, title: item.title, price: item.price, image: item.images?.[0] || '' }), [addItem]);
  const isMobile = Platform.OS !== 'web';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#007782" />}>
      <View style={[styles.hero, isCompact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <View style={styles.eyebrow}><Ionicons name="leaf-outline" size={15} color="#00626B" /><Text style={styles.eyebrowText}>PRE-LOVED, RELOVED</Text></View>
          <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>Your next favourite{`\n`}thing is already here.</Text>
          <Text style={styles.heroText}>Discover unique fashion from people nearby. Buy better, sell simply, and keep great clothes in circulation.</Text>
          <View style={styles.heroActions}>
            <Pressable onPress={() => router.push('/search')} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Start exploring</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable>
            <Pressable onPress={() => router.push('/sell')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sell an item</Text></Pressable>
          </View>
          <View style={styles.trustRow}><Ionicons name="shield-checkmark-outline" size={17} color="#00626B" /><Text style={styles.trustText}>Secure payments · Buyer protection · Local sellers</Text></View>
        </View>
        {!isCompact && !isMobile && <View style={styles.heroArt}>
          <View style={[styles.orb, styles.orbOne]} /><View style={[styles.orb, styles.orbTwo]} />
          <View style={styles.heroCard}><Text style={styles.heroCardTag}>JUST LISTED</Text><Text style={styles.heroCardTitle}>Make space for{`\n`}something new</Text><Text style={styles.heroCardPrice}>Fashion, re-circulated</Text></View>
          <View style={styles.heroFashionIcon}><MaterialCommunityIcons name="hanger" size={86} color="#007782" /></View>
        </View>}
      </View>

      <View style={styles.searchWrap}><Ionicons name="search-outline" size={21} color="#5C6363" /><TextInput style={styles.searchInput} placeholder="Search for brands, styles, and more" placeholderTextColor="#718080" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={search} returnKeyType="search" /><Pressable onPress={search} style={styles.searchButton}><Text style={styles.searchButtonText}>Search</Text></Pressable></View>

      <View style={[styles.section, isCompact && styles.sectionCompact]}><View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Shop by category</Text><Text style={styles.sectionSubtitle}>Find exactly what you’re looking for</Text></View><Link href="/search" asChild><Pressable><Text style={styles.linkText}>See all</Text></Pressable></Link></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <TouchableOpacity onPress={() => setSelectedCategory('All')} style={[styles.category, selectedCategory === 'All' && styles.categoryActive]}><View style={styles.categoryIcon}><Ionicons name="grid-outline" size={22} color={selectedCategory === 'All' ? '#fff' : '#007782'} /></View><Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>All items</Text></TouchableOpacity>
          {CATEGORIES.map((category) => <TouchableOpacity key={category.name} onPress={() => setSelectedCategory(category.name)} style={[styles.category, selectedCategory === category.name && styles.categoryActive]}><View style={styles.categoryIcon}>{category.material ? <MaterialCommunityIcons name={category.icon as any} size={22} color={selectedCategory === category.name ? '#fff' : '#007782'} /> : <Ionicons name={category.icon as any} size={22} color={selectedCategory === category.name ? '#fff' : '#007782'} />}</View><Text style={[styles.categoryText, selectedCategory === category.name && styles.categoryTextActive]}>{category.name}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>

      <View style={[styles.benefits, isCompact && styles.benefitsCompact]}><View style={styles.benefit}><Ionicons name="pricetag-outline" size={23} color="#007782" /><View><Text style={styles.benefitTitle}>No listing fees</Text><Text style={styles.benefitText}>Put your wardrobe to work</Text></View></View><View style={styles.benefit}><Ionicons name="shield-checkmark-outline" size={23} color="#007782" /><View><Text style={styles.benefitTitle}>Protected payments</Text><Text style={styles.benefitText}>Shop with confidence</Text></View></View><View style={styles.benefit}><Ionicons name="leaf-outline" size={23} color="#007782" /><View><Text style={styles.benefitTitle}>Better for the planet</Text><Text style={styles.benefitText}>Give clothes another life</Text></View></View></View>

      <View style={[styles.section, isCompact && styles.sectionCompact]}><View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>{selectedCategory === 'All' ? 'Fresh from the community' : `${selectedCategory} picks`}</Text><Text style={styles.sectionSubtitle}>Newly listed pieces, ready for their next chapter</Text></View><Link href="/search" asChild><Pressable><Text style={styles.linkText}>View catalogue</Text></Pressable></Link></View>
        {isLoading ? <View style={styles.grid}>{Array.from({ length: 8 }).map((_, i) => <View key={i} style={[styles.skeleton, isCompact && styles.cardCompact]} />)}</View> : listings.length === 0 ? <View style={styles.empty}><Ionicons name="search-outline" size={36} color="#718080" /><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>Try another category or be the first to list an item.</Text></View> : <View style={styles.grid}>{listings.map(item => { const favorite = isFavorite(item.id); return <Link key={item.id} href={`/listing/${item.id}`} asChild><TouchableOpacity style={StyleSheet.flatten([styles.card, isCompact && styles.cardCompact])} onPress={() => openListing(item)} activeOpacity={0.82}><View style={styles.imageWrap}><Image style={styles.image} source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80' }} /><Pressable accessibilityRole="button" accessibilityLabel={favorite ? `Remove ${item.title} from favourites` : `Add ${item.title} to favourites`} onPress={(event: any) => { event.stopPropagation?.(); favorite ? removeFavorite(item.id) : addFavorite(item.id); }} style={styles.heart}><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={19} color={favorite ? '#D64C5B' : '#263333'} /></Pressable>{item.is_rentable && <View style={styles.rent}><Text style={styles.rentText}>RENT</Text></View>}</View><View style={styles.cardInfo}><Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.cardMeta} numberOfLines={1}>{[item.brand, item.size, item.condition].filter(Boolean).join(' · ') || item.condition}</Text><Text style={styles.price}>{formatPrice(item.price)}</Text><Text style={styles.location} numberOfLines={1}>{item.city || 'Pakistan'}</Text></View></TouchableOpacity></Link>; })}</View>}
        {listings.length > 0 && !isLoading && <Link href="/search" asChild><Pressable accessibilityRole="button" style={styles.seeMore}><Text style={styles.seeMoreText}>See more items</Text><Ionicons name="arrow-forward" size={17} color="#007782" /></Pressable></Link>}
      </View><WebFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9F9' }, pageContent: { paddingBottom: 52 }, hero: { maxWidth: 1280, width: '100%', alignSelf: 'center', minHeight: 356, paddingHorizontal: 44, paddingVertical: 48, backgroundColor: '#DDF1EE', flexDirection: 'row', overflow: 'hidden' }, heroCompact: { minHeight: 0, paddingHorizontal: 24, paddingVertical: 36 }, heroCopy: { flex: 1, maxWidth: 630, zIndex: 2 }, eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }, eyebrowText: { fontSize: 11, letterSpacing: 1.2, fontWeight: '800', color: '#00626B' }, heroTitle: { color: '#073B3F', fontSize: 42, lineHeight: 48, fontWeight: '800', letterSpacing: -1.3 }, heroTitleCompact: { fontSize: 32, lineHeight: 38, letterSpacing: -.7 }, heroText: { maxWidth: 530, fontSize: 16, lineHeight: 24, color: '#34585A', marginTop: 16 }, heroActions: { flexDirection: 'row', gap: 12, marginTop: 25, flexWrap: 'wrap' }, primaryButton: { backgroundColor: '#007782', borderRadius: 7, paddingVertical: 13, paddingHorizontal: 19, flexDirection: 'row', gap: 9, alignItems: 'center' }, primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 }, secondaryButton: { borderWidth: 1, borderColor: '#007782', borderRadius: 7, paddingVertical: 12, paddingHorizontal: 19 }, secondaryButtonText: { color: '#00626B', fontWeight: '700', fontSize: 15 }, trustRow: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 28 }, trustText: { fontSize: 12, color: '#497072', flexShrink: 1 }, heroArt: { width: 410, position: 'relative', justifyContent: 'center', alignItems: 'center' }, orb: { position: 'absolute', borderRadius: 999 }, orbOne: { height: 310, width: 310, backgroundColor: '#BEE3DD', right: 8, top: -28 }, orbTwo: { height: 170, width: 170, backgroundColor: '#F6D9B7', right: 230, bottom: -55 }, heroCard: { backgroundColor: '#fff', borderRadius: 12, width: 220, padding: 22, zIndex: 2, shadowColor: '#174B4C', shadowOpacity: 0.13, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, heroCardTag: { color: '#007782', fontWeight: '800', letterSpacing: 1.1, fontSize: 10 }, heroCardTitle: { color: '#173E40', fontSize: 22, lineHeight: 27, fontWeight: '800', marginTop: 16 }, heroCardPrice: { color: '#6D8384', fontSize: 12, marginTop: 16 }, heroFashionIcon: { position: 'absolute', right: 35, top: 81, zIndex: 3 }, searchWrap: { maxWidth: 920, width: '90%', alignSelf: 'center', backgroundColor: '#fff', marginTop: -23, minHeight: 57, borderRadius: 8, paddingLeft: 17, paddingRight: 6, alignItems: 'center', flexDirection: 'row', shadowColor: '#123', shadowOpacity: .11, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, searchInput: { flex: 1, marginLeft: 11, fontSize: 15, color: '#172525', minWidth: 80 }, searchButton: { backgroundColor: '#007782', borderRadius: 6, paddingHorizontal: 22, paddingVertical: 12 }, searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 }, section: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 20, marginTop: 42 }, sectionCompact: { paddingHorizontal: 14, marginTop: 32 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }, sectionTitle: { fontSize: 25, color: '#172525', fontWeight: '800', letterSpacing: -.4 }, sectionTitleCompact: { fontSize: 21 }, sectionSubtitle: { color: '#688080', fontSize: 14, marginTop: 4 }, linkText: { color: '#007782', fontWeight: '700', fontSize: 14 }, categoryRow: { gap: 12, paddingRight: 20 }, category: { minWidth: 112, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCE7E6' }, categoryActive: { backgroundColor: '#007782', borderColor: '#007782' }, categoryIcon: { height: 29, justifyContent: 'center' }, categoryText: { fontSize: 13, color: '#34585A', fontWeight: '700', marginTop: 5 }, categoryTextActive: { color: '#fff' }, benefits: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E0EBEA', marginTop: 44, paddingVertical: 22, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', gap: 72, flexWrap: 'wrap' }, benefitsCompact: { justifyContent: 'flex-start', gap: 20, paddingVertical: 20 }, benefit: { flexDirection: 'row', gap: 11, alignItems: 'center' }, benefitTitle: { fontWeight: '800', color: '#1B3334', fontSize: 14 }, benefitText: { color: '#708282', fontSize: 12, marginTop: 2 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, card: { width: Platform.OS === 'web' ? '23.8%' : '47.8%', minWidth: Platform.OS === 'web' ? 200 : undefined, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E3EDEC' }, cardCompact: { width: '47.7%', minWidth: undefined }, imageWrap: { aspectRatio: .79, backgroundColor: '#EAF0EF', position: 'relative' }, image: { width: '100%', height: '100%' }, heart: { position: 'absolute', top: 9, right: 9, height: 34, width: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center' }, rent: { position: 'absolute', bottom: 8, left: 8, backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }, rentText: { color: '#00626B', fontSize: 9, letterSpacing: .6, fontWeight: '800' }, cardInfo: { padding: 11 }, cardTitle: { color: '#263333', fontSize: 14, fontWeight: '700' }, cardMeta: { color: '#718080', fontSize: 12, marginTop: 4 }, price: { color: '#172525', fontSize: 15, fontWeight: '800', marginTop: 8 }, location: { color: '#718080', fontSize: 12, marginTop: 4 }, skeleton: { width: Platform.OS === 'web' ? '23.8%' : '47.8%', aspectRatio: .73, borderRadius: 8, backgroundColor: '#E6EFEE' }, empty: { paddingVertical: 64, alignItems: 'center', backgroundColor: '#fff', borderRadius: 8 }, emptyTitle: { fontWeight: '800', fontSize: 17, color: '#263333', marginTop: 10 }, emptyText: { color: '#718080', marginTop: 5, fontSize: 13 }, seeMore: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#007782', borderRadius: 7, paddingHorizontal: 21, paddingVertical: 13, marginTop: 28 }, seeMoreText: { fontSize: 14, fontWeight: '800', color: '#007782' },
});
