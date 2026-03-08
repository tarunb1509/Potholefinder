import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { PotholeReport, MapRegion } from '@/lib/types';

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

function makeSvgIcon(color: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`;
}

export default function PotholeMap({ reports, region, onMarkerPress }: MapProps) {
  const [leafletModules, setLeafletModules] = useState<any>(null);

  useEffect(() => {
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

  function createIcon(color: string) {
    return L.divIcon({
      html: makeSvgIcon(color),
      className: '',
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -40],
    });
  }

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
        {reports.map((report) => {
          const color = MARKER_COLORS[report.status] ?? '#FF6B35';
          return (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={createIcon(color)}
              eventHandlers={{
                click: () => handleMarkerClick(report),
              }}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 100 }}>
                  <strong style={{ color }}>{report.status.toUpperCase()}</strong>
                  {report.description && (
                    <p style={{ margin: '4px 0 0' }}>{report.description}</p>
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
