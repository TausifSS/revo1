import React from "react";
import ErrorScreen from "./ErrorScreen";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorType: "general", error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-bg-light">
          <ErrorScreen 
            type="server" 
            message={this.state.error?.message ? `Render error: ${this.state.error.message}` : "We encountered an unexpected crash while rendering this section."}
            onRetry={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          />
        </div>
      );
    }

    return this.props.children; 
  }
}
