import { NextResponse } from "next/server"
import PDFDocument from "pdfkit"

export async function GET() {
  console.log("Testing PDF generation")

  try {
    // Create a simple PDF document
    const doc = new PDFDocument({ margin: 50 })

    // Set response headers
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="test-pdf.pdf"`)

    // Buffer to store PDF data
    const chunks: Buffer[] = []

    // Collect PDF data
    doc.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    // Return a promise that resolves with the PDF data
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on("end", () => {
        console.log("Test PDF generation completed successfully")
        const pdfBuffer = Buffer.concat(chunks)
        resolve(new NextResponse(pdfBuffer, { headers }))
      })

      doc.on("error", (err) => {
        console.error("Test PDF generation error:", err)
        reject(
          new NextResponse(JSON.stringify({ error: "PDF generation failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
        )
      })

      // Add minimal content to the PDF
      doc.fontSize(25).text("Test PDF", { align: "center" })
      doc.moveDown()
      doc.fontSize(15).text("This is a test PDF document", { align: "center" })
      doc.moveDown()
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "center" })

      // Finalize the PDF
      doc.end()
    })
  } catch (error) {
    console.error("Error in test PDF generation:", error)
    return NextResponse.json(
      {
        error: "Failed to generate test PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
