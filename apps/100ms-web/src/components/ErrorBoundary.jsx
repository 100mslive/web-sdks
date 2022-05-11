import React, { Component } from "react";
import LogRocket from "logrocket";
import { ErrorWithSupportLink } from "./PreviewScreen";

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
        console.error("uiError", this.state.error, this.state.errorInfo);
        LogRocket.track("uiError", { error: this.state.error });
      }
    );
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div>
          {ErrorWithSupportLink(
            "Something went wrong. Please reload to see if it works."
          )}
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {JSON.stringify(this.state.errorInfo)}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
