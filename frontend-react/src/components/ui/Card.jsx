/**
 * Card Component - Eco-Modern Enterprise Style
 * White cards with rounded corners, subtle borders, and soft shadows
 */
export default function Card({ children, className = '', hover = true }) {
  return (
    <div className={`card ${hover ? 'hover:shadow-md' : ''} ${className}`}>
      <div className="card-content">{children}</div>
    </div>
  )
}

