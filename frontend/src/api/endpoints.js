// Endpoint calls yang memanfaatkan client.js
import api from './client';

// ── Settings ──────────────────────────────────────────────────
export const getPublicSettings = () => api.get('/settings/public');

// ── Master Data ───────────────────────────────────────────────
export const getCategories  = () => api.get('/categories');
export const getMotorTypes  = () => api.get('/motor-types');

// ── Produk Publik ─────────────────────────────────────────────
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const query = qs.toString();
  return api.get('/products' + (query ? '?' + query : ''));
};

export const getProduct = (slugOrCode) => api.get(`/products/${encodeURIComponent(slugOrCode)}`);

export const getRelatedProducts = (id) => api.get(`/products/${id}/related`);

// ── Keranjang ─────────────────────────────────────────────────
export const validateCart = (items) => api.post('/cart/validate', { items });

// ── Pesanan ───────────────────────────────────────────────────
export const createOrder   = (data) => api.post('/orders', data);
export const getOrderByCode = (code, token) => api.get(`/orders/${code}?token=${encodeURIComponent(token)}`);

// ── AI ────────────────────────────────────────────────────────
export const aiChat          = (data) => api.post('/ai/chat', data);
export const aiSearch        = (data) => api.post('/ai/search', data);
export const aiCompatibility = (data) => api.post('/ai/compatibility', data);

// ── Admin ─────────────────────────────────────────────────────
export const adminLogin  = (email, password) => api.post('/admin/login', { email, password });
export const adminLogout = () => api.post('/admin/logout');
export const adminMe     = () => api.get('/admin/me');

export const adminGetDashboard = () => api.get('/admin/dashboard');

export const adminGetProducts     = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get('/admin/products' + (qs ? '?' + qs : ''));
};
export const adminGetProduct  = (id) => api.get(`/admin/products/${id}`);
export const adminCreateProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const adminNextCode = (categoryId) => api.get(`/admin/products/next-code?category_id=${categoryId}`);
export const adminUploadImages = (id, formData) =>
  api.post(`/admin/products/${id}/images`, formData, { headers: {} }); // FormData: tanpa Content-Type
export const adminDeleteImage = (id, imageId) => api.delete(`/admin/products/${id}/images/${imageId}`);
export const adminPatchImage  = (id, imageId, data) => api.patch(`/admin/products/${id}/images/${imageId}`, data);
export const adminPatchStock  = (id, data) => api.patch(`/admin/products/${id}/stock`, data);
export const adminPatchStatus = (id, data) => api.patch(`/admin/products/${id}/status`, data);

export const adminGetOrders     = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get('/admin/orders' + (qs ? '?' + qs : ''));
};
export const adminGetOrder     = (id) => api.get(`/admin/orders/${id}`);
export const adminCountNewOrders = () => api.get('/admin/orders/count-new');
export const adminPatchOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, { status });
export const adminPatchOrderNote   = (id, note) => api.patch(`/admin/orders/${id}/note`, { note });

export const adminGetCategories     = () => api.get('/admin/categories');
export const adminCreateCategory    = (data) => api.post('/admin/categories', data);
export const adminUpdateCategory    = (id, data) => api.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory    = (id) => api.delete(`/admin/categories/${id}`);

export const adminGetMotorTypes     = () => api.get('/admin/motor-types');
export const adminCreateMotorType   = (data) => api.post('/admin/motor-types', data);
export const adminUpdateMotorType   = (id, data) => api.put(`/admin/motor-types/${id}`, data);
export const adminDeleteMotorType   = (id) => api.delete(`/admin/motor-types/${id}`);

export const adminGetSettings    = () => api.get('/admin/settings');
export const adminUpdateSettings = (data) => api.put('/admin/settings', data);
export const adminChangePassword = (data) => api.put('/admin/password', data);

export const adminGetStockReport   = (format = 'json') => api.get(`/admin/reports/stock?format=${format}`);
export const adminGetOrderReport   = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get('/admin/reports/orders' + (qs ? '?' + qs : ''));
};

export const adminAiDescribeProduct = (data) => api.post('/admin/ai/describe-product', data);

