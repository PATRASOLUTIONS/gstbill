"use client"

import { useState, useCallback } from "react"
import { handleError, type ErrorInfo } from "@/utils/error-handler"

interface UseSafeActionOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ErrorInfo) => void
  context?: string
  showToast?: boolean
}

interface UseSafeActionResult<T> {
  execute: (actionFn: () => Promise<T>) => Promise<T | null>
  isLoading: boolean
  error: ErrorInfo | null
  clearError: () => void
}

export function useSafeAction<T = any>({
  onSuccess,
  onError,
  context = "operation",
  showToast = true,
}: UseSafeActionOptions = {}): UseSafeActionResult<T> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorInfo | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(
    async (actionFn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await actionFn()

        if (onSuccess) {
          onSuccess(result)
        }

        return result
      } catch (err) {
        const errorInfo = handleError(err, context, showToast)
        setError(errorInfo)

        if (onError) {
          onError(errorInfo)
        }

        return null
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onError, context, showToast],
  )

  return { execute, isLoading, error, clearError }
}
