export interface Client {
  shopId: string
  clientName: string
  agent: Agent
  kycDate: string
  status: ClientStatus
  notes?: string
}

export type Agent = string

export type ClientStatus = "Active" | "Inactive" | "In Process" | "Eliminated"

export interface Order {
  orderId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  location: string
  price: number
  status: OrderStatus
}

export type OrderStatus = "Pending" | "Processing" | "Completed"

export interface Deposit {
  depositId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  amount: number
  paymentMode: PaymentMode
}

export interface Withdrawal {
  withdrawalId: string
  shopId: string
  clientName: string
  agent: Agent
  date: string
  amount: number
  paymentMode: PaymentMode
}

export type PaymentMode = "Crypto" | "Online Banking" | "Ewallet"

export interface OrderRequest {
  id: string
  shopId: string
  clientName: string
  agent: Agent
  date: string | Date
  location: string
  price: number
  status: OrderRequestStatus
  remarks?: string
  createdAt: number
}

export type OrderRequestStatus = "Pending" | "Approved" | "Rejected"

export interface TimelineEvent {
  id: string
  type: "order" | "deposit" | "withdrawal"
  date: string
  amount: number
  status?: string
  location?: string
  paymentMode?: string
}

// Update the ClientContextType interface to include the new bulk functions
export interface ClientContextType {
  // ... existing properties
  bulkAddDeposits: (deposits: Deposit[]) => void
  bulkAddWithdrawals: (withdrawals: Withdrawal[]) => void
  // ... rest of the properties
}

