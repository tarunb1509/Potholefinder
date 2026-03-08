import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getMyReportIds } from '@/lib/my-reports';
import { PotholeReport } from '@/lib/types';

const NUM_COLUMNS = 2;

export default function GalleryScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = useCallback(async () => {
    try {
      setLoading(true);
      const ids = await getMyReportIds();
      if (ids.length === 0) {
        setReports([]);
        return;
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as PotholeReport[]) ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const handlePress = useCallback(
    (report: PotholeReport) => {
      router.push(`/report/${report.id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your reports...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>?</Text>
        </View>
        <Text style={styles.emptyTitle}>No reports yet</Text>
        <Text style={styles.emptySubtitle}>
          Photos you report will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handlePress(item)}
          >
            <Image source={{ uri: item.media_url }} style={styles.image} />
            <View style={styles.cardInfo}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_COLORS[item.status] ?? '#FF6B35' },
                ]}
              />
              <Text style={styles.cardText} numberOfLines={1}>
                {item.description || 'No description'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF6B35',
  verified: '#E63946',
  resolved: '#2A9D8F',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyIconText: {
    fontSize: 32,
    color: '#FF6B35',
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  grid: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
});
