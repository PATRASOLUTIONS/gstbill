// Add or update the User interface to include sidebarPermissions
interface User {
  id: string
  name: string
  email: string
  role: string
  sidebarPermissions?: Record<string, boolean>
}

// Update the Session interface if needed
declare module "next-auth" {
  interface Session {
    user: User
  }
}

