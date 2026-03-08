export type ReportStatus = 'pending' | 'verified' | 'resolved';

export type MediaType = 'photo' | 'video';

export interface PotholeReport {
  id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  media_url: string;
  media_type: MediaType;
  description: string;
  status: ReportStatus;
}

export type NewPotholeReport = Omit<PotholeReport, 'id' | 'created_at' | 'status'>;

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
