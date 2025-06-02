import type { Metadata } from "next"
import { AdminRegistrationForm } from "@/components/admin/admin-registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Registration | Inventory Management",
  description: "Register as an admin user",
}

export default function AdminRegistrationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <ClipboardList className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Registration</CardTitle>
          <CardDescription>Create an admin account for the inventory management system</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRegistrationForm />
        </CardContent>
      </Card>
    </div>
  )
}

