// Improve the error-handler utility with better error handling and flexibility

export interface ErrorInfo {
  title: string
  message: string
  details?: string
  suggestion?: string
}

/**
 * Handles errors and returns a formatted error object
 * @param error - The error to handle
 * @param context - The context of the error (optional)
 * @param showToast - Whether to show a toast notification (default: true)
 * @returns Formatted error object
 */
export function handleError(error: unknown, context?: string, showToast = true): ErrorInfo {
  console.error(`Error in ${context || "unknown context"}:`, error)

  // Default error info
  const defaultError: ErrorInfo = {
    title: "An unexpected error occurred",
    message: "Something went wrong. Please try again later.",
    suggestion: "If the problem persists, please contact support.",
  }

  // If it's an Error object with a message
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Handle specific error cases (add more as needed)
    if (errorMessage.includes("network")) {
      return {
        title: "Network Error",
        message: "There was a problem connecting to the server. Please check your internet connection.",
        suggestion: "Try again after checking your network connection.",
      }
    }

    if (errorMessage.includes("validation")) {
      return {
        title: "Validation Error",
        message: "There was a problem with the data you submitted.",
        suggestion: "Please check the form and try again.",
      }
    }

    // For other error messages, use the error message directly
    return {
      title: "An unexpected error occurred",
      message: error.message,
      details: error.stack,
      suggestion: "Please try again or contact support if the issue persists.",
    }
  }

  // For non-Error objects or unknown errors
  return defaultError
}

/**
 * Specifically handles errors related to sale cancellation
 * @param error - The error to handle
 * @returns Formatted error object specific to sale cancellation
 */
export function handleSaleCancellationError(error: any): ErrorInfo {
  console.error("Sale cancellation error:", error)

  // Default error info
  const defaultError: ErrorInfo = {
    title: "Error Cancelling Sale",
    message: "An unexpected error occurred while cancelling the sale.",
    suggestion: "Please try again or contact support if the issue persists.",
  }

  // If it's an Error object with a message
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Handle specific error cases
    if (errorMessage.includes("invoice") && errorMessage.includes("paid")) {
      return {
        title: "Cannot Cancel Sale",
        message: "This sale has a paid invoice associated with it.",
        details: "Paid invoices must be voided before the sale can be cancelled.",
        suggestion: "Please void the invoice first, then try cancelling the sale again.",
      }
    }

    if (errorMessage.includes("inventory") || errorMessage.includes("stock") || errorMessage.includes("quantity")) {
      return {
        title: "Inventory Error",
        message: "There was an issue with inventory quantities when cancelling this sale.",
        details: error.message,
        suggestion: "Please check your inventory records and try again.",
      }
    }

    if (
      errorMessage.includes("permission") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("access")
    ) {
      return {
        title: "Permission Denied",
        message: "You don't have permission to cancel this sale.",
        suggestion: "Please contact your administrator if you believe this is an error.",
      }
    }

    // For other error messages, use the error message directly
    return {
      title: "Error Cancelling Sale",
      message: error.message,
      suggestion: "Please try again or contact support if the issue persists.",
    }
  }

  // For non-Error objects or unknown errors
  return defaultError
}

