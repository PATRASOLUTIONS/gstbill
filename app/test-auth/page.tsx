"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">NextAuth.js Test Page</h1>

      <div className="mb-4 rounded border p-4">
        <h2 className="mb-2 text-xl">Session Status: {status}</h2>
        {session ? (
          <div>
            <p>Signed in as: {session.user?.email}</p>
            <pre className="mt-2 max-w-lg overflow-auto rounded bg-gray-100 p-2">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Not signed in</p>
        )}
      </div>

      <div className="flex gap-4">
        {!session ? (
          <Button onClick={() => signIn()}>Sign in</Button>
        ) : (
          <Button variant="destructive" onClick={() => signOut()}>
            Sign out
          </Button>
        )}
      </div>
    </div>
  )
}
