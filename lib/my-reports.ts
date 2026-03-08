import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'my_report_ids';

export async function getMyReportIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addMyReportId(id: string): Promise<void> {
  const ids = await getMyReportIds();
  ids.unshift(id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
