import type { DesignSuggestion, Preference, Project, ProjectDetail, Room, SafetyRecommendation, UserSession } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
let unauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function messageFromErrorBody(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const body = error as { error?: string; fields?: Record<string, string> };
    if (body.fields && Object.keys(body.fields).length > 0) {
      return Object.entries(body.fields).map(([field, message]) => `${field}: ${message}`).join(', ');
    }
    return body.error ?? fallback;
  }
  return fallback;
}

function friendlyStatusMessage(status: number, fallback: string) {
  if (status === 401) return 'Your session expired. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested item could not be found.';
  if (status >= 500) return 'Server error. Please try again in a moment.';
  return fallback;
}

async function request<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(messageFromErrorBody(error, friendlyStatusMessage(response.status, 'Request failed')), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  setUnauthorizedHandler: (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
  },
  register: (payload: { name: string; email: string; password: string }) =>
    request<UserSession>('/auth/register', undefined, { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<UserSession>('/auth/login', undefined, { method: 'POST', body: JSON.stringify(payload) }),
  projects: (token: string) => request<Project[]>('/projects', token),
  createProject: (token: string, payload: { name: string; description: string }) =>
    request<Project>('/projects', token, { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (token: string, id: number, payload: { name: string; description: string }) =>
    request<Project>(`/projects/${id}`, token, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (token: string, id: number) => request<void>(`/projects/${id}`, token, { method: 'DELETE' }),
  projectDetail: (token: string, id: number) => request<ProjectDetail>(`/projects/${id}`, token),
  uploadBlueprint: (token: string, id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/projects/${id}/blueprint`, token, { method: 'POST', body: form });
  },
  blueprintFile: async (token: string, id: number) => {
    const response = await fetch(`${API_URL}/projects/${id}/blueprint/file`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new ApiError(messageFromErrorBody(error, friendlyStatusMessage(response.status, 'Could not load blueprint')), response.status);
    }
    return response.blob();
  },
  addRoom: (token: string, id: number, payload: { name: string; type: string; length: number; width: number }) =>
    request<Room>(`/projects/${id}/rooms`, token, { method: 'POST', body: JSON.stringify(payload) }),
  updateRoom: (token: string, projectId: number, roomId: number, payload: { name: string; type: string; length: number; width: number }) =>
    request<Room>(`/projects/${projectId}/rooms/${roomId}`, token, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRoom: (token: string, projectId: number, roomId: number) =>
    request<void>(`/projects/${projectId}/rooms/${roomId}`, token, { method: 'DELETE' }),
  savePreference: (token: string, id: number, payload: { style: string; budget: string; colorPalette: string }) =>
    request<Preference>(`/projects/${id}/preferences`, token, { method: 'POST', body: JSON.stringify(payload) }),
  suggestions: (token: string, id: number) => request<DesignSuggestion[]>(`/projects/${id}/suggestions`, token),
  safety: (token: string, id: number) => request<SafetyRecommendation[]>(`/projects/${id}/safety`, token)
};
