// utils.js - Utility functions

const Utils = {
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    // ==========================================
    // Alert System
    // ==========================================

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert-toast');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-toast alert-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        alertDiv.innerHTML = `
      <span class="alert-icon">${icons[type] || icons.info}</span>
      <span class="alert-message">${message}</span>
      <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    },

    // ==========================================
    // Loading States
    // ==========================================

    showLoading(element) {
        if (!element) return;

        element.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
    },

    hideLoading() {
        const loadingElements = document.querySelectorAll('.loading-state');
        loadingElements.forEach(el => el.remove());
    },

    // ==========================================
    // Date/Time Formatting
    // ==========================================

    formatPersianDate(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);

        // Simple Persian date formatting (you can use a library like moment-jalaali for accurate conversion)
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleString('fa-IR', options);
    },

    formatRelativeTime(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return this.formatPersianDate(dateString);
        }
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleString('en-US', options);
    },

    formatDate(dateString) {
        if (!dateString) return '-';
    
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
    
        return date.toLocaleString('en-US', options);
    },

    // ==========================================
    // Validation
    // ==========================================

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
        return passwordRegex && password.length >= 8;
    },

    validateUsername(username) {
        // 3-50 characters, alphanumeric and underscores only
        const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
        return usernameRegex.test(username);
    },

    // ==========================================
    // Translations (matching database ENUM values)
    // ==========================================

    translateStatus(status) {
        const translations = {
            // Service statuses (matching service_status ENUM)
            'up': 'Operational',
            'degraded': 'Degraded Performance',
            'down': 'Down',

            // Incident statuses (matching incident_status ENUM)
            'open': 'Open',
            'resolved': 'Resolved',

            // Incident severities (matching incident_severity ENUM)
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical',

            // User roles (matching user_role ENUM)
            'viewer': 'Viewer',
            'engineer': 'Engineer',
            'admin': 'Administrator'
        };

        return translations[status] || status;
    },

    translateRole(role) {
        return this.translateStatus(role);
    },

    // ==========================================
    // Badge Classes
    // ==========================================

    getStatusBadgeClass(status) {
        const classes = {
            // Service statuses
            'up': 'success',
            'degraded': 'warning',
            'down': 'danger',

            // Incident statuses
            'open': 'warning',
            'resolved': 'success',

            // Incident severities
            'low': 'info',
            'medium': 'warning',
            'high': 'danger',
            'critical': 'danger'
        };

        return classes[status] || 'info';
    },

    getSeverityBadgeClass(severity) {
        return this.getStatusBadgeClass(severity);
    },

    getRoleBadgeClass(role) {
        const classes = {
            'viewer': 'info',
            'engineer': 'warning',
            'admin': 'danger'
        };

        return classes[role] || 'info';
    },

    // ==========================================
    // String Helpers
    // ==========================================

    truncate(str, maxLength = 100) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // ==========================================
    // URL Helpers
    // ==========================================

    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    setQueryParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    },

    // ==========================================
    // Confirmation Dialogs
    // ==========================================

    confirm(message) {
        return window.confirm(message);
    },

    // ==========================================
    // Copy to Clipboard
    // ==========================================

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showAlert('Copied to clipboard!', 'success');
            return true;
        } catch (error) {
            this.showAlert('Failed to copy', 'error');
            return false;
        }
    },

    // ==========================================
    // Debounce
    // ==========================================

    debounce(func, wait = 300) {
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

    // ==========================================
    // Local Storage Helpers
    // ==========================================

    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },

    // ==========================================
    // Data Formatting
    // ==========================================

    formatNumber(num) {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('en-US').format(num);
    },

    formatPercentage(num, decimals = 2) {
        if (num === null || num === undefined) return '-';
        return num.toFixed(decimals) + '%';
    },

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        if (!bytes) return '-';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

        // ==========================================
    // Translation Helpers
    // ==========================================

    translateSeverity(severity) {
        const map = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical'
        };
        return map[severity] || severity || '-';
    },

    translateStatus(status) {
        const map = {
            investigating: 'Investigating',
            identified: 'Identified',
            monitoring: 'Monitoring',
            resolved: 'Resolved',
            open: 'Open',
            closed: 'Closed'
        };
        return map[status] || status || '-';
    },

    translateServiceStatus(status) {
        const map = {
            up: 'Up',
            degraded: 'Degraded',
            down: 'Down'
        };
        return map[status] || status || '-';
    },

    translateIncidentStatus(status) {
        const map = {
            open: 'Open',
            investigating: 'Investigating',
            identified: 'Identified',
            monitoring: 'Monitoring',
            resolved: 'Resolved',
            closed: 'Closed'
        };
        return map[status] || status || '-';
    },

        // ==========================================
    // Auth Check
    // ==========================================

    checkAuth() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    },

    logout() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
    }


};

// ✅ Make it available as both Utils and utils (for backward compatibility)
const utils = Utils;


// Add CSS for alerts dynamically
if (!document.querySelector('#utils-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-styles';
    style.textContent = `
    .alert-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 300px;
      max-width: 500px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .alert-toast.alert-success {
      border-left: 4px solid #10b981;
    }

    .alert-toast.alert-error {
      border-left: 4px solid #ef4444;
    }

    .alert-toast.alert-warning {
      border-left: 4px solid #f59e0b;
    }

    .alert-toast.alert-info {
      border-left: 4px solid #3b82f6;
    }

    .alert-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .alert-message {
      flex: 1;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .alert-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-close:hover {
      color: #6b7280;
    }

    .loading-state {
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .empty-state {
      padding: 3rem 2rem;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state-subtext {
      font-size: 0.875rem;
      color: #6b7280;
    }
  `;
    document.head.appendChild(style);
}
