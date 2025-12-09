import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Gerekli', 'Resimlere erişim izni gerekiyor.');
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
    return null;
  }
};

export const takePicture = async (): Promise<string | null> => {
  try {
    // Request permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera erişim izni gerekiyor.');
        return null;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      return `data:image/jpeg;base64,${result.assets[0].base64}`;
    }

    return null;
  } catch (error) {
    console.error('Error taking picture:', error);
    Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    return null;
  }
};