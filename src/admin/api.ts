// src/admin/api.ts
// API helper with credentials and error handling

const API_BASE = '/api';

// helper: path'i normalize et → '/api/...' garantile
function normalizeApiPath(path: string): string {
  if (!path) return '/api';
  // Eğer zaten '/api' ile başlıyorsa bırak
  if (path.startsWith('/api')) return path;
  // 'admin/users' veya '/admin/users' gelirse başına '/api' ekle
  return `/api${path.startsWith('/') ? '' : '/'}${path}`;
}

// helper: URL kur (origin tabanlı, query param ekle)
function buildUrl(path: string, params?: Record<string, any>): string {
  const fullPath = normalizeApiPath(path);
  const url = new URL(fullPath, window.location.origin); // ÖNEMLİ: origin ver
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

interface ApiError extends Error {
  status: number;
}

class ApiClient {
  private async fetchWithCredentials(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
      error.status = response.status;
      throw error;
    }

    return response;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = buildUrl(endpoint, params);
    if (import.meta?.env?.DEV) {
      console.debug('[api] GET', url);
    }
    const response = await this.fetchWithCredentials(url);
    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta?.env?.DEV) {
      console.debug('[api] POST', url);
    }
    const response = await this.fetchWithCredentials(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta?.env?.DEV) {
      console.debug('[api] PATCH', url);
    }
    const response = await this.fetchWithCredentials(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta?.env?.DEV) {
      console.debug('[api] PUT', url);
    }
    const response = await this.fetchWithCredentials(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta?.env?.DEV) {
      console.debug('[api] DELETE', url);
    }
    const response = await this.fetchWithCredentials(url, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const api = new ApiClient();

// Admin API endpoints
export const adminApi = {
  // Users
  getUsers: async (params?: { query?: string; role?: string; status?: string; limit?: number; cursor?: string }) => {
    const q = { query: '', role: '', status: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: User[]; nextCursor?: string; error?: string }>('/admin/users', q);
    if (import.meta.env.DEV) console.debug('[api] users', json);
    return json;
  },
  
  getUser: (id: string) =>
    api.get<{ ok: boolean; user: User; events: any[] }>(`/admin/users/${id}`),
  
  updateUserStatus: (id: string, status: 'active' | 'disabled') =>
    api.patch<{ ok: boolean }>(`/admin/users/${id}/status`, { status }),
  
  updateUser: (id: string, data: { displayName?: string; roles?: string[]; status?: string }) =>
    api.put<{ ok: boolean }>(`/admin/users/${id}`, data),

  // Stories
  getStories: async (params?: { query?: string; isActive?: boolean; limit?: number; cursor?: string }) => {
    const q = { query: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: Story[]; nextCursor?: string; error?: string }>('/admin/stories', q);
    if (import.meta.env.DEV) console.debug('[api] stories', json);
    return json;
  },
  
  getStory: (id: string) =>
    api.get<{ ok: boolean; story: Story }>(`/admin/stories/${id}`),
  
  updateStoryStatus: (id: string, isActive: boolean) =>
    api.patch<{ ok: boolean }>(`/admin/stories/${id}/status`, { isActive }),
  
  updateStory: (id: string, data: any) =>
    api.put<{ ok: boolean }>(`/admin/stories/${id}`, data),

  // Feedbacks
  getFeedbacks: async (params?: { storyId?: string; userId?: string; status?: string; starsGte?: number; limit?: number; cursor?: string }) => {
    const q = { storyId: '', userId: '', status: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: Feedback[]; nextCursor?: string; error?: string }>('/admin/feedbacks', q);
    if (import.meta.env.DEV) console.debug('[api] feedbacks', json);
    return json;
  },
  
  updateFeedbackStatus: (id: string, status: 'visible' | 'hidden' | 'flagged') =>
    api.patch<{ ok: boolean }>(`/admin/feedbacks/${id}/status`, { status }),
  
  deleteFeedback: (id: string) =>
    api.delete<{ ok: boolean }>(`/admin/feedbacks/${id}`),
};

// Types
export interface User {
  _id: string;
  email: string;
  displayName: string;
  roles: string[];
  status: 'active' | 'disabled' | 'deleted';
  balance: number;
  createdAt: string;
}

export interface Story {
  _id: string;
  slug: string;
  title: string;
  isActive: boolean;
  pricing: {
    creditsPerChapter: number;
    estimatedChapterCount: number;
  };
  stats: {
    avgRating: number;
    totalReviews: number;
  };
  updatedAt: string;
}

export interface Feedback {
  _id: string;
  userId: string;
  storyId: string;
  stars: number;
  text: string;
  status: 'visible' | 'hidden' | 'flagged' | 'deleted';
  createdAt: string;
}
