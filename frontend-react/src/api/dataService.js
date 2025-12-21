import { auth } from '../firebase';
import { localStore } from './localStore';
import * as api from './emissions'; // Existing API calls

// Helper to check if user is logged in
const isUserLoggedIn = () => {
    return !!auth.currentUser;
};

// Data Service that abstracts storage backend
export const dataService = {
    addManualEntry: async (entry, userId = null) => {
        if (userId) {
            const payload = { ...entry, user_id: userId };
            return api.addManualEntry(payload);
        } else {
            return localStore.addEntry(entry);
        }
    },

    addBulkEmissions: async (payload, userId = null) => {
        if (userId) {
            // Add user_id to all entries in payload if needed, or rely on backend to extract from one?
            // Backend bulk_emissions expects 'user_id' in entries.
            const newEntries = payload.entries.map(e => ({ ...e, user_id: userId }));
            return api.addBulkEmissions({ ...payload, entries: newEntries });
        } else {
            return localStore.addBulk(payload);
        }
    },

    getDashboardData: async (businessId, userId = null) => {
        if (userId) {
            return api.getDashboardData(businessId, userId);
        } else {
            return localStore.getDashboard();
        }
    },

    getEmissions: async (businessId, userId = null) => {
        if (userId) {
            return api.getEmissions(businessId, userId);
        } else {
            return localStore.getEmissions();
        }
    },

    // Pass-through for things that require login anyway (or handled by UI gating)
    uploadCSV: (formData) => api.uploadCSV(formData),
    getLeaderboard: () => api.getLeaderboard(), // Maybe guest can see leaderboard? Let's verify.
};
