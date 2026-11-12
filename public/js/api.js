/**
 * Active Student Portal - API Client
 * Centralized REST API client for campus services.
 */

const API_BASE = window.location.origin;

class ApiClient {
  static getHeaders() {
    const user = ApiClient.getStoredUser();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (user && user.id) {
      headers['x-user-id'] = user.id;
    }
    return headers;
  }

  static getStoredUser() {
    try {
      const data = localStorage.getItem('active_student_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static setStoredUser(user) {
    if (user) {
      localStorage.setItem('active_student_user', JSON.stringify(user));
      localStorage.setItem('anurag_voting_session', JSON.stringify({
        name: user.fullName || user.displayName || 'Student',
        email: user.email,
        userId: user.id
      }));
    } else {
      localStorage.removeItem('active_student_user');
      localStorage.removeItem('anurag_voting_session');
    }
  }

  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultHeaders = ApiClient.getHeaders();

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // --- AUTH ---
  static async login(email, password) {
    const data = await ApiClient.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data.user) {
      ApiClient.setStoredUser(data.user);
    }
    return data;
  }

  static async register(userData) {
    const data = await ApiClient.request('/api/auth/register', {
      method: 'POST',
      body: userData
    });
    if (data.user) {
      ApiClient.setStoredUser(data.user);
    }
    return data;
  }

  static logout() {
    ApiClient.setStoredUser(null);
    window.location.href = 'login.html';
  }

  // --- CANTEEN ---
  static async getCanteenMenu() {
    return ApiClient.request('/api/canteen/menu');
  }

  static async addCanteenMenuItem(item) {
    return ApiClient.request('/api/canteen/menu', {
      method: 'POST',
      body: item
    });
  }

  static async updateCanteenMenuItem(id, updates) {
    return ApiClient.request(`/api/canteen/menu/${id}`, {
      method: 'PATCH',
      body: updates
    });
  }

  static async deleteCanteenMenuItem(id) {
    return ApiClient.request(`/api/canteen/menu/${id}`, {
      method: 'DELETE'
    });
  }

  static async getCanteenOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return ApiClient.request(`/api/canteen/orders${query ? '?' + query : ''}`);
  }

  static async placeCanteenOrder(orderData) {
    return ApiClient.request('/api/canteen/orders', {
      method: 'POST',
      body: orderData
    });
  }

  static async updateOrderStatus(orderId, status) {
    return ApiClient.request(`/api/canteen/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status }
    });
  }

  static async getCart(userId) {
    return ApiClient.request(`/api/canteen/cart?userId=${encodeURIComponent(userId)}`);
  }

  static async saveCart(userId, items) {
    return ApiClient.request('/api/canteen/cart', {
      method: 'POST',
      body: { userId, items }
    });
  }

  static async getCanteenStats() {
    return ApiClient.request('/api/canteen/stats');
  }

  // --- VOTING ---
  static async getElections() {
    return ApiClient.request('/api/voting/elections');
  }

  static async getElection(id) {
    return ApiClient.request(`/api/voting/elections/${id}`);
  }

  static async createElection(electionData) {
    return ApiClient.request('/api/voting/elections', {
      method: 'POST',
      body: electionData
    });
  }

  static async updateElection(id, updates) {
    return ApiClient.request(`/api/voting/elections/${id}`, {
      method: 'PATCH',
      body: updates
    });
  }

  static async deleteElection(id) {
    return ApiClient.request(`/api/voting/elections/${id}`, {
      method: 'DELETE'
    });
  }

  static async castVote(electionId, candidateId, userId, voterInfo) {
    return ApiClient.request(`/api/voting/elections/${electionId}/vote`, {
      method: 'POST',
      body: { candidateId, userId, voterInfo }
    });
  }

  static async addCandidate(electionId, candidateData) {
    return ApiClient.request(`/api/voting/elections/${electionId}/candidates`, {
      method: 'POST',
      body: candidateData
    });
  }

  static async deleteCandidate(electionId, candidateId) {
    return ApiClient.request(`/api/voting/elections/${electionId}/candidates/${candidateId}`, {
      method: 'DELETE'
    });
  }

  // --- TRACURRENCY / LEDGER ---
  static async getLedgerEvents() {
    return ApiClient.request('/api/ledger/events');
  }

  static async getLedgerEvent(id) {
    return ApiClient.request(`/api/ledger/events/${id}`);
  }

  static async createLedgerEvent(eventData) {
    return ApiClient.request('/api/ledger/events', {
      method: 'POST',
      body: eventData
    });
  }

  static async updateLedgerEvent(id, updates) {
    return ApiClient.request(`/api/ledger/events/${id}`, {
      method: 'PATCH',
      body: updates
    });
  }

  static async deleteLedgerEvent(id) {
    return ApiClient.request(`/api/ledger/events/${id}`, {
      method: 'DELETE'
    });
  }

  static async getTransactions(eventId) {
    const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    return ApiClient.request(`/api/ledger/transactions${q}`);
  }

  static async addTransaction(txData) {
    return ApiClient.request('/api/ledger/transactions', {
      method: 'POST',
      body: txData
    });
  }
}

// Make accessible to all scripts
window.API = ApiClient;
