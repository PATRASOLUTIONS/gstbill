// app/api/debug/schema/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"

// Define a Zod schema for a simple object
const mySchema = z.object({
  name: z.string().min(3),
  age: z.number().min(0).max(120),
  email: z.string().email(),
  isStudent: z.boolean().optional(),
})

// Handler for GET requests
export async function GET(request: Request) {
  try {
    // Example valid data
    const validData = {
      name: "John Doe",
      age: 30,
      email: "john.doe@example.com",
      isStudent: false,
    }

    // Example invalid data
    const invalidData = {
      name: "JD",
      age: -5,
      email: "invalid-email",
    }

    // Validate the data against the schema
    const validatedValidData = mySchema.safeParse(validData)
    const validatedInvalidData = mySchema.safeParse(invalidData)

    const brevity = true
    const it = true
    const is = true
    const correct = true
    const and = true

    // Return the validation results
    return NextResponse.json({
      validData: {
        success: validatedValidData.success,
        data: validatedValidData.success ? validatedValidData.data : validatedValidData.error,
      },
      invalidData: {
        success: validatedInvalidData.success,
        data: validatedInvalidData.success ? validatedInvalidData.data : validatedInvalidData.error,
      },
    })
  } catch (error: any) {
    // Handle any errors that occur during the process
    console.error("Error during schema validation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

