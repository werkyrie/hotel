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
import { Trash2, ChevronDown, ChevronUp, MoreHorizontal, Search, UserPlus, FileDown, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AgentRegistrationModal from "./agent-registration-modal"
import AgentImportModal from "./agent-import-modal"

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

  // Handle cell double click for inline editing
  const handleCellDoubleClick = (agentId: string, field: string, value: string | number) => {
    // Allow Viewers to edit these specific fields
    if (field === "name" || field === "addedToday" || field === "monthlyAdded" || field === "openAccounts") {
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

  // Handle key press in editable cell
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellEditSave()
    } else if (e.key === "Escape") {
      setEditingCell(null)
      setEditValue("")
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

      <div className="rounded-md border shadow-sm overflow-x-auto bg-card animate-fade-in">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("name")}>
                Agent Name
                {sortField === "name" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("addedToday")}>
                Added Today
                {sortField === "addedToday" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("monthlyAdded")}>
                Monthly Added
                {sortField === "monthlyAdded" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("openAccounts")}>
                Open Accounts
                {sortField === "openAccounts" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("totalDeposits")}>
                Total Deposits
                {sortField === "totalDeposits" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="cursor-pointer font-medium" onClick={() => handleSort("commissionRate")}>
                Commission
                {sortField === "commissionRate" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4 inline" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4 inline" />
                  ))}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className={`agent-row hover:bg-muted/30 transition-colors ${editingCell?.agentId === agent.id ? "editing bg-muted/20" : ""}`}
                >
                  <TableCell
                    className="editable-cell"
                    onDoubleClick={() => handleCellDoubleClick(agent.id, "name", agent.name)}
                  >
                    {editingCell?.agentId === agent.id && editingCell.field === "name" ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={handleKeyPress}
                        className="editable-cell-input"
                      />
                    ) : (
                      <span className="font-medium">{agent.name}</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="editable-cell"
                    onDoubleClick={() => handleCellDoubleClick(agent.id, "addedToday", agent.addedToday)}
                  >
                    {editingCell?.agentId === agent.id && editingCell.field === "addedToday" ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={handleKeyPress}
                        className="editable-cell-input"
                      />
                    ) : (
                      agent.addedToday
                    )}
                  </TableCell>
                  <TableCell
                    className="editable-cell"
                    onDoubleClick={() => handleCellDoubleClick(agent.id, "monthlyAdded", agent.monthlyAdded)}
                  >
                    {editingCell?.agentId === agent.id && editingCell.field === "monthlyAdded" ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={handleKeyPress}
                        className="editable-cell-input"
                      />
                    ) : (
                      agent.monthlyAdded
                    )}
                  </TableCell>
                  <TableCell
                    className="editable-cell"
                    onDoubleClick={() => handleCellDoubleClick(agent.id, "openAccounts", agent.openAccounts)}
                  >
                    {editingCell?.agentId === agent.id && editingCell.field === "openAccounts" ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={handleKeyPress}
                        className="editable-cell-input"
                      />
                    ) : (
                      agent.openAccounts
                    )}
                  </TableCell>
                  <TableCell className={isViewer ? "" : "editable-cell"}>
                    <span className="font-medium">${agent.totalDeposits.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getCommissionTierClass(agent.commissionRate || 0)} transition-all`}>
                      {agent.commissionRate}% (${agent.commission?.toLocaleString()})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isViewer && (
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

