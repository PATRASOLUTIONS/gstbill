"use client"

import type React from "react"
import { forwardRef, useState, useEffect } from "react"
import ReactDatePicker from "react-datepicker"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import "react-datepicker/dist/react-datepicker.css"

// Custom stylesheet to override default styles
const datePickerStyles = `
.react-datepicker {
  font-family: inherit;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background-color: hsl(var(--background));
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.react-datepicker-wrapper {
  display: block;
  width: 100%;
}

.react-datepicker__header {
  background-color: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  padding-top: 10px;
}

.react-datepicker__navigation {
  top: 12px;
}

.react-datepicker__current-month {
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 10px;
  color: hsl(var(--foreground));
}

.react-datepicker__day-name {
  width: 2rem;
  line-height: 2rem;
  margin: 0.166rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.react-datepicker__day {
  width: 2rem;
  line-height: 2rem;
  margin: 0.166rem;
  border-radius: 0.375rem;
  color: hsl(var(--foreground));
}

.react-datepicker__day:hover,
.react-datepicker__month-text:hover,
.react-datepicker__quarter-text:hover,
.react-datepicker__year-text:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  border-radius: 0.375rem;
}

.react-datepicker__day--selected,
.react-datepicker__day--keyboard-selected {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
  font-weight: 600;
}

.react-datepicker__day--today {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  font-weight: 600;
}

.react-datepicker__day--outside-month {
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
}

.react-datepicker__triangle {
  display: none;
}

.react-datepicker__month-container {
  float: none;
}

.react-datepicker-popper {
  z-index: 50 !important;
}

.react-datepicker__today-button {
  background-color: hsl(var(--muted));
  border-top: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  font-weight: 500;
  padding: 8px 0;
}

.react-datepicker__month-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
}

.react-datepicker__month {
  margin: 0;
  padding: 4px;
}

.react-datepicker__year-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: none;
  gap: 4px;
  padding: 4px;
}

.react-datepicker__year-text {
  padding: 6px;
  border-radius: 0.375rem;
  margin: 0;
  width: auto !important;
}

.react-datepicker__year-text:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.react-datepicker__year-text--selected {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
}

.react-datepicker__navigation--years-upcoming,
.react-datepicker__navigation--years-previous {
  position: relative;
  top: 0;
  height: 24px;
  margin-top: 4px;
}

.react-datepicker__navigation-icon--years-upcoming::before,
.react-datepicker__navigation-icon--years-previous::before {
  top: 6px;
}

.react-datepicker__portal .react-datepicker__day-name,
.react-datepicker__portal .react-datepicker__day,
.react-datepicker__portal .react-datepicker__time-name {
  width: 3rem;
  line-height: 3rem;
}
`

// Add the styles to the document
const StyleInjector = () => {
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement("style")
    styleElement.innerHTML = datePickerStyles
    // Append to head
    document.head.appendChild(styleElement)

    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  return null
}

interface DatePickerProps {
  date: Date | null
  onChange: (date: Date | null) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  showTimeSelect?: boolean
  timeFormat?: string
  dateFormat?: string
  className?: string
  clearable?: boolean
  minDate?: Date
  maxDate?: Date
  isMobile?: boolean
  showYearDropdown?: boolean
  showMonthDropdown?: boolean
  yearDropdownItemNumber?: number
  monthsShown?: number
  todayButton?: string
  inline?: boolean
}

export function ModernDatePicker({
  date,
  onChange,
  label,
  placeholder = "Select date",
  disabled = false,
  error,
  showTimeSelect = false,
  timeFormat = "HH:mm",
  dateFormat = "MMMM d, yyyy",
  className,
  clearable = true,
  minDate,
  maxDate,
  isMobile = false,
  showYearDropdown = false,
  showMonthDropdown = false,
  yearDropdownItemNumber = 15,
  monthsShown = 1,
  todayButton = "Today",
  inline = false,
}: DatePickerProps) {
  // Inject styles
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Custom input component
  const CustomInput = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
    ({ value, onClick, onChange: _onChange, ...props }, ref) => (
      <Button
        ref={ref}
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full justify-between text-left font-normal",
          !date && "text-muted-foreground",
          error && "border-red-500 focus-visible:ring-red-500",
        )}
        {...props}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
        <div className="flex items-center">
          {date && clearable && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-1 h-5 w-5 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear date</span>
            </Button>
          )}
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </div>
      </Button>
    ),
  )
  CustomInput.displayName = "CustomInput"

  return (
    <div className={cn("grid gap-2", className)}>
      {mounted && <StyleInjector />}

      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <ReactDatePicker
        selected={date}
        onChange={onChange}
        customInput={inline ? undefined : <CustomInput />}
        dateFormat={dateFormat}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        disabled={disabled}
        calendarClassName="!bg-background"
        wrapperClassName="w-full"
        popperClassName="z-50"
        minDate={minDate}
        maxDate={maxDate}
        showYearDropdown={showYearDropdown}
        showMonthDropdown={showMonthDropdown}
        dropdownMode="select"
        yearDropdownItemNumber={yearDropdownItemNumber}
        monthsShown={monthsShown}
        todayButton={todayButton}
        fixedHeight
        inline={inline}
        showPopperArrow={false}
        dayClassName={() => "hover:bg-accent hover:text-accent-foreground"}
        monthClassName={() => "hover:bg-accent hover:text-accent-foreground"}
        weekDayClassName={() => "text-muted-foreground"}
      />

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  )
}

// Form integration component
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface FormDatePickerProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  disabled?: boolean
  className?: string
  showTimeSelect?: boolean
  clearable?: boolean
  showYearDropdown?: boolean
  showMonthDropdown?: boolean
}

export function FormModernDatePicker({
  name,
  label,
  placeholder,
  description,
  disabled,
  className,
  showTimeSelect,
  clearable,
  showYearDropdown,
  showMonthDropdown,
}: FormDatePickerProps) {
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <ModernDatePicker
              date={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              error={fieldState.error?.message}
              showTimeSelect={showTimeSelect}
              clearable={clearable}
              showYearDropdown={showYearDropdown}
              showMonthDropdown={showMonthDropdown}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

