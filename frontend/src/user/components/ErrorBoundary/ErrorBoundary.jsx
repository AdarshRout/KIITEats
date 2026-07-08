import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('App crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary section-card'>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page. Your cart and orders are saved locally.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
