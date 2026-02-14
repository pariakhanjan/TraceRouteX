// api.js - API communication layer
// Updated to match backend response format: { success, data, message }

const API_BASE_URL = 'http://localhost:3000';

// Use mock data when backend is not available
const USE_MOCK = false;

const API = {
    // ==========================================
    // Authentication APIs
    // ==========================================

    async register(userData) {
        if (USE_MOCK) {
            return this._mockRegister(userData);
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Registration failed');
        }

            // ✅ normalize response: هر دو ساختار را پشتیبانی می‌کند
        if (result.success && result.token && result.user && !result.data) {
            return {
                success: result.success,
                data: {
                    token: result.token,
                    user: result.user
                },
                message: result.message
            };
        }

        return result; // { success: true, data: { user, token }, message: "..." }
    },

    async login(credentials) {
        if (USE_MOCK) {
            return this._mockLogin(credentials);
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Login failed');
        }

            // ✅ normalize response: هر دو ساختار را پشتیبانی می‌کند
        if (result.success && result.token && result.user && !result.data) {
            return {
                success: result.success,
                data: {
                    token: result.token,
                    user: result.user
                },
                message: result.message
            };
        }

        return result; // { success: true, data: { user, token }, message: "..." }
    },

    async logout() {
        if (USE_MOCK) {
            return this._mockLogout();
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
                        headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Logout failed');
        }

        return result;
    },

    async getMe() {
        if (USE_MOCK) {
            return this._mockGetMe();
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        //     credentials: 'include'
        // });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to get user info');
        }

        return result; // { success: true, data: { user }, message: "..." }
    },

    // ==========================================
    // Services APIs
    // ==========================================

    async getServices() {
        if (USE_MOCK) {
            return this._mockGetServices();
        }

        const response = await fetch(`${API_BASE_URL}/api/services?`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch services');
        }

        // ✅ Normalize: if data is array, wrap it
        if (Array.isArray(result.data)) {
            return {
                success: true,
                data: { services: result.data },
                message: result.message || 'Services retrieved successfully'
            };
        }

        return result; // { success: true, data: { services: [...] }, message: "..." }
    },

    async getServiceById(id) {
        if (USE_MOCK) {
            return this._mockGetServiceById(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {          
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch service');
        }

        // ✅ Normalize: if data is object (not wrapped), wrap it
        if (result.data && !result.data.service) {
            return {
                success: true,
                data: { service: result.data },
                message: result.message || 'Service retrieved successfully'
            };
        }

        return result; // { success: true, data: { service }, message: "..." }
    },

    async createService(serviceData) {
        if (USE_MOCK) {
            return this._mockCreateService(serviceData);
        }   

        const response = await fetch(`${API_BASE_URL}/api/services`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(serviceData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create service');
        }

        return result;
    },

    async updateService(id, serviceData) {
        if (USE_MOCK) {
            return this._mockUpdateService(id, serviceData);
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(serviceData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update service');
        }

        return result;
    },

    async updateServiceStatus(id, status) {
        if (USE_MOCK) {
            return this._mockUpdateServiceStatus(id, status);
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update service status');
        }

        return result;
    },

    async deleteService(id) {
        if (USE_MOCK) {
            return this._mockDeleteService(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete service');
        }

        return result;
    },

    // ==========================================
    // Incidents APIs
    // ==========================================

    async getIncidents(filters = {}) {
        if (USE_MOCK) {
            return this._mockGetIncidents(filters);
        }

        const params = new URLSearchParams();
        
        if (filters.service_id) params.append('service_id', filters.service_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.severity) params.append('severity', filters.severity);

        const response = await fetch(`${API_BASE_URL}/api/incidents?${params}`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch incidents');
        }

        // ✅ Normalize: if data is array, wrap it
        if (Array.isArray(result.data)) {
            return {
                success: true,
                data: { incidents: result.data },
                message: result.message || 'Incidents retrieved successfully'
            };
        }

        return result; // { success: true, data: { incidents: [...] }, message: "..." }
    },

    async getIncidentById(id) {
        if (USE_MOCK) {
            return this._mockGetIncidentById(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch incident');
        }

        // ✅ Normalize
        if (result.data && !result.data.incident) {
            return {
                success: true,
                data: { incident: result.data },
                message: result.message || 'Incident retrieved successfully'
            };
        }

        return result; // { success: true, data: { incident }, message: "..." }
    },

    async createIncident(incidentData) {
        if (USE_MOCK) {
            return this._mockCreateIncident(incidentData);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(incidentData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create incident');
        }

        return result;
    },

    async updateIncident(id, incidentData) {
        if (USE_MOCK) {
            return this._mockUpdateIncident(id, incidentData);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(incidentData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update incident');
        }

        return result;
    },

    async resolveIncident(id, resolutionData) {
        if (USE_MOCK) {
            return this._mockResolveIncident(id, resolutionData);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resolutionData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to resolve incident');
        }

        return result;
    },

    async deleteIncident(id) {
        if (USE_MOCK) {
            return this._mockDeleteIncident(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete incident');
        }

        return result;
    },

    // ==========================================
    // Incident Updates APIs
    // ==========================================

    async getIncidentUpdates(incidentId) {
        if (USE_MOCK) {
            return this._mockGetIncidentUpdates(incidentId);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/updates`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch incident updates');
        }

                // ✅ Normalize
        if (Array.isArray(result.data)) {
            return {
                success: true,
                data: { updates: result.data },
                message: result.message || 'Updates retrieved successfully'
            };
        }

        return result; // { success: true, data: { updates: [...] }, message: "..." }
    },

    async addIncidentUpdate(incidentId, message) {
        if (USE_MOCK) {
            return this._mockAddIncidentUpdate(incidentId, message);
        }

        const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/updates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to add update');
        }

       return result;
    },

    // ==========================================
    // Public Status Page API
    // ==========================================

    async getPublicStatus() {
        if (USE_MOCK) {
            return this._mockGetPublicStatus();
        }

        const response = await fetch(`${API_BASE_URL}/public/status`, {
            credentials: 'include'
        });
        //const response = await fetch(`${API_BASE_URL}/public/status`);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch public status');
        }

        return result; // { success: true, data: { services, incidents }, message: "..." }
    },

    // ==========================================
    // Users APIs (Admin only)
    // ==========================================

    async getUsers(filters = {}) {
        if (USE_MOCK) {
            return this._mockGetUsers(filters);
        }

        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.search) params.append('search', filters.search);

        const response = await fetch(`${API_BASE_URL}/api/users?${params}`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch users');
        }

        // ✅ Normalize
        if (Array.isArray(result.data)) {
            return {
                success: true,
                data: { users: result.data },
                message: result.message || 'Users retrieved successfully'
            };
        }

        return result;
    },

    async getUserById(id) {
        if (USE_MOCK) {
            return this._mockGetUserById(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch user');
        }

        // ✅ Normalize
        if (result.data && !result.data.user) {
            return {
                success: true,
                data: { user: result.data },
                message: result.message || 'User retrieved successfully'
            };
        }

        return result;
    },

    async updateUser(id, userData) {
        if (USE_MOCK) {
            return this._mockUpdateUser(id, userData);
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update user');
        }

        return result;
    },

    async deleteUser(id) {
        if (USE_MOCK) {
            return this._mockDeleteUser(id);
        }

        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete user');
        }

        return result;
    },

    // ==========================================
    // MOCK DATA (for testing without backend)
    // ==========================================

    _mockRegister(userData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    id: 4,
                    username: userData.username,
                    email: userData.email,
                    role: 'viewer',
                    created_at: new Date().toISOString()
                };
                resolve({
                    success: true,
                    data: {
                        user,
                        token: 'mock_token_' + Date.now()
                    },
                    message: 'User registered successfully'
                });
            }, 500);
        });
    },

    _mockLogin(credentials) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (credentials.email === 'admin@traceroutex.com') {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: 1,
                                username: 'admin',
                                email: 'admin@traceroutex.com',
                                role: 'admin',
                                created_at: '2024-01-01T00:00:00Z'
                            },
                            token: 'mock_admin_token'
                        },
                        message: 'Login successful'
                    });
                } else if (credentials.email === 'engineer@traceroutex.com') {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: 2,
                                username: 'engineer1',
                                email: 'engineer@traceroutex.com',
                                role: 'engineer',
                                created_at: '2024-01-01T00:00:00Z'
                            },
                            token: 'mock_engineer_token'
                        },
                        message: 'Login successful'
                    });
                } else if (credentials.email === 'viewer@traceroutex.com') {
                    resolve({
                        success: true,
                        data: {
                            user: {
                                id: 3,
                                username: 'viewer1',
                                email: 'viewer@traceroutex.com',
                                role: 'viewer',
                                created_at: '2024-01-01T00:00:00Z'
                            },
                            token: 'mock_viewer_token'
                        },
                        message: 'Login successful'
                    });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 500);
        });
    },

    _mockLogout() {
        return Promise.resolve({
            success: true,
            message: 'Logged out successfully'
        });
    },

    _mockGetMe() {
        const user = Auth.getUser();
        return Promise.resolve({
            success: true,
            data: { user },
            message: 'User info retrieved'
        });
    },

    _mockGetServices() {
        return Promise.resolve({
            success: true,
            data: {
                services: [
                    {
                        id: 1,
                        name: 'Payment Service',
                        description: 'سرویس پرداخت و تراکنش‌های مالی',
                        status: 'up',
                        created_by: 1,
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-02-10T15:30:00Z'
                    },
                    {
                        id: 2,
                        name: 'Authentication Service',
                        description: 'سرویس احراز هویت کاربران',
                        status: 'up',
                        created_by: 1,
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-02-10T15:30:00Z'
                    },
                    {
                        id: 3,
                        name: 'Main Website',
                        description: 'وب‌سایت اصلی شرکت',
                        status: 'degraded',
                        created_by: 1,
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-02-12T08:00:00Z'
                    },
                    {
                        id: 4,
                        name: 'Database Server',
                        description: 'سرور پایگاه داده اصلی',
                        status: 'up',
                        created_by: 1,
                        created_at: '2024-01-15T10:00:00Z',
                        updated_at: '2024-02-10T15:30:00Z'
                    }
                ]
            },
            message: 'Services retrieved successfully'
        });
    },

    _mockGetServiceById(id) {
        const services = this._mockGetServices().data.services;
        const service = services.find(s => s.id === parseInt(id));

        if (!service) {
            return Promise.reject(new Error('Service not found'));
        }

        return Promise.resolve({
            success: true,
            data: { service },
            message: 'Service retrieved successfully'
        });
    },

    _mockCreateService(serviceData) {
        return Promise.resolve({
            success: true,
            data: {
                service: {
                    id: 5,
                    ...serviceData,
                    created_by: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Service created successfully'
        });
    },

    _mockUpdateService(id, serviceData) {
        return Promise.resolve({
            success: true,
            data: {
                service: {
                    id: parseInt(id),
                    ...serviceData,
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Service updated successfully'
        });
    },

    _mockUpdateServiceStatus(id, status) {
        return Promise.resolve({
            success: true,
            data: {
                service: {
                    id: parseInt(id),
                    status,
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Service status updated successfully'
        });
    },

    _mockDeleteService(id) {
        return Promise.resolve({
            success: true,
            message: 'Service deleted successfully'
        });
    },

    _mockGetIncidents(filters) {
        const allIncidents = [
            {
                id: 1,
                service_id: 3,
                title: 'کندی در بارگذاری صفحات',
                description: 'صفحات با تاخیر بارگذاری می‌شوند. کاربران گزارش کندی داده‌اند.',
                severity: 'medium',
                status: 'open',
                is_published: true,
                root_cause: null,
                prevention_notes: null,
                created_by: 2,
                resolved_by: null,
                resolved_at: null,
                created_at: '2024-02-12T08:00:00Z',
                updated_at: '2024-02-12T08:00:00Z'
            },
            {
                id: 2,
                service_id: 1,
                title: 'خطا در پردازش تراکنش‌ها',
                description: 'برخی تراکنش‌های پرداخت با خطا مواجه شده‌اند',
                severity: 'high',
                status: 'resolved',
                is_published: true,
                root_cause: 'مشکل در تنظیمات Gateway پرداخت',
                prevention_notes: 'مانیتورینگ بهتر Gateway و تنظیم آلارم برای خطاهای ارتباطی',
                created_by: 2,
                resolved_by: 2,
                resolved_at: '2024-02-11T14:30:00Z',
                created_at: '2024-02-11T10:00:00Z',
                updated_at: '2024-02-11T14:30:00Z'
            }
        ];

        let filtered = allIncidents;

        if (filters.service_id) {
            filtered = filtered.filter(i => i.service_id === parseInt(filters.service_id));
        }
        if (filters.status) {
            filtered = filtered.filter(i => i.status === filters.status);
        }
        if (filters.severity) {
            filtered = filtered.filter(i => i.severity === filters.severity);
        }

        return Promise.resolve({
            success: true,
            data: { incidents: filtered },
            message: 'Incidents retrieved successfully'
        });
    },

    _mockGetIncidentById(id) {
        return this._mockGetIncidents({}).then(result => {
            const incident = result.data.incidents.find(i => i.id === parseInt(id));

            if (!incident) {
                return Promise.reject(new Error('Incident not found'));
            }

            return {
                success: true,
                data: { incident },
                message: 'Incident retrieved successfully'
            };
        });
    },

    _mockCreateIncident(incidentData) {
        return Promise.resolve({
            success: true,
            data: {
                incident: {
                    id: 3,
                    ...incidentData,
                    status: 'open',
                    is_published: false,
                    created_by: 2,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Incident created successfully'
        });
    },

    _mockUpdateIncident(id, incidentData) {
        return Promise.resolve({
            success: true,
            data: {
                incident: {
                    id: parseInt(id),
                    ...incidentData,
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Incident updated successfully'
        });
    },

    _mockResolveIncident(id, resolutionData) {
        return Promise.resolve({
            success: true,
            data: {
                incident: {
                    id: parseInt(id),
                    status: 'resolved',
                    ...resolutionData,
                    resolved_by: 2,
                    resolved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            },
            message: 'Incident resolved successfully'
        });
    },

    _mockDeleteIncident(id) {
        return Promise.resolve({
            success: true,
            message: 'Incident deleted successfully'
        });
    },

    _mockGetIncidentUpdates(incidentId) {
        const updates = {
            1: [
                {
                    id: 1,
                    incident_id: 1,
                    message: 'مشکل شناسایی شد. سرور دیتابیس تحت بررسی است.',
                    created_by: 2,
                    created_at: '2024-02-12T08:15:00Z'
                },
                {
                    id: 2,
                    incident_id: 1,
                    message: 'کش Redis ریست شد. در حال مانیتور کردن وضعیت...',
                    created_by: 2,
                    created_at: '2024-02-12T09:00:00Z'
                }
            ],
            2: [
                {
                    id: 3,
                    incident_id: 2,
                    message: 'تیم فنی در حال بررسی لاگ‌های سرور پرداخت است',
                    created_by: 2,
                    created_at: '2024-02-11T10:30:00Z'
                },
                {
                    id: 4,
                    incident_id: 2,
                    message: 'مشکل در ارتباط با Gateway پرداخت شناسایی شد',
                    created_by: 2,
                    created_at: '2024-02-11T12:00:00Z'
                },
                {
                    id: 5,
                    incident_id: 2,
                    message: 'تنظیمات Gateway اصلاح شد. مشکل برطرف شده است',
                    created_by: 2,
                    created_at: '2024-02-11T14:30:00Z'
                }
            ]
        };

        return Promise.resolve({
            success: true,
            data: {
                updates: updates[incidentId] || []
            },
            message: 'Updates retrieved successfully'
        });
    },

    _mockAddIncidentUpdate(incidentId, message) {
        return Promise.resolve({
            success: true,
            data: {
                update: {
                    id: Date.now(),
                    incident_id: parseInt(incidentId),
                    message,
                    created_by: 2,
                    created_at: new Date().toISOString()
                }
            },
            message: 'Update added successfully'
        });
    },

    _mockGetPublicStatus() {
        return Promise.all([
            this._mockGetServices(),
            this._mockGetIncidents({})
        ]).then(([servicesResult, incidentsResult]) => {
            const publishedIncidents = incidentsResult.data.incidents.filter(i => i.is_published);

            return {
                success: true,
                data: {
                    services: servicesResult.data.services,
                    incidents: publishedIncidents
                },
                message: 'Public status retrieved successfully'
            };
        });
    }
};
