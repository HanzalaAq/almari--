import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationsStore } from '../../store/useNotificationsStore';

export function WebNavbar() {
  const { user, profile, logout } = useAuthStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < 880;

  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const search = () => {
    const q = query.trim();
    if (q) {
      router.push({ pathname: '/search', params: { q } });
      setQuery('');
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
        ],
      }}
      className="bg-white/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-md shadow-brand/5"
    >
      <View className="w-full px-6 py-3 flex-row items-center justify-between">
        {/* Logo */}
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-brand items-center justify-center shadow-sm shadow-brand/40">
              <Text className="text-white text-xl font-extrabold">a</Text>
            </View>
            <View>
              <Text className="text-2xl font-extrabold tracking-tight text-brand">almari</Text>
              <Text className="text-[10px] tracking-[2px] font-bold text-text-muted">RE-LOVED</Text>
            </View>
          </Pressable>
        </Link>

        {/* Search bar (center, hidden on compact) */}
        {!compact && (
          <View className="flex-1 max-w-[500px] mx-8">
            <View className="flex-row items-center bg-surface border border-border/60 rounded-full px-4 py-2.5 shadow-inner">
              <Ionicons name="search-outline" size={20} color="#647777" />
              <TextInput
                className="flex-1 ml-3 text-sm text-text-primary"
                placeholder="Search items, brands and styles"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={search}
                returnKeyType="search"
              />
              <Pressable
                onPress={search}
                className="bg-brand hover:bg-brand-hover rounded-full px-5 py-2 shadow-sm"
              >
                <Text className="text-white text-xs font-bold tracking-wide">Search</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Right side actions */}
        <View className="flex-row items-center gap-3">
          {user ? (
            <>
              <NavAction
                href="/search"
                icon="search-outline"
                label="Browse"
                compact={compact}
                active={pathname === '/search'}
              />
              <NavAction
                href="/sell"
                icon="add-circle-outline"
                label="Sell now"
                compact={compact}
                emphasize
                active={pathname === '/sell'}
              />

              {/* Notifications */}
              <Link href="/notifications" asChild>
                <HeaderButton active={pathname === '/notifications'}>
                  <View className="relative">
                    <Ionicons name="notifications-outline" size={22} color="#1D3030" />
                    {unreadCount > 0 && (
                      <View className="absolute -top-1.5 -right-1.5 bg-error rounded-full min-w-4 h-4 px-1 items-center justify-center">
                        <Text className="text-white text-[9px] font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!compact && (
                    <Text className="text-sm font-semibold text-text-primary">Alerts</Text>
                  )}
                </HeaderButton>
              </Link>

              <NavAction
                href="/messages"
                icon="chatbubble-outline"
                label="Messages"
                compact={compact}
                active={pathname === '/messages'}
              />

              {/* Profile / User menu */}
              <View className="relative">
                <Pressable
                  onPress={() => setMenuOpen(!menuOpen)}
                  className="flex-row items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface"
                >
                  <View className="w-8 h-8 rounded-full bg-brand-light items-center justify-center overflow-hidden">
                    {profile?.photo_url ? (
                      <Image
                        source={{ uri: profile.photo_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-brand font-bold text-sm">
                        {profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>
                  {!compact && (
                    <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                      {profile?.name || 'Profile'}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={14} color="#6B7280" />
                </Pressable>

                {/* Dropdown menu */}
                {menuOpen && (
                  <>
                    <Pressable
                      className="fixed inset-0"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                      onPress={() => setMenuOpen(false)}
                    />
                    <View
                      style={{ position: 'absolute', top: 44, right: 0, zIndex: 50 }}
                      className="bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px]"
                    >
                      <Link href="/profile" asChild>
                        <Pressable
                          onPress={() => setMenuOpen(false)}
                          className="flex-row items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                        >
                          <Ionicons name="person-outline" size={18} color="#4B5563" />
                          <Text className="text-sm font-semibold text-text-primary">My Profile</Text>
                        </Pressable>
                      </Link>
                      <Link href="/orders" asChild>
                        <Pressable
                          onPress={() => setMenuOpen(false)}
                          className="flex-row items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                        >
                          <Ionicons name="receipt-outline" size={18} color="#4B5563" />
                          <Text className="text-sm font-semibold text-text-primary">Orders</Text>
                        </Pressable>
                      </Link>
                      <Link href="/addresses" asChild>
                        <Pressable
                          onPress={() => setMenuOpen(false)}
                          className="flex-row items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                        >
                          <Ionicons name="location-outline" size={18} color="#4B5563" />
                          <Text className="text-sm font-semibold text-text-primary">Addresses</Text>
                        </Pressable>
                      </Link>
                      <View className="h-px bg-gray-200 my-1" />
                      <Pressable
                        onPress={handleLogout}
                        className="flex-row items-center gap-3 px-4 py-2.5 hover:bg-red-50"
                      >
                        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                        <Text className="text-sm font-semibold text-red-600">Sign Out</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </>
          ) : (
            <>
              <NavAction
                href="/search"
                icon="search-outline"
                label="Browse"
                compact={compact}
                active={pathname === '/search'}
              />
              <AuthAction label="Sign in" />
              <AuthAction label="Create account" primary />
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function NavAction({
  href,
  icon,
  label,
  compact,
  emphasize = false,
  active = false,
}: {
  href: any;
  icon: any;
  label: string;
  compact: boolean;
  emphasize?: boolean;
  active?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <HeaderButton emphasize={emphasize} active={active}>
        <Ionicons
          name={icon}
          size={22}
          color={emphasize ? '#fff' : active ? '#007782' : '#4B5563'}
        />
        {!compact && (
          <Text
            className={`text-sm font-bold ${
              emphasize ? 'text-white' : active ? 'text-brand' : 'text-text-primary'
            }`}
          >
            {label}
          </Text>
        )}
      </HeaderButton>
    </Link>
  );
}

function AuthAction({ label, primary = false }: { label: string; primary?: boolean }) {
  return (
    <Link href="/(auth)/login" asChild>
      <Pressable
        className={
          primary
            ? 'bg-brand rounded-full px-5 py-2.5 shadow-md shadow-brand/30 hover:bg-brand-hover'
            : 'px-4 py-2.5'
        }
      >
        <Text
          className={
            primary
              ? 'text-white text-sm font-extrabold'
              : 'text-brand text-sm font-extrabold'
          }
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function HeaderButton({
  children,
  emphasize = false,
  active = false,
  ...props
}: any) {
  const [hovered, setHovered] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: hovered ? 1.05 : 1,
      friction: 7,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [hovered, scale]);

  return (
    <Pressable
      {...props}
      onHoverIn={(event: any) => {
        setHovered(true);
        props.onHoverIn?.(event);
      }}
      onHoverOut={(event: any) => {
        setHovered(false);
        props.onHoverOut?.(event);
      }}
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className={`flex-row items-center gap-2 px-3.5 py-2 rounded-xl ${
          emphasize
            ? 'bg-brand shadow-md shadow-brand/30'
            : active
            ? 'bg-brand-light border border-brand/20'
            : 'bg-transparent'
        } ${hovered && !emphasize && !active ? 'bg-surface' : ''}`}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
