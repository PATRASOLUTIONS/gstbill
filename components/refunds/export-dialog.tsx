"use client"

import React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CSVLink } from "react-csv"

const exportFormSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includeDetails: z.boolean().default(false),
})

export function ExportRefundsDialog({ open, onOpenChange }) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [refundsData, setRefundsData] = useState([])
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvData, setCsvData] = useState([])
  const [csvFilename, setCsvFilename] = useState("refunds-export.csv")

  const form = useForm({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      status: "",
      type: "",
      startDate: undefined,
      endDate: undefined,
      includeDetails: false,
    },
  })

  const csvLinkRef = React.useRef()

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)

      // Validate date range if both dates are provided
      if (data.startDate && data.endDate) {
        if (data.startDate > data.endDate) {
          form.setError("endDate", {
            message: "End date cannot be before start date",
          })
          setIsLoading(false)
          return
        }
      }

      // Build query params
      const queryParams = new URLSearchParams()
      if (data.status && data.status !== "all") queryParams.append("status", data.status)
      if (data.type && data.type !== "all") queryParams.append("type", data.type)
      if (data.startDate) queryParams.append("startDate", data.startDate.toISOString())
      if (data.endDate) queryParams.append("endDate", data.endDate.toISOString())
      if (data.includeDetails) queryParams.append("includeDetails", "true")

      const response = await fetch(`/api/refunds/export?${queryParams.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to export refunds: ${response.status}`)
      }

      const result = await response.json()

      // Validate the response data
      if (!result.headers || !result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid export data received from server")
      }

      // Set CSV data
      setRefundsData(result.refunds || [])
      setCsvHeaders(result.headers)
      setCsvData(result.data)
      setCsvFilename(`refunds-export-${new Date().toISOString().split("T")[0]}.csv`)

      // Trigger download
      setTimeout(() => {
        if (csvLinkRef.current) {
          csvLinkRef.current.link.click()
        }
        toast({
          title: "Success",
          description: "Refunds exported successfully",
        })
      }, 100)
    } catch (error) {
      console.error("Error exporting refunds:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export refunds",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Refunds</DialogTitle>
          <DialogDescription>Export refunds data to CSV file</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="customer">Customer Refunds</SelectItem>
                      <SelectItem value="supplier">Supplier Refunds</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="includeDetails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Detailed Information</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Include additional details like customer/supplier information and reference details
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Hidden CSV Link for download */}
        {csvData.length > 0 && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={csvFilename}
            className="hidden"
            ref={csvLinkRef}
            target="_blank"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
