import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Authentication
export const registerUser = async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
};

export const loginUser = async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
};

export const loginAdmin = async (email, password) => {
    const response = await api.post('/admin/login', { email, password });
    return response.data;
};

// Admins
export const grantSubAdmin = async (data) => {
    const response = await api.post('/admin/grant-sub-admin', data);
    return response.data;
};

export const getAdmins = async () => {
    const response = await api.get('/admin/list');
    return response.data;
};

// Users (Admin only)
export const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories');
    return response.data;
};

export const deleteUser = async (id) => {
    await api.delete(`/admin/users/${id}`);
};

// Transactions
export const getTransactions = async (userId) => {
    if (userId) {
        const response = await api.get(`/transactions/user/${userId}`);
        return response.data;
    }
    return [];
};

export const createTransaction = async (userId, data) => {
    const response = await api.post(`/transactions/user/${userId}`, data);
    return response.data;
};

export const deleteTransaction = async (id) => {
    await api.delete(`/transactions/${id}`);
};

// Notifications
export const getMyNotifications = async (userId, page = 0, size = 20, priority = 'ALL') => {
    const response = await api.get(`/notifications/user/${userId}`, {
        params: { page, size, priority }
    });
    return response.data;
};

export const getBroadcasts = async () => {
    const response = await api.get('/notifications/broadcasts');
    return response.data;
};

export const createNotification = async (data, adminId) => {
    const url = adminId ? `/notifications/create?adminId=${adminId}` : '/notifications/create';
    const response = await api.post(url, data);
    return response.data;
};

export const pinNotification = async (id) => {
    const response = await api.put(`/notifications/${id}/pin`);
    return response.data;
};

export const deleteNotification = async (id) => {
    await api.delete(`/notifications/${id}`);
};

export const markNotificationRead = async (id, userId) => {
    const url = userId ? `/notifications/read/${id}?userId=${userId}` : `/notifications/read/${id}`;
    const response = await api.put(url);
    return response.data;
};

// Dashboard Stats (Mocked or Derived)
export const getDashboardStats = async () => {
    try {
        const users = await getUsers();
        return {
            totalUsers: users.length,
            recentActivity: [],
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        return { totalUsers: 0, recentActivity: [] };
    }
};

// Budgets
export const getBudgetProfile = async (userId) => {
    const response = await api.get(`/budgets/profile/${userId}`);
    return response.data;
};

export const getUserBudgets = async (userId) => {
    const response = await api.get(`/budgets/user/${userId}`);
    return response.data;
};

// Goals
export const getUserGoals = async (userId) => {
    const response = await api.get(`/goals/user/${userId}`);
    return response.data;
};

// AI Recommendations
export const getRecommendations = async (userId) => {
    const response = await api.get(`/recommendations/${userId}`);
    return response.data;
};

// Alerts
export const getActiveAlerts = async () => {
    const response = await api.get('/alerts/active');
    return response.data;
};

export const resolveAlert = async (id) => {
    const response = await api.post(`/alerts/${id}/resolve`);
    return response.data;
};

export const triggerAIAnalysis = async () => {
    await api.post('/alerts/trigger-analysis');
};

// Feedback
export const submitFeedback = async (userId, feedback) => {
    const response = await api.post(`/feedback/submit/${userId}`, feedback);
    return response.data;
};

export const getUserFeedback = async (userId) => {
    const response = await api.get(`/feedback/user/${userId}`);
    return response.data;
};

export const getAllFeedback = async () => {
    const response = await api.get('/feedback/all');
    return response.data;
};

export const updateFeedbackStatus = async (feedbackId, status, remarks) => {
    const params = new URLSearchParams({ status });
    if (remarks) params.append('remarks', remarks);

    const response = await api.put(`/feedback/${feedbackId}/status?${params.toString()}`);
    return response.data;
};

export const deleteUserFeedback = async (feedbackId) => {
    const response = await api.delete(`/feedback/${feedbackId}`);
    return response.data;
};

// Gamification
export const getGamificationStats = async (userId) => {
    const response = await api.get(`/gamification/stats/${userId}`);
    return response.data;
};

export const getAllBadges = async () => {
    const response = await api.get('/gamification/badges/all');
    return response.data;
};

// Admin Trigger (Optional usage)
export const triggerMonthlyRewards = async (userId) => {
    await api.post(`/gamification/trigger-monthly/${userId}`);
};

// Admin Gamification
export const getGamificationConfig = async () => {
    const response = await api.get('/admin/gamification/config');
    return response.data;
};

export const updateGamificationConfig = async (config) => {
    const response = await api.put('/admin/gamification/config', config);
    return response.data;
};

export const getRewardLogs = async () => {
    const response = await api.get('/admin/gamification/logs');
    return response.data;
};

export const getGamificationOverview = async () => {
    const response = await api.get('/admin/gamification/stats');
    return response.data;
};

// Badge Management
export const getAdminBadges = async () => {
    const response = await api.get('/admin/gamification/badges');
    return response.data;
};

export const createBadge = async (badgeData) => {
    const response = await api.post('/admin/gamification/badges', badgeData);
    return response.data;
};

export const updateBadge = async (id, badgeData) => {
    const response = await api.put(`/admin/gamification/badges/${id}`, badgeData);
    return response.data;
};

// Receipts
export const getReceipts = async (userId) => {
    const response = await api.get(`/receipts/user/${userId}`);
    return response.data;
};

export const getReceiptById = async (id) => {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
};

export default api;
