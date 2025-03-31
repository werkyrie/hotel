"use client"

import { useState, useEffect, useCallback } from "react"
import { useClientContext } from "@/context/client-context"
import { useAuth } from "@/context/auth-context"
import type { Withdrawal } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CreditCard,
  FileDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import WithdrawalModal from "./modals/withdrawal-modal"
import BulkWithdrawalModal from "./modals/bulk-withdrawal-modal"
import ExportOptionsModal from "./modals/export-options-modal"
// Import the helper functions
import { formatCurrency, formatDate } from "@/utils/format-helpers"

export default function WithdrawalsTable() {
  const { withdrawals, deleteWithdrawal } = useClientContext()
  const { isViewer } = useAuth()
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof Withdrawal>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")

  // Filter and sort withdrawals
  useEffect(() => {
    let result = [...withdrawals]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (withdrawal) =>
          withdrawal.shopId.toLowerCase().includes(term) ||
          withdrawal.clientName.toLowerCase().includes(term) ||
          withdrawal.agent.toLowerCase().includes(term),
      )
    }

    // Apply payment mode filter
    if (paymentModeFilter !== "all") {
      result = result.filter((withdrawal) => withdrawal.paymentMode === paymentModeFilter)
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      result = result.filter((withdrawal) => withdrawal.agent === agentFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
      }

      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setFilteredWithdrawals(result)
  }, [withdrawals, searchTerm, sortField, sortDirection, paymentModeFilter, agentFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, startIndex + itemsPerPage)

  // Handle sort
  const handleSort = (field: keyof Withdrawal) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle withdrawal actions
  const handleAddWithdrawal = () => {
    setModalMode("add")
    setSelectedWithdrawal(null)
    setIsModalOpen(true)
  }

  const handleBulkAddWithdrawal = () => {
    setIsBulkModalOpen(true)
  }

  const handleEditWithdrawal = (withdrawal: Withdrawal) => {
    setModalMode("edit")
    setSelectedWithdrawal(withdrawal)
    setIsModalOpen(true)
  }

  const handleExportOptions = () => {
    setIsExportModalOpen(true)
  }

  const handleDeleteWithdrawal = useCallback(
    (withdrawalId: string) => {
      if (confirm("Are you sure you want to delete this withdrawal?")) {
        deleteWithdrawal(withdrawalId)
      }
    },
    [deleteWithdrawal],
  )

  // Get payment mode badge color
  const getPaymentModeColor = (paymentMode: string) => {
    switch (paymentMode) {
      case "Crypto":
        return "bg-purple-500"
      case "Online Banking":
        return "bg-blue-500"
      case "Ewallet":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get unique agents from withdrawals
  const uniqueAgents = Array.from(new Set(withdrawals.map((withdrawal) => withdrawal.agent))).sort()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Withdrawals</h2>
        <div className="flex gap-2">
          <Button onClick={handleExportOptions} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Options
          </Button>
          {!isViewer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Withdrawal
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddWithdrawal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Withdrawal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkAddWithdrawal}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Bulk Add Withdrawals
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search withdrawals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Modes</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
            <SelectItem value="Online Banking">Online Banking</SelectItem>
            <SelectItem value="Ewallet">Ewallet</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {uniqueAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Shop ID</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date
                  {sortField === "date" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Amount
                  {sortField === "amount" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("paymentMode")}>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Payment Mode
                  {sortField === "paymentMode" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedWithdrawals.length > 0 ? (
              paginatedWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.withdrawalId} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{withdrawal.shopId}</TableCell>
                  <TableCell>{withdrawal.clientName}</TableCell>
                  <TableCell>{withdrawal.agent}</TableCell>
                  <TableCell>{formatDate(withdrawal.date)}</TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentModeColor(withdrawal.paymentMode)}>{withdrawal.paymentMode}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isViewer && (
                          <DropdownMenuItem onClick={() => handleEditWithdrawal(withdrawal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {!isViewer && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteWithdrawal(withdrawal.withdrawalId)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No withdrawals found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredWithdrawals.length)} of{" "}
          {filteredWithdrawals.length}
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {isModalOpen && (
        <WithdrawalModal
          mode={modalMode}
          withdrawal={selectedWithdrawal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isBulkModalOpen && <BulkWithdrawalModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />}

      {isExportModalOpen && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          data={filteredWithdrawals}
          type="withdrawals"
        />
      )}
    </div>
  )
}

