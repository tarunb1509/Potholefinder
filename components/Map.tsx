import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { PotholeReport, MapRegion } from '@/lib/types';
import { ensureLeafletCSS } from '@/lib/leaflet-css';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface MapProps {
  reports: PotholeReport[];
  region: MapRegion;
  onMarkerPress?: (report: PotholeReport) => void;
}

const MARKER_COLORS: Record<string, string> = {
  pending: '#FF6B35',
  verified: '#E63946',
  resolved: '#2A9D8F',
};

function makeSvgIcon(color: string, count: number) {
  if (count <= 1) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>`;
  }
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 46" width="36" height="46">
      <path d="M18 6C11.4 6 6 11.4 6 18c0 9 12 24 12 24s12-15 12-24C30 11.4 24.6 6 18 6z" fill="${color}"/>
      <circle cx="18" cy="18" r="7" fill="white"/>
      <text x="18" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${count}</text>
      <circle cx="28" cy="8" r="8" fill="#E63946"/>
      <text x="28" y="12" text-anchor="middle" font-size="10" font-weight="bold" fill="white">${count}</text>
    </svg>`;
}

interface ClusteredReport {
  lat: number;
  lng: number;
  count: number;
  reports: PotholeReport[];
  primaryStatus: string;
}

function clusterReports(reports: PotholeReport[], precision = 4): ClusteredReport[] {
  const map = new Map<string, PotholeReport[]>();
  for (const r of reports) {
    const key = `${r.latitude.toFixed(precision)},${r.longitude.toFixed(precision)}`;
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  const clusters: ClusteredReport[] = [];
  for (const group of map.values()) {
    const lat = group.reduce((s, r) => s + r.latitude, 0) / group.length;
    const lng = group.reduce((s, r) => s + r.longitude, 0) / group.length;
    clusters.push({
      lat,
      lng,
      count: group.length,
      reports: group,
      primaryStatus: group[0].status,
    });
  }
  return clusters;
}

export default function PotholeMap({ reports, region, onMarkerPress }: MapProps) {
  const [leafletModules, setLeafletModules] = useState<any>(null);

  useEffect(() => {
    ensureLeafletCSS();
    (async () => {
      const L = await import('leaflet');
      const RL = await import('react-leaflet');
      setLeafletModules({ L, RL });
    })();
  }, []);

  const handleMarkerClick = useCallback(
    (report: PotholeReport) => {
      onMarkerPress?.(report);
    },
    [onMarkerPress]
  );

  if (!leafletModules) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const { L, RL } = leafletModules;
  const { MapContainer, TileLayer, Marker, Popup } = RL;

  function createIcon(color: string, count: number) {
    const size = count > 1 ? [36, 46] : [28, 40];
    const anchor = count > 1 ? [18, 46] : [14, 40];
    return L.divIcon({
      html: makeSvgIcon(color, count),
      className: '',
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [0, -anchor[1]],
    });
  }

  const clusters = clusterReports(reports);

  return (
    <View style={styles.container}>
      <MapContainer
        center={[region.latitude, region.longitude]}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <SetViewOnChange region={region} RL={RL} />
        {clusters.map((cluster, idx) => {
          const color = MARKER_COLORS[cluster.primaryStatus] ?? '#FF6B35';
          const firstReport = cluster.reports[0];
          return (
            <Marker
              key={`cluster-${idx}`}
              position={[cluster.lat, cluster.lng]}
              icon={createIcon(color, cluster.count)}
              eventHandlers={{
                click: () => handleMarkerClick(firstReport),
              }}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 100 }}>
                  <strong style={{ color }}>
                    {cluster.count > 1
                      ? `${cluster.count} reports`
                      : firstReport.status.toUpperCase()}
                  </strong>
                  {cluster.count === 1 && firstReport.description && (
                    <p style={{ margin: '4px 0 0' }}>{firstReport.description}</p>
                  )}
                  {cluster.count > 1 && (
                    <p style={{ margin: '4px 0 0', color: '#666' }}>
                      Tap to view details
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

function SetViewOnChange({ region, RL }: { region: MapRegion; RL: any }) {
  const map = RL.useMap();
  React.useEffect(() => {
    map.setView([region.latitude, region.longitude], 14);
  }, [region.latitude, region.longitude, map]);
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});
