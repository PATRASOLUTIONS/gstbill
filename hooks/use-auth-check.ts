"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuthCheck(redirectTo = "/auth/login") {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log(`User not authenticated, redirecting to ${redirectTo}`)
      router.replace(redirectTo)
    }
  }, [status, router, redirectTo])

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}

