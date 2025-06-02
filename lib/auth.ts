import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { collections, dbConnect } from "@/lib/mongodb"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          await dbConnect()
          const usersCollection = await collections.users()
          const user = await usersCollection.findOne({ email: credentials.email })

          if (!user) {
            console.log(`User not found: ${credentials.email}`)
            return null
          }

          const passwordMatch = await compare(credentials.password, user.password)

          if (!passwordMatch) {
            console.log("Invalid password")
            return null
          }

          console.log("User authenticated successfully:", user.email)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            sidebarPermissions: user.sidebarPermissions || {
              dashboard: true,
              products: true,
              invoices: true,
            },
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.sidebarPermissions = user.sidebarPermissions
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.sidebarPermissions = token.sidebarPermissions as Record<string, boolean>
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
}
