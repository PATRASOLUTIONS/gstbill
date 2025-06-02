import { getServerSession } from "next-auth/next"
import { ObjectId } from "mongodb"
import { authOptions } from "./auth-config"

// Re-export authOptions
export { authOptions }

/**
 * Gets the current user ID from the session
 * @returns The user ID as a string, or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return null
    }

    // Return user ID from session
    return session.user.id || null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

/**
 * Converts a string ID to MongoDB ObjectId
 * @param id The ID to convert
 * @returns MongoDB ObjectId
 */
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

/**
 * Validates that the current user has access to a resource
 * @param resourceUserId The user ID associated with the resource
 * @returns Boolean indicating if the current user has access
 */
export async function validateUserAccess(resourceUserId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId()

  if (!currentUserId) {
    return false
  }

  return currentUserId === resourceUserId
}

/**
 * Creates a base query filter that includes user ID
 * @returns Query object with user ID filter
 */
export async function createUserFilter() {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  return { userId }
}

