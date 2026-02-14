// =========================================
// AUTHENTICATION MANAGER
// =========================================

const Auth = {
  // Save Token and user information
  saveAuth(token, user) {
    // ✅ FIX: اطمینان از ذخیره string token نه object
    if (typeof token === 'object') {
      console.error('⚠️ Token should be string, not object:', token);
      return;
    }
    
    if (!token || !user) {
      console.error('❌ saveAuth failed: missing token or user', { token, user });
      throw new Error('Cannot save auth: missing token or user');
    }
    
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Auth saved successfully');
      console.log('  - Token:', token.substring(0, 20) + '...');
      console.log('  - User:', user.username || user.email);
    } catch (error) {
      console.error('❌ Failed to save auth:', error);
      throw error;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get user information
  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.warn('⚠️ No user in localStorage');
        return null;
      }
      const user = JSON.parse(userStr);
      
      // ✅ Validation: بررسی که user یک object معتبر است
      if (!user || typeof user !== 'object') {
        console.error('❌ Invalid user object in localStorage');
        localStorage.removeItem('user');
        return null;
      }
      
      return user;
    } catch (e) {
      console.error('❌ Error parsing user from localStorage:', error);
      localStorage.removeItem('user'); // پاک کردن داده خراب
      return null;
    }
  },

  // Check if logged in
  isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = this.getUser();
    
    // ✅ هر دو باید موجود باشند
    return !!(token && user);
  },

  // Logout
  logout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },

  // Check user role
  hasRole(...roles) {
    const user = this.getUser();
    
    if (!user) {
      console.warn('⚠️ hasRole: user is null');
      return false;
    }
    
    if (!user.role) {
      console.warn('⚠️ hasRole: user.role is undefined');
      return false;
    }
    return roles.includes(user.role);
  },

  // Guard for protected pages
  requireAuth() {
    if (!this.isLoggedIn()) {
      console.warn('⚠️ Not logged in, redirecting to login...');
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  },

  // Guard for specific roles
  requireRole(...roles) {
    if (!this.requireAuth()) return false;

    if (!this.hasRole(...roles)) {
      console.warn('⚠️ Insufficient permissions, redirecting to dashboard...');
      Utils.showAlert('You do not have access to this section', 'error');
      window.location.href = '/pages/dashboard.html';
      return false;
    }
    return true;
  },

  // Display user name in Navbar
  displayUserInfo() {
    const user = this.getUser();
    
    // ✅ FIX: اضافه کردن چک امنیتی
    if (!user) {
      console.error('❌ displayUserInfo: user is null');
      console.log('📊 Debug info:');
      console.log('  - Token exists:', !!localStorage.getItem('token'));
      console.log('  - User exists:', !!localStorage.getItem('user'));
      console.log('  - User raw:', localStorage.getItem('user'));
      
      // اگر user نیست، logout کن
      this.logout();
      return;
    }

    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(el => {
      el.textContent = user.full_name || user.username || user.email || 'User';
    });

    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(el => {
      el.textContent = Utils.translateRole(user.role);
    });

    console.log('✅ User info displayed:', user.username || user.email);
  },

  // ✅ Helper: دریافت token
  getToken() {
    return localStorage.getItem('token');
  },
  
  // ✅ Debug helper
  debugAuth() {
    console.log('=== AUTH DEBUG ===');
    console.log('Token:', this.getToken());
    console.log('User:', this.getUser());
    console.log('Is Logged In:', this.isLoggedIn());
    console.log('Has Admin Role:', this.hasRole('admin'));
  }
};

window.Auth = Auth;
