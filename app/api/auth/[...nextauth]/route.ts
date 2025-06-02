import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

// Export authOptions from this file as well
export { authOptions }

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
