import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import "@/index.css";
import App from "@/App";

// Ultra-safe error catching for mobile
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', msg, url, lineNo, columnNo, error);
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <h1 style={{ color: '#e53e3e', fontSize: '24px', marginBottom: '16px' }}>
            ⚠️ Something went wrong
          </h1>
          <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
            We're working on fixing this. Please try:
          </p>
          <ul style={{ marginBottom: '20px', lineHeight: '1.8' }}>
            <li>Refreshing the page</li>
            <li>Clearing browser cache (Settings → Clear browsing data)</li>
            <li>Using regular mode instead of incognito</li>
            <li>Trying a different browser</li>
          </ul>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(to right, #EA580C, #F97316)',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
              Technical Details
            </summary>
            <pre style={{ 
              background: '#f7fafc', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '11px'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe rendering with fallback
function renderApp() {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: system-ui;">
          <h1>Error: Root element not found</h1>
          <p>Please contact support.</p>
        </div>
      `;
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('✓ React app mounted successfully');
    
  } catch (error) {
    console.error('Fatal error rendering app:', error);
    
    // Last resort fallback UI
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          padding: 20px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 600px;
          margin: 40px auto;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
          <h1 style="color: #e53e3e; font-size: 24px; margin-bottom: 16px;">
            Unable to load Calliotel
          </h1>
          <p style="margin-bottom: 20px; line-height: 1.6; color: #4a5568;">
            We're experiencing technical difficulties. This could be due to:
          </p>
          <ul style="
            text-align: left;
            margin: 0 auto 24px;
            max-width: 400px;
            line-height: 1.8;
            color: #4a5568;
          ">
            <li>Browser compatibility issues</li>
            <li>Network connectivity problems</li>
            <li>Temporary server issues</li>
          </ul>
          <button 
            onclick="window.location.reload()"
            style="
              background: linear-gradient(to right, #EA580C, #F97316);
              color: white;
              padding: 14px 32px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            "
          >
            🔄 Reload Page
          </button>
          <p style="margin-top: 24px; font-size: 14px; color: #718096;">
            Error: ${error.message || 'Unknown error'}
          </p>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}

// Prevent scroll restoration on page load
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
