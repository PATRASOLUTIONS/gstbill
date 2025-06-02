"use server"

import { z } from "zod"
import { connectToDatabase } from "@/lib/mongodb"

// Define validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export async function submitContactForm(formData: FormData) {
  try {
    // Extract form data
    const values = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    // Validate using Zod
    const result = contactFormSchema.safeParse(values)

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return { success: false, errors }
    }

    // Store in database instead of sending email
    const { db } = await connectToDatabase()

    // Create contact message document
    const contactMessage = {
      name: values.name,
      email: values.email,
      subject: values.subject,
      message: values.message,
      createdAt: new Date(),
      status: "unread",
    }

    // Insert into database
    await db.collection("contactMessages").insertOne(contactMessage)

    return {
      success: true,
      message: "Your message has been sent successfully! We will get back to you soon.",
    }
  } catch (error) {
    console.error("Contact form submission error:", error)
    return {
      success: false,
      message: "There was a problem sending your message. Please try again later.",
    }
  }
}
