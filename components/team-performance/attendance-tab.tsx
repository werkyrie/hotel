"use client"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
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

export default function AttendanceTab() {
  const { agents, attendance, addAttendance, deleteAttendance } = useTeamContext()
  const { isViewer } = useAuth()
  const { toast } = useToast()

  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [remarks, setRemarks] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<"Whole Day" | "Half Day" | "Leave" | "Undertime">("Whole Day")
  // Add a state variable to control form visibility
  const [showForm, setShowForm] = useState(false)

  // Modify the handleAddAttendance function to prevent duplicates
  const handleAddAttendance = () => {
    if (!selectedAgentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an agent",
      })
      return
    }

    const selectedAgent = agents.find((a) => a.id === selectedAgentId)
    if (!selectedAgent) return

    // Check if attendance already exists for this agent on this date
    const attendanceExists = attendance.some(
      (a) =>
        a.agentId === selectedAgentId &&
        a.date === (date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")),
    )

    if (attendanceExists) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Absence for ${selectedAgent.name} on this date already exists`,
      })
      return
    }

    addAttendance({
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      remarks,
      date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      status,
    })

    // Reset form
    setSelectedAgentId("")
    setRemarks("")
    setDate(new Date())
    setStatus("Whole Day")
    // Hide form after submission
    setShowForm(false)

    toast({
      title: "Absence Added",
      description: `Absence has been recorded for ${selectedAgent.name}`,
    })
  }

  const handleDeleteAttendance = (id: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete this absence record for ${agentName}?`)) {
      deleteAttendance(id)
      toast({
        title: "Absence Deleted",
        description: `Absence for ${agentName} has been removed`,
      })
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Whole Day":
        return "bg-green-500"
      case "Half Day":
        return "bg-yellow-500"
      case "Leave":
        return "bg-blue-500"
      case "Undertime":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = ["Date", "Agent", "Status", "Remarks"]
    const rows = attendance.map((record) => [record.date, record.agentName, record.status, record.remarks])

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
    link.setAttribute("download", "absences.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Absences data has been exported to CSV",
    })
  }

  // Replace the form card with this updated version that includes a toggle button
  return (
    <div className="space-y-6">
      {/* Only show the add attendance button for non-viewers */}
      {!isViewer && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? "Cancel" : "Add Absence"}
            {!showForm && <PlusCircle className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Only show the add attendance form for non-viewers and when showForm is true */}
      {!isViewer && showForm && (
        <Card className="animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle>Add Absent Record</CardTitle>
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "Whole Day" | "Half Day" | "Leave" | "Undertime")}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Whole Day">Whole Day</SelectItem>
                    <SelectItem value="Half Day">Half Day</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                    <SelectItem value="Undertime">Undertime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional remarks"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button onClick={handleAddAttendance} className="w-full">
                  Add Absent Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-in shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Absence Records</CardTitle>
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
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Remarks</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length > 0 ? (
                  attendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-medium">{record.agentName}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </TableCell>
                      <TableCell>{record.remarks}</TableCell>
                      {!isViewer && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAttendance(record.id, record.agentName)}
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
                      No absence records found
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

