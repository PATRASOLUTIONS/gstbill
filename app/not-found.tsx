"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect } from "react"

export default function NotFound() {
  const router = useRouter()

  // Clear session and redirect to login
  const handleGoToLogin = async () => {
    await signOut({ redirect: false })
    router.push("/auth/login")
  }

  // Automatically clear session after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoToLogin()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>You will be redirected to the login page in 5 seconds.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleGoToLogin}>Go to Login</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
