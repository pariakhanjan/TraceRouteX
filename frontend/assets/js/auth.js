// =========================================
// AUTHENTICATION MANAGER
// =========================================

const Auth = {
  // Save Token and user information
  saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get user information
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if logged in
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },

  // Check user role
  hasRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  },

  // Guard for protected pages
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  },

  // Guard for specific roles
  requireRole(...roles) {
    if (!this.requireAuth()) return false;
    
    if (!this.hasRole(...roles)) {
      Utils.showAlert('You do not have access to this section', 'error');
      window.location.href = '/pages/dashboard.html';
      return false;
    }
    return true;
  },

  // Display user name in Navbar
  displayUserInfo() {
    const user = this.getUser();
    if (!user) return;

    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(el => {
      el.textContent = user.full_name || user.username;
    });

    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(el => {
      el.textContent = Utils.translateRole(user.role);
    });
  }
};

window.Auth = Auth;