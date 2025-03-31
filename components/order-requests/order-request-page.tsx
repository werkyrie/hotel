"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderRequestForm from "./order-request-form"
import OrderRequestList from "./order-request-list"
import { FileText, PlusCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function OrderRequestPage() {
  const [activeTab, setActiveTab] = useState("list")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Order Requests</h2>
        <Button
          onClick={() => setActiveTab("new")}
          className="animate-pulse-slow"
          variant={activeTab === "list" ? "default" : "outline"}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Request
        </Button>
      </div>

      <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex gap-3 items-start">
            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-1">How to use Order Requests</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Order requests allow you to submit orders for approval. Use the <strong>Create New Request</strong>{" "}
                button to submit a new order, or switch between tabs below to view existing requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>View Requests</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Request</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 animate-fade-in">
          <OrderRequestList />
        </TabsContent>

        <TabsContent value="new" className="mt-6 animate-fade-in">
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <AlertTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create a New Order Request
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Fill out the form below to submit a new order request. All requests will be reviewed by an administrator.
            </AlertDescription>
          </Alert>
          <OrderRequestForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}

