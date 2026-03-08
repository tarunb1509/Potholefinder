import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { NewPotholeReport } from '@/lib/types';
import { addMyReportId } from '@/lib/my-reports';

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export default function SubmitScreen() {
  const router = useRouter();
  const { uri, lat, lng } = useLocalSearchParams<{
    uri: string;
    lat: string;
    lng: string;
  }>();

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const imageUri = uri ? decodeURIComponent(uri) : '';
  const latitude = parseFloat(lat ?? '0');
  const longitude = parseFloat(lng ?? '0');

  const handleCancel = () => {
    router.replace('/');
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image available.');
      return;
    }

    setSubmitting(true);

    try {
      const fileName = `${Date.now()}.jpg`;
      const filePath = `reports/${fileName}`;

      const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, decode(fileBase64), {
          contentType: 'image/jpeg',
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
        media_type: 'photo',
        description: description.trim(),
      };

      const { data: insertData, error: insertError } = await supabase
        .from('reports')
        .insert(newReport)
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (insertData?.id) {
        await addMyReportId(insertData.id);
      }

      router.replace('/thankyou');
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
        <Text style={styles.heading}>Review Report</Text>

        {imageUri ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          </View>
        ) : null}

        <View style={styles.field}>
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

        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationBox}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 24,
    gap: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  thumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  field: {
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
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f0f0',
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cancelText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
