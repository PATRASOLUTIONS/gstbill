import type { Metadata } from "next"
import CreateSaleForm from "./CreateSaleForm"

export const metadata: Metadata = {
  title: "Create Sale",
  description: "Create a new sale record",
}

export default function CreateSalePage() {
  return <CreateSaleForm />
}

