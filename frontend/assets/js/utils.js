// =========================================
// UTILITY FUNCTIONS
// =========================================

const Utils = {
  // Display message to user
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

  // Format Persian date
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

  // Format relative time (e.g., "5 minutes ago")
  formatRelativeTime(date) {
    const diff = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  },

  // Validate Email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate Password (minimum 6 characters)
  validatePassword(password) {
    return password.length >= 6;
  },

  // Show/Hide Loading Spinner
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

  // Translate Status to English
  translateStatus(status) {
    const translations = {
      'operational': 'Operational',
      'degraded': 'Degraded Performance',
      'down': 'Down',
      'maintenance': 'Under Maintenance',
      'investigating': 'Investigating',
      'identified': 'Identified',
      'monitoring': 'Monitoring',
      'resolved': 'Resolved',
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    return translations[status] || status;
  },

  // Translate Role to English
  translateRole(role) {
    const translations = {
      'admin': 'Administrator',
      'operator': 'Operator',
      'user': 'User'
    };
    return translations[role] || role;
  },

  // Badge color based on Status
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

  // Debounce for Search
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
      this.showAlert('Copied!', 'success', 1500);
    });
  }
};

// Export for use in other files
window.Utils = Utils;
