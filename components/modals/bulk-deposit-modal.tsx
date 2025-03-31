"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useClientContext } from "@/context/client-context"
import type { Deposit, PaymentMode } from "@/types/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { AlertCircle, FileUp, Upload, X, CheckCircle } from "lucide-react"
import { format, parse } from "date-fns"
import { Progress } from "@/components/ui/progress"

interface BulkDepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkDepositModal({ isOpen, onClose }: BulkDepositModalProps) {
  const { clients, addDeposit, generateDepositId } = useClientContext()
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
      setSuccess(false)

      // Parse CSV data
      const lines = csvData.trim().split("\n")
      if (lines.length < 2) {
        setError("CSV must contain at least a header row and one data row")
        setIsProcessing(false)
        return
      }

      // Check header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
      const requiredFields = ["shop id", "date", "amount", "payment mode"]
      const missingFields = requiredFields.filter((field) => !header.includes(field))

      if (missingFields.length > 0) {
        setError(`CSV is missing required fields: ${missingFields.join(", ")}`)
        setIsProcessing(false)
        return
      }

      // Process data rows
      let successCount = 0
      let errorCount = 0
      const shopIdIndex = header.indexOf("shop id")
      const dateIndex = header.indexOf("date")
      const amountIndex = header.indexOf("amount")
      const paymentModeIndex = header.indexOf("payment mode")

      // Process rows with a small delay to show progress
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",").map((v) => v.trim())

          // Validate shop ID
          const shopId = values[shopIdIndex]
          const client = clients.find((c) => c.shopId === shopId)

          if (!client) {
            errorCount++
            continue
          }

          // Validate and parse date (MM/DD/YYYY format)
          let depositDate
          try {
            // Try to parse MM/DD/YYYY format
            const dateValue = values[dateIndex]
            const parsedDate = parse(dateValue, "MM/dd/yyyy", new Date())
            
            if (isNaN(parsedDate.getTime())) {
              // Fallback to today if parsing fails
              depositDate = format(new Date(), "yyyy-MM-dd")
            } else {
              // Convert to ISO format for storage
              depositDate = format(parsedDate, "yyyy-MM-dd")
            }
          } catch (e) {
            depositDate = format(new Date(), "yyyy-MM-dd")
          }

          // Validate amount
          const amount = Number.parseFloat(values[amountIndex])
          if (isNaN(amount) || amount <= 0) {
            errorCount++
            continue
          }

          // Validate payment mode
          const paymentMode = values[paymentModeIndex] as PaymentMode
          if (!["Crypto", "Online Banking", "Ewallet"].includes(paymentMode)) {
            errorCount++
            continue
          }

          // Create and add deposit
          const deposit: Deposit = {
            depositId: generateDepositId(),
            shopId,
            clientName: client.clientName,
            agent: client.agent,
            date: depositDate,
            amount,
            paymentMode,
          }

          addDeposit(deposit)
          successCount++
        }

        // Update progress
        setProgress(Math.round((i / (lines.length - 1)) * 100))

        // Small delay to show progress animation
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      setSuccessCount(successCount)
      setErrorCount(errorCount)
      setSuccess(successCount > 0)
      setIsProcessing(false)

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Import Successful",
          description: `Successfully imported ${successCount} deposits. ${errorCount > 0 ? `${errorCount} deposits had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid deposits found in the CSV data")
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
          <DialogTitle className="text-xl">Bulk Add Deposits</DialogTitle>
          <DialogDescription>Upload a CSV file or paste CSV data to add multiple deposits at once.</DialogDescription>
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
              className="file-upload-area flex items-center justify-center p-8 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30 transition-colors" 
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
              placeholder="shop id,date,amount,payment mode"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="h-[200px] font-mono text-sm form-input"
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">CSV format: shop id,date,amount,payment mode</p>
              <p className="text-xs text-muted-foreground">Date format must be MM/DD/YYYY (e.g., 03/15/2025)</p>
              <p className="text-xs text-muted-foreground">Example: SHOP001,03/15/2025,500.00,Crypto</p>
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
            <Alert variant="destructive" className="border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Import Successful</AlertTitle>
              <AlertDescription>
                Successfully imported {successCount} deposits.
                {errorCount > 0 && ` ${errorCount} deposits had errors and were skipped.`}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isProcessing || !csvData.trim()} 
            className="btn-primary"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? "Importing..." : "Import Deposits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}