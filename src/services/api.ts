import { PersonReport, Campaign, NotificationItem, Comment, User } from '../types/index.ts';

const TOKEN_KEY = 'gurmad_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (typeof data === 'object' && data?.error) || 'Cilad ayaa dhacday';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  async signup(payload: { name: string; email: string; phone?: string; password: string }): Promise<{ token: string; user: User }> {
    return fetchWithAuth('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return fetchWithAuth('/api/auth/me');
  },

  async updateProfile(payload: { name?: string; phone?: string; bio?: string }): Promise<{ success: boolean; user: User }> {
    return fetchWithAuth('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // People
  async getPeople(params?: { q?: string; category?: string; status?: string }): Promise<{ items: PersonReport[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth(`/api/people${qs}`);
  },

  async getMyPeople(): Promise<{ items: PersonReport[] }> {
    return fetchWithAuth('/api/my/people');
  },

  async getPerson(id: string): Promise<PersonReport> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}`);
  },

  async createPerson(payload: Partial<PersonReport>): Promise<PersonReport> {
    return fetchWithAuth('/api/people', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePerson(id: string, payload: Partial<PersonReport>): Promise<{ success: boolean; report: PersonReport }> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async togglePersonStatus(id: string): Promise<{ success: boolean; status: string; report: PersonReport }> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}/status`, {
      method: 'POST',
    });
  },

  async deletePerson(id: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Social
  async getSocial(id: string): Promise<{ likesCount: number; liked: boolean; comments: Comment[] }> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}/social`);
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}/like`, {
      method: 'POST',
    });
  },

  async addComment(id: string, payload: { text: string; authorName?: string }): Promise<Comment> {
    return fetchWithAuth(`/api/people/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Campaigns
  async getCampaigns(): Promise<{ items: Campaign[] }> {
    return fetchWithAuth('/api/campaigns');
  },

  async createCampaign(payload: Partial<Campaign>): Promise<Campaign> {
    return fetchWithAuth('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createPaymentIntent(payload: { campaignId?: string; method: string; phone: string; amount: number }): Promise<any> {
    return fetchWithAuth('/api/campaigns/payment-intent', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Abuse reports
  async submitAbuseReport(payload: { reportId: string; reason: string; notes?: string; reporterContact?: string }): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth('/api/reports/abuse', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ items: NotificationItem[] }> {
    return fetchWithAuth('/api/notifications');
  },

  async markNotificationsRead(): Promise<{ success: boolean }> {
    return fetchWithAuth('/api/notifications/mark-read', {
      method: 'POST',
    });
  },

  // Support
  async submitSupport(payload: { name?: string; contact?: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth('/api/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // AI-Assisted Intelligence
  async getAiFormGuidance(payload: {
    name?: string;
    age?: string | number;
    category?: string;
    location?: string;
    lastSeen?: string;
    description?: string;
  }): Promise<{
    suggestions: string[];
    missingPrompts: string[];
    clarityScore: number;
    aiPowered: boolean;
  }> {
    return fetchWithAuth('/api/ai/assist-report', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async checkDuplicateReport(payload: {
    name: string;
    age?: string | number;
    location?: string;
  }): Promise<{
    isLikelyDuplicate: boolean;
    matches: Array<{
      id: string;
      name: string;
      age: string | number;
      location: string;
      score: number;
      matchReason: string;
      photoDataUrl?: string;
    }>;
  }> {
    return fetchWithAuth('/api/ai/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/**
 * Client-side photo compression utility to keep images crisp and fast
 */
export function compressImage(file: File, maxWidth = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
