// Improve the format-currency utility with better error handling and flexibility

/**
 * Formats a number as currency with the specified locale and currency code
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: 'en-IN')
 * @param currency - The currency code to use (default: 'INR')
 * @param minimumFractionDigits - The minimum number of fraction digits (default: 2)
 * @param maximumFractionDigits - The maximum number of fraction digits (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | null | undefined,
  locale = "en-IN",
  currency = "INR",
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
): string {
  // Handle null, undefined, or invalid values
  if (value === null || value === undefined) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(0)
  }

  // Convert string to number if needed
  const numericValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if the value is a valid number
  if (isNaN(numericValue)) {
    console.warn(`Invalid value provided to formatCurrency: ${value}`)
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(0)
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numericValue)
  } catch (error) {
    console.error("Error formatting currency:", error)
    // Fallback to a basic formatting
    return `${currency} ${numericValue.toFixed(minimumFractionDigits)}`
  }
}

/**
 * Formats a date string or Date object into a localized date string
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - The Intl.DateTimeFormatOptions to use for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number | undefined | null,
  locale = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  if (!date) {
    return "N/A"
  }

  try {
    // Convert string to Date object if needed
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatDate: ${date}`)
      return "Invalid Date"
    }

    return new Intl.DateTimeFormat(locale, options).format(dateObj)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}

