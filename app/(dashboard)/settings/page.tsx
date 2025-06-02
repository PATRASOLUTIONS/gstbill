"use client"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Save, Building, Lock, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Company Information
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [gstin, setGstin] = useState("")
  const [state, setState] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [taxRate, setTaxRate] = useState("18")
  const [logo, setLogo] = useState("")

  // Bank Details
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [branch, setBranch] = useState("")

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [stockAlerts, setStockAlerts] = useState(true)
  const [orderNotifications, setOrderNotifications] = useState(true)
  const [paymentNotifications, setPaymentNotifications] = useState(true)

  // Fetch company information on page load
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/company")
        const result = await response.json()

        if (response.ok && result.data) {
          const company = result.data

          // Set company information
          setCompanyName(company.companyName || "")
          setEmail(company.email || "")
          setPhone(company.contact || "")
          setAddress(Array.isArray(company.address) ? company.address.join(", ") : company.address || "")
          setGstin(company.gstin || "")
          setState(company.state || "")
          setStateCode(company.stateCode || "")
          setCurrency(company.currency || "INR")
          setTaxRate(company.taxRate || "18")
          setLogo(company.logo || "")

          // Set bank details
          if (company.bankDetails) {
            setAccountHolderName(company.bankDetails.accountHolderName || "")
            setBankName(company.bankDetails.bankName || "")
            setAccountNumber(company.bankDetails.accountNumber || "")
            setBranch(company.bankDetails.branch || "")
            setIfscCode(company.bankDetails.ifscCode || "")
          }
        }
      } catch (err) {
        console.error("Error fetching company information:", err)
        setError("Failed to load company information. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyInfo()
  }, [])

  // Save company information
  const saveCompanyInfo = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          email,
          contact: phone,
          address: address.split(",").map((item) => item.trim()),
          gstin,
          state,
          stateCode,
          currency,
          taxRate,
          logo,
          bankDetails: {
            accountHolderName,
            bankName,
            accountNumber,
            branch,
            ifscCode,
          },
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess("Company information saved successfully")
        toast({
          title: "Success",
          description: "Company information saved successfully",
          variant: "default",
        })
      } else {
        setError(result.message || "Failed to save company information")
        toast({
          title: "Error",
          description: result.message || "Failed to save company information",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error saving company information:", err)
      setError("An error occurred while saving company information")
      toast({
        title: "Error",
        description: "An error occurred while saving company information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess("")
        }, 3000)
      }
    }
  }

  // Save bank details
  const saveBankDetails = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          email,
          contact: phone,
          address: address.split(",").map((item) => item.trim()),
          gstin,
          state,
          stateCode,
          currency,
          taxRate,
          logo,
          bankDetails: {
            accountHolderName,
            bankName,
            accountNumber,
            branch,
            ifscCode,
          },
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess("Bank details saved successfully")
        toast({
          title: "Success",
          description: "Bank details saved successfully",
          variant: "default",
        })
      } else {
        setError(result.message || "Failed to save bank details")
        toast({
          title: "Error",
          description: result.message || "Failed to save bank details",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error saving bank details:", err)
      setError("An error occurred while saving bank details")
      toast({
        title: "Error",
        description: "An error occurred while saving bank details",
        variant: "destructive",
      })
    } finally {
      setSaving(false)

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess("")
        }, 3000)
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} disabled={loading} />
                </div>
              </div>

              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value)} disabled={loading} />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="stateCode">State Code</Label>
                  <Input
                    id="stateCode"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency} disabled={loading}>
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
                <div className="flex-1 space-y-1">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Select value={taxRate} onValueChange={setTaxRate} disabled={loading}>
                    <SelectTrigger id="taxRate">
                      <SelectValue placeholder="Select tax rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-md border">
                    {logo ? (
                      <img src={logo || "/placeholder.svg"} alt="Company logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Building className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    disabled={loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setLogo(event.target?.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveCompanyInfo} disabled={saving || loading}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>Update your bank account information for invoices and payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={loading} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveBankDetails} disabled={saving || loading}>
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback>AD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-muted-foreground">admin@example.com</p>
                      </div>
                    </div>
                    <div>
                      <Badge>Admin</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">john@example.com</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline">Staff</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback>JS</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Jane Smith</p>
                        <p className="text-xs text-muted-foreground">jane@example.com</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline">Staff</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Add User</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="emailNotifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="stockAlerts" className="text-base">
                      Stock Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">Get notified when inventory items are running low</p>
                  </div>
                  <Switch id="stockAlerts" checked={stockAlerts} onCheckedChange={setStockAlerts} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="orderNotifications" className="text-base">
                      Order Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new orders and order status changes
                    </p>
                  </div>
                  <Switch
                    id="orderNotifications"
                    checked={orderNotifications}
                    onCheckedChange={setOrderNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="paymentNotifications" className="text-base">
                      Payment Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about payment receipts and due payments
                    </p>
                  </div>
                  <Switch
                    id="paymentNotifications"
                    checked={paymentNotifications}
                    onCheckedChange={setPaymentNotifications}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

