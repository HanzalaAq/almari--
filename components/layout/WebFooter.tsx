import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';

export function WebFooter() {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return null;
  const compact = width < 700;
  return <View style={[styles.footer, compact && styles.footerCompact]}>
    <View style={[styles.inner, compact && styles.innerCompact]}>
      <View style={styles.brand}><Text style={styles.logo}>almari</Text><Text style={styles.tagline}>Fashion deserves another life.</Text></View>
      <View style={styles.links}>
        <FooterLink href="/search" label="Browse" /><FooterLink href="/sell" label="Sell an item" />
        <FooterLink href="/orders" label="Orders" /><FooterLink href="/profile" label="My profile" />
      </View>
    </View>
    <View style={[styles.inner, styles.bottom, compact && styles.innerCompact]}><Text style={styles.copy}>© {new Date().getFullYear()} Almari · Buy and sell pre-loved.</Text><Text style={styles.safe}>Protected marketplace</Text></View>
  </View>;
}
function FooterLink({ href, label }: { href: any; label: string }) { return <Link href={href} asChild><Pressable><Text style={styles.link}>{label}</Text></Pressable></Link>; }
const styles = StyleSheet.create({ footer:{backgroundColor:'#173E40',marginTop:52,paddingHorizontal:20,paddingTop:34,paddingBottom:20},footerCompact:{marginTop:34,paddingTop:27},inner:{maxWidth:1200,width:'100%',alignSelf:'center',flexDirection:'row',justifyContent:'space-between',gap:20},innerCompact:{flexDirection:'column',alignItems:'flex-start',gap:16},brand:{gap:6},logo:{color:'#fff',fontSize:24,fontWeight:'800',letterSpacing:-.6},tagline:{color:'#BBD2D1',fontSize:13},links:{flexDirection:'row',gap:23,alignItems:'center',flexWrap:'wrap'},link:{color:'#fff',fontSize:13,fontWeight:'700'},bottom:{borderTopWidth:1,borderColor:'#31585A',paddingTop:19,marginTop:28},copy:{color:'#A3C0BF',fontSize:12},safe:{color:'#A3C0BF',fontSize:12,fontWeight:'700'} });
