import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ErrorInfo } from "@/utils/error-handler"

interface ErrorFeedbackProps {
  error: ErrorInfo
}

export function ErrorFeedback({ error }: ErrorFeedbackProps) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.details && <p className="mt-2 text-sm">{error.details}</p>}
        {error.suggestion && <p className="mt-2 text-sm font-medium">Suggestion: {error.suggestion}</p>}
      </AlertDescription>
    </Alert>
  )
}

