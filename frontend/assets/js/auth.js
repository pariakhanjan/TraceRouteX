// =========================================
// AUTHENTICATION MANAGER
// =========================================

const Auth = {
  // ذخیره Token و اطلاعات کاربر
  saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // دریافت اطلاعات کاربر
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // چک کردن لاگین بودن
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  // خروج از سیستم
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },

  // چک کردن نقش کاربر
  hasRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  },

  // Guard برای صفحات محافظت شده
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  },

  // Guard برای نقش‌های خاص
  requireRole(...roles) {
    if (!this.requireAuth()) return false;
    
    if (!this.hasRole(...roles)) {
      Utils.showAlert('شما دسترسی به این بخش را ندارید', 'error');
      window.location.href = '/pages/dashboard.html';
      return false;
    }
    return true;
  },

  // نمایش نام کاربر در Navbar
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
