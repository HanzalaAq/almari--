import Constants from 'expo-constants';

const r2Config = {
  accountId: Constants.expoConfig?.extra?.r2AccountId || process.env.EXPO_PUBLIC_R2_ACCOUNT_ID || '',
  accessKeyId: Constants.expoConfig?.extra?.r2AccessKeyId || process.env.EXPO_PUBLIC_R2_ACCESS_KEY_ID || '',
  secretAccessKey: Constants.expoConfig?.extra?.r2SecretAccessKey || process.env.EXPO_PUBLIC_R2_SECRET_ACCESS_KEY || '',
  bucketName: Constants.expoConfig?.extra?.r2BucketName || process.env.EXPO_PUBLIC_R2_BUCKET_NAME || 'almari-images',
  publicUrl: Constants.expoConfig?.extra?.r2PublicUrl || process.env.EXPO_PUBLIC_R2_PUBLIC_URL || '',
};

export function getPublicUrl(key: string): string {
  return `${r2Config.publicUrl}/${key}`;
}

export function generateListingKey(listingId: string, index: number): string {
  return `listings/${listingId}/${Date.now()}-${index}.jpg`;
}

export function generateProfileKey(userId: string): string {
  return `profiles/${userId}/${Date.now()}.jpg`;
}

// Note: For actual R2 uploads, you'll need to use AWS SDK v3 or a similar S3-compatible client
// This is a placeholder for the upload function that will be implemented with proper R2 integration
export async function uploadToR2(file: File | Blob, key: string): Promise<string> {
  // TODO: Implement actual R2 upload using AWS SDK v3
  // For now, this is a placeholder that returns a mock URL
  console.log('Uploading to R2:', key);
  return getPublicUrl(key);
}
