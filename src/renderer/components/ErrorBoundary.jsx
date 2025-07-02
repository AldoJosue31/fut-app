// src/renderer/components/ErrorBoundary.jsx
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      const { error } = this.state;
      if (error.code === 'OFFLINE') {
        return (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#DC2626',
            background: '#2D2D2D',
            height: '100vh',
          }}>
            <h2>Sin conexión</h2>
            <p>Parece que no tienes internet. Por favor, reconéctate para continuar.</p>
          </div>
        );
      }
      // otros errores
      return <div>Ha ocurrido un error: {error.message}</div>;
    }
    return this.props.children;
  }
}
