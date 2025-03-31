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
import { format } from "date-fns"
import { Trash2, CalendarIcon, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function PenaltiesTab() {
  const { agents, penalties, addPenalty, deletePenalty } = useTeamContext()
  const { isViewer } = useAuth() // Get viewer status
  const { toast } = useToast()

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleAddPenalty = () => {
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

    addPenalty({
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      description,
      amount,
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    })

    // Reset form
    setSelectedAgentId("")
    setDescription("")
    setAmount(0)
    setDate(new Date())

    toast({
      title: "Penalty Added",
      description: `Penalty has been recorded for ${selectedAgent.name}`,
    })
  }

  const handleDeletePenalty = (id: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete this penalty for ${agentName}?`)) {
      deletePenalty(id)
      toast({
        title: "Penalty Deleted",
        description: `Penalty for ${agentName} has been removed`,
      })
    }
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = ["Date", "Agent", "Description", "Amount"]
    const rows = penalties.map((penalty) => [penalty.date, penalty.agentName, penalty.description, penalty.amount])

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
    link.setAttribute("download", "penalties.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Penalties data has been exported to CSV",
    })
  }

  return (
    <div className="space-y-6">
      {/* Only show the add penalty form for non-viewers */}
      {!isViewer && (
        <Card className="animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Add New Penalty</CardTitle>
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter penalty description"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddPenalty} className="w-full">
                  Add Penalty
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Penalty Records</CardTitle>
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
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {penalties.length > 0 ? (
                  penalties.map((penalty) => (
                    <TableRow key={penalty.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>{penalty.date}</TableCell>
                      <TableCell className="font-medium">{penalty.agentName}</TableCell>
                      <TableCell>{penalty.description}</TableCell>
                      <TableCell className="font-medium">${penalty.amount.toLocaleString()}</TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePenalty(penalty.id, penalty.agentName)}
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
                    <TableCell colSpan={isViewer ? 4 : 5} className="text-center py-8 text-muted-foreground">
                      No penalties recorded
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

