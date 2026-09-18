/**
 * State Persistence & Mock Firebase Firestore Integration
 */

export interface GameSaveData {
  id: string;
  version: number;
  colonyName: string;
  savedAt: string;
  time: any;
  resources: Record<string, number>;
  pawns: any[];
  buildings: any[];
  zones: any[];
  plants: any[];
  items: any[];
  chunks: { cx: number; cy: number; tiles: any[][] }[];
  logs: any[];
  worldFactions: any[];
}

class MockFirestoreService {
  private prefix = 'rimcolony_db_';
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  public async setDoc(collection: string, docId: string, data: any): Promise<void> {
    const key = `${this.prefix}${collection}_${docId}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Notify listeners
    const notifySet = this.listeners.get(key);
    if (notifySet) {
      notifySet.forEach(cb => cb(data));
    }
  }

  public async getDoc(collection: string, docId: string): Promise<any | null> {
    const key = `${this.prefix}${collection}_${docId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public onSnapshot(collection: string, docId: string, callback: (data: any) => void): () => void {
    const key = `${this.prefix}${collection}_${docId}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Initial read
    this.getDoc(collection, docId).then(data => {
      if (data) callback(data);
    });

    // Unsubscribe
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  public listSaves(): { id: string; name: string; date: string; day: number; colonistCount: number }[] {
    const saves: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${this.prefix}saves_`)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || '{}');
          saves.push({
            id: parsed.id || k.replace(`${this.prefix}saves_`, ''),
            name: parsed.colonyName || 'Unknown Colony',
            date: parsed.savedAt || 'Unknown',
            day: parsed.time?.day || 1,
            colonistCount: parsed.pawns?.length || 0,
          });
        } catch {
          // ignore corrupted
        }
      }
    }
    return saves;
  }

  public deleteSave(saveId: string) {
    const key = `${this.prefix}saves_${saveId}`;
    localStorage.removeItem(key);
  }
}

export const mockFirestore = new MockFirestoreService();

/**
 * File Export / Import utilities
 */
export function exportGameToJson(saveData: GameSaveData) {
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${saveData.colonyName.toLowerCase().replace(/\s+/g, '_')}_day${saveData.time.day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importGameFromJson(file: File): Promise<GameSaveData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON save file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
