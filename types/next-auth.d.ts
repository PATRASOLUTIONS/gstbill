import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  // Add sidebarPermissions to the User interface in the session
  interface User {
    id: string
    name: string
    email: string
    role: string
    sidebarPermissions?: {
      dashboard?: boolean
      products?: boolean
      categories?: boolean
      customers?: boolean
      sales?: boolean
      purchases?: boolean
      suppliers?: boolean
      invoices?: boolean
      refunds?: boolean
      reports?: boolean
      admin?: boolean
      [key: string]: boolean | undefined
    }
  }
}
