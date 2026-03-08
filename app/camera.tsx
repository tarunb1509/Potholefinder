import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const router = useRouter();
  const launched = useRef(false);

  useEffect(() => {
    if (launched.current) return;
    launched.current = true;

    (async () => {
      const [cameraStatus, locationStatus] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);

      if (cameraStatus.status !== 'granted') {
        router.replace('/');
        return;
      }

      const locationPromise =
        locationStatus.status === 'granted'
          ? Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          : Promise.resolve(null);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        router.replace('/');
        return;
      }

      const uri = result.assets[0].uri;
      let lat = '0';
      let lng = '0';

      try {
        const loc = await locationPromise;
        if (loc) {
          lat = loc.coords.latitude.toString();
          lng = loc.coords.longitude.toString();
        }
      } catch {
        // Location unavailable, use defaults
      }

      router.replace(`/submit?uri=${encodeURIComponent(uri)}&lat=${lat}&lng=${lng}`);
    })();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.text}>Opening camera...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 16,
  },
  text: {
    color: '#999',
    fontSize: 14,
  },
});
