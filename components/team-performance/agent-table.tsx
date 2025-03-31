"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useTeamContext } from "@/context/team-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  UserPlus,
  FileDown,
  Upload,
  Edit,
  Check,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AgentRegistrationModal from "./agent-registration-modal"
import AgentImportModal from "./agent-import-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function AgentTable() {
  const { agents, updateAgent, deleteAgent } = useTeamContext()
  const { isViewer, isAdmin } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAgents, setFilteredAgents] = useState(agents)
  const [sortField, setSortField] = useState<keyof (typeof agents)[0]>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editingCell, setEditingCell] = useState<{ agentId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string | number>("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Filter and sort agents
  useEffect(() => {
    let result = [...agents]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (agent) => agent.name.toLowerCase().includes(term) || agent.totalDeposits.toString().includes(term),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      // String comparison
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()

      if (aString < bString) return sortDirection === "asc" ? -1 : 1
      if (aString > bString) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredAgents(result)
  }, [agents, searchTerm, sortField, sortDirection])

  // Focus input when editing cell
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  // Handle sort
  const handleSort = (field: keyof (typeof agents)[0]) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle cell edit click
  const handleCellEditClick = (agentId: string, field: string, value: string | number) => {
    // Define which fields are editable based on user role
    const isEditable =
      // For viewers: only these specific fields are editable
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      // For non-viewers (admins/editors): all these fields are editable
      (!isViewer &&
        (field === "name" || field === "addedToday" || field === "monthlyAdded" || field === "openAccounts"))

    if (isEditable) {
      setEditingCell({ agentId, field })
      setEditValue(value)
    }
  }

  // Handle cell edit save
  const handleCellEditSave = () => {
    if (!editingCell) return

    const agent = agents.find((a) => a.id === editingCell.agentId)
    if (!agent) return

    let value: string | number = editValue

    // Convert to number for numeric fields
    if (editingCell.field !== "name") {
      value = Number(editValue)
      if (isNaN(value) || value < 0) {
        toast({
          variant: "destructive",
          title: "Invalid value",
          description: "Please enter a valid number",
        })
        return
      }
    }

    // Update agent
    const updatedAgent = { ...agent, [editingCell.field]: value }
    updateAgent(updatedAgent)

    // Reset editing state
    setEditingCell(null)
    setEditValue("")

    toast({
      title: "Updated",
      description: `Agent ${agent.name}'s ${editingCell.field} has been updated`,
    })
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  // Handle key press in editable cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellEditSave()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  // Handle delete agent
  const handleDeleteAgent = (agentId: string, agentName: string) => {
    if (confirm(`Are you sure you want to delete agent ${agentName}?`)) {
      deleteAgent(agentId)
      toast({
        title: "Agent deleted",
        description: `${agentName} has been removed from the system`,
      })
    }
  }

  // Get commission tier class
  const getCommissionTierClass = (rate: number) => {
    if (rate === 0) return "commission-tier-0"
    if (rate === 4) return "commission-tier-4"
    if (rate === 5) return "commission-tier-5"
    if (rate === 7) return "commission-tier-7"
    if (rate === 9) return "commission-tier-9"
    if (rate === 10) return "commission-tier-10"
    return ""
  }

  const handleExportCsv = () => {
    // Create CSV content
    const headers = [
      "Agent Name",
      "Added Today",
      "Monthly Added",
      "Open Accounts",
      "Total Deposits",
      "Commission Rate",
      "Commission Amount",
    ]
    const rows = filteredAgents.map((agent) => [
      agent.name,
      agent.addedToday,
      agent.monthlyAdded,
      agent.openAccounts,
      agent.totalDeposits,
      `${agent.commissionRate}%`,
      agent.commission,
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
    link.setAttribute("download", "agent_overview.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Agent overview data has been exported to CSV",
    })
  }

  const handleExportTemplate = () => {
    // Create CSV template with just headers
    const headers = ["Agent Name", "Added Today", "Monthly Added", "Total Deposits"]
    const csvContent = headers.join(",")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "agent_import_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "CSV import template has been downloaded",
    })
  }

  // Render editable cell content
  const renderEditableCell = (agent: any, field: string, value: string | number) => {
    const isEditing = editingCell?.agentId === agent.id && editingCell.field === field

    // Define which fields are editable based on user role
    const isEditable =
      // For viewers: only these specific fields are editable
      (isViewer && (field === "addedToday" || field === "monthlyAdded" || field === "openAccounts")) ||
      // For non-viewers (admins/editors): all these fields are editable
      (!isViewer &&
        (field === "name" || field === "addedToday" || field === "monthlyAdded" || field === "openAccounts"))

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 justify-center">
          <Input
            ref={inputRef}
            type={field === "name" ? "text" : "number"}
            min={field !== "name" ? "0" : undefined}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="editable-cell-input text-center"
          />
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCellEditSave}
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelEdit}
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center group">
        <span className={field === "name" ? "font-medium" : ""}>{field === "name" ? value : value}</span>
        {isEditable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCellEditClick(agent.id, field, value)}
                  className="h-7 w-7 opacity-100 ml-2"
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit {field.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportCsv} variant="outline" size="sm" className="animate-fade-in">
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="animate-fade-in">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportTemplate}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button onClick={() => setIsRegistrationModalOpen(true)} className="animate-fade-in">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {!isViewer ? (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm mb-4">
          <p className="flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            <span>
              <strong>Pro tip:</strong> Hover over cells to see edit buttons. Click the edit icon to modify values.
            </span>
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm mb-4">
          <p className="flex items-center">
            <Edit className="h-4 w-4 mr-2" />
            <span>
              <strong>Pro tip:</strong> As a viewer, you can edit Added Today, Monthly Added, and Open Accounts fields.
            </span>
          </p>
        </div>
      )}

      <div className="rounded-md border shadow-sm overflow-x-auto bg-card animate-fade-in">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer font-medium text-center" onClick={() => handleSort("name")}>
                Agent Name
                {sortField === "name" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium text-center" onClick={() => handleSort("addedToday")}>
                Added Today
                {sortField === "addedToday" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium text-center" onClick={() => handleSort("monthlyAdded")}>
                Monthly Added
                {sortField === "monthlyAdded" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium text-center" onClick={() => handleSort("openAccounts")}>
                Open Accounts
                {sortField === "openAccounts" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium text-center" onClick={() => handleSort("totalDeposits")}>
                Total Deposits
                {sortField === "totalDeposits" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead
                className="cursor-pointer font-medium text-center"
                onClick={() => handleSort("commissionRate")}
              >
                Commission
                {sortField === "commissionRate" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className={`agent-row hover:bg-muted/30 transition-colors ${editingCell?.agentId === agent.id ? "editing bg-muted/20" : ""}`}
                >
                  <TableCell className="editable-cell text-center">
                    {renderEditableCell(agent, "name", agent.name)}
                  </TableCell>
                  <TableCell className="editable-cell text-center">
                    {renderEditableCell(agent, "addedToday", agent.addedToday)}
                  </TableCell>
                  <TableCell className="editable-cell text-center">
                    {renderEditableCell(agent, "monthlyAdded", agent.monthlyAdded)}
                  </TableCell>
                  <TableCell className="editable-cell text-center">
                    {renderEditableCell(agent, "openAccounts", agent.openAccounts)}
                  </TableCell>
                  <TableCell className={`${isViewer ? "" : "editable-cell"} text-center`}>
                    <span className="font-medium">${agent.totalDeposits.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge className={`${getCommissionTierClass(agent.commissionRate || 0)} transition-all`}>
                        {agent.commissionRate}% (${agent.commission?.toLocaleString()})
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {!isViewer && (
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id, agent.name)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isRegistrationModalOpen && (
        <AgentRegistrationModal isOpen={isRegistrationModalOpen} onClose={() => setIsRegistrationModalOpen(false)} />
      )}

      {isImportModalOpen && <AgentImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />}
    </div>
  )
}

