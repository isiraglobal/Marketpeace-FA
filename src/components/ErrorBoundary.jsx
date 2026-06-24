import React from 'react';

/**
 * ErrorBoundary — wraps children and silently swallows render errors.
 * Used primarily around BackgroundClouds to prevent WebGL context-loss
 * from crashing the entire React tree.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log for debugging without exposing to users
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ErrorBoundary] Caught error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render the fallback prop if provided, otherwise nothing
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
