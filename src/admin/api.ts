// src/admin/api.ts
// API helper with credentials and error handling

// NOTE: If you see TypeScript errors related to 'import.meta.env', make sure your tsconfig includes:
//   "types": ["vite/client"]
// in "compilerOptions". This ensures Vite env types are recognized.

const API_BASE = '/api';

// Authentication state management
let isAuthenticated = false;
let currentUser: AdminUser | null = null;

export interface AdminUser {
  email: string;
  name: string;
  role: string;
}

// Check authentication status
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user: AdminUser | null }> {
  try {
    const response = await fetch('/api/auth/admin/check', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      isAuthenticated = true;
      currentUser = data.user;
      return { isAuthenticated: true, user: data.user };
    } else {
      isAuthenticated = false;
      currentUser = null;
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    isAuthenticated = false;
    currentUser = null;
    return { isAuthenticated: false, user: null };
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    isAuthenticated = false;
    currentUser = null;
    // Redirect to login
    window.location.href = '/api/auth/google';
  }
}

// Get current user
export function getCurrentUser(): AdminUser | null {
  return currentUser;
}

// Check if authenticated
export function getIsAuthenticated(): boolean {
  return isAuthenticated;
}

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
  private async fetchWithRetry(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    try {
      return await this.fetchWithCredentials(url, options);
    } catch (error: any) {
      // Only retry on 429 errors and if we haven't exceeded max retries
      if (error.status === 429 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      
      // Re-throw the error if it's not a 429 or we've exceeded max retries
      throw error;
    }
  }

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
      // 📦 Enhanced error logging for debugging
      console.error("❌ API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error("❌ Authentication failed - redirecting to login");
        isAuthenticated = false;
        currentUser = null;
        window.location.href = '/api/auth/google';
        const error = new Error("Authentication required") as ApiError;
        error.status = response.status;
        throw error;
      }
      
      // Handle specific error types
      if (response.status === 429) {
        console.error("❌ Rate limit exceeded - too many requests");
        const error = new Error("Too many requests, please wait a moment and try again.") as ApiError;
        error.status = 429;
        throw error;
      }
      
      // Try to get error response body
      try {
        const errorData = await response.json();
        console.error("❌ API Error Data:", JSON.stringify(errorData, null, 2));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        throw error;
      } catch (parseError) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        throw error;
      }
    }

    return response;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = buildUrl(endpoint, params);
    if ((import.meta as any).env?.DEV) {
      console.debug('[api] GET', url);
    }
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Handle 403 errors specifically
    if (!response.ok && response.status === 403) {
      console.error('❌ 403 Forbidden - Admin session may have expired');
      // You could trigger a redirect to login here if needed
    }
    
    return data;
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta.env.DEV) {
      console.debug('[api] POST', url);
    }
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta.env.DEV) {
      console.debug('[api] PATCH', url);
    }
    const response = await this.fetchWithRetry(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    const responseData = await response.json();
    
    // Handle 403 errors specifically
    if (!response.ok && response.status === 403) {
      console.error('❌ 403 Forbidden - Admin session may have expired');
    }
    
    return responseData;
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta.env.DEV) {
      console.debug('[api] PUT', url);
    }
    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint);
    if (import.meta.env.DEV) {
      console.debug('[api] DELETE', url);
    }
    const response = await this.fetchWithRetry(url, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const api = new ApiClient();

// Admin API endpoints
export const adminApi = {
  // Users
  getUsers: async (params?: { query?: string; role?: string; status?: string; searchField?: string; limit?: number; offset?: number; cursor?: string }) => {
    const q = { query: '', role: '', status: '', searchField: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: User[]; totalCount?: number; nextCursor?: string; error?: string }>('/admin/users', q);
    if ((import.meta as any).env?.DEV) console.debug('[api] users', json);
    return json;
  },
  
  getUser: (id: string) =>
    api.get<{ ok: boolean; user: User; events: any[] }>(`/admin/users/${id}`),
  
  updateUserStatus: (id: string, status: 'active' | 'disabled') =>
    api.patch<{ ok: boolean }>(`/admin/users/${id}/status`, { status }),
  
  updateUser: (id: string, data: { displayName?: string; roles?: string[]; status?: string }) =>
    api.put<{ ok: boolean }>(`/admin/users/${id}`, data),

  createUser: (data: { displayName: string; email: string; roles?: string[]; status?: 'active' | 'disabled'; walletBalance?: number }) =>
    api.post<{ ok: boolean; userId: string; error?: string }>('/admin/users', data),

  // Stories
  getStories: async (params?: { query?: string; isActive?: boolean; limit?: number; cursor?: string }) => {
    const q = { query: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: Story[]; nextCursor?: string; error?: string }>('/admin/stories', q);
    if ((import.meta as any).env?.DEV) console.debug('[api] stories', json);
    return json;
  },
  
  getStory: (id: string) =>
    api.get<{ ok: boolean; story: Story }>(`/admin/stories/${id}`),
  
  updateStoryStatus: (id: string, isActive: boolean) =>
    api.patch<{ ok: boolean }>(`/admin/stories/${id}/status`, { isActive }),
  
  updateStory: (id: string, data: unknown) =>
    api.put<{ ok: boolean }>(`/admin/stories/${id}`, data),

  createStoryWithGeneration: (data: { title: string; authorName: string; publishedYear: number; mainCategory: string }) =>
    api.post<{ ok: boolean; storyId: string; error?: string }>('/admin/stories', { ...data, autoGenerate: true }),

  generateStoryDBJSON: (data: { title: string; authorName: string; publishedYear: number; mainCategory: string }) =>
    api.post<{ ok: boolean; story: any; error?: string }>('/admin/stories/generate', data),

  createStoryFromDBJSON: (doc: any) =>
    api.post<{ ok: boolean; storyId: string; error?: string }>('/admin/stories', doc),

  validateStoryCompliance: (storyData: any) =>
    api.post<{ ok: boolean; validation: { isCompliant: boolean; issues: string[] }; error?: string }>('/admin/stories/validate-compliance', storyData),

  exportStory: (id: string) =>
    api.get<Story>(`/admin/stories/${id}/export`),

  // Feedbacks
  getFeedbacks: async (params?: { storyId?: string; userId?: string; status?: string; starsGte?: number; limit?: number; cursor?: string }) => {
    const q = { storyId: '', userId: '', status: '', limit: 10, ...params };
    const json = await api.get<{ ok: boolean; items: AdminFeedback[]; nextCursor?: string; error?: string }>('/admin/feedbacks', q);
    if ((import.meta as any).env?.DEV) console.debug('[api] feedbacks', json);
    return json;
  },
  
  updateFeedbackStatus: (id: string, status: 'visible' | 'hidden' | 'flagged') =>
    api.patch<{ ok: boolean }>(`/admin/feedbacks/${id}/status`, { status }),
  
  deleteFeedback: (id: string) =>
    api.delete<{ ok: boolean }>(`/admin/feedbacks/${id}`),

  // Wallet Analytics
  getWalletAnalytics: () =>
    api.get<{ ok: boolean; analytics: WalletAnalytics }>('/admin/wallet/analytics'),

  getTotalCredits: () =>
    api.get<{ ok: boolean; totalCredits: number }>('/admin/wallet/total'),

  getTopCreditUsers: (limit?: number) =>
    api.get<{ ok: boolean; users: TopCreditUser[] }>('/admin/wallet/top-users', limit ? { limit } : {}),

  getWalletDistribution: () =>
    api.get<{ ok: boolean; distribution: WalletDistribution }>('/admin/wallet/distribution'),

  getTransactionStats: (params?: { startDate?: string; endDate?: string; type?: string; source?: string }) =>
    api.get<{ ok: boolean; stats: TransactionStats }>('/admin/wallet/transactions/stats', params || {}),

  getDailySummary: (date?: string) =>
    api.get<{ ok: boolean; summary: DailySummary }>('/admin/wallet/transactions/daily', date ? { date } : {}),

  getUserTransactionHistory: (userId: string, params?: { limit?: number; offset?: number; type?: string; source?: string }) =>
    api.get<{ ok: boolean; transactions: WalletTransaction[] }>(`/admin/wallet/transactions/user/${userId}`, params || {}),

  getTransactionLogs: (params?: { limit?: number; offset?: number; startDate?: string; endDate?: string; type?: string; source?: string }) =>
    api.get<{ ok: boolean; transactions: TransactionLog[]; totalCount: number }>('/admin/wallet/transactions/logs', params || {}),

  // StoryRunner
  getStorySettings: () =>
    api.get<{ ok: boolean; settings: StorySettings }>('/admin/storyrunner/settings'),

  updateStorySettings: (data: Partial<StorySettings>) =>
    api.put<{ ok: boolean; settings: StorySettings }>('/admin/storyrunner/settings', data),

  getStorySessions: async (params?: { userId?: string; storyId?: string; status?: string; limit?: number; offset?: number }) => {
    const q = { limit: 10, ...params };
    const json = await api.get<{ ok: boolean; sessions: UserStorySession[]; totalCount?: number; error?: string }>('/admin/storyrunner/sessions', q);
    if ((import.meta as any).env?.DEV) console.debug('[api] story sessions', json);
    return json;
  },

  getStorySession: (id: string) =>
    api.get<{ ok: boolean; session: UserStorySession }>(`/admin/storyrunner/sessions/${id}`),

  getSessionChapters: (sessionId: string) =>
    api.get<{ ok: boolean; chapters: Chapter[] }>(`/admin/storyrunner/sessions/${sessionId}/chapters`),

  // Brief
  getBrief: () =>
    api.get<{ ok: boolean; brief: Brief }>('/admin/brief'),

  updateBrief: (data: { title?: string; whatIsPlaible: string; howToPlay: string; storyrunnerRole: string }) =>
    api.put<{ ok: boolean; brief: Brief }>('/admin/brief', data),
};

// Types
export interface User {
  _id: string;
  email: string;
  displayName: string;
  roles: string[];
  status: 'active' | 'disabled' | 'deleted';
  balance: number;
  wallet?: {
    balance: number;
  };
  createdAt: string;
}

// Character and Role interfaces
export interface Character {
  id: string;
  name: string;
  summary: string;
  hooks: string[];
  assets: {
    images: string[];
    videos: string[];
  };
}

export interface Role {
  id: string;
  label: string;
}

export interface Cast {
  characterId: string;
  roleIds: string[];
}

export interface Highlight {
  title: string;
  description: string;
}

export interface Summary {
  original: string;
  modern: string;
  highlights: Highlight[];
}

export interface FactItem {
  title: string;
  description: string;
}

export interface FunFacts {
  storyFacts: FactItem[];
  authorInfo: FactItem[];
  modernEcho: FactItem[];
}

export interface MediaBlock {
  images: string[];
  videos: string[];
  ambiance: string[];
}

export interface Share {
  link: string;
  text: string;
  images: string[];
  videos: string[];
}

export interface Feedback {
  profilePictureUrl: string;
  displayName: string;
  text: string;
  stars: number;
  date: string;
}

export interface Pricing {
  creditsPerChapter: number;
  estimatedChapterCount: number;
}

export interface ReengagementTemplate {
  trigger: string;
  template: string;
  cooldownHours: number;
  enabled: boolean;
}

export interface Storyrunner {
  storyPrompt: string;
  systemPrompt?: string; // Legacy field for backward compatibility
  editableFinalPrompt?: string; // User-edited Final Prompt text
  openingBeats: string[];
  guardrails: string[];
}

export interface StoryStats {
  totalPlayed: number;
  totalReviews: number;
  avgRating: number;
  savedCount: number;
}

// Main Story interface
export interface Story {
  _id: string;
  slug: string;
  mainCategory: string;
  subCategory?: string;
  title: string;
  authorName?: string;
  publisher?: string;
  genres: string[];
  storySettingTime?: string;
  publishedYear?: number;
  headline?: string;
  description?: string;
  language: string;
  license: 'public-domain' | 'creative-commons' | 'copyrighted' | 'fair-use';
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  tags: string[];
  assets: MediaBlock;
  characters: Character[];
  roles: Role[];
  cast: Cast[];
  hooks: string[];
  summary: Summary;
  funFacts: FunFacts;
  stats: StoryStats;
  share: Share;
  feedbacks: Feedback[];
  pricing: Pricing;
  relatedStoryIds: string[];
  reengagementTemplates: ReengagementTemplate[];
  storyrunner: Storyrunner;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AdminFeedback {
  _id: string;
  userId: string;
  storyId: string;
  stars: number;
  text: string;
  status: 'visible' | 'hidden' | 'flagged' | 'deleted';
  createdAt: string;
}

// Wallet Analytics Types
export interface WalletAnalytics {
  totalCredits: number;
  averageBalance: number;
  zeroBalanceUsers: number;
  highBalanceUsers: number;
  topUsers: TopCreditUser[];
  totalUsers: number;
  timestamp: string;
}

export interface TopCreditUser {
  _id: string;
  email: string;
  displayName: string;
  balance: number;
  roles: string[];
  status: string;
  createdAt: string;
}

export interface WalletDistribution {
  total: number;
  average: number;
  min: number;
  max: number;
  userCount: number;
  zeroBalance: {
    count: number;
    percentage: number;
  };
  highBalance: {
    count: number;
    percentage: number;
  };
}

export interface TransactionStats {
  totalTransactions: number;
  creditsAdded: number;
  creditsSpent: number;
  netCredits: number;
  averageAmount: number;
  uniqueUserCount: number;
}

export interface DailySummary {
  date: string;
  stats: TransactionStats;
  topTransactions: WalletTransaction[];
}

export interface WalletTransaction {
  _id: string;
  userId: string;
  type: 'credit' | 'debit';
  source: 'admin' | 'purchase' | 'ai' | 'topup' | 'play' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number;
  note?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface TransactionLog {
  _id: string;
  user: {
    _id: string;
    email: string;
    displayName: string;
  };
  type: 'credit' | 'debit';
  amount: number;
  source: 'admin' | 'purchase' | 'ai' | 'topup' | 'play' | 'refund' | 'adjustment';
  note?: string;
  balanceAfter: number;
  createdAt: string;
  description: 'Added' | 'Deducted';
}

// StoryRunner interfaces
export interface StorySetting {
  id: string;
  displayLabel: string;
  description?: string;
}

export interface StorySettings {
  _id: string;
  tone_styles: StorySetting[];
  time_flavors: StorySetting[];
  version: string;
  isActive: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStorySession {
  _id: string;
  userId: string;
  storyId: string;
  toneStyleId: string;
  timeFlavorId: string;
  storyPrompt: string;
  status: 'active' | 'finished' | 'abandoned';
  currentChapter: number;
  chaptersGenerated: number;
  sessionStartedAt: string;
  lastActivityAt: string;
  userPreferences?: {
    preferredPacing?: 'slow' | 'medium' | 'fast';
    contentSensitivity?: 'low' | 'medium' | 'high';
    interactionStyle?: 'passive' | 'interactive' | 'immersive';
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChapterChoice {
  text: string;
  nextChapterId?: string;
}

export interface Chapter {
  _id: string;
  sessionId: string;
  chapterIndex: number;
  storyPromptUsed: string;
  openingBeat: string;
  title: string;
  content: string;
  choices: ChapterChoice[];
  createdAt: string;
  updatedAt: string;
}

// Brief interface for StoryRunner AI Dashboard
export interface Brief {
  _id: string;
  title: string;
  whatIsPlaible: string;
  howToPlay: string;
  storyrunnerRole: string;
  version: string;
  isActive: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}
