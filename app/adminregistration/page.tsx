import type { Metadata } from "next"
import { AdminRegistrationForm } from "@/components/admin/admin-registration-form"

export const metadata: Metadata = {
  title: "Admin Registration",
  description: "Register as an admin user",
}

export default function AdminRegistrationPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Registration</h1>
          <p className="text-sm text-muted-foreground">Create an admin account for the inventory management system</p>
        </div>
        <AdminRegistrationForm />
      </div>
    </div>
  )
}

