import { Navigate } from 'react-router-dom'

/**
 * Protected Route Wrapper
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const userId = localStorage.getItem('user_id')
  
  if (!userId) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

