"use client"

import { useState } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Calendar, MapPin, DollarSign, User, Store, MessageSquare, Trash2 } from "lucide-react"
import type { OrderRequest, OrderRequestStatus } from "@/types/client"
import { formatCurrency, formatDate } from "@/utils/format-helpers"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OrderRequestCardProps {
  request: OrderRequest
}

export default function OrderRequestCard({ request }: OrderRequestCardProps) {
  const { updateOrderRequestStatus, deleteOrderRequest } = useClientContext()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Get status badge color
  const getStatusColor = (status: OrderRequestStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500"
      case "Approved":
        return "bg-green-500"
      case "Rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // Handle status update
  const handleStatusUpdate = (status: OrderRequestStatus) => {
    setIsUpdating(true)

    // Simulate a delay for better UX
    setTimeout(() => {
      updateOrderRequestStatus(request.id, status)

      toast({
        title: `Request ${status}`,
        description: `Order request has been ${status.toLowerCase()}.`,
        variant: status === "Approved" ? "success" : status === "Rejected" ? "destructive" : "default",
      })

      setIsUpdating(false)
    }, 500)
  }

  // Handle delete request
  const handleDeleteRequest = () => {
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteOrderRequest(request.id)
    toast({
      title: "Request Deleted",
      description: "Order request has been deleted successfully.",
      variant: "default",
    })
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        layout
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-4 pb-0 flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.shopId}</span>
            </div>
            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{request.clientName}</p>
                  <p className="text-xs text-muted-foreground">Agent: {request.agent}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{formatDate(request.date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{request.location}</p>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{formatCurrency(request.price || 0)}</p>
              </div>
            </div>

            {request.remarks && (
              <div className="flex items-start gap-2 pt-1 border-t">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm">{request.remarks}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0 flex justify-end gap-2">
            {isAdmin && request.status === "Pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleStatusUpdate("Rejected")}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => handleStatusUpdate("Approved")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleDeleteRequest}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

