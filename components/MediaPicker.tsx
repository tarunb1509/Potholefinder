import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from '@/lib/types';

interface MediaPickerProps {
  mediaUri: string | null;
  mediaType: MediaType;
  onMediaSelected: (uri: string, type: MediaType) => void;
}

export default function MediaPicker({
  mediaUri,
  mediaType,
  onMediaSelected,
}: MediaPickerProps) {
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to capture pothole photos and videos.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (!(await requestPermissions())) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      onMediaSelected(result.assets[0].uri, 'photo');
    }
  };

  const takeVideo = async () => {
    if (!(await requestPermissions())) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 30,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      onMediaSelected(result.assets[0].uri, 'video');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to select pothole images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      onMediaSelected(result.assets[0].uri, isVideo ? 'video' : 'photo');
    }
  };

  return (
    <View style={styles.container}>
      {mediaUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: mediaUri }} style={styles.preview} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {mediaType === 'video' ? 'VIDEO' : 'PHOTO'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>+</Text>
          <Text style={styles.placeholderText}>Capture or select media</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takeVideo}>
          <Text style={styles.buttonText}>Record Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.galleryButton]}
          onPress={pickFromGallery}
        >
          <Text style={[styles.buttonText, styles.galleryButtonText]}>
            Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderIcon: {
    fontSize: 36,
    color: '#bbb',
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
  },
  galleryButtonText: {
    color: '#FF6B35',
  },
});
