/**
 * Active Student Portal - Authentication Handler
 */

const Auth = {
  getUser() {
    return API.getStoredUser();
  },

  isLoggedIn() {
    return !!API.getStoredUser();
  },

  requireAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  },

  initHeaderUI() {
    const user = this.getUser();
    const loading = document.getElementById('auth-loading');
    const guest = document.getElementById('auth-guest');
    const userDiv = document.getElementById('auth-user');
    const userNameEl = document.getElementById('user-name');

    if (loading) loading.style.display = 'none';

    if (user) {
      if (guest) guest.style.display = 'none';
      if (userDiv) userDiv.style.display = 'flex';
      if (userNameEl) userNameEl.innerText = user.fullName || user.displayName || user.email.split('@')[0];
    } else {
      if (userDiv) userDiv.style.display = 'none';
      if (guest) guest.style.display = 'flex';
    }
  },

  logout() {
    API.logout();
  }
};

window.Auth = Auth;
window.logout = () => Auth.logout();

