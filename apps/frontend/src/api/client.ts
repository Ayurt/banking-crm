import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: { id: string; email: string; name: string; role: string };
  };
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function runAgentQuery(query: string) {
  const { data } = await api.post('/agent/query', { query });
  return data;
}

export async function getAnalytics() {
  const { data } = await api.get('/analytics/summary');
  return data;
}

export async function getEvaluationBenchmarks() {
  const { data } = await api.get('/evaluation/benchmarks');
  return data;
}

export async function getEvaluationMetrics() {
  const { data } = await api.get('/evaluation/metrics');
  return data;
}

export async function getPendingMessages() {
  const { data } = await api.get('/messaging/pending');
  return data;
}

export async function updateMessage(id: string, payload: { status: string; content?: string }) {
  const { data } = await api.patch(`/messaging/${id}`, payload);
  return data;
}

export async function getCustomers(page = 1, q?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (q) params.set('q', q);
  const { data } = await api.get(`/customers?${params}`);
  return data;
}

export async function getCustomerProfile(id: string) {
  const { data } = await api.get(`/customers/${id}/profile`);
  return data;
}

export async function getRecommendations(page = 1) {
  const { data } = await api.get(`/recommendations?page=${page}&pageSize=20`);
  return data;
}

export async function getCampaigns(page = 1) {
  const { data } = await api.get(`/campaigns?page=${page}&pageSize=20`);
  return data;
}

export async function getAuditLogs(page = 1) {
  const { data } = await api.get(`/audit?page=${page}&pageSize=20&order=desc`);
  return data;
}

export async function getFeatureFlags() {
  const { data } = await api.get('/feature-flags');
  return data;
}

export async function updateFeatureFlag(key: string, enabled: boolean) {
  const { data } = await api.patch(`/feature-flags/${key}`, { enabled });
  return data;
}
