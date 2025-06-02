"use client"

import { useState } from "react"
import { ModernDatePicker } from "@/components/ui/modern-date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ModernDatePickerPage() {
  const [date1, setDate1] = useState<Date | null>(new Date())
  const [date2, setDate2] = useState<Date | null>(new Date())
  const [date3, setDate3] = useState<Date | null>(new Date())
  const [date4, setDate4] = useState<Date | null>(new Date())

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Modern Date Picker Examples</h1>

      <Tabs defaultValue="default" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="dropdown">With Dropdowns</TabsTrigger>
          <TabsTrigger value="time">With Time</TabsTrigger>
          <TabsTrigger value="inline">Inline Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Standard Date Picker</CardTitle>
              <CardDescription>A clean, modern date picker with today button and month navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernDatePicker date={date1} onChange={setDate1} label="Select Date" placeholder="Choose a date" />

              {date1 && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Selected Date:</p>
                  <p className="text-lg">
                    {date1.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropdown" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Date Picker with Dropdowns</CardTitle>
              <CardDescription>Date picker with month and year dropdown selectors for quick navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernDatePicker
                date={date2}
                onChange={setDate2}
                label="Select Date"
                placeholder="Choose a date"
                showYearDropdown={true}
                showMonthDropdown={true}
                yearDropdownItemNumber={10}
              />

              {date2 && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Selected Date:</p>
                  <p className="text-lg">
                    {date2.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Date & Time Picker</CardTitle>
              <CardDescription>Combined date and time picker for selecting precise moments</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernDatePicker
                date={date3}
                onChange={setDate3}
                label="Select Date & Time"
                placeholder="Choose a date and time"
                showTimeSelect={true}
                dateFormat="MMMM d, yyyy h:mm aa"
              />

              {date3 && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Selected Date & Time:</p>
                  <p className="text-lg">
                    {date3.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inline" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Inline Calendar</CardTitle>
              <CardDescription>Calendar always visible for quick date selection</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernDatePicker date={date4} onChange={setDate4} label="Select Date" inline={true} />

              {date4 && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">Selected Date:</p>
                  <p className="text-lg">
                    {date4.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
