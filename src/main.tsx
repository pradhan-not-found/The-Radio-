import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ContentPage } from "./ContentPage";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#E8E5DD', fontFamily: 'sans-serif', background: '#11110F', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ fontSize: 12, opacity: 0.6 }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    {window.location.pathname === '/content' ? <ContentPage /> : <App />}
  </ErrorBoundary>,
);
