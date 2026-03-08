import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PotholeReport } from '@/lib/types';
import { ensureLeafletCSS } from '@/lib/leaflet-css';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100', label: 'Pending' },
  verified: { bg: '#FFEBEE', text: '#B71C1C', label: 'Verified' },
  resolved: { bg: '#E8F5E9', text: '#1B5E20', label: 'Resolved' },
};

function MiniMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [mods, setMods] = useState<any>(null);

  useEffect(() => {
    ensureLeafletCSS();
    (async () => {
      const L = await import('leaflet');
      const RL = await import('react-leaflet');
      setMods({ L, RL });
    })();
  }, []);

  if (!mods) {
    return (
      <View style={styles.miniMapLoading}>
        <ActivityIndicator size="small" color="#FF6B35" />
      </View>
    );
  }

  const { L, RL } = mods;
  const { MapContainer, TileLayer, Marker } = RL;

  const pinIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#FF6B35"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      doubleClickZoom={false}
      touchZoom={false}
    >
      <TileLayer url={OSM_TILE_URL} />
      <Marker position={[latitude, longitude]} icon={pinIcon} />
    </MapContainer>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<PotholeReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setReport(data as PotholeReport);
      } catch {
        // Report not found or Supabase not configured
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Report Details' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Stack.Screen options={{ title: 'Report Details' }} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Report not found</Text>
        </View>
      </>
    );
  }

  const status = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;

  return (
    <>
      <Stack.Screen options={{ title: 'Report Details' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Image source={{ uri: report.media_url }} style={styles.heroImage} />

        <View style={styles.details}>
          <View style={styles.headerRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
            <Text style={styles.date}>
              {new Date(report.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {report.description ? (
            <Text style={styles.description}>{report.description}</Text>
          ) : (
            <Text style={styles.noDescription}>No description provided</Text>
          )}

          <View style={styles.coordsRow}>
            <Text style={styles.coordsLabel}>Coordinates</Text>
            <Text style={styles.coordsValue}>
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.miniMapContainer}>
            <MiniMap latitude={report.latitude} longitude={report.longitude} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  details: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    color: '#888',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  noDescription: {
    fontSize: 14,
    color: '#bbb',
    fontStyle: 'italic',
  },
  coordsRow: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  coordsLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  miniMapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  miniMapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
