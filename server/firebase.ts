// Firebase Realtime Database Client & Synchronization Layer for «نسمة شتاء»
// Project Database: https://nasmt-aa6e3-default-rtdb.firebaseio.com/

const FIREBASE_RTDB_BASE_URL = (
  process.env.FIREBASE_RTDB_URL || 'https://nasmt-aa6e3-default-rtdb.firebaseio.com'
).replace(/\/$/, '');

let isOnline = false;
let lastSyncTimestamp: string | null = null;
let syncErrorCount = 0;

export function getFirebaseStatus() {
  return {
    databaseUrl: FIREBASE_RTDB_BASE_URL,
    isOnline,
    lastSyncTimestamp,
    syncErrorCount,
  };
}

/**
 * Perform an authenticated or standard REST operation against Firebase Realtime Database
 * with built-in timeout and graceful error recovery.
 */
async function rtdbFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${FIREBASE_RTDB_BASE_URL}${cleanPath}.json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      syncErrorCount++;
      isOnline = false;
      const errorText = await res.text().catch(() => '');
      return { success: false, error: `Firebase RTDB HTTP ${res.status}: ${errorText}` };
    }

    const data = await res.json();
    isOnline = true;
    lastSyncTimestamp = new Date().toISOString();
    return { success: true, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    syncErrorCount++;
    isOnline = false;
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Firebase RTDB request timed out' : err.message,
    };
  }
}

/**
 * Read data from Firebase Realtime Database
 */
export async function rtdbGet<T = any>(path: string): Promise<T | null> {
  const res = await rtdbFetch<T>(path, { method: 'GET' });
  if (res.success && res.data !== undefined) {
    return res.data;
  }
  return null;
}

/**
 * Write (replace) data at path in Firebase Realtime Database
 */
export async function rtdbPut<T = any>(path: string, data: T): Promise<boolean> {
  const res = await rtdbFetch(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.success;
}

/**
 * Patch (partial update) data in Firebase Realtime Database
 */
export async function rtdbPatch<T = any>(path: string, partialData: Partial<T>): Promise<boolean> {
  const res = await rtdbFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(partialData),
  });
  return res.success;
}

/**
 * Delete data at path in Firebase Realtime Database
 */
export async function rtdbDelete(path: string): Promise<boolean> {
  const res = await rtdbFetch(path, { method: 'DELETE' });
  return res.success;
}

/**
 * Append data as a new child with unique Firebase push ID
 */
export async function rtdbPost<T = any>(path: string, data: T): Promise<string | null> {
  const res = await rtdbFetch<{ name: string }>(path, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.success && res.data?.name) {
    return res.data.name;
  }
  return null;
}
