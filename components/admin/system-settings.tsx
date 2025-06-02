"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

type SystemSettingsProps = {}

export function SystemSettings({}: SystemSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    general: {
      companyName: "",
      companyLogo: "",
      currency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
    },
    invoice: {
      prefix: "INV-",
      termsAndConditions: "",
      showLogo: true,
      showSignature: true,
      defaultDueDays: 15,
    },
    email: {
      enableEmailNotifications: true,
      senderName: "",
      senderEmail: "",
      invoiceEmailTemplate: "",
      reminderEmailTemplate: "",
    },
    security: {
      sessionTimeout: 60,
      requireStrongPasswords: true,
      enableTwoFactorAuth: false,
      passwordExpiryDays: 90,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/settings")

        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load system settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleInputChange = (category: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Success",
        description: "System settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="ml-2">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.general.companyName}
                onChange={(e) => handleInputChange("general", "companyName", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyLogo">Company Logo URL</Label>
              <Input
                id="companyLogo"
                value={settings.general.companyLogo}
                onChange={(e) => handleInputChange("general", "companyLogo", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.general.currency}
                onValueChange={(value) => handleInputChange("general", "currency", value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.general.timezone}
                onValueChange={(value) => handleInputChange("general", "timezone", value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (GMT+5:30)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.general.dateFormat}
              onValueChange={(value) => handleInputChange("general", "dateFormat", value)}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="prefix">Invoice Number Prefix</Label>
              <Input
                id="prefix"
                value={settings.invoice.prefix}
                onChange={(e) => handleInputChange("invoice", "prefix", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultDueDays">Default Due Days</Label>
              <Input
                id="defaultDueDays"
                type="number"
                min="0"
                value={settings.invoice.defaultDueDays}
                onChange={(e) => handleInputChange("invoice", "defaultDueDays", Number.parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="termsAndConditions">Default Terms and Conditions</Label>
            <Textarea
              id="termsAndConditions"
              rows={4}
              value={settings.invoice.termsAndConditions}
              onChange={(e) => handleInputChange("invoice", "termsAndConditions", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="showLogo"
                checked={settings.invoice.showLogo}
                onCheckedChange={(checked) => handleInputChange("invoice", "showLogo", checked)}
              />
              <Label htmlFor="showLogo">Show Logo on Invoice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showSignature"
                checked={settings.invoice.showSignature}
                onCheckedChange={(checked) => handleInputChange("invoice", "showSignature", checked)}
              />
              <Label htmlFor="showSignature">Show Signature on Invoice</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableEmailNotifications"
              checked={settings.email.enableEmailNotifications}
              onCheckedChange={(checked) => handleInputChange("email", "enableEmailNotifications", checked)}
            />
            <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={settings.email.senderName}
                onChange={(e) => handleInputChange("email", "senderName", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={settings.email.senderEmail}
                onChange={(e) => handleInputChange("email", "senderEmail", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoiceEmailTemplate">Invoice Email Template</Label>
            <Textarea
              id="invoiceEmailTemplate"
              rows={4}
              value={settings.email.invoiceEmailTemplate}
              onChange={(e) => handleInputChange("email", "invoiceEmailTemplate", e.target.value)}
              placeholder="Use {{variables}} for dynamic content"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reminderEmailTemplate">Payment Reminder Template</Label>
            <Textarea
              id="reminderEmailTemplate"
              rows={4}
              value={settings.email.reminderEmailTemplate}
              onChange={(e) => handleInputChange("email", "reminderEmailTemplate", e.target.value)}
              placeholder="Use {{variables}} for dynamic content"
            />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange("security", "sessionTimeout", Number.parseInt(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
              <Input
                id="passwordExpiryDays"
                type="number"
                min="0"
                value={settings.security.passwordExpiryDays}
                onChange={(e) => handleInputChange("security", "passwordExpiryDays", Number.parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="requireStrongPasswords"
                checked={settings.security.requireStrongPasswords}
                onCheckedChange={(checked) => handleInputChange("security", "requireStrongPasswords", checked)}
              />
              <Label htmlFor="requireStrongPasswords">Require Strong Passwords</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enableTwoFactorAuth"
                checked={settings.security.enableTwoFactorAuth}
                onCheckedChange={(checked) => handleInputChange("security", "enableTwoFactorAuth", checked)}
              />
              <Label htmlFor="enableTwoFactorAuth">Enable Two-Factor Authentication</Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  )
}
