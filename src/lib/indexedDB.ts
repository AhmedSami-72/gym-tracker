const DB_NAME = 'ApexStrengthDB';
const DB_VERSION = 1;

export const STORES = {
  PROFILE: 'user_profile',
  WEIGHTS: 'weight_logs',
  EXERCISES: 'exercises',
  SPLITS: 'workout_splits',
  PLANS: 'workout_plans',
  SESSIONS: 'workout_sessions',
};

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const target = event.currentTarget as IDBOpenDBRequest | null;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.WEIGHTS)) {
        db.createObjectStore(STORES.WEIGHTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
        db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SPLITS)) {
        db.createObjectStore(STORES.SPLITS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PLANS)) {
        db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
      }
    };
  });
}

export async function getStoreData<T>(storeName: string): Promise<T[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error fetching data from IndexedDB store ${storeName}:`, err);
    return [];
  }
}

export async function saveItem<T>(storeName: string, item: T): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error saving item to IndexedDB store ${storeName}:`, err);
  }
}

export async function saveMultipleItems<T>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let errorOccurred = false;
      items.forEach((item) => {
        const req = store.put(item);
        req.onerror = () => {
          errorOccurred = true;
        };
      });

      transaction.oncomplete = () => {
        if (errorOccurred) {
          reject(new Error(`Some items failed to save in ${storeName}`));
        } else {
          resolve();
        }
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error(`Error saving multiple items to IndexedDB store ${storeName}:`, err);
  }
}

export async function deleteItem(storeName: string, id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error deleting item ${id} from IndexedDB store ${storeName}:`, err);
  }
}

export async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Error clearing IndexedDB store ${storeName}:`, err);
  }
}
