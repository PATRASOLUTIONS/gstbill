"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface MonthPickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  description?: string
  error?: string
}

export function MonthPicker({
  date,
  setDate,
  label,
  placeholder = "Pick a month",
  className,
  disabled = false,
  description,
  error,
}: MonthPickerProps) {
  const [year, setYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear())

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const handleYearChange = (increment: number) => {
    setYear((prevYear) => prevYear + increment)
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1)
    setDate(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-red-500 focus-visible:ring-red-500",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={() => handleYearChange(-1)}>
                <span className="sr-only">Previous year</span>
                <span aria-hidden="true">←</span>
              </Button>
              <div className="text-sm font-medium">{year}</div>
              <Button variant="outline" size="icon" onClick={() => handleYearChange(1)}>
                <span className="sr-only">Next year</span>
                <span aria-hidden="true">→</span>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => {
                const isSelected = date && date.getMonth() === index && date.getFullYear() === year

                return (
                  <Button
                    key={month}
                    variant={isSelected ? "default" : "outline"}
                    className={cn("h-9", isSelected && "bg-primary text-primary-foreground")}
                    onClick={() => handleMonthSelect(index)}
                  >
                    {month.substring(0, 3)}
                  </Button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  )
}

interface FormMonthPickerProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormMonthPicker({ name, label, placeholder, description, disabled, className }: FormMonthPickerProps) {
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MonthPicker
              date={field.value}
              setDate={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              error={fieldState.error?.message}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

