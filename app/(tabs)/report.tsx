import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { MediaType, NewPotholeReport } from '@/lib/types';
import MediaPicker from '@/components/MediaPicker';

export default function ReportScreen() {
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'We need your location to pin the pothole on the map.'
        );
        setLocationLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
      } catch {
        Alert.alert('Location Error', 'Could not retrieve your current location.');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const handleMediaSelected = (uri: string, type: MediaType) => {
    setMediaUri(uri);
    setMediaType(type);
  };

  const resetForm = () => {
    setMediaUri(null);
    setMediaType('photo');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!mediaUri) {
      Alert.alert('Missing Media', 'Please capture or select a photo/video first.');
      return;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Missing Location', 'Location data is not available yet.');
      return;
    }

    setSubmitting(true);

    try {
      const ext = mediaType === 'video' ? 'mp4' : 'jpg';
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `reports/${fileName}`;

      const fileBase64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, decode(fileBase64), {
          contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const newReport: NewPotholeReport = {
        latitude,
        longitude,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        description: description.trim(),
      };

      const { error: insertError } = await supabase
        .from('reports')
        .insert(newReport);

      if (insertError) throw insertError;

      Alert.alert('Report Submitted', 'Thank you for reporting this pothole!');
      resetForm();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Report a Pothole</Text>
        <Text style={styles.subheading}>
          Capture a photo or video, and we'll pin it to your current location.
        </Text>

        <MediaPicker
          mediaUri={mediaUri}
          mediaType={mediaType}
          onMediaSelected={handleMediaSelected}
        />

        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Large pothole near the bus stop..."
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          {locationLoading ? (
            <View style={styles.locationRow}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.locationText}>Fetching location...</Text>
            </View>
          ) : latitude !== null && longitude !== null ? (
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={styles.locationError}>Location unavailable</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !mediaUri) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !mediaUri}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subheading: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
    marginTop: -8,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A9D8F',
  },
  locationText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'SpaceMono',
  },
  locationError: {
    fontSize: 13,
    color: '#E63946',
    padding: 14,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
