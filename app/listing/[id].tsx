import { View, Text, ScrollView, Pressable, Image, Platform, Alert, TextInput, Modal, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore';
import { WebNavbar } from '../../components/layout/WebNavbar';
import { WebFooter } from '../../components/layout/WebFooter';

type Listing = { id: string; title: string; description?: string; price: number; images: string[]; city: string; condition: string; category: string; size?: string; brand?: string; is_rentable: boolean; rental_price_per_day?: number; is_exchangeable: boolean; user_id: string; created_at: string };
type Seller = { id: string; name?: string; city?: string; photo_url?: string; rating?: number };
const money = (amount: number) => `PKR ${Number(amount || 0).toLocaleString()}`;

const fallbackListingMap: Record<string, Listing> = {
  'fallback-1': {
    id: 'fallback-1',
    title: 'Floral Maxi Dress',
    description: 'A lightweight summer maxi dress with a flattering fit, ideal for casual outings and warm evenings.',
    price: 1800,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900'],
    city: 'Karachi',
    condition: 'Like New',
    category: 'Western',
    size: 'M',
    brand: 'Zara',
    is_rentable: true,
    rental_price_per_day: 80,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-2': {
    id: 'fallback-2',
    title: 'Embroidered Lawn Suit',
    description: 'Beautiful embroidered lawn suit with matching dupatta, worn once for a special occasion and in excellent condition.',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900'],
    city: 'Lahore',
    condition: 'New',
    category: 'Traditional',
    size: 'M',
    brand: 'Khaadi',
    is_rentable: true,
    rental_price_per_day: 150,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-3': {
    id: 'fallback-3',
    title: 'Classic White Shirt',
    description: 'Formal cotton white shirt with a crisp finish, easy to pair with tailored trousers or denim.',
    price: 1200,
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900'],
    city: 'Islamabad',
    condition: 'Good',
    category: 'Western',
    size: 'M',
    brand: 'Van Heusen',
    is_rentable: true,
    rental_price_per_day: 50,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-4': {
    id: 'fallback-4',
    title: 'Leather Handbag',
    description: 'Classic leather handbag in a rich brown tone with structured styling and plenty of everyday practicality.',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900'],
    city: 'Karachi',
    condition: 'Like New',
    category: 'Accessories',
    size: 'One Size',
    brand: 'Unknown',
    is_rentable: true,
    rental_price_per_day: 200,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-5': {
    id: 'fallback-5',
    title: 'Classic Blue Denim',
    description: 'Classic blue denim with a relaxed fit, perfect for everyday wear and easy to style with your favorite basics.',
    price: 2200,
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=900'],
    city: 'Lahore',
    condition: 'Good',
    category: 'Western',
    size: 'M',
    brand: 'Levis',
    is_rentable: true,
    rental_price_per_day: 100,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-6': {
    id: 'fallback-6',
    title: 'Cotton Kurti',
    description: 'Lightweight cotton kurti with an easy, breathable fit and a classic cut that works from day to evening.',
    price: 800,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900'],
    city: 'Karachi',
    condition: 'Good',
    category: 'Traditional',
    size: 'M',
    brand: 'Gul Ahmed',
    is_rentable: false,
    is_exchangeable: false,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-7': {
    id: 'fallback-7',
    title: 'Kids Sneakers',
    description: 'Comfortable kids sneakers in a playful design with cushioned support and easy everyday wear.',
    price: 1200,
    images: ['https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=900'],
    city: 'Islamabad',
    condition: 'Like New',
    category: 'Kids',
    size: '28',
    brand: 'Nike',
    is_rentable: false,
    is_exchangeable: false,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
  'fallback-8': {
    id: 'fallback-8',
    title: 'Formal Navy Blazer',
    description: 'Sharp navy blazer with structured tailoring and a refined finish for work events and special occasions.',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900'],
    city: 'Lahore',
    condition: 'Good',
    category: 'Men',
    size: 'L',
    brand: 'Raymond',
    is_rentable: true,
    rental_price_per_day: 180,
    is_exchangeable: true,
    user_id: 'sample-seller',
    created_at: new Date().toISOString(),
  },
};

const fallbackSeller: Seller = {
  id: 'sample-seller',
  name: 'Sample Seller',
  city: 'Karachi',
  photo_url: '',
  rating: 4.8,
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const { user } = useAuthStore(); const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore(); const { addItem } = useRecentlyViewedStore();
  const { width } = useWindowDimensions(); const compact = width < 860;
  const [imageIndex, setImageIndex] = useState(0); const [offerOpen, setOfferOpen] = useState(false); const [offer, setOffer] = useState(''); const [sending, setSending] = useState(false);
  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const fallbackListing = id ? fallbackListingMap[String(id)] ?? {
        id: String(id),
        title: 'Featured item',
        description: 'A pre-loved item that is ready for its next chapter.',
        price: 0,
        images: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'],
        city: 'Pakistan',
        condition: 'Good',
        category: 'Western',
        size: 'One Size',
        brand: 'Almari',
        is_rentable: false,
        is_exchangeable: true,
        user_id: 'sample-seller',
        created_at: new Date().toISOString(),
      } : undefined;
      const hasRealConfig = !!(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() && !(process.env.EXPO_PUBLIC_SUPABASE_URL || '').includes('your-project');

      if (!hasRealConfig) {
        return fallbackListing || null;
      }

      try {
        const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
        if (error) {
          return fallbackListing || null;
        }
        return data as Listing;
      } catch {
        return fallbackListing || null;
      }
    },
  });
  const { data: seller } = useQuery({
    queryKey: ['listing-seller', listing?.user_id],
    enabled: !!listing?.user_id,
    queryFn: async () => {
      const hasRealConfig = !!(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() && !(process.env.EXPO_PUBLIC_SUPABASE_URL || '').includes('your-project');
      if (!hasRealConfig || listing?.user_id === 'sample-seller') {
        return fallbackSeller;
      }

      try {
        const { data, error } = await supabase.from('users').select('id,name,city,photo_url,rating').eq('id', listing!.user_id).single();
        if (error) return fallbackSeller;
        return data as Seller;
      } catch {
        return fallbackSeller;
      }
    },
  });
  const { data: related = [] } = useQuery({
    queryKey: ['listing-related', listing?.category, id],
    enabled: !!listing?.category,
    queryFn: async () => {
      if (!listing) return [];

      const hasRealConfig = !!(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() && !(process.env.EXPO_PUBLIC_SUPABASE_URL || '').includes('your-project');
      if (!hasRealConfig) {
        return Object.values(fallbackListingMap)
          .filter((item) => item.category === listing.category && item.id !== listing.id)
          .slice(0, 4);
      }

      try {
        const { data, error } = await supabase.from('listings').select('id,title,price,images,city,condition').eq('status', 'active').eq('category', listing.category).neq('id', id).limit(4);
        if (error) return [];
        return data as Listing[];
      } catch {
        return [];
      }
    },
  });
  useEffect(() => { if (listing) addItem({ id: listing.id, title: listing.title, price: listing.price, image: listing.images?.[0] || '' }); }, [listing, addItem]);
  if (isLoading) return <View style={styles.loading}><Text style={styles.muted}>Loading item…</Text></View>;
  if (!listing) return <View style={styles.loading}><Text style={styles.muted}>This item is no longer available.</Text></View>;
  const own = user?.id === listing.user_id; const favourite = isFavorite(listing.id); const images = listing.images?.length ? listing.images : ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'];
  const requireLogin = (callback: () => void) => { if (!user) { Alert.alert('Sign in required', 'Sign in to continue with this item.'); router.push('/(auth)/login'); return; } callback(); };
  const sendOffer = async () => { const amount = Number(offer); if (!amount || amount <= 0 || amount >= listing.price) { Alert.alert('Enter a valid offer', `Your offer must be less than ${money(listing.price)}.`); return; } setSending(true); const { error } = await supabase.from('offers').insert({ listing_id: listing.id, buyer_id: user!.id, amount }); setSending(false); if (error) { Alert.alert('Could not send offer', error.message); return; } setOfferOpen(false); setOffer(''); Alert.alert('Offer sent', 'The seller will be notified.'); };
  return <View style={styles.screen}>{Platform.OS === 'web' && <WebNavbar />}<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <View style={styles.breadcrumb}><Link href="/" asChild><Pressable><Text style={styles.breadcrumbLink}>Home</Text></Pressable></Link><Ionicons name="chevron-forward" size={14} color="#849292" /><Link href={`/search?q=${encodeURIComponent(listing.category)}`} asChild><Pressable><Text style={styles.breadcrumbLink}>{listing.category}</Text></Pressable></Link><Ionicons name="chevron-forward" size={14} color="#849292" /><Text style={styles.breadcrumbCurrent} numberOfLines={1}>{listing.title}</Text></View>
    <View style={[styles.top, compact && styles.topCompact]}>
      <View style={styles.gallery}><View style={styles.mainImage}><Image source={{ uri: images[imageIndex] }} style={styles.image} resizeMode="contain" /><Pressable accessibilityRole="button" accessibilityLabel={favourite ? 'Remove from favourites' : 'Add to favourites'} onPress={() => favourite ? removeFavorite(listing.id) : addFavorite(listing.id)} style={styles.heart}><Ionicons name={favourite ? 'heart' : 'heart-outline'} color={favourite ? '#D64C5B' : '#1E3030'} size={22} /></Pressable>{images.length > 1 && <View style={styles.counter}><Text style={styles.counterText}>{imageIndex + 1}/{images.length}</Text></View>}</View>
        {images.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>{images.map((uri, index) => <Pressable key={`${uri}-${index}`} onPress={() => setImageIndex(index)} style={[styles.thumb, index === imageIndex && styles.thumbActive]}><Image source={{ uri }} style={styles.thumbImage} /></Pressable>)}</ScrollView>}
      </View>
      <View style={styles.panel}><View style={styles.titleRow}><View style={styles.titleCopy}><Text style={styles.price}>{money(listing.price)}</Text><Text style={styles.title}>{listing.title}</Text><Text style={styles.subtle}>{listing.brand ? `${listing.brand} · ` : ''}{listing.size || 'One size'} · {listing.condition}</Text></View></View>
        <View style={styles.details}><Detail label="Brand" value={listing.brand || 'Not specified'} /><Detail label="Size" value={listing.size || 'Not specified'} /><Detail label="Condition" value={listing.condition} /><Detail label="Location" value={listing.city} /></View>
        {!own ? <><Pressable onPress={() => requireLogin(() => router.push(`/listing/${listing.id}/buy`))} style={styles.buy}><Text style={styles.buyText}>Buy now · {money(listing.price)}</Text></Pressable><Pressable onPress={() => requireLogin(() => setOfferOpen(true))} style={styles.offer}><Text style={styles.offerText}>Make an offer</Text></Pressable><Pressable onPress={() => requireLogin(() => router.push(`/messages?user=${listing.user_id}`))} style={styles.message}><Ionicons name="chatbubble-outline" color="#007782" size={18} /><Text style={styles.messageText}>Ask seller</Text></Pressable></> : <Link href={`/listing/${listing.id}/edit`} asChild><Pressable style={styles.offer}><Text style={styles.offerText}>Edit your listing</Text></Pressable></Link>}
        <View style={styles.protection}><Ionicons name="shield-checkmark-outline" size={20} color="#007782" /><View style={styles.protectionCopy}><Text style={styles.protectionTitle}>Buyer Protection</Text><Text style={styles.protectionText}>Your payment stays protected until your order is delivered and checked.</Text></View></View>
      </View>
    </View>
    <View style={[styles.lower, compact && styles.lowerCompact]}><View style={styles.description}><Text style={styles.sectionTitle}>Item details</Text><Text style={styles.descriptionText}>{listing.description || 'The seller has not added a description for this item yet.'}</Text><Text style={styles.listed}>Listed {new Date(listing.created_at).toLocaleDateString()}</Text></View><View style={styles.sellerCard}><Text style={styles.sectionTitle}>Seller</Text><Link href={`/profile/${seller?.id || listing.user_id}`} asChild><Pressable style={styles.seller}><View style={styles.avatar}>{seller?.photo_url ? <Image source={{ uri: seller.photo_url }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{seller?.name?.[0]?.toUpperCase() || 'A'}</Text>}</View><View style={styles.sellerInfo}><Text style={styles.sellerName}>{seller?.name || 'Almari member'}</Text><Text style={styles.sellerMeta}>{seller?.city || listing.city}{seller?.rating ? ` · ★ ${Number(seller.rating).toFixed(1)}` : ''}</Text></View><Ionicons name="chevron-forward" color="#718080" size={18} /></Pressable></Link></View></View>
    {related.length > 0 && <View style={styles.related}><View style={styles.relatedHeader}><Text style={styles.sectionTitle}>More from this category</Text><Link href={`/search?q=${encodeURIComponent(listing.category)}`} asChild><Pressable><Text style={styles.seeAll}>See all</Text></Pressable></Link></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>{related.map(item => <Link key={item.id} href={`/listing/${item.id}`} asChild><Pressable style={styles.relatedCard}><Image source={{ uri: item.images?.[0] }} style={styles.relatedImage} /><Text style={styles.relatedPrice}>{money(item.price)}</Text><Text style={styles.relatedTitle} numberOfLines={1}>{item.title}</Text></Pressable></Link>)}</ScrollView></View>}
  </ScrollView><WebFooter /><Modal visible={offerOpen} transparent animationType="fade"><View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalTitle}>Make an offer</Text><Text style={styles.modalText}>The listing price is {money(listing.price)}.</Text><TextInput value={offer} onChangeText={setOffer} keyboardType="numeric" placeholder="Your offer in PKR" placeholderTextColor="#718080" style={styles.offerInput} /><View style={styles.modalActions}><Pressable onPress={() => setOfferOpen(false)} style={styles.modalCancel}><Text style={styles.offerText}>Cancel</Text></Pressable><Pressable disabled={sending} onPress={sendOffer} style={styles.modalSend}><Text style={styles.buyText}>{sending ? 'Sending…' : 'Send offer'}</Text></Pressable></View></View></View></Modal></View>;
}
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ screen:{flex:1,backgroundColor:'#F6F8F8'},scroll:{flex:1},content:{maxWidth:1240,width:'100%',alignSelf:'center',paddingHorizontal:20,paddingBottom:48},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F6F8F8'},muted:{color:'#718080'},breadcrumb:{height:52,flexDirection:'row',alignItems:'center',gap:5},breadcrumbLink:{fontSize:13,color:'#007782'},breadcrumbCurrent:{fontSize:13,color:'#718080',flex:1},top:{flexDirection:'row',gap:24,alignItems:'flex-start'},topCompact:{flexDirection:'column',gap:14},gallery:{flex:1,minWidth:0},mainImage:{width:'100%',height:560,backgroundColor:'#EAF0EF',borderRadius:10,overflow:'hidden',position:'relative'},image:{width:'100%',height:'100%'},heart:{position:'absolute',top:14,right:14,width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:'#fff',shadowColor:'#123',shadowOpacity:.13,shadowRadius:8,elevation:3},counter:{position:'absolute',bottom:13,right:13,backgroundColor:'rgba(18,38,38,.75)',borderRadius:16,paddingHorizontal:10,paddingVertical:5},counterText:{color:'#fff',fontSize:12,fontWeight:'700'},thumbs:{gap:9,paddingVertical:11},thumb:{height:68,width:54,borderRadius:6,overflow:'hidden',borderWidth:2,borderColor:'transparent'},thumbActive:{borderColor:'#007782'},thumbImage:{height:'100%',width:'100%'},panel:{width:380,backgroundColor:'#fff',borderWidth:1,borderColor:'#DFE9E8',borderRadius:10,padding:20},titleRow:{paddingBottom:16,borderBottomWidth:1,borderColor:'#E5EEEE'},titleCopy:{gap:5},price:{fontSize:23,fontWeight:'800',color:'#172525'},title:{fontSize:18,fontWeight:'700',color:'#263333',lineHeight:24},subtle:{color:'#718080',fontSize:14},details:{paddingVertical:13,gap:10},detail:{flexDirection:'row',justifyContent:'space-between'},detailLabel:{fontSize:14,color:'#718080'},detailValue:{fontSize:14,color:'#263333',fontWeight:'600',maxWidth:'58%',textAlign:'right'},buy:{backgroundColor:'#007782',borderRadius:7,paddingVertical:14,alignItems:'center',marginTop:5},buyText:{color:'#fff',fontWeight:'800',fontSize:15},offer:{borderWidth:1,borderColor:'#007782',borderRadius:7,paddingVertical:13,alignItems:'center',marginTop:10},offerText:{color:'#007782',fontWeight:'800',fontSize:14},message:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:7,paddingVertical:15},messageText:{color:'#007782',fontSize:14,fontWeight:'700'},protection:{flexDirection:'row',gap:9,borderTopWidth:1,borderColor:'#E5EEEE',paddingTop:15,marginTop:2},protectionCopy:{flex:1},protectionTitle:{fontSize:13,fontWeight:'800',color:'#263333'},protectionText:{fontSize:12,lineHeight:17,color:'#718080',marginTop:2},lower:{flexDirection:'row',gap:20,marginTop:20,alignItems:'flex-start'},lowerCompact:{flexDirection:'column'},description:{flex:1,backgroundColor:'#fff',borderRadius:10,borderWidth:1,borderColor:'#DFE9E8',padding:20,minHeight:145},sectionTitle:{fontSize:17,fontWeight:'800',color:'#263333'},descriptionText:{fontSize:14,lineHeight:21,color:'#405757',marginTop:12},listed:{fontSize:12,color:'#849292',marginTop:17},sellerCard:{width:380,backgroundColor:'#fff',borderRadius:10,borderWidth:1,borderColor:'#DFE9E8',padding:20},seller:{flexDirection:'row',alignItems:'center',marginTop:14},avatar:{width:43,height:43,borderRadius:22,backgroundColor:'#DDF1EE',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avatarText:{fontWeight:'800',color:'#007782'},sellerInfo:{flex:1,marginLeft:11},sellerName:{color:'#263333',fontWeight:'800',fontSize:14},sellerMeta:{color:'#718080',fontSize:12,marginTop:3},related:{marginTop:34},relatedHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},seeAll:{fontSize:14,fontWeight:'700',color:'#007782'},relatedRow:{gap:14,paddingRight:20},relatedCard:{width:158},relatedImage:{width:158,height:195,borderRadius:8,backgroundColor:'#EAF0EF'},relatedPrice:{fontSize:14,fontWeight:'800',color:'#263333',marginTop:8},relatedTitle:{fontSize:13,color:'#718080',marginTop:3},modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.45)',alignItems:'center',justifyContent:'center',padding:20},modal:{width:'100%',maxWidth:380,backgroundColor:'#fff',borderRadius:12,padding:22},modalTitle:{fontSize:20,fontWeight:'800',color:'#263333'},modalText:{fontSize:14,color:'#718080',marginTop:6},offerInput:{borderWidth:1,borderColor:'#C9D8D7',borderRadius:7,paddingHorizontal:13,paddingVertical:12,color:'#263333',fontSize:16,marginTop:18},modalActions:{flexDirection:'row',gap:10,marginTop:14},modalCancel:{flex:1,borderWidth:1,borderColor:'#007782',borderRadius:7,paddingVertical:12,alignItems:'center'},modalSend:{flex:1,backgroundColor:'#007782',borderRadius:7,paddingVertical:12,alignItems:'center'} });
