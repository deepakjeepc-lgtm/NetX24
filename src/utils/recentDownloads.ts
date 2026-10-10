/**
 * Utility for tracking recent user downloads in LocalStorage.
 */

export interface RecentDownloadItem {
  id: string;
  title: string;
  category: 'Rate Card' | 'IGNOU Notes' | 'Tool Result' | 'Sample Guide' | 'Receipt';
  date: string;
  timestamp: number;
  url?: string;
  downloads?: { name: string; url: string }[];
}

const STORAGE_KEY = 'netx24_recent_downloads';

export const getRecentDownloads = (): RecentDownloadItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse recent downloads from localStorage:', e);
    return [];
  }
};

export const addRecentDownload = (
  item: Omit<RecentDownloadItem, 'id' | 'timestamp' | 'date'>
): RecentDownloadItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getRecentDownloads();
    const newItem: RecentDownloadItem = {
      ...item,
      id: 'dl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Filter duplicates with same title within 5 minutes or prepend
    const updated = [newItem, ...existing.filter(i => i.title !== newItem.title || (newItem.timestamp - i.timestamp > 300000))].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event so UI components can update reactively
    window.dispatchEvent(new Event('netx_recent_downloads_updated'));
    return updated;
  } catch (e) {
    console.error('Failed to save recent download to localStorage:', e);
    return [];
  }
};

export const clearRecentDownloads = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('netx_recent_downloads_updated'));
  } catch (e) {
    console.error('Failed to clear recent downloads:', e);
  }
};
