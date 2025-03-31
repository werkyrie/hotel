"use client"

import { useState } from "react"
import { useTeamContext } from "@/context/team-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle } from "lucide-react"

interface AgentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AgentRegistrationModal({ isOpen, onClose }: AgentRegistrationModalProps) {
  const { addAgent } = useTeamContext()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [addedToday, setAddedToday] = useState(0)
  const [monthlyAdded, setMonthlyAdded] = useState(0)
  const [openAccounts, setOpenAccounts] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)

  const [nameError, setNameError] = useState("")

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Agent name is required")
      return false
    }
    setNameError("")
    return true
  }

  const handleSubmit = () => {
    if (!validateName(name)) {
      return
    }

    addAgent({
      name,
      addedToday,
      monthlyAdded,
      openAccounts,
      totalDeposits,
    })

    toast({
      title: "Agent Added",
      description: `${name} has been added successfully`,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>Enter the agent details to add them to the system</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                validateName(e.target.value)
              }}
              placeholder="Enter agent name"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {nameError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addedToday">Added Today</Label>
              <Input
                id="addedToday"
                type="number"
                min="0"
                value={addedToday}
                onChange={(e) => setAddedToday(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAdded">Monthly Added</Label>
              <Input
                id="monthlyAdded"
                type="number"
                min="0"
                value={monthlyAdded}
                onChange={(e) => setMonthlyAdded(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openAccounts">Open Accounts</Label>
              <Input
                id="openAccounts"
                type="number"
                min="0"
                value={openAccounts}
                onChange={(e) => setOpenAccounts(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalDeposits">Total Deposits ($)</Label>
              <Input
                id="totalDeposits"
                type="number"
                min="0"
                step="0.01"
                value={totalDeposits}
                onChange={(e) => setTotalDeposits(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

