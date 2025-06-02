"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Loader2 } from "lucide-react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { status } = useSession()

  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"
  const error = searchParams?.get("error")
  const registered = searchParams?.get("registered")

  const [email, setEmail] = useState("admin@example.com") // Pre-filled for demo
  const [password, setPassword] = useState("password123") // Pre-filled for demo
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    // Show toast if user just registered
    if (registered === "true") {
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
        variant: "default",
      })
    }

    // Show error message if there's an error in the URL
    if (error) {
      let errorMessage = "An error occurred during authentication"

      switch (error) {
        case "CredentialsSignin":
          errorMessage = "Invalid email or password"
          break
        case "SessionRequired":
          errorMessage = "You need to be signed in to access this page"
          break
      }

      setFormError(errorMessage)
    }
  }, [registered, error, toast])

  // Add a useEffect to check if the user is already logged in
  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (status === "authenticated") {
      console.log("User already authenticated, redirecting to dashboard")
      router.replace("/dashboard")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError("")

    try {
      console.log("Attempting to sign in with:", { email, callbackUrl })

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        setFormError(result.error || "Invalid email or password")
        toast({
          title: "Authentication failed",
          description: result.error || "Invalid email or password",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login successful",
          description: "You have been successfully logged in.",
          variant: "default",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      setFormError(error.message || "An unexpected error occurred")
      toast({
        title: "Authentication failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <ClipboardList className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">QuickBill GST</CardTitle>
          <CardDescription>Enter your credentials to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {formError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{formError}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

