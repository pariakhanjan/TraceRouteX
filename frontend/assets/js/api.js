// =========================================
// API HANDLER WITH MOCK DATA
// =========================================

const API = {
  // Base URL (فعلاً خالی، بعداً از Backend استفاده می‌کنیم)
  baseURL: 'http://localhost:3000/api',
  useMockData: true, // تا زمانی که Backend آماده نشده

  // Mock Data
  mockData: {
    users: [
      { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', full_name: 'مدیر سیستم' },
      { id: '2', username: 'operator1', email: 'operator@example.com', role: 'operator', full_name: 'اپراتور یک' },
      { id: '3', username: 'user1', email: 'user@example.com', role: 'user', full_name: 'کاربر یک' }
    ],
    services: [
      { 
        id: '1', 
        name: 'وب‌سایت اصلی', 
        description: 'سایت اصلی شرکت',
        url: 'https://example.com',
        status: 'operational',
        uptime_percentage: 99.95,
        response_time_avg: 120,
        created_at: '2026-01-01T10:00:00Z'
      },
      { 
        id: '2', 
        name: 'API سرویس', 
        description: 'API عمومی',
        url: 'https://api.example.com',
        status: 'operational',
        uptime_percentage: 99.80,
        response_time_avg: 85,
        created_at: '2026-01-01T10:00:00Z'
      },
      { 
        id: '3', 
        name: 'پایگاه داده', 
        description: 'سرور اصلی',
        url: 'postgres://db.example.com',
        status: 'degraded',
        uptime_percentage: 98.50,
        response_time_avg: 250,
        created_at: '2026-01-01T10:00:00Z'
      }
    ],
    incidents: [
      {
        id: '1',
        service_id: '3',
        title: 'کندی در پاسخ‌دهی',
        description: 'سرور با افزایش ترافیک مواجه است',
        severity: 'medium',
        status: 'monitoring',
        started_at: '2026-02-10T14:30:00Z',
        updates: [
          {
            id: '1',
            message: 'تیم فنی در حال بررسی مشکل است',
            status: 'investigating',
            created_at: '2026-02-10T14:35:00Z'
          },
          {
            id: '2',
            message: 'علت مشکل شناسایی شد',
            status: 'identified',
            created_at: '2026-02-10T15:00:00Z'
          }
        ]
      }
    ]
  },

  // Helper: Get Token
  getToken() {
    return localStorage.getItem('token');
  },

  // Helper: Make Request (Real API)
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطا در ارتباط با سرور');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Mock Delay (برای شبیه‌سازی تأخیر شبکه)
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ================== AUTH APIs ==================
  async login(username, password) {
    if (this.useMockData) {
      await this.delay();
      const user = this.mockData.users.find(u => u.username === username);
      if (user && password === 'password') {
        const token = 'mock_token_' + user.id;
        return { token, user };
      }
      throw new Error('نام کاربری یا رمز عبور اشتباه است');
    }
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async register(userData) {
    if (this.useMockData) {
      await this.delay();
      const newUser = {
        id: String(this.mockData.users.length + 1),
        ...userData,
        role: 'user'
      };
      this.mockData.users.push(newUser);
      const token = 'mock_token_' + newUser.id;
      return { token, user: newUser };
    }
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // ================== SERVICES APIs ==================
  async getServices() {
    if (this.useMockData) {
      await this.delay();
      return { services: this.mockData.services };
    }
    return this.request('/services');
  },

  async getServiceById(id) {
    if (this.useMockData) {
      await this.delay();
      const service = this.mockData.services.find(s => s.id === id);
      if (!service) throw new Error('سرویس یافت نشد');
      return { service };
    }
    return this.request(`/services/${id}`);
  },

  async createService(serviceData) {
    if (this.useMockData) {
      await this.delay();
      const newService = {
        id: String(this.mockData.services.length + 1),
        ...serviceData,
        status: 'operational',
        uptime_percentage: 100,
        response_time_avg: 0,
        created_at: new Date().toISOString()
      };
      this.mockData.services.push(newService);
      return { service: newService };
    }
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  },

  async updateService(id, serviceData) {
    if (this.useMockData) {
      await this.delay();
      const index = this.mockData.services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('سرویس یافت نشد');
      this.mockData.services[index] = { ...this.mockData.services[index], ...serviceData };
      return { service: this.mockData.services[index] };
    }
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  },

  async deleteService(id) {
    if (this.useMockData) {
      await this.delay();
      const index = this.mockData.services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('سرویس یافت نشد');
      this.mockData.services.splice(index, 1);
      return { message: 'سرویس حذف شد' };
    }
    return this.request(`/services/${id}`, { method: 'DELETE' });
  },

  // ================== INCIDENTS APIs ==================
  async getIncidents(serviceId = null) {
    if (this.useMockData) {
      await this.delay();
      let incidents = this.mockData.incidents;
      if (serviceId) {
        incidents = incidents.filter(i => i.service_id === serviceId);
      }
      return { incidents };
    }
    const query = serviceId ? `?service_id=${serviceId}` : '';
    return this.request(`/incidents${query}`);
  },

  async getIncidentById(id) {
    if (this.useMockData) {
      await this.delay();
      const incident = this.mockData.incidents.find(i => i.id === id);
      if (!incident) throw new Error('رخداد یافت نشد');
      return { incident };
    }
    return this.request(`/incidents/${id}`);
  },

  async createIncident(incidentData) {
    if (this.useMockData) {
      await this.delay();
      const newIncident = {
        id: String(this.mockData.incidents.length + 1),
        ...incidentData,
        status: 'investigating',
        started_at: new Date().toISOString(),
        updates: []
      };
      this.mockData.incidents.push(newIncident);
      return { incident: newIncident };
    }
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  },

  async addIncidentUpdate(incidentId, updateData) {
    if (this.useMockData) {
      await this.delay();
      const incident = this.mockData.incidents.find(i => i.id === incidentId);
      if (!incident) throw new Error('رخداد یافت نشد');
      
      const newUpdate = {
        id: String(Date.now()),
        ...updateData,
        created_at: new Date().toISOString()
      };
      incident.updates.push(newUpdate);
      incident.status = updateData.status;
      
      return { update: newUpdate };
    }
    return this.request(`/incidents/${incidentId}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData)
    });
  }
};

window.API = API;
