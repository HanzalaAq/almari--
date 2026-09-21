import { supabase } from '../supabase/client';
import * as ImageManipulator from 'expo-image-manipulator';

export async function convertToWebP(uri: string): Promise<{ uri: string; base64?: string }> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { format: ImageManipulator.SaveFormat.WEBP, compress: 0.8, base64: true }
    );
    return { uri: result.uri, base64: result.base64 };
  } catch (err) {
    console.warn('[Storage] Image manipulation failed, using original URI:', err);
    return { uri };
  }
}

export async function uploadListingImage(
  uri: string,
  userId: string,
  listingId: string,
  index: number
): Promise<string> {
  // If already a remote CDN URL and not a local blob/file/localhost, keep it
  if (
    (uri.startsWith('http://') || uri.startsWith('https://')) &&
    !uri.startsWith('blob:') &&
    !uri.includes('localhost')
  ) {
    return uri;
  }

  const { uri: processedUri, base64 } = await convertToWebP(uri);
  const fileName = `listings/${userId}/${listingId}/${Date.now()}-${index}.webp`;

  try {
    const response = await fetch(processedUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('almari-images')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] Supabase storage upload failed:', error.message);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('almari-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (storageError: any) {
    console.warn(
      '[Storage] Falling back to base64 data URI for listing image due to storage error:',
      storageError?.message || storageError
    );

    // Fallback to compressed base64 data URL so photos are NOT lost if storage RLS is pending
    if (base64) {
      return `data:image/webp;base64,${base64}`;
    }

    try {
      const response = await fetch(processedUri);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fallbackErr) {
      console.error('[Storage] All upload and fallback methods failed:', fallbackErr);
      throw storageError;
    }
  }
}

export async function uploadProfileImage(
  uri: string,
  userId: string
): Promise<string> {
  if (
    (uri.startsWith('http://') || uri.startsWith('https://')) &&
    !uri.startsWith('blob:') &&
    !uri.includes('localhost')
  ) {
    return uri;
  }

  const { uri: processedUri, base64 } = await convertToWebP(uri);
  const fileName = `profiles/${userId}/${Date.now()}.webp`;

  try {
    const response = await fetch(processedUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('almari-images')
      .upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] Profile upload error:', error.message);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('almari-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (storageError: any) {
    console.warn(
      '[Storage] Falling back to base64 data URI for profile image due to storage error:',
      storageError?.message || storageError
    );

    if (base64) {
      return `data:image/webp;base64,${base64}`;
    }

    try {
      const response = await fetch(processedUri);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fallbackErr) {
      console.error('[Storage] Profile image fallback failed:', fallbackErr);
      throw storageError;
    }
  }
}

export async function deleteImageFromStorage(url: string): Promise<void> {
  if (!url || url.startsWith('data:')) return;
  const bucketUrl = supabase.storage.from('almari-images').getPublicUrl('').data.publicUrl;
  const fileName = url.replace(bucketUrl, '').replace(/^\//, '');
  if (fileName) {
    await supabase.storage.from('almari-images').remove([fileName]);
  }
}
