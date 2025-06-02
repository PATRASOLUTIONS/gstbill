import { NextResponse } from "next/server"

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }

  return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
}

export function formatDateForCSV(date: Date | string | number): string {
  try {
    const d = new Date(date)
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

