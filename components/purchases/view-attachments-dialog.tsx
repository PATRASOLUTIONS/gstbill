"use client"

import { File, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Attachment {
  fileName: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

interface PurchaseOrder {
  poNumber: string
  supplierName: string
  attachments?: Attachment[]
}

interface ViewAttachmentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: PurchaseOrder | null
}

export function ViewAttachmentsDialog({ open, onOpenChange, purchase }: ViewAttachmentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Purchase Order Attachments</DialogTitle>
          <DialogDescription>
            {purchase?.poNumber} - {purchase?.supplierName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {purchase?.attachments && purchase.attachments.length > 0 ? (
            <div className="space-y-4">
              {purchase.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between border p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={attachment.fileUrl}
                    download={attachment.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No attachments found for this purchase order.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

