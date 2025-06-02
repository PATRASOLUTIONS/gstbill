import * as XLSX from "xlsx"
import type { Sale, Customer, Refund, Product } from "@/types"

// Function to convert data to XLSX
function convertToXLSX(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

// Function to convert data to CSV
function convertToCSV(data: any[]) {
  const replacer = (key: string, value: any) => (value === null ? "" : value)
  const header = Object.keys(data[0])
  const csv = [
    header.join(","),
    ...data.map((row) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(",")),
  ].join("\r\n")

  return csv
}

// Function to download CSV file
function downloadCSV(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${fileName}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Function to export sales
export async function exportSales(format: string, sales: Sale[]) {
  try {
    const data = sales.map((sale) => ({
      "Invoice Number": sale.invoiceNumber,
      Date: format(new Date(sale.date), "yyyy-MM-dd"),
      Customer: sale.customer?.name || "Walk-in Customer",
      Subtotal: sale.subtotal.toFixed(2),
      "Tax Amount": sale.taxAmount.toFixed(2),
      Discount: `${sale.discount}%`,
      Total: sale.total.toFixed(2),
      "Payment Status": sale.paymentStatus,
      "Payment Method": sale.paymentMethod,
      Items: sale.items.length,
    }))

    const fileName = `sales_export_${format(new Date(), "yyyy-MM-dd")}`

    if (format === "xlsx") {
      convertToXLSX(data, fileName)
      return true
    } else if (format === "csv") {
      const csv = convertToCSV(data)
      downloadCSV(csv, fileName)
      return true
    }
    return false
  } catch (error) {
    console.error("Export error:", error)
    return false
  }
}

// Function to export customers by fetching from API
export async function exportCustomers(format: string) {
  try {
    const response = await fetch("/api/customers/export")
    if (!response.ok) {
      throw new Error("Failed to fetch customers for export")
    }

    const customers = await response.json()

    const data = customers.map((customer: Customer) => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone || "",
      Address: customer.address || "",
    }))

    const fileName = `customers_export_${format(new Date(), "yyyy-MM-dd")}`

    if (format === "xlsx") {
      convertToXLSX(data, fileName)
      return true
    } else if (format === "csv") {
      const csv = convertToCSV(data)
      downloadCSV(csv, fileName)
      return true
    }
    return false
  } catch (error) {
    console.error("Export error:", error)
    return false
  }
}

// Function to export refunds
export async function exportRefunds(format: string, refunds: Refund[]) {
  try {
    const data = refunds.map((refund) => ({
      "Refund ID": refund.id,
      "Original Invoice": refund.originalInvoice,
      Date: format(new Date(refund.date), "yyyy-MM-dd"),
      Customer: refund.customer?.name || "Walk-in Customer",
      Amount: refund.amount.toFixed(2),
      Reason: refund.reason,
      Status: refund.status,
      "Refund Method": refund.refundMethod,
    }))

    const fileName = `refunds_export_${format(new Date(), "yyyy-MM-dd")}`

    if (format === "xlsx") {
      convertToXLSX(data, fileName)
      return true
    } else if (format === "csv") {
      const csv = convertToCSV(data)
      downloadCSV(csv, fileName)
      return true
    }
    return false
  } catch (error) {
    console.error("Export error:", error)
    return false
  }
}

// Function to export products
export async function exportProducts(format: string, products: Product[]) {
  try {
    const data = products.map((product) => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      Price: product.price.toFixed(2),
      Cost: product.cost.toFixed(2),
      Stock: product.stock,
      Description: product.description || "",
    }))

    const fileName = `products_export_${format(new Date(), "yyyy-MM-dd")}`

    if (format === "xlsx") {
      convertToXLSX(data, fileName)
      return true
    } else if (format === "csv") {
      const csv = convertToCSV(data)
      downloadCSV(csv, fileName)
      return true
    }
    return false
  } catch (error) {
    console.error("Export error:", error)
    return false
  }
}

