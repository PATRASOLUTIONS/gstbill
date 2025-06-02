"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTime } from "@/lib/utils"
import { useState } from "react"
import { Info } from "lucide-react"

interface ActivityLog {
  _id: string
  user: string
  action: string
  details: string
  ipAddress?: string
  timestamp: string
  metadata?: Record<string, any>
}

interface ActivityLogTableProps {
  logs: ActivityLog[]
}

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log)
    setIsDetailsOpen(true)
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "default"
    if (action.includes("update") || action.includes("edit")) return "secondary"
    if (action.includes("delete") || action.includes("remove")) return "destructive"
    if (action.includes("login") || action.includes("logout")) return "outline"
    return "secondary"
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No activity logs found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{log.user}</TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                <TableCell>{log.ipAddress || "N/A"}</TableCell>
                <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                    <Info className="mr-2 h-4 w-4" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>Detailed information about this activity</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">User</h3>
                  <p>{selectedLog.user}</p>
                </div>
                <div>
                  <h3 className="font-medium">Action</h3>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <h3 className="font-medium">Details</h3>
                  <p className="whitespace-pre-wrap">{selectedLog.details}</p>
                </div>
                <div>
                  <h3 className="font-medium">IP Address</h3>
                  <p>{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <h3 className="font-medium">Timestamp</h3>
                  <p>{formatDateTime(selectedLog.timestamp)}</p>
                </div>
                {selectedLog.metadata && (
                  <div>
                    <h3 className="font-medium">Additional Data</h3>
                    <pre className="mt-2 rounded bg-muted p-2 text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

