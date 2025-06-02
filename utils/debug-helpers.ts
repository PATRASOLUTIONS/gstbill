/**
 * Utility functions to help with debugging
 */

/**
 * Safely inspects an object's structure for debugging
 * @param obj The object to inspect
 * @param maxDepth Maximum depth to inspect (default: 2)
 * @returns A simplified representation of the object structure
 */
export function inspectObject(obj: any, maxDepth = 2): any {
  if (maxDepth <= 0) return typeof obj

  if (obj === null) return null
  if (obj === undefined) return undefined

  if (typeof obj !== "object") return typeof obj

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]"
    return [inspectObject(obj[0], maxDepth - 1), obj.length > 1 ? `...${obj.length - 1} more items` : ""].filter(
      Boolean,
    )
  }

  const result: Record<string, any> = {}
  for (const key of Object.keys(obj).slice(0, 5)) {
    result[key] = inspectObject(obj[key], maxDepth - 1)
  }

  const remainingKeys = Object.keys(obj).length - 5
  if (remainingKeys > 0) {
    result[`...${remainingKeys} more keys`] = "..."
  }

  return result
}

/**
 * Logs detailed information about an error
 * @param error The error to log
 * @param context Additional context information
 */
export function logDetailedError(error: any, context = ""): void {
  console.error(`Error in ${context || "unknown context"}:`, error)

  if (error instanceof Error) {
    console.error(`Name: ${error.name}`)
    console.error(`Message: ${error.message}`)
    console.error(`Stack: ${error.stack}`)
  }

  // Log any additional properties on the error object
  if (typeof error === "object" && error !== null) {
    const additionalProps = Object.keys(error).filter((key) => key !== "name" && key !== "message" && key !== "stack")

    if (additionalProps.length > 0) {
      console.error("Additional error properties:")
      additionalProps.forEach((prop) => {
        console.error(`- ${prop}:`, error[prop])
      })
    }
  }
}
