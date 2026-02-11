// =========================================
// API HANDLER WITH MOCK DATA
// =========================================

const API = {
  // Base URL (empty for now, will use Backend later)
  baseURL: 'http://localhost:3000/api',
  useMockData: true, // Until Backend is ready

  // Mock Data
  mockData: {
    users: [
      { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', full_name: 'System Administrator' },
      { id: '2', username: 'operator1', email: 'operator@example.com', role: 'operator', full_name: 'Operator One' },
      { id: '3', username: 'user1', email: 'user@example.com', role: 'user', full_name: 'User One' }
    ],
    services: [
      { 
        id: '1', 
        name: 'Main Website', 
        description: 'Company main website',
        url: 'https://example.com',
        status: 'operational',
        uptime_percentage: 99.95,
        response_time_avg: 120,
        created_at: '2026-01-01T10:00:00Z'
      },
      { 
        id: '2', 
        name: 'API Service', 
        description: 'Public API',
        url: 'https://api.example.com',
        status: 'operational',
        uptime_percentage: 99.80,
        response_time_avg: 85,
        created_at: '2026-01-01T10:00:00Z'
      },
      { 
        id: '3', 
        name: 'Database', 
        description: 'Main server',
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
        title: 'Slow Response Time',
        description: 'Server experiencing increased traffic',
        severity: 'medium',
        status: 'monitoring',
        started_at: '2026-02-10T14:30:00Z',
        updates: [
          {
            id: '1',
            message: 'Technical team is investigating the issue',
            status: 'investigating',
            created_at: '2026-02-10T14:35:00Z'
          },
          {
            id: '2',
            message: 'Root cause identified',
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
  // Backend format: { success: true/false, message: "...", data: {} }
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add Bearer Token to header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      // Check standard Backend format: { success, message, data }
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Server communication error');
      }

      // Return data from response
      return data.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Mock Delay (to simulate network latency)
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
      throw new Error('Invalid username or password');
    }
    // Backend endpoint: POST /api/auth/login
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
    // Backend endpoint: POST /api/auth/register
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async logout() {
    if (this.useMockData) {
      await this.delay();
      return { message: 'Logout successful' };
    }
    // Backend endpoint: POST /api/auth/logout
    return this.request('/auth/logout', { method: 'POST' });
  },

  async getCurrentUser() {
    if (this.useMockData) {
      await this.delay();
      const token = this.getToken();
      if (!token) throw new Error('Token not found');
      const userId = token.replace('mock_token_', '');
      const user = this.mockData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      return { user };
    }
    // Backend endpoint: GET /api/auth/me
    return this.request('/auth/me');
  },

  // ================== SERVICES APIs ==================
  async getServices() {
    if (this.useMockData) {
      await this.delay();
      return { services: this.mockData.services };
    }
    // Backend endpoint: GET /api/services
    return this.request('/services');
  },

  async getServiceById(id) {
    if (this.useMockData) {
      await this.delay();
      const service = this.mockData.services.find(s => s.id === id);
      if (!service) throw new Error('Service not found');
      return { service };
    }
    // Backend endpoint: GET /api/services/:id
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
    // Backend endpoint: POST /api/services (admin only)
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  },

  async updateService(id, serviceData) {
    if (this.useMockData) {
      await this.delay();
      const index = this.mockData.services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Service not found');
      this.mockData.services[index] = { ...this.mockData.services[index], ...serviceData };
      return { service: this.mockData.services[index] };
    }
    // Backend endpoint: PUT /api/services/:id
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  },

  async updateServiceStatus(id, status) {
    if (this.useMockData) {
      await this.delay();
      const index = this.mockData.services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Service not found');
      this.mockData.services[index].status = status;
      return { service: this.mockData.services[index] };
    }
    // Backend endpoint: PATCH /api/services/:id/status (engineer, admin)
    return this.request(`/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async deleteService(id) {
    if (this.useMockData) {
      await this.delay();
      const index = this.mockData.services.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Service not found');
      this.mockData.services.splice(index, 1);
      return { message: 'Service deleted' };
    }
    // Backend endpoint: DELETE /api/services/:id
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
    // Backend endpoint: GET /api/incidents
    const query = serviceId ? `?service_id=${serviceId}` : '';
    return this.request(`/incidents${query}`);
  },

  async getIncidentById(id) {
    if (this.useMockData) {
      await this.delay();
      const incident = this.mockData.incidents.find(i => i.id === id);
      if (!incident) throw new Error('Incident not found');
      return { incident };
    }
    // Backend endpoint: GET /api/incidents/:id
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
    // Backend endpoint: POST /api/incidents (engineer, admin)
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  },

  async addIncidentUpdate(incidentId, updateData) {
    if (this.useMockData) {
      await this.delay();
      const incident = this.mockData.incidents.find(i => i.id === incidentId);
      if (!incident) throw new Error('Incident not found');
      
      const newUpdate = {
        id: String(Date.now()),
        ...updateData,
        created_at: new Date().toISOString()
      };
      incident.updates.push(newUpdate);
      incident.status = updateData.status;
      
      return { update: newUpdate };
    }
    // Backend endpoint: POST /api/incidents/:id/updates
    return this.request(`/incidents/${incidentId}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData)
    });
  }
};

window.API = API;
