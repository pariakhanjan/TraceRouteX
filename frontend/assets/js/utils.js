// =========================================
// UTILITY FUNCTIONS
// =========================================

const Utils = {
  // نمایش پیام به کاربر
  showAlert(message, type = 'info', duration = 3000) {
    const alertContainer = document.getElementById('alert-container') || this.createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.animation = 'slideInDown 0.3s ease-out';
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.style.animation = 'slideOutUp 0.3s ease-in';
      setTimeout(() => alert.remove(), 300);
    }, duration);
  },

  createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      width: 90%;
      max-width: 500px;
    `;
    document.body.appendChild(container);
    return container;
  },

  // فرمت کردن تاریخ شمسی
  formatPersianDate(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  },

  // فرمت کردن زمان نسبی (مثلاً "۵ دقیقه پیش")
  formatRelativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${days} روز پیش`;
  },

  // Validate Email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate Password (حداقل 6 کاراکتر)
  validatePassword(password) {
    return password.length >= 6;
  },

  // نمایش/مخفی کردن Loading Spinner
  showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    container.appendChild(spinner);
  },

  hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
  },

  // تبدیل Status به فارسی
  translateStatus(status) {
    const translations = {
      'operational': 'عملیاتی',
      'degraded': 'کاهش عملکرد',
      'down': 'خارج از سرویس',
      'maintenance': 'در دست تعمیر',
      'investigating': 'در حال بررسی',
      'identified': 'شناسایی شده',
      'monitoring': 'در حال نظارت',
      'resolved': 'حل شده',
      'low': 'کم',
      'medium': 'متوسط',
      'high': 'زیاد',
      'critical': 'بحرانی'
    };
    return translations[status] || status;
  },

  // تبدیل Role به فارسی
  translateRole(role) {
    const translations = {
      'admin': 'مدیر',
      'operator': 'اپراتور',
      'user': 'کاربر'
    };
    return translations[role] || role;
  },

  // رنگ Badge بر اساس Status
  getStatusBadgeClass(status) {
    const classes = {
      'operational': 'badge-success',
      'degraded': 'badge-warning',
      'down': 'badge-danger',
      'maintenance': 'badge-info',
      'resolved': 'badge-success',
      'investigating': 'badge-warning',
      'identified': 'badge-info',
      'monitoring': 'badge-warning'
    };
    return classes[status] || 'badge-info';
  },

  // Debounce برای Search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Copy to Clipboard
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showAlert('کپی شد!', 'success', 1500);
    });
  }
};

// Export for use in other files
window.Utils = Utils;
