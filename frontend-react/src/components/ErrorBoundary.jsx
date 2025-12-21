import React from 'react'
import Button from './ui/Button'
import Card from './ui/Card'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <Card className="max-w-md w-full">
                        <div className="card-content text-center">
                            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                            <p className="text-slate-600 mb-6">
                                We encountered an unexpected error. Please try refreshing the page.
                            </p>
                            <div className="bg-slate-100 p-3 rounded text-left text-xs text-slate-500 overflow-auto max-h-32 mb-6">
                                {this.state.error?.toString()}
                            </div>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Refresh Page
                                </Button>
                                <Button variant="primary" onClick={() => window.location.href = '/'}>
                                    Go Home
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
