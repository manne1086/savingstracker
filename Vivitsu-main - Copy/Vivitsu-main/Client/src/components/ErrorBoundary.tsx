import React from "react";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            flexDirection: "column",
            gap: "20px",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "10px", fontSize: "24px" }}>
              ⚠️ App Error
            </h1>
            <p style={{ marginBottom: "20px", color: "#ccc", maxWidth: "500px" }}>
              {this.state.error?.message || "Something went wrong"}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Reload App
            </button>
          </div>
          <details style={{ marginTop: "20px", textAlign: "left", color: "#aaa" }}>
            <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
              Error Details
            </summary>
            <pre
              style={{
                backgroundColor: "#0a0a0a",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "200px",
                fontSize: "12px",
              }}
            >
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
