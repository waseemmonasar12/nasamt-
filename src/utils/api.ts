// Centralized API client for «نسمة شتاء»

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('nesmat_sheta_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem('nesmat_sheta_token', token);
    } else {
      localStorage.removeItem('nesmat_sheta_token');
    }
  } catch (err) {
    console.error('Storage error', err);
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({ error: 'استجابة غير متوقعة من الخادم' }));

  if (!res.ok) {
    const errorMsg = data.error || `خطأ في الطلب (${res.status})`;
    const error = new Error(errorMsg) as Error & { status: number; waitSeconds?: number; code?: string };
    error.status = res.status;
    error.waitSeconds = data.waitSeconds;
    error.code = data.code;
    throw error;
  }

  return data;
}
