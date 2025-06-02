"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { format, addMonths, subMonths, isToday, isEqual, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface EnhancedDatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
}

export function EnhancedDatePicker({
  date,
  setDate,
  label,
  placeholder = "Pick a date",
  className,
  disabled = false,
  error,
}: EnhancedDatePickerProps) {
  const [month, setMonth] = React.useState(date || new Date())
  const [open, setOpen] = React.useState(false)

  // Update the month view when the date changes externally
  React.useEffect(() => {
    if (date) {
      setMonth(date)
    }
  }, [date])

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const handlePreviousMonth = () => {
    setMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setMonth((prev) => addMonths(prev, 1))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (previous month days + current month days)
    const totalDays = daysFromPrevMonth + lastDay.getDate()

    // Calculate rows needed (ceil to ensure we have enough rows)
    const rows = Math.ceil(totalDays / 7)

    // Calculate total cells needed
    const totalCells = rows * 7

    const days: Date[] = []

    // Add days from previous month
    const prevMonth = subMonths(firstDay, 1)
    const prevMonthLastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()

    for (let i = 0; i < daysFromPrevMonth; i++) {
      const day = prevMonthLastDay - daysFromPrevMonth + i + 1
      days.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day))
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // Add days from next month
    const remainingCells = totalCells - days.length
    const nextMonth = addMonths(firstDay, 1)

    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i))
    }

    return days
  }

  const days = getDaysInMonth(month)

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
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
            {date ? format(date, "MMMM do, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous month</span>
              </Button>
              <div className="text-sm font-medium">{format(month, "MMMM yyyy")}</div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next month</span>
              </Button>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isSelected = date ? isEqual(day, date) : false
                const isCurrentMonth = isSameMonth(day, month)
                const isTodayDate = isToday(day)

                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-50",
                      isTodayDate && "bg-muted",
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    )}
                    onClick={() => {
                      setDate(day)
                      setOpen(false)
                    }}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setDate(new Date())
                setOpen(false)
              }}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  )
}

// Form integration component
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface FormEnhancedDatePickerProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function FormEnhancedDatePicker({
  name,
  label,
  placeholder,
  description,
  disabled,
  className,
}: FormEnhancedDatePickerProps) {
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <EnhancedDatePicker
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

