export async function downloadInvoice(id: string) {
  try {
    console.log(`Downloading invoice with ID: ${id}`)

    // Fetch invoice data from the API
    const response = await fetch(`/api/invoice/download?id=${id}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response:", errorData)
      throw new Error(errorData.error || `Failed to fetch invoice data: ${response.status}`)
    }

    const data = await response.json()
    console.log("Invoice data received:", data)

    // Import the PDF generation utility dynamically
    const { generateInvoicePDF } = await import("@/utils/generate-invoice-pdf")

    // Generate and download the PDF
    await generateInvoicePDF(data)

    return { success: true }
  } catch (error) {
    console.error("Error downloading invoice:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
