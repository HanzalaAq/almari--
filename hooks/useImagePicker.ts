import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export function useImagePicker() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: Use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
          }
        };
        input.click();
      } else {
        // Native: Use expo-image-picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
  };

  return {
    image,
    loading,
    pickImage,
    clearImage,
  };
}
