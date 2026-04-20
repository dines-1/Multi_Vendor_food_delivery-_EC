import api from './api';

const adminService = {
  // ==================== DASHBOARD ====================
  getKPI: () => api.get('/admin/dashboard/kpi').then(r => r.data),
  getRevenueChart: () => api.get('/admin/dashboard/revenue-chart').then(r => r.data),
  getOrdersChart: () => api.get('/admin/dashboard/orders-chart').then(r => r.data),
  getOrderStatus: () => api.get('/admin/dashboard/order-status').then(r => r.data),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders').then(r => r.data),
  getPendingVendors: () => api.get('/admin/dashboard/pending-vendors').then(r => r.data),

  // ==================== VENDORS ====================
  getVendors: (params = {}) => api.get('/admin/vendors', { params }).then(r => r.data),
  getVendorDetail: (id) => api.get(`/admin/vendors/${id}`).then(r => r.data),
  approveVendor: (id) => api.put(`/admin/vendors/${id}/approve`).then(r => r.data),
  rejectVendor: (id) => api.put(`/admin/vendors/${id}/reject`).then(r => r.data),
  suspendVendor: (id, reason) => api.put(`/admin/vendors/${id}/suspend`, { reason }).then(r => r.data),
  reactivateVendor: (id) => api.put(`/admin/vendors/${id}/reactivate`).then(r => r.data),
  setCommission: (id, commissionRate) => api.put(`/admin/vendors/${id}/commission`, { commissionRate }).then(r => r.data),
  getPerformance: (id) => api.get(`/admin/vendors/${id}/performance`).then(r => r.data),

  // ==================== USERS ====================
  getUsers: (params = {}) => api.get('/admin/users', { params }).then(r => r.data),
  getUserDetail: (id) => api.get(`/admin/users/${id}`).then(r => r.data),
  banUser: (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }).then(r => r.data),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`).then(r => r.data),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data),
  exportUsersCSV: () => api.get('/admin/users/export', { responseType: 'blob' }),

  // ==================== PRODUCTS ====================
  getProducts: (params = {}) => api.get('/admin/products', { params }).then(r => r.data),
  approveProduct: (id) => api.put(`/admin/products/${id}/approve`).then(r => r.data),
  rejectProduct: (id) => api.put(`/admin/products/${id}/reject`).then(r => r.data),
  removeProduct: (id, reason) => api.delete(`/admin/products/${id}`, { data: { reason } }).then(r => r.data),
  toggleFeatured: (id) => api.put(`/admin/products/${id}/featured`).then(r => r.data),

  // Categories (using consolidated Category model)
  getCategories: () => api.get('/admin/products/categories').then(r => r.data),
  createCategory: (data) => api.post('/admin/products/categories', data).then(r => r.data),
  updateCategory: (id, data) => api.put(`/admin/products/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id) => api.delete(`/admin/products/categories/${id}`).then(r => r.data),

  // Subcategories (using consolidated Category model with parentCategory)
  getSubcategories: (parentCategory) => api.get('/admin/products/subcategories', { params: { parentCategory } }).then(r => r.data),
  createSubcategory: (data) => api.post('/admin/products/subcategories', data).then(r => r.data),
  updateSubcategory: (id, data) => api.put(`/admin/products/subcategories/${id}`, data).then(r => r.data),
  deleteSubcategory: (id) => api.delete(`/admin/products/subcategories/${id}`).then(r => r.data),

  // Reviews
  removeReview: (id) => api.delete(`/admin/products/reviews/${id}`).then(r => r.data),

  // ==================== ORDERS ====================
  getOrders: (params = {}) => api.get('/admin/orders', { params }).then(r => r.data),
  getOrderDetail: (id) => api.get(`/admin/orders/${id}`).then(r => r.data),
  overrideOrderStatus: (id, status, note) => api.put(`/admin/orders/${id}/status`, { status, note }).then(r => r.data),
  handleRefund: (id, action, amount) => api.put(`/admin/orders/${id}/refund`, { action, amount }).then(r => r.data),
  exportOrdersCSV: () => api.get('/admin/orders/export', { responseType: 'blob' }),

  // Disputes (embedded in Order.dispute)
  getDisputes: (params = {}) => api.get('/admin/orders/disputes', { params }).then(r => r.data),
  getDisputeDetail: (id) => api.get(`/admin/orders/disputes/${id}`).then(r => r.data),
  resolveDispute: (id, resolution) => api.put(`/admin/orders/disputes/${id}/resolve`, { resolution }).then(r => r.data),

  // ==================== FINANCE ====================
  getRevenue: (params = {}) => api.get('/admin/finance/revenue', { params }).then(r => r.data),
  getCommissionSettings: () => api.get('/admin/finance/commission').then(r => r.data),
  updateCommission: (rate, vendorId) => api.put('/admin/finance/commission', { rate, vendorId }).then(r => r.data),
  getVendorEarnings: () => api.get('/admin/finance/vendor-earnings').then(r => r.data),
  getPayouts: (params = {}) => api.get('/admin/finance/payouts', { params }).then(r => r.data),
  processPayout: (id, status, transactionRef) => api.put(`/admin/finance/payouts/${id}`, { status, transactionRef }).then(r => r.data),
  exportFinanceCSV: () => api.get('/admin/finance/export', { responseType: 'blob' }),

  // ==================== SETTINGS ====================
  getShippingZones: () => api.get('/admin/settings/shipping-zones').then(r => r.data),
  createShippingZone: (data) => api.post('/admin/settings/shipping-zones', data).then(r => r.data),
  updateShippingZone: (id, data) => api.put(`/admin/settings/shipping-zones/${id}`, data).then(r => r.data),
  deleteShippingZone: (id) => api.delete(`/admin/settings/shipping-zones/${id}`).then(r => r.data),
  getSubAdmins: () => api.get('/admin/settings/sub-admins').then(r => r.data),
  createSubAdmin: (data) => api.post('/admin/settings/sub-admins', data).then(r => r.data),
  updateSubAdmin: (id, data) => api.put(`/admin/settings/sub-admins/${id}`, data).then(r => r.data),
  deleteSubAdmin: (id) => api.delete(`/admin/settings/sub-admins/${id}`).then(r => r.data),
};

export default adminService;
