"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

export function CreateSaleButton() {
  return (
    <Button asChild>
      <Link href="/sales/create">
        <PlusIcon className="mr-2 h-4 w-4" />
        New Sale
      </Link>
    </Button>
  )
}

