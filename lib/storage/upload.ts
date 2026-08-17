import { supabase } from '../supabase/client';
import * as ImageManipulator from 'expo-image-manipulator';

export async function convertToWebP(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { format: ImageManipulator.SaveFormat.WEBP, compress: 0.8 }
  );
  return result.uri;
}

export async function uploadListingImage(
  uri: string,
  userId: string,
  listingId: string,
  index: number
): Promise<string> {
  const webpUri = await convertToWebP(uri);
  
  const fileName = `listings/${userId}/${listingId}/${Date.now()}-${index}.webp`;
  
  const response = await fetch(webpUri);
  const blob = await response.blob();
  
  const { data, error } = await supabase.storage
    .from('almari-images')
    .upload(fileName, blob, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('almari-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function uploadProfileImage(
  uri: string,
  userId: string
): Promise<string> {
  const webpUri = await convertToWebP(uri);
  
  const fileName = `profiles/${userId}/${Date.now()}.webp`;
  
  const response = await fetch(webpUri);
  const blob = await response.blob();
  
  const { data, error } = await supabase.storage
    .from('almari-images')
    .upload(fileName, blob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('almari-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteImageFromStorage(url: string): Promise<void> {
  const bucketUrl = supabase.storage.from('almari-images').getPublicUrl('').data.publicUrl;
  const fileName = url.replace(bucketUrl, '');
  if (fileName) {
    await supabase.storage.from('almari-images').remove([fileName]);
  }
}
