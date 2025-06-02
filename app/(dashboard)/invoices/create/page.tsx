import type { Metadata } from "next"
import { CreateInvoiceForm } from "./create-invoice-form"

export const metadata: Metadata = {
  title: "Create New Invoice | Inventory Management",
  description: "Create a new invoice for your customer",
}

export default function CreateInvoicePage() {
  return (
    <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
      </div>

      <CreateInvoiceForm />
    </div>
  )
}
