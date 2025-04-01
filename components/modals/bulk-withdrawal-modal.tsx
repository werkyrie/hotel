"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useClientContext } from "@/context/client-context"
import type { Withdrawal, PaymentMode } from "@/types/client"
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
import { AlertCircle, FileUp, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"

interface BulkWithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkWithdrawalModal({ isOpen, onClose }: BulkWithdrawalModalProps) {
  const { clients, addWithdrawal, generateWithdrawalId } = useClientContext()
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
          const clientName = client?.clientName || "Unknown Client"
          const agent = client?.agent || "Unknown Agent"

          // Validate and parse date
          let withdrawalDate = values[dateIndex]
          try {
            // Try to parse and format the date
            const parsedDate = new Date(withdrawalDate)
            if (isNaN(parsedDate.getTime())) {
              withdrawalDate = format(new Date(), "yyyy-MM-dd")
            } else {
              withdrawalDate = format(parsedDate, "yyyy-MM-dd")
            }
          } catch (e) {
            withdrawalDate = format(new Date(), "yyyy-MM-dd")
          }

          // Validate amount
          const amount = Number.parseFloat(values[amountIndex])
          if (isNaN(amount) || amount <= 0) {
            errorCount++
            continue
          }

          // Validate payment mode
          let paymentMode = values[paymentModeIndex] as PaymentMode
          if (!["Crypto", "Online Banking", "Ewallet"].includes(paymentMode)) {
            // Try to normalize the payment mode
            const normalizedMode = values[paymentModeIndex].trim().toLowerCase()
            if (["crypto", "cryptocurrency", "bitcoin", "eth", "btc"].includes(normalizedMode)) {
              paymentMode = "Crypto"
            } else if (["online", "online banking", "internet banking"].includes(normalizedMode)) {
              paymentMode = "Online Banking"
            } else if (["ewallet", "e-wallet", "digital wallet", "wallet"].includes(normalizedMode)) {
              paymentMode = "Ewallet"
            } else {
              errorCount++
              continue
            }
          }

          // Create and add withdrawal
          const withdrawal: Withdrawal = {
            withdrawalId: generateWithdrawalId(),
            shopId,
            clientName,
            agent,
            date: withdrawalDate,
            amount,
            paymentMode,
          }

          addWithdrawal(withdrawal)
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
      setSuccess(true)
      setIsProcessing(false)

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Import Successful",
          description: `Successfully imported ${successCount} withdrawals. ${errorCount > 0 ? `${errorCount} withdrawals had errors and were skipped.` : ""}`,
        })
      } else {
        setError("No valid withdrawals found in the CSV data")
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
          <DialogTitle className="text-xl">Bulk Add Withdrawals</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste CSV data to add multiple withdrawals at once. Unknown shop IDs will be accepted
            with placeholder client information.
          </DialogDescription>
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
            <div className="file-upload-area flex items-center justify-center" onClick={handleClickUpload}>
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
              <p className="text-xs text-muted-foreground font-medium">CSV Format Instructions:</p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>
                  First row must be the header: <span className="font-mono">shop id,date,amount,payment mode</span>
                </li>
                <li>Shop ID: Any valid shop ID (unknown IDs will be accepted)</li>
                <li>Date: Any date format (MM/DD/YYYY, YYYY-MM-DD, etc.)</li>
                <li>Amount: Numeric value greater than 0</li>
                <li>Payment Mode: Crypto, Online Banking, or Ewallet</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Example: <span className="font-mono">4013785,2023-01-01,200.00,Ewallet</span>
              </p>
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
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Successfully imported {successCount} withdrawals.
                {errorCount > 0 && ` ${errorCount} withdrawals had errors and were skipped.`}
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
            {isProcessing ? "Importing..." : "Import Withdrawals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

