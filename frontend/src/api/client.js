let csrfToken = '';

export function setCsrfToken(token) {
  csrfToken = token || '';
}

export function getCsrfToken() {
  return csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Attach CSRF token if available and method is state-changing
  const method = (options.method || 'GET').toUpperCase();
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // Handle JSON body
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      body,
      credentials: 'include', // penting untuk sesi PHP
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null };
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const err = new Error(json?.error?.message || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.code = json?.error?.code || 'UNKNOWN_ERROR';
      err.fields = json?.error?.fields || {};
      
      // Handle 401 Unauthorized for admin
      if (response.status === 401 && endpoint.includes('/admin') && !endpoint.includes('/admin/login')) {
        window.dispatchEvent(new CustomEvent('pepso:unauthorized'));
      }

      throw err;
    }

    return json;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const networkErr = new Error('Tidak dapat terhubung ke server backend. Pastikan server PHP aktif.');
      networkErr.code = 'NETWORK_ERROR';
      networkErr.status = 0;
      throw networkErr;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

