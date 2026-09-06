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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error('[Network Error]:', netErr);
    const error = new Error('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.') as Error & {
      status: number;
    };
    error.status = 0;
    throw error;
  }

  // Safely parse JSON or handle HTML/proxy responses
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!data) {
    const rawText = await res.text().catch(() => '');
    console.warn(`[API Non-JSON Response] url=${endpoint} status=${res.status}:`, rawText.slice(0, 100));

    if (res.status === 401) {
      data = { error: 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم أو كلمة المرور.' };
    } else if (res.status === 404) {
      data = { error: 'مسار الخدمة غير موجود حالياً في الخادم.' };
    } else if (res.status === 429) {
      data = { error: 'تم تجاوز عدد المحاولات، يرجى الانتظار قليلاً.' };
    } else if (res.status >= 500) {
      data = { error: 'الخادم يواجه ضغطاً مؤقتاً، يرجى المحاولة بعد لحظات.' };
    } else {
      data = {
        error: res.ok
          ? 'تم استلام استجابة غير متوقعة من الخادم.'
          : `تعذر إكمال الطلب (رمز الخطأ: ${res.status}).`,
      };
    }
  }

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
