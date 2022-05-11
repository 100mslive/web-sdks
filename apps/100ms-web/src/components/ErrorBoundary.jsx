import React, { Component } from "react";
import LogRocket from "logrocket";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState(
      {
        error: error?.message,
        errorInfo: errorInfo,
      },
      () => {
        console.log("calling log rocket with error", this.state);
        LogRocket.track("uiError", this.state);
      }
    );
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div>
          {this.props.childName ? (
            <h2>Error rendering: {this.props.childName}.</h2>
          ) : (
            <h2>Something went wrong.</h2>
          )}
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
