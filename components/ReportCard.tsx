import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { PotholeReport } from '@/lib/types';

interface ReportCardProps {
  report: PotholeReport;
  onPress?: (report: PotholeReport) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100', label: 'Pending' },
  verified: { bg: '#FFEBEE', text: '#B71C1C', label: 'Verified' },
  resolved: { bg: '#E8F5E9', text: '#1B5E20', label: 'Resolved' },
};

export default function ReportCard({ report, onPress }: ReportCardProps) {
  const status = STATUS_STYLES[report.status] ?? STATUS_STYLES.pending;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(report)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: report.media_url }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(report.created_at).toLocaleDateString()}
          </Text>
        </View>
        {report.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {report.description}
          </Text>
        ) : null}
        <Text style={styles.coords}>
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  coords: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'SpaceMono',
  },
});
