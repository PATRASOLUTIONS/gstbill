"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Shield, Users, SettingsIcon, Activity } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { UserManagementTable } from "@/components/admin/user-management-table"
import { ActivityLogTable } from "@/components/admin/activity-log-table"
import { SystemSettings } from "@/components/admin/system-settings"
import { useToast } from "@/components/ui/use-toast"
import { UserSidebarPermissionsTable } from "@/components/admin/user-sidebar-permissions-table"

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [usersForPermissions, setUsersForPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [userPermissionsSearchTerm, setUserPermissionsSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [logSearchTerm, setLogSearchTerm] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      // Check if user is admin
      if (session?.user?.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      fetchUsersForPermissions()
      fetchUsers()
      fetchActivityLogs()
    }
  }, [status, router, session])

  const fetchUsersForPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsersForPermissions(data.users || [])
    } catch (error) {
      console.error("Error fetching users for permissions:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch("/api/admin/activity-logs")

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs")
      }

      const data = await response.json()
      setActivityLogs(data.logs || [])
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      toast({
        title: "Error",
        description: "Failed to load activity logs. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredUsersForPermissions = usersForPermissions.filter(
    (user) =>
      user.name.toLowerCase().includes(userPermissionsSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userPermissionsSearchTerm.toLowerCase()),
  )

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
  )

  const filteredLogs = activityLogs.filter(
    (log) =>
      log.action?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(logSearchTerm.toLowerCase()),
  )

  if (loading && status !== "authenticated") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
      </div>

      <Tabs defaultValue="userPermissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="userPermissions">
            <Shield className="mr-2 h-4 w-4" />
            User Permissions
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon className="mr-2 h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="userPermissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Sidebar Permissions</CardTitle>
              <CardDescription>Manage which sidebar components each user can access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="w-full pl-8"
                      value={userPermissionsSearchTerm}
                      onChange={(e) => setUserPermissionsSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={fetchUsersForPermissions}>Refresh</Button>
              </div>

              <Separator className="my-4" />

              <UserSidebarPermissionsTable
                users={filteredUsersForPermissions}
                onPermissionsUpdated={fetchUsersForPermissions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Create, edit, and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="w-full pl-8"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={fetchUsers}>Refresh</Button>
              </div>

              <Separator className="my-4" />

              <UserManagementTable users={filteredUsers} onUserUpdated={fetchUsers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>Track user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search logs..."
                      className="w-full pl-8"
                      value={logSearchTerm}
                      onChange={(e) => setLogSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={fetchActivityLogs}>Refresh</Button>
              </div>

              <Separator className="my-4" />

              <ActivityLogTable logs={filteredLogs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
