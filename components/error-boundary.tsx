"use client"

import { Component, type ErrorInfo as ReactErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ReactErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    })

    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            An error occurred while rendering this component.
          </p>
          {this.state.error && (
            <div className="mt-4 max-w-[500px] rounded-md bg-muted p-4 text-left">
              <p className="text-sm font-medium">Error: {this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Stack trace</summary>
                  <pre className="mt-2 max-h-[300px] overflow-auto text-xs">{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Button onClick={() => window.location.reload()}>Refresh the page</Button>
            <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
