"use client"

import { useState } from "react"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EnhancedDatePickerExample() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Date Picker</CardTitle>
        <CardDescription>Select a date using our improved date picker component</CardDescription>
      </CardHeader>
      <CardContent>
        <EnhancedDatePicker date={date} setDate={setDate} label="Select Date" placeholder="Pick a date" />

        {date && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium">Selected Date:</p>
            <p className="text-lg">
              {date.toLocaleDateString("en-US", {
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
  )
}
