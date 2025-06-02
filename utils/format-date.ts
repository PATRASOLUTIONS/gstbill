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

/**
 * Formats a date as a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date | number | undefined | null, locale = "en-US"): string {
  if (!date) {
    return "N/A"
  }

  try {
    // Convert string to Date object if needed
    const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn(`Invalid date provided to formatRelativeTime: ${date}`)
      return "Invalid Date"
    }

    const now = new Date()
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000)
    const absSeconds = Math.abs(diffInSeconds)

    // Define time units in seconds
    const minute = 60
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const month = day * 30
    const year = day * 365

    let unit: Intl.RelativeTimeFormatUnit
    let value: number

    if (absSeconds < minute) {
      unit = "second"
      value = diffInSeconds
    } else if (absSeconds < hour) {
      unit = "minute"
      value = Math.round(diffInSeconds / minute)
    } else if (absSeconds < day) {
      unit = "hour"
      value = Math.round(diffInSeconds / hour)
    } else if (absSeconds < week) {
      unit = "day"
      value = Math.round(diffInSeconds / day)
    } else if (absSeconds < month) {
      unit = "week"
      value = Math.round(diffInSeconds / week)
    } else if (absSeconds < year) {
      unit = "month"
      value = Math.round(diffInSeconds / month)
    } else {
      unit = "year"
      value = Math.round(diffInSeconds / year)
    }

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    return rtf.format(value, unit)
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "Error"
  }
}
