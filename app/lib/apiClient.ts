// src/lib/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, cache = 'default' } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    cache,
    credentials: 'include', // Para incluir cookies en la petición
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

// Función específica para POST
export async function apiPost<T>(
  endpoint: string,
  data: any,
  headers?: Record<string, string>
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: data,
    headers,
  });
}