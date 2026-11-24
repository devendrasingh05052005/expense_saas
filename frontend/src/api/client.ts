const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : (import.meta.env.PROD ? '/api/v1' : 'http://127.0.0.1:8000/api/v1');

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    
    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed. Is the backend server running?', 0);
  }
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyOtp: (body: { email: string; otp_code: string }) => request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  resendOtp: (body: { email: string; purpose?: string }) => request<any>('/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body: { email: string }) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),

  // Groups
  getGroups: () => request<any[]>('/groups'),
  createGroup: (body: { name: string; description?: string; currency?: string }) => request<any>('/groups', { method: 'POST', body: JSON.stringify(body) }),
  joinGroup: (body: { invite_code: string }) => request<any>('/groups/join', { method: 'POST', body: JSON.stringify(body) }),
  getGroup: (groupId: number) => request<any>(`/groups/${groupId}`),
  updateGroup: (groupId: number, body: any) => request<any>(`/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(body) }),
  getMembers: (groupId: number) => request<any[]>(`/groups/${groupId}/members`),
  inviteMember: (groupId: number, body: { email: string; role?: string }) => request<any>(`/groups/${groupId}/members/invite`, { method: 'POST', body: JSON.stringify(body) }),
  removeMember: (groupId: number, userId: number) => request<any>(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // Individual Expenses
  getExpenses: (groupId: number, params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return request<any[]>(`/groups/${groupId}/expenses?${q.toString()}`);
  },
  addExpense: (groupId: number, body: any) => request<any>(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
  updateExpense: (groupId: number, expenseId: number, body: any) => request<any>(`/groups/${groupId}/expenses/${expenseId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteExpense: (groupId: number, expenseId: number) => request<any>(`/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' }),

  // Common Fund
  getFundSummary: (groupId: number) => request<any>(`/groups/${groupId}/fund/summary`),
  getFundTransactions: (groupId: number, params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return request<any[]>(`/groups/${groupId}/fund/transactions?${q.toString()}`);
  },
  addContribution: (groupId: number, body: any) => request<any>(`/groups/${groupId}/fund/contribute`, { method: 'POST', body: JSON.stringify(body) }),
  addFundExpense: (groupId: number, body: any) => request<any>(`/groups/${groupId}/fund/expense`, { method: 'POST', body: JSON.stringify(body) }),
  updateFundExpense: (groupId: number, expenseId: number, body: any) => request<any>(`/groups/${groupId}/fund/expense/${expenseId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFundExpense: (groupId: number, expenseId: number) => request<any>(`/groups/${groupId}/fund/expense/${expenseId}`, { method: 'DELETE' }),
  deleteFundContribution: (groupId: number, contributionId: number) => request<any>(`/groups/${groupId}/fund/contribution/${contributionId}`, { method: 'DELETE' }),

  // Settlements
  getSettlements: (groupId: number) => request<any>(`/groups/${groupId}/settlements`),
  recordSettlementPayment: (groupId: number, body: any) => request<any>(`/groups/${groupId}/settlements/record-payment`, { method: 'POST', body: JSON.stringify(body) }),
  deleteSettlementPayment: (groupId: number, paymentId: number) => request<any>(`/groups/${groupId}/settlements/${paymentId}`, { method: 'DELETE' }),

  // Analytics & Activity
  getAnalytics: (groupId: number, params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return request<any>(`/groups/${groupId}/analytics?${q.toString()}`);
  },
  getActivities: (groupId: number) => request<any[]>(`/groups/${groupId}/activities`),

  // Demo seed
  seedDemo: () => request<any>('/demo/seed', { method: 'POST' }),
};
