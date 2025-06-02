"use client"

import { createInvoice, deleteInvoice, updateInvoice } from "@/app/lib/actions"
import { Button } from "@/app/ui/button"
import { PlusIcon } from "@heroicons/react/24/outline"
import { Search } from "@/app/ui/search"
import { InvoicesTable } from "@/app/ui/invoices/table"
import { CreateInvoice } from "@/app/ui/invoices/create-form"
import { UpdateInvoice } from "@/app/ui/invoices/edit-form"
import { useOptimistic, useState, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function InvoicesClient({
  invoices,
  customers,
  totalPages,
}: {
  invoices: any[]
  customers: any[]
  totalPages: number
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [invoiceToUpdate, setInvoiceToUpdate] = useState(null)

  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const currentPage = Number(searchParams.get("page")) || 1
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [optimisticInvoices, setOptimisticInvoices] = useOptimistic(invoices, (state, newInvoice) => [
    newInvoice,
    ...state,
  ])

  const handleCreateFormToggle = () => {
    setIsCreating((prevState) => !prevState)
  }

  const handleUpdateFormToggle = (invoice: any) => {
    setInvoiceToUpdate(invoice)
  }

  const handleUpdateFormClose = () => {
    setInvoiceToUpdate(null)
  }

  async function handleCreateInvoice(formData: FormData) {
    startTransition(async () => {
      try {
        const rawFormData = {
          customerId: formData.get("customerId"),
          amount: formData.get("amount"),
          status: formData.get("status"),
        }

        const { id } = await createInvoice(rawFormData)

        // Revalidate the cache
        // revalidatePath('/dashboard/invoices');
        setOptimisticInvoices((prevState) => [
          {
            id: id,
            customer_id: rawFormData.customerId,
            amount: Number.parseInt(rawFormData.amount as string),
            status: rawFormData.status,
            date: new Date().toISOString().split("T")[0],
          },
          ...prevState,
        ])
        setIsCreating(false)
      } catch (error) {
        console.error("Error creating invoice:", error)
      }
    })
  }

  async function handleUpdateInvoice(id: string, formData: FormData) {
    startTransition(async () => {
      try {
        const rawFormData = {
          customerId: formData.get("customerId"),
          amount: formData.get("amount"),
          status: formData.get("status"),
        }

        await updateInvoice(id, rawFormData)
        handleUpdateFormClose()
      } catch (error) {
        console.error("Error updating invoice:", error)
      }
    })
  }

  async function handleDeleteInvoice(id: string) {
    startTransition(async () => {
      try {
        await deleteInvoice(id)
      } catch (error) {
        console.error("Error deleting invoice:", error)
      }
    })
  }

  return (
    <div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <div>
          <Button onClick={handleCreateFormToggle}>
            <PlusIcon className="h-5 w-5" />
            Create Invoice
          </Button>
        </div>
      </div>
      {isCreating && (
        <CreateInvoice customers={customers} onCreate={handleCreateInvoice} onClose={handleCreateFormToggle} />
      )}
      {invoiceToUpdate && (
        <UpdateInvoice
          id={invoiceToUpdate.id}
          customerId={invoiceToUpdate.customer_id}
          amount={invoiceToUpdate.amount}
          status={invoiceToUpdate.status}
          customers={customers}
          onUpdate={handleUpdateInvoice}
          onClose={handleUpdateFormClose}
        />
      )}
      <InvoicesTable
        invoices={optimisticInvoices}
        search={query}
        currentPage={currentPage}
        totalPages={totalPages}
        deleteInvoice={handleDeleteInvoice}
      />
    </div>
  )
}
