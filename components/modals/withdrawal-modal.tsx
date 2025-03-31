"use client"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import type { Withdrawal, Client, PaymentMode } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface WithdrawalModalProps {
  mode: "add" | "edit"
  withdrawal: Withdrawal | null
  isOpen: boolean
  onClose: () => void
}

export default function WithdrawalModal({ mode, withdrawal, isOpen, onClose }: WithdrawalModalProps) {
  const { clients, addWithdrawal, updateWithdrawal, generateWithdrawalId } = useClientContext()
  const { toast } = useToast()

  // Add these new state variables and functions at the top of the component
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [withdrawalId, setWithdrawalId] = useState("")
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Crypto")

  // Validation state
  const [shopIdError, setShopIdError] = useState("")
  const [amountError, setAmountError] = useState("")

  // Available clients for dropdown
  const [availableClients, setAvailableClients] = useState<Client[]>([])

  // Add this function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-gray-500"
      case "In Process":
        return "bg-yellow-500"
      case "Eliminated":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  // Update the useEffect to initialize filteredClients
  useEffect(() => {
    const initializeForm = async () => {
      setAvailableClients(clients)
      setFilteredClients(clients)

      if (mode === "edit" && withdrawal) {
        setWithdrawalId(withdrawal.withdrawalId)
        setShopId(withdrawal.shopId)
        setClientName(withdrawal.clientName)
        setAgent(withdrawal.agent)
        setDate(typeof withdrawal.date === "string" ? withdrawal.date : format(new Date(withdrawal.date), "yyyy-MM-dd"))
        setAmount(withdrawal.amount)
        setPaymentMode(withdrawal.paymentMode)
      } else {
        // Reset form for add mode
        try {
          const newWithdrawalId = await generateWithdrawalId()
          setWithdrawalId(newWithdrawalId)
        } catch (error) {
          console.error("Error generating withdrawal ID:", error)
          setWithdrawalId(`WD${Date.now().toString()}`)
        }
        setShopId("")
        setClientName("")
        setAgent("")
        setDate(format(new Date(), "yyyy-MM-dd"))
        setAmount(0)
        setPaymentMode("Crypto")
      }
    }

    initializeForm()
  }, [mode, withdrawal, clients, generateWithdrawalId])

  // Update client name and agent when shop ID changes
  useEffect(() => {
    if (shopId) {
      const selectedClient = clients.find((client) => client.shopId === shopId)
      if (selectedClient) {
        setClientName(selectedClient.clientName)
        setAgent(selectedClient.agent)
      }
    }
  }, [shopId, clients])

  // Validate shop ID
  const validateShopId = (shopIdToValidate?: string) => {
    const shopIdValue = shopIdToValidate || shopId
    if (!shopIdValue) {
      setShopIdError("Shop ID is required")
      return false
    }

    const clientExists = clients.some((client) => client.shopId === shopIdValue)
    if (!clientExists) {
      setShopIdError("Client with this Shop ID does not exist")
      return false
    }

    setShopIdError("")
    return true
  }

  // Validate amount
  const validateAmount = () => {
    if (amount <= 0) {
      setAmountError("Amount must be greater than 0")
      return false
    }

    setAmountError("")
    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const isShopIdValid = validateShopId()
    const isAmountValid = validateAmount()

    if (!isShopIdValid || !isAmountValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const withdrawalData: Withdrawal = {
        withdrawalId,
        shopId,
        clientName,
        agent,
        date,
        amount,
        paymentMode,
      }

      if (mode === "add") {
        await addWithdrawal(withdrawalData)
        toast({
          title: "Withdrawal Added",
          description: `Withdrawal ${withdrawalId} has been added successfully.`,
          variant: "success",
        })
      } else if (mode === "edit" && withdrawal) {
        await updateWithdrawal(withdrawalData)
        toast({
          title: "Withdrawal Updated",
          description: `Withdrawal ${withdrawalId} has been updated successfully.`,
          variant: "success",
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Withdrawal" : "Edit Withdrawal"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Fill in the details to add a new withdrawal" : "Update withdrawal information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="withdrawalId">Withdrawal ID</Label>
              <Input id="withdrawalId" value={withdrawalId} readOnly />
            </div>
          )}

          {/* Replace the Shop ID select dropdown with an enhanced searchable version */}
          <div className="space-y-2">
            <Label htmlFor="shopId">Shop ID</Label>
            <div className="relative">
              <Input
                id="shopIdSearch"
                placeholder="Search by Shop ID or Client Name"
                value={searchTerm || ""}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (e.target.value) {
                    const filtered = availableClients.filter(
                      (client) =>
                        client.shopId.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        client.clientName.toLowerCase().includes(e.target.value.toLowerCase()),
                    )
                    setFilteredClients(filtered)
                  } else {
                    setFilteredClients(availableClients)
                  }
                }}
                className={shopIdError ? "border-red-500" : ""}
                disabled={mode === "edit"}
              />
              {searchTerm && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.shopId}
                      className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setShopId(client.shopId)
                        setSearchTerm("")
                        validateShopId(client.shopId)
                      }}
                    >
                      <div>
                        <div className="font-medium">{client.shopId}</div>
                        <div className="text-sm text-muted-foreground">{client.clientName}</div>
                      </div>
                      <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {shopIdError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {shopIdError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" value={clientName} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Input id="agent" value={agent} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(Number.parseFloat(e.target.value))
                validateAmount()
              }}
              placeholder="Enter amount"
              className={amountError ? "border-red-500" : ""}
            />
            {amountError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {amountError}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode)}>
              <SelectTrigger id="paymentMode">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Crypto">Crypto</SelectItem>
                <SelectItem value="Online Banking">Online Banking</SelectItem>
                <SelectItem value="Ewallet">Ewallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : mode === "add" ? "Add Withdrawal" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

