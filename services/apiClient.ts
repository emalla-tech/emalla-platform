import { apiUrl } from './apiConfig';
import { monitoringService } from './monitoringService';

const request = async (path: string, init: RequestInit = {}) => {
  const token = localStorage.getItem('emalla_token');
  const headers = new Headers(init.headers || {});
  if (init.body != null && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers
    });
  } catch (error) {
    monitoringService.reportApiError({
      path,
      message: error instanceof Error ? error.message : 'Backend unavailable'
    });
    throw new Error('Backend unavailable. Restart the app and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) {
      monitoringService.reportApiError({
        path,
        statusCode: response.status,
        message: data.error || 'Server request failed',
        requestId: data.requestId || response.headers.get('x-request-id') || undefined
      });
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

export const apiClient = {
  async warmBackend() {
    return request('/health?warm=1');
  },

  async login(email: string, password: string) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(params: { name: string; email: string; password: string; role: string }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async createSellerApplication(params: {
    businessName: string;
    category: string;
    email: string;
    phone: string;
    logoUrl?: string;
    supportingDocumentUrl?: string;
  }) {
    return request('/seller/applications', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async checkSellerApplicationStatus(params: { email: string; phone: string }) {
    return request('/seller/applications/status-check', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async verifyToken(token: string) {
    return request('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  async requestPasswordReset(email: string) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token: string, password: string) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  },

  async getSessions() {
    return request('/auth/sessions');
  },

  async logoutCurrentSession() {
    return request('/auth/logout', {
      method: 'DELETE'
    });
  },

  async logoutAllSessions() {
    return request('/auth/logout-all', {
      method: 'DELETE'
    });
  },

  async getPublicInsights() {
    return request('/public/insights');
  },

  async submitContactForm(params: { name: string; email: string; subject: string; message: string }) {
    return request('/contact', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async submitInvestorInquiry(params: { name: string; email: string; company: string; message: string }) {
    return request('/investor-inquiries', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getAddresses() {
    return request('/addresses');
  },

  async getWishlist() {
    return request('/wishlist');
  },

  async addToWishlist(productId: string) {
    return request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
  },

  async removeFromWishlist(productId: string) {
    return request(`/wishlist/${productId}`, {
      method: 'DELETE'
    });
  },

  async createAddress(params: { name: string; district: string; sector: string; street: string }) {
    return request('/addresses', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async deleteAddress(addressId: string) {
    return request(`/addresses/${addressId}`, {
      method: 'DELETE'
    });
  },

  async updateAddress(addressId: string, params: { name: string; district: string; sector: string; street: string }) {
    return request(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async setDefaultAddress(addressId: string) {
    return request(`/addresses/${addressId}/default`, {
      method: 'PUT'
    });
  },

  async getOrders() {
    return request('/orders');
  },

  async getProductReviews(productId: string) {
    return request(`/products/${productId}/reviews`);
  },

  async submitProductReview(productId: string, rating: number, comment: string) {
    return request(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },

  async getOrderPool() {
    return request('/orders?scope=pool');
  },

  async getOrder(orderId: string, options?: { email?: string; phone?: string }) {
    const searchParams = new URLSearchParams();
    if (options?.email) {
      searchParams.set('email', options.email);
    }
    if (options?.phone) {
      searchParams.set('phone', options.phone);
    }

    const query = searchParams.toString();
    return request(`/orders/${orderId}${query ? `?${query}` : ''}`);
  },

  async createOrder(params: object) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getSupportTickets() {
    return request('/support/tickets');
  },

  async createSupportTicket(params: object) {
    return request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async updateOrderStatus(orderId: string, status: string) {
    return request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async confirmOrderReceived(orderId: string, options?: { email?: string; phone?: string }) {
    return request(`/orders/${orderId}/confirm-received`, {
      method: 'PUT',
      body: JSON.stringify(options || {})
    });
  },

  async assignRider(orderId: string, riderId: string, riderName: string) {
    return request(`/orders/${orderId}/assign-rider`, {
      method: 'PUT',
      body: JSON.stringify({ riderId, riderName })
    });
  },

  async updateOrderRiderPayout(orderId: string, riderPayout: number) {
    return request(`/orders/${orderId}/rider-payout`, {
      method: 'PUT',
      body: JSON.stringify({ riderPayout })
    });
  },

  async cancelOrder(orderId: string, options?: { email?: string; phone?: string }) {
    return request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(options || {})
    });
  },

  async initiatePayment(params: object) {
    return request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async verifyPayment(txRef: string, options?: { orderId?: string; email?: string }) {
    const searchParams = new URLSearchParams();
    if (options?.orderId) {
      searchParams.set('order_id', options.orderId);
    }
    if (options?.email) {
      searchParams.set('email', options.email);
    }

    const query = searchParams.toString();
    return request(`/payments/verify/${encodeURIComponent(txRef)}${query ? `?${query}` : ''}`);
  },

  async submitManualPayment(params: { txRef: string; orderId: string; email: string; payerPhone: string; bankReference: string }) {
    return request('/payments/manual/submit', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getNotifications() {
    return request('/notifications');
  },

  async createNotification(params: object) {
    return request('/notifications', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async markNotificationRead(notificationId: string) {
    return request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead() {
    return request('/notifications/read-all', {
      method: 'PUT'
    });
  },

  async deleteNotification(notificationId: string) {
    return request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  },

  async getMerchantWallet() {
    return request('/wallet/merchant');
  },

  async getMerchantSettings() {
    return request('/merchant/settings');
  },

  async updateMerchantSettings(params: object) {
    return request('/merchant/settings', {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async requestMerchantPayout(amount: number) {
    return request('/wallet/merchant/payout', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  },

  async getRiderWallet() {
    return request('/wallet/rider');
  },

  async getRiderProfile() {
    return request('/rider/profile');
  },

  async updateRiderProfile(params: {
    phone: string;
    mobileMoneyNumber?: string;
    vehicleNumber?: string;
    emergencyContact?: string;
  }) {
    return request('/rider/profile', {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async createRiderApplication(params: {
    name: string;
    email: string;
    phone: string;
    vehicleNumber: string;
  }) {
    return request('/rider/applications', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async checkRiderApplicationStatus(params: { email: string; phone: string }) {
    return request('/rider/applications/status-check', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async updateRiderStatus(isOnline: boolean) {
    return request('/rider/status', {
      method: 'PUT',
      body: JSON.stringify({ isOnline })
    });
  },

  async getAdminStats() {
    return request('/admin/stats');
  },

  async getAdminMonitoring() {
    return request('/admin/monitoring');
  },

  async getAdminFinance() {
    return request('/admin/finance');
  },

  async getAdminPaymentClaims() {
    return request('/admin/payment-claims');
  },

  async reviewAdminPaymentClaim(paymentId: string, status: 'approved' | 'rejected') {
    return request(`/admin/payment-claims/${paymentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getAdminPayouts() {
    return request('/admin/payouts');
  },

  async updateAdminPayoutStatus(payoutId: string, status: 'success' | 'failed') {
    return request(`/admin/payouts/${payoutId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getAdminSettings() {
    return request('/admin/settings');
  },

  async updateAdminSettings(params: object) {
    return request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async getAdminSellers(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/sellers${search}`);
  },

  async getAdminUsers(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/users${search}`);
  },

  async getAdminStaff() {
    return request('/admin/staff');
  },

  async createAdminStaff(params: {
    name: string;
    email: string;
    phone?: string;
    role: 'LOGISTICS' | 'FINANCE' | 'SUPPORT';
    staffLevel: 'officer' | 'manager';
  }) {
    return request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async updateAdminStaff(
    staffId: string,
    params: {
      name?: string;
      phone?: string;
      role?: 'LOGISTICS' | 'FINANCE' | 'SUPPORT';
      staffLevel?: 'officer' | 'manager';
      status?: 'active' | 'suspended';
    }
  ) {
    return request(`/admin/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async getAdminInquiries(type: string = 'all') {
    const search = type && type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';
    return request(`/admin/inquiries${search}`);
  },

  async getAdminEmailLogs(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/email-logs${search}`);
  },

  async getAdminEmailStatus() {
    return request('/admin/email-status');
  },

  async updateAdminInquiryStatus(inquiryId: string, status: 'new' | 'replied' | 'resolved') {
    return request(`/admin/inquiries/${inquiryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async updateAdminInquiry(
    inquiryId: string,
    params: { status?: 'new' | 'replied' | 'resolved'; internalNotes?: string; responseMessage?: string; assignToSelf?: boolean }
  ) {
    return request(`/admin/inquiries/${inquiryId}`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  async getAdminSellerApplications(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/seller-applications${search}`);
  },

  async approveAdminSellerApplication(applicationId: string) {
    return request(`/admin/seller-applications/${applicationId}/approve`, {
      method: 'PUT'
    });
  },

  async rejectAdminSellerApplication(applicationId: string, reason: string) {
    return request(`/admin/seller-applications/${applicationId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  async updateAdminSellerStatus(sellerId: string, status: 'active' | 'pending' | 'suspended') {
    return request(`/admin/sellers/${sellerId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getAdminProducts(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/products${search}`);
  },

  async getAdminRiders(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/riders${search}`);
  },

  async getAdminRiderApplications(status: string = 'all') {
    const search = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/rider-applications${search}`);
  },

  async approveAdminRiderApplication(applicationId: string) {
    return request(`/admin/rider-applications/${applicationId}/approve`, {
      method: 'PUT'
    });
  },

  async rejectAdminRiderApplication(applicationId: string, reason: string) {
    return request(`/admin/rider-applications/${applicationId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  async updateAdminRiderStatus(riderId: string, status: 'active' | 'offline' | 'suspended') {
    return request(`/admin/riders/${riderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  async getAdminSessions(role: string = 'all', suspiciousOnly: boolean = false) {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.set('role', role);
    if (suspiciousOnly) params.set('suspicious', 'true');
    const search = params.toString() ? `?${params.toString()}` : '';
    return request(`/admin/sessions${search}`);
  },

  async revokeAdminSession(sessionId: string) {
    return request(`/admin/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  },

  async revokeAdminUserSessions(userId: string) {
    return request(`/admin/sessions/user/${userId}`, {
      method: 'DELETE'
    });
  }
};
