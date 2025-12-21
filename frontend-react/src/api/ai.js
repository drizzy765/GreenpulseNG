import client from './client'

export const getInsights = (businessId, userId = null) => {
    const query = userId ? `?user_id=${userId}` : ''
    return client.get(`/insights/${businessId}${query}`)
}

export const runScenario = (data, userId = null) => {
    const payload = userId ? { ...data, user_id: userId } : data
    return client.post('/ai/scenario', payload)
}

export const generateReport = (businessId, userId = null) => {
    const payload = { business_id: businessId }
    if (userId) payload.user_id = userId
    return client.post('/ai/report', payload, { responseType: 'blob' })
}

export const chatWithAI = (prompt) => client.post('/ai/chat', { prompt })
