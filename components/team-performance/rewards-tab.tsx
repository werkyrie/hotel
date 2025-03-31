"use client"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context" // Add this import
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
// Add import for PlusCircle icon
import { Trash2, CalendarIcon, FileDown, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function RewardsTab() {
  const { agents, rewards, addReward, deleteReward } = useTeamContext()
  const { isViewer } = useAuth() // Get viewer status
  const { toast } = useToast()

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<"Received" | "Pending" | "Cancelled">("Pending")
  // Add a state variable to control form visibility
  const [showForm, setShowForm] = useState(false)

  // Modify the handleAddReward function to prevent duplicates
  const handleAddReward = () => {
    if (!selectedAgentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an agent",
      })
      return
    }

    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a description",
      })
      return
    }

    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Amount must be greater than 0",
      })
      return
    }

    const selectedAgent = agents.find((a) => a.id === selectedAgentId)
    if (!selectedAgent) return

    addReward({
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      description,
      amount,
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      status,
    })

    // Reset form
    setSelectedAgentId("")
    setDescription("")
    setAmount(0)
    setDate(new Date())
    setStatus("Pending")
    // Hide form after submission
    setShowForm(false)

    toast({
      title: "Reward Added",
      description: `Reward has been recorded for ${selectedAgent.name}`,
    })
  }

  const handleDeleteReward = (id: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete this reward for ${agentName}?`)) {
      deleteReward(id)
      toast({
        title: "Reward Deleted",
        description: `Reward for ${agentName} has been removed`,
      })
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-green-500"
      case "Pending":
        return "bg-yellow-500"
      case "Cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = ["Date", "Agent", "Description", "Amount", "Status"]
    const rows = rewards.map((reward) => [
      reward.date,
      reward.agentName,
      reward.description,
      reward.amount,
      reward.status,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","),
      ),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "rewards.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Rewards data has been exported to CSV",
    })
  }

  // Replace the form card with this updated version that includes a toggle button
  return (
    <div className="space-y-6">
      {/* Only show the add reward button for non-viewers */}
      {!isViewer && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? "Cancel" : "Add New Reward"}
            {!showForm && <PlusCircle className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Only show the add reward form for non-viewers and when showForm is true */}
      {!isViewer && showForm && (
        <Card className="animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Add New Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "Received" | "Pending" | "Cancelled")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter reward description"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddReward} className="w-full">
                  Add Reward
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Reward Records</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border shadow-sm overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Agent</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="font-medium">Amount</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.length > 0 ? (
                  rewards.map((reward) => (
                    <TableRow key={reward.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>{reward.date}</TableCell>
                      <TableCell className="font-medium">{reward.agentName}</TableCell>
                      <TableCell>{reward.description}</TableCell>
                      <TableCell className="font-medium">${reward.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(reward.status)} transition-all`}>{reward.status}</Badge>
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReward(reward.id, reward.agentName)}
                            className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isViewer ? 5 : 6} className="text-center py-8 text-muted-foreground">
                      No rewards recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

