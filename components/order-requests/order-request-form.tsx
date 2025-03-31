"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useClientContext } from "@/context/client-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CalendarIcon,
  PlusCircle,
  Search,
  User,
  Building,
  MapPin,
  DollarSign,
  MessageSquare,
} from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function OrderRequestForm() {
  const { clients, addOrderRequest } = useClientContext()
  const { toast } = useToast()

  // Form state
  const [shopId, setShopId] = useState("")
  const [clientName, setClientName] = useState("")
  const [agent, setAgent] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState<number | string>("") // Change to string or number
  const [remarks, setRemarks] = useState("")

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState(clients || [])
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Validation state
  const [shopIdError, setShopIdError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [priceError, setPriceError] = useState("")

  // Update filtered clients when clients or search term changes
  useEffect(() => {
    if (clients) {
      // Only include Active and Inactive clients
      const eligibleClients = clients.filter((client) => client.status === "Active" || client.status === "Inactive")

      if (searchTerm) {
        const filtered = eligibleClients.filter(
          (client) =>
            (client.shopId && client.shopId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.clientName && client.clientName.toLowerCase().includes(searchTerm.toLowerCase())),
        )
        setFilteredClients(filtered)
      } else {
        setFilteredClients(eligibleClients)
      }
    }
  }, [clients, searchTerm])

  // Auto-fill client name and agent when shop ID is selected
  useEffect(() => {
    if (shopId && clients) {
      const selectedClient = clients.find((client) => client.shopId === shopId)
      if (selectedClient) {
        setClientName(selectedClient.clientName)
        setAgent(selectedClient.agent)
        setShopIdError("")
      }
    }
  }, [shopId, clients])

  // Validate shop ID
  const validateShopId = () => {
    if (!shopId) {
      setShopIdError("Shop ID is required")
      return false
    }

    if (!clients) {
      setShopIdError("No clients available")
      return false
    }

    const clientExists = clients.some(
      (client) => client.shopId === shopId && (client.status === "Active" || client.status === "Inactive"),
    )

    if (!clientExists) {
      setShopIdError("Client with this Shop ID does not exist or is not eligible for orders")
      return false
    }

    setShopIdError("")
    return true
  }

  // Validate location
  const validateLocation = () => {
    if (!location) {
      setLocationError("Location is required")
      return false
    }

    setLocationError("")
    return true
  }

  // Validate price
  const validatePrice = () => {
    const numericPrice = typeof price === "string" ? Number.parseFloat(price) : price

    if (!price || isNaN(numericPrice) || numericPrice <= 0) {
      setPriceError("Price must be greater than 0")
      return false
    }

    setPriceError("")
    return true
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const isShopIdValid = validateShopId()
    const isLocationValid = validateLocation()
    const isPriceValid = validatePrice()

    if (!isShopIdValid || !isLocationValid || !isPriceValid) {
      return
    }

    // Convert price to number for submission
    const numericPrice = typeof price === "string" ? Number.parseFloat(price) : price

    // Create order request
    addOrderRequest({
      shopId,
      clientName,
      agent,
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      location,
      price: numericPrice,
      remarks,
    })

    // Reset form
    setShopId("")
    setClientName("")
    setAgent("")
    setDate(new Date())
    setLocation("")
    setPrice("")
    setRemarks("")
    setSearchTerm("")

    // Show success toast
    toast({
      title: "Order Request Submitted",
      description: "Your order request has been submitted successfully.",
      variant: "success",
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-gray-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-t-lg border-b">
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-blue-500" />
          Create New Order Request
        </CardTitle>
        <CardDescription>
          Fill out this form to request a new order. Your request will be reviewed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="shopId" className="flex items-center gap-1">
              <Building className="h-4 w-4" /> Shop ID
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="shopId"
                placeholder="Search by Shop ID or Client Name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow for click
                  setTimeout(() => setShowClientDropdown(false), 200)
                }}
                className={cn("pl-10", shopIdError ? "border-red-500" : "")}
              />
              {showClientDropdown && filteredClients && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.shopId}
                      className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setShopId(client.shopId)
                        setSearchTerm(client.shopId)
                        setShowClientDropdown(false)
                      }}
                    >
                      <div>
                        <div className="font-medium">{client.shopId}</div>
                        <div className="text-sm text-muted-foreground">{client.clientName}</div>
                      </div>
                      {client.status && <Badge className={getStatusColor(client.status)}>{client.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}
              {showClientDropdown && searchTerm && (!filteredClients || filteredClients.length === 0) && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center">
                  No eligible clients found. Only Active and Inactive clients can be selected.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Client Name
              </Label>
              <Input id="clientName" value={clientName} readOnly className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Agent
              </Label>
              <Input id="agent" value={agent} readOnly className="bg-muted/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" /> Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className={locationError ? "border-red-500" : ""}
              />
              {locationError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {locationError}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Price
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  // Remove leading zeros and convert to number or empty string
                  const value = e.target.value
                  if (value === "") {
                    setPrice("")
                  } else {
                    // Parse as float to remove leading zeros
                    setPrice(Number.parseFloat(value))
                  }
                }}
                placeholder="Enter price"
                className={priceError ? "border-red-500" : ""}
              />
              {priceError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {priceError}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-1">
                Status
              </Label>
              <Input id="status" value="Pending" readOnly className="bg-yellow-50 dark:bg-yellow-900/20" />
              <p className="text-xs text-muted-foreground">Status will be set to Pending until approved by admin</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> Remarks
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any additional comments or special requirements"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Order Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

