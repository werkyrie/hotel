"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useTeamContext } from "@/context/team-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileUp, Upload, X, Check } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AgentImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AgentImportModal({ isOpen, onClose }: AgentImportModalProps) {
  const { addAgent } = useTeamContext()
  const { toast } = useToast()
  const [csvData, setCsvData] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text || "")
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setCsvData("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError("Please enter or upload CSV data")
      return
    }

    try {
      setIsProcessing(true)
      setProgress(0)
      setError("")

      // Parse CSV data
      const lines = csvData.trim().split("\n")
      if (lines.length < 2) {
        setError("CSV must contain at least a header row and one data row")
        setIsProcessing(false)
        return
      }

      // Check header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredFields = ["agent name", "added today", "monthly added", "total deposits"]
      const missingFields = requiredFields.filter((field) => !header.includes(field))

      if (missingFields.length > 0) {
        setError(`CSV is missing required fields: ${missingFields.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Process data rows
      let successCount = 0
      let errorCount = 0
      const nameIndex = header.indexOf("agent name")
      const addedTodayIndex = header.indexOf("added today")
      const monthlyAddedIndex = header.indexOf("monthly added")
      const totalDepositsIndex = header.indexOf("total deposits")

      // Process rows with a small delay to show progress
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim())

          // Validate agent name
          const name = values[nameIndex]
          if (!name) {
            errorCount++
            continue
          }

          // Validate and parse numeric fields
          const addedToday = Number.parseInt(values[addedTodayIndex], 10)
          const monthlyAdded = Number.parseInt(values[monthlyAddedIndex], 10)
          const totalDeposits = Number.parseFloat(values[totalDepositsIndex])

          if (
            isNaN(addedToday) ||
            addedToday < 0 ||
            isNaN(monthlyAdded) ||
            monthlyAdded < 0 ||
            isNaN(totalDeposits) ||
            totalDeposits < 0
          ) {
            errorCount++
            continue
          }

          // Create and add agent
          addAgent({
            name,
            addedToday,
            monthlyAdded,
            openAccounts: 0, // Default value
            totalDeposits,
          })

          successCount++
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100))

        // Small delay to show progress animation
        if (i % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      setSuccessCount(successCount)
      setErrorCount(errorCount)
      setSuccess(true)
      setIsProcessing(false)

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Import Successful",
          description: `Successfully imported ${successCount} agents. ${errorCount > 0 ? `${errorCount} agents had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid agents found in the CSV data")
      }

      if (successCount > 0) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      setError("Error processing CSV data. Please check the format.")
      setIsProcessing(false)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Agents from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple agents at once.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedFile ? (
            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-md mr-3">
                  <FileUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="file-upload-area flex items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors duration-200 hover:bg-muted/50"
              onClick={handleClickUpload}
            >
              <div className="text-center">
                <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Click to upload a CSV file</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
                <Input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="csvData">Or paste CSV data</Label>
            <Textarea
              id="csvData"
              placeholder="Agent Name,Added Today,Monthly Added,Total Deposits"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="h-[200px] font-mono text-sm"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                CSV format: Agent Name,Added Today,Monthly Added,Total Deposits
              </p>
              <p className="text-xs text-muted-foreground">Example: John Doe,5,20,5000</p>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Successfully imported {successCount} agents.
                {errorCount > 0 && ` ${errorCount} agents had errors and were skipped.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isProcessing || !csvData.trim()} className="btn-primary">
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? "Importing..." : "Import Agents"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

