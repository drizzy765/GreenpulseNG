import client from './client'

export const addManualEntry = (data) => client.post('/manual_entry', data)

export const addBulkEmissions = (data) => client.post('/emissions/bulk', data)

export const getEmissions = (businessId, userId = null) => {
    const query = userId ? `?user_id=${userId}` : '';
    return client.get(`/emissions/${businessId}${query}`);
}

export const getDashboardData = (businessId, userId = null) => {
    const query = userId ? `?user_id=${userId}` : '';
    return client.get(`/dashboard/${businessId}${query}`);
}

export const getLeaderboard = () => client.get('/leaderboard')

// export const getForecast = (businessId) => client.post(`/forecast/${businessId}`) // Not in new backend

export const uploadCSV = (formData) => client.post('/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
})

// export const getTaxIncentives = () => client.get('/tax_incentives') // Not in new backend
