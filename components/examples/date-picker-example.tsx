"use client"

import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker, FormDatePicker } from "@/components/ui/date-picker"
import { DateRangePicker, FormDateRangePicker } from "@/components/ui/date-range-picker"
import { MonthPicker, FormMonthPicker } from "@/components/ui/month-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Example schema for form validation
const formSchema = z.object({
  singleDate: z.date({
    required_error: "Please select a date",
  }),
  dateRange: z.object({
    from: z.date({
      required_error: "Please select a start date",
    }),
    to: z.date({
      required_error: "Please select an end date",
    }),
  }),
  monthYear: z.date({
    required_error: "Please select a month",
  }),
})

export function DatePickerExample() {
  // For standalone examples
  const [date, setDate] = useState<Date>()
  const [dateRange, setDateRange] = useState<DateRange>()
  const [month, setMonth] = useState<Date>()

  // For form examples
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Process form submission
  }

  return (
    <Tabs defaultValue="standalone" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="standalone">Standalone Examples</TabsTrigger>
        <TabsTrigger value="form">Form Integration</TabsTrigger>
      </TabsList>

      <TabsContent value="standalone">
        <Card>
          <CardHeader>
            <CardTitle>Date Picker Components</CardTitle>
            <CardDescription>
              Standalone date picker components that can be used anywhere in your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Single Date Picker</h3>
              <DatePicker
                date={date}
                setDate={setDate}
                label="Select Date"
                description="Pick a single date from the calendar."
              />
              {date && <p className="mt-2 text-sm">Selected date: {date.toLocaleDateString()}</p>}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Date Range Picker</h3>
              <DateRangePicker
                dateRange={dateRange}
                setDateRange={setDateRange}
                label="Select Date Range"
                description="Pick a date range from the calendar."
              />
              {dateRange?.from && (
                <p className="mt-2 text-sm">
                  Selected range: {dateRange.from.toLocaleDateString()}
                  {dateRange.to && ` to ${dateRange.to.toLocaleDateString()}`}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Month Picker</h3>
              <MonthPicker date={month} setDate={setMonth} label="Select Month" description="Pick a month and year." />
              {month && (
                <p className="mt-2 text-sm">
                  Selected month: {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="form">
        <Card>
          <CardHeader>
            <CardTitle>Date Picker Form Integration</CardTitle>
            <CardDescription>
              Date picker components integrated with React Hook Form and Zod validation.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormDatePicker
                  name="singleDate"
                  label="Event Date"
                  description="The date when the event will take place."
                />

                <FormDateRangePicker
                  name="dateRange"
                  label="Booking Period"
                  description="The start and end dates for your booking."
                />

                <FormMonthPicker
                  name="monthYear"
                  label="Report Month"
                  description="Select a month for the monthly report."
                />
              </CardContent>
              <CardFooter>
                <Button type="submit">Submit</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

