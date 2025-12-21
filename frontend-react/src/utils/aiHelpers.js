/**
 * Utility functions for handling AI responses and errors
 */

/**
 * Checks if the response contains known error patterns
 * @param {any} response - The response to check
 * @returns {boolean} - True if it's an error
 */
export const isAIError = (response) => {
    if (!response) return false

    const responseStr = String(response).toLowerCase()
    const errorPatterns = [
        'temporarily unavailable',
        'ai service',
        'error:',
        '422',
        '404',
        '500',
        'failed to get response',
        'unexpected error'
    ]

    return errorPatterns.some(pattern => responseStr.includes(pattern))
}

/**
 * Sanitizes the AI response to ensure it's always a safe string
 * @param {any} response - The raw response
 * @returns {string} - Sanitized string safe for ReactMarkdown
 */
export const sanitizeAIResponse = (response) => {
    if (response === null || response === undefined) return ''

    if (typeof response === 'string') {
        // If it's a string but looks like a JSON object, try to parse it
        if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(response)
                // If it parsed to an object with a message or error field, use that
                if (parsed.message) return String(parsed.message)
                if (parsed.error) return String(parsed.error)
                // Otherwise just return the original string if it's valid JSON but not an error object
                return response
            } catch (e) {
                // Not valid JSON, just return the string
                return response
            }
        }
        return response
    }

    if (typeof response === 'object') {
        // If it's an error object
        if (response.message) return String(response.message)
        if (response.error) return String(response.error)

        // Otherwise stringify it nicely
        try {
            return JSON.stringify(response, null, 2)
        } catch (e) {
            return String(response)
        }
    }

    return String(response)
}

/**
 * Returns a friendly error message for the UI
 * @returns {string} - Friendly error message
 */
export const getFriendlyErrorMessage = () => {
    return "AI is taking a quick nap, try again in a moment."
}
