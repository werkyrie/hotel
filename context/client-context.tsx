"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Client, Order, Deposit, Withdrawal, OrderRequest, OrderRequestStatus } from "@/types/client"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface ClientContextType {
  clients: Client[]
  orders: Order[]
  deposits: Deposit[]
  withdrawals: Withdrawal[]
  orderRequests: OrderRequest[]
  loading: boolean
  addClient: (client: Client) => Promise<void>
  updateClient: (client: Client) => Promise<void>
  deleteClient: (shopId: string) => Promise<void>
  bulkDeleteClients: (shopIds: string[]) => Promise<void>
  addOrder: (order: Order) => Promise<void>
  updateOrder: (order: Order) => Promise<void>
  deleteOrder: (orderId: string) => Promise<void>
  addDeposit: (deposit: Deposit) => Promise<void>
  updateDeposit: (deposit: Deposit) => Promise<void>
  deleteDeposit: (depositId: string) => Promise<void>
  addWithdrawal: (withdrawal: Withdrawal) => Promise<void>
  updateWithdrawal: (withdrawal: Withdrawal) => Promise<void>
  deleteWithdrawal: (withdrawalId: string) => Promise<void>
  addOrderRequest: (request: Omit<OrderRequest, "id" | "status" | "createdAt">) => Promise<void>
  updateOrderRequestStatus: (id: string, status: OrderRequestStatus) => Promise<void>
  deleteOrderRequest: (id: string) => Promise<void>
  isShopIdUnique: (shopId: string, currentId?: string) => Promise<boolean>
  generateOrderId: () => string
  generateDepositId: () => string
  generateWithdrawalId: () => string
  resetAllData: () => Promise<void>
  exportData: () => Promise<string>
  importData: (jsonData: string) => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status first
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
      if (!user) {
        // If not authenticated, use localStorage data instead
        try {
          const savedClients = localStorage.getItem("clients")
          const savedOrders = localStorage.getItem("orders")
          const savedDeposits = localStorage.getItem("deposits")
          const savedWithdrawals = localStorage.getItem("withdrawals")
          const savedOrderRequests = localStorage.getItem("orderRequests")

          if (savedClients) setClients(JSON.parse(savedClients))
          if (savedOrders) setOrders(JSON.parse(savedOrders))
          if (savedDeposits) setDeposits(JSON.parse(savedDeposits))
          if (savedWithdrawals) setWithdrawals(JSON.parse(savedWithdrawals))
          if (savedOrderRequests) setOrderRequests(JSON.parse(savedOrderRequests))
        } catch (error) {
          console.error("Error loading from localStorage:", error)
        }
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Load data from Firestore only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    console.log("Setting up Firestore listeners")

    // Set up listeners for real-time updates
    const clientsUnsubscribe = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        const clientsData: Client[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          clientsData.push({
            shopId: doc.id,
            clientName: data.clientName,
            agent: data.agent,
            kycDate: data.kycDate ? new Date(data.kycDate.seconds * 1000) : undefined,
            status: data.status,
            notes: data.notes || "",
          })
        })
        setClients(clientsData)
      },
      (error) => {
        console.error("Error fetching clients:", error)
      },
    )

    const ordersUnsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const ordersData: Order[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          ordersData.push({
            orderId: doc.id,
            shopId: data.shopId,
            clientName: data.clientName,
            agent: data.agent,
            date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
            location: data.location,
            price: data.price,
            status: data.status,
          })
        })
        setOrders(ordersData)
      },
      (error) => {
        console.error("Error fetching orders:", error)
      },
    )

    const depositsUnsubscribe = onSnapshot(
      collection(db, "deposits"),
      (snapshot) => {
        const depositsData: Deposit[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          depositsData.push({
            depositId: doc.id,
            shopId: data.shopId,
            clientName: data.clientName,
            agent: data.agent,
            date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
            amount: data.amount,
            paymentMode: data.paymentMode,
          })
        })
        setDeposits(depositsData)
      },
      (error) => {
        console.error("Error fetching deposits:", error)
      },
    )

    const withdrawalsUnsubscribe = onSnapshot(
      collection(db, "withdrawals"),
      (snapshot) => {
        const withdrawalsData: Withdrawal[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          withdrawalsData.push({
            withdrawalId: doc.id,
            shopId: data.shopId,
            clientName: data.clientName,
            agent: data.agent,
            date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
            amount: data.amount,
            paymentMode: data.paymentMode,
          })
        })
        setWithdrawals(withdrawalsData)
      },
      (error) => {
        console.error("Error fetching withdrawals:", error)
      },
    )

    const orderRequestsUnsubscribe = onSnapshot(
      collection(db, "orderRequests"),
      (snapshot) => {
        const requestsData: OrderRequest[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          requestsData.push({
            id: doc.id,
            shopId: data.shopId,
            clientName: data.clientName,
            agent: data.agent,
            date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
            location: data.location,
            price: data.price,
            status: data.status,
            remarks: data.remarks || "",
            createdAt: data.createdAt ? data.createdAt.seconds * 1000 : Date.now(),
          })
        })
        setOrderRequests(requestsData)
      },
      (error) => {
        console.error("Error fetching order requests:", error)
      },
    )

    setLoading(false)

    // Clean up listeners on unmount
    return () => {
      clientsUnsubscribe()
      ordersUnsubscribe()
      depositsUnsubscribe()
      withdrawalsUnsubscribe()
      orderRequestsUnsubscribe()
    }
  }, [isAuthenticated])

  // Check if a Shop ID is unique
  const isShopIdUnique = async (shopId: string, currentId?: string): Promise<boolean> => {
    if (!isAuthenticated) {
      // Fallback to localStorage check
      return !clients.some((client) => client.shopId === shopId && client.shopId !== currentId)
    }

    if (shopId === currentId) return true

    try {
      const clientSnap = await getDocs(query(collection(db, "clients"), where("__name__", "==", shopId)))
      return clientSnap.empty
    } catch (error) {
      console.error("Error checking shop ID uniqueness:", error)
      return false
    }
  }

  // Generate unique IDs - simplified to be synchronous
  const generateOrderId = (): string => {
    const lastOrder = orders.length > 0 ? Number.parseInt(orders[orders.length - 1].orderId.replace("OR", "")) : 0
    const newId = lastOrder + 1
    return `OR${newId.toString().padStart(5, "0")}`
  }

  const generateDepositId = (): string => {
    const lastDeposit =
      deposits.length > 0 ? Number.parseInt(deposits[deposits.length - 1].depositId.replace("DP", "")) : 0
    const newId = lastDeposit + 1
    return `DP${newId.toString().padStart(5, "0")}`
  }

  const generateWithdrawalId = (): string => {
    const lastWithdrawal =
      withdrawals.length > 0 ? Number.parseInt(withdrawals[withdrawals.length - 1].withdrawalId.replace("WD", "")) : 0
    const newId = lastWithdrawal + 1
    return `WD${newId.toString().padStart(5, "0")}`
  }

  // Client CRUD operations
  const addClient = async (client: Client) => {
    if (!isAuthenticated) {
      // Fallback to localStorage
      setClients((prev) => [...prev, client])
      localStorage.setItem("clients", JSON.stringify([...clients, client]))
      return
    }

    try {
      await setDoc(doc(db, "clients", client.shopId), {
        clientName: client.clientName,
        agent: client.agent,
        kycDate: client.kycDate ? Timestamp.fromDate(new Date(client.kycDate)) : null,
        status: client.status,
        notes: client.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding client:", error)
    }
  }

  const updateClient = async (updatedClient: Client) => {
    try {
      await updateDoc(doc(db, "clients", updatedClient.shopId), {
        clientName: updatedClient.clientName,
        agent: updatedClient.agent,
        kycDate: updatedClient.kycDate ? Timestamp.fromDate(new Date(updatedClient.kycDate)) : null,
        status: updatedClient.status,
        notes: updatedClient.notes || "",
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating client:", error)
    }
  }

  const deleteClient = async (shopId: string) => {
    try {
      // Delete client
      await deleteDoc(doc(db, "clients", shopId))

      // Delete related orders
      const ordersQuery = query(collection(db, "orders"), where("shopId", "==", shopId))
      const ordersSnapshot = await getDocs(ordersQuery)
      ordersSnapshot.forEach(async (orderDoc) => {
        await deleteDoc(doc(db, "orders", orderDoc.id))
      })

      // Delete related deposits
      const depositsQuery = query(collection(db, "deposits"), where("shopId", "==", shopId))
      const depositsSnapshot = await getDocs(depositsQuery)
      depositsSnapshot.forEach(async (depositDoc) => {
        await deleteDoc(doc(db, "deposits", depositDoc.id))
      })

      // Delete related withdrawals
      const withdrawalsQuery = query(collection(db, "withdrawals"), where("shopId", "==", shopId))
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery)
      withdrawalsSnapshot.forEach(async (withdrawalDoc) => {
        await deleteDoc(doc(db, "withdrawals", withdrawalDoc.id))
      })

      // Delete related order requests
      const requestsQuery = query(collection(db, "orderRequests"), where("shopId", "==", shopId))
      const requestsSnapshot = await getDocs(requestsQuery)
      requestsSnapshot.forEach(async (requestDoc) => {
        await deleteDoc(doc(db, "orderRequests", requestDoc.id))
      })
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  const bulkDeleteClients = async (shopIds: string[]) => {
    try {
      // Create a batch for more efficient Firestore operations
      const batch = writeBatch(db)

      for (const shopId of shopIds) {
        // Add client deletion to batch
        batch.delete(doc(db, "clients", shopId))

        // Find and delete related data
        // Note: In a real app, you might want to use separate batches or transactions
        // if there are many related documents to delete

        // For now, we'll delete related data after the batch commits
      }

      // Commit the batch
      await batch.commit()

      // Now handle related data deletion
      for (const shopId of shopIds) {
        // Delete related orders
        const ordersQuery = query(collection(db, "orders"), where("shopId", "==", shopId))
        const ordersSnapshot = await getDocs(ordersQuery)
        ordersSnapshot.forEach(async (orderDoc) => {
          await deleteDoc(doc(db, "orders", orderDoc.id))
        })

        // Delete related deposits
        const depositsQuery = query(collection(db, "deposits"), where("shopId", "==", shopId))
        const depositsSnapshot = await getDocs(depositsQuery)
        depositsSnapshot.forEach(async (depositDoc) => {
          await deleteDoc(doc(db, "deposits", depositDoc.id))
        })

        // Delete related withdrawals
        const withdrawalsQuery = query(collection(db, "withdrawals"), where("shopId", "==", shopId))
        const withdrawalsSnapshot = await getDocs(withdrawalsQuery)
        withdrawalsSnapshot.forEach(async (withdrawalDoc) => {
          await deleteDoc(doc(db, "withdrawals", withdrawalDoc.id))
        })

        // Delete related order requests
        const requestsQuery = query(collection(db, "orderRequests"), where("shopId", "==", shopId))
        const requestsSnapshot = await getDocs(requestsQuery)
        requestsSnapshot.forEach(async (requestDoc) => {
          await deleteDoc(doc(db, "orderRequests", requestDoc.id))
        })
      }
    } catch (error) {
      console.error("Error bulk deleting clients:", error)
      throw error
    }
  }

  // Order CRUD operations
  const addOrder = async (order: Order) => {
    try {
      const orderId = order.orderId || generateOrderId()

      if (!isAuthenticated) {
        // Fallback to localStorage
        const newOrder = { ...order, orderId }
        setOrders((prev) => [...prev, newOrder])
        localStorage.setItem("orders", JSON.stringify([...orders, newOrder]))
        return
      }

      await setDoc(doc(db, "orders", orderId), {
        shopId: order.shopId,
        clientName: order.clientName,
        agent: order.agent,
        date: order.date ? Timestamp.fromDate(new Date(order.date)) : Timestamp.fromDate(new Date()),
        location: order.location,
        price: order.price,
        status: order.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding order:", error)
    }
  }

  const updateOrder = async (updatedOrder: Order) => {
    try {
      await updateDoc(doc(db, "orders", updatedOrder.orderId), {
        shopId: updatedOrder.shopId,
        clientName: updatedOrder.clientName,
        agent: updatedOrder.agent,
        date: updatedOrder.date ? Timestamp.fromDate(new Date(updatedOrder.date)) : Timestamp.fromDate(new Date()),
        location: updatedOrder.location,
        price: updatedOrder.price,
        status: updatedOrder.status,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId))
    } catch (error) {
      console.error("Error deleting order:", error)
    }
  }

  // Deposit CRUD operations
  const addDeposit = async (deposit: Deposit) => {
    try {
      const depositId = deposit.depositId || generateDepositId()

      // Ensure date is properly formatted
      let depositDate: Date
      if (typeof deposit.date === "string") {
        depositDate = new Date(deposit.date)
        if (isNaN(depositDate.getTime())) {
          depositDate = new Date()
        }
      } else if (deposit.date instanceof Date) {
        depositDate = deposit.date
      } else {
        depositDate = new Date()
      }

      if (!isAuthenticated) {
        // Fallback to localStorage
        const newDeposit = {
          ...deposit,
          depositId,
          date: depositDate,
        }
        setDeposits((prev) => [...prev, newDeposit])
        localStorage.setItem("deposits", JSON.stringify([...deposits, newDeposit]))
        return
      }

      await setDoc(doc(db, "deposits", depositId), {
        shopId: deposit.shopId,
        clientName: deposit.clientName,
        agent: deposit.agent,
        date: Timestamp.fromDate(depositDate),
        amount: deposit.amount,
        paymentMode: deposit.paymentMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding deposit:", error)
    }
  }

  const updateDeposit = async (updatedDeposit: Deposit) => {
    try {
      await updateDoc(doc(db, "deposits", updatedDeposit.depositId), {
        shopId: updatedDeposit.shopId,
        clientName: updatedDeposit.clientName,
        agent: updatedDeposit.agent,
        date: updatedDeposit.date ? Timestamp.fromDate(new Date(updatedDeposit.date)) : Timestamp.fromDate(new Date()),
        amount: updatedDeposit.amount,
        paymentMode: updatedDeposit.paymentMode,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating deposit:", error)
    }
  }

  const deleteDeposit = async (depositId: string) => {
    try {
      await deleteDoc(doc(db, "deposits", depositId))
    } catch (error) {
      console.error("Error deleting deposit:", error)
    }
  }

  // Withdrawal CRUD operations
  const addWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      const withdrawalId = withdrawal.withdrawalId || generateWithdrawalId()

      // Ensure date is properly formatted
      let withdrawalDate: Date
      if (typeof withdrawal.date === "string") {
        withdrawalDate = new Date(withdrawal.date)
        if (isNaN(withdrawalDate.getTime())) {
          withdrawalDate = new Date()
        }
      } else if (withdrawal.date instanceof Date) {
        withdrawalDate = withdrawal.date
      } else {
        withdrawalDate = new Date()
      }

      if (!isAuthenticated) {
        // Fallback to localStorage
        const newWithdrawal = {
          ...withdrawal,
          withdrawalId,
          date: withdrawalDate,
        }
        setWithdrawals((prev) => [...prev, newWithdrawal])
        localStorage.setItem("withdrawals", JSON.stringify([...withdrawals, newWithdrawal]))
        return
      }

      await setDoc(doc(db, "withdrawals", withdrawalId), {
        shopId: withdrawal.shopId,
        clientName: withdrawal.clientName,
        agent: withdrawal.agent,
        date: Timestamp.fromDate(withdrawalDate),
        amount: withdrawal.amount,
        paymentMode: withdrawal.paymentMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding withdrawal:", error)
    }
  }

  const updateWithdrawal = async (updatedWithdrawal: Withdrawal) => {
    try {
      await updateDoc(doc(db, "withdrawals", updatedWithdrawal.withdrawalId), {
        shopId: updatedWithdrawal.shopId,
        clientName: updatedWithdrawal.clientName,
        agent: updatedWithdrawal.agent,
        date: updatedWithdrawal.date
          ? Timestamp.fromDate(new Date(updatedWithdrawal.date))
          : Timestamp.fromDate(new Date()),
        amount: updatedWithdrawal.amount,
        paymentMode: updatedWithdrawal.paymentMode,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating withdrawal:", error)
    }
  }

  const deleteWithdrawal = async (withdrawalId: string) => {
    try {
      await deleteDoc(doc(db, "withdrawals", withdrawalId))
    } catch (error) {
      console.error("Error deleting withdrawal:", error)
    }
  }

  // Order Request CRUD operations
  const addOrderRequest = async (request: Omit<OrderRequest, "id" | "status" | "createdAt">) => {
    try {
      await addDoc(collection(db, "orderRequests"), {
        shopId: request.shopId,
        clientName: request.clientName,
        agent: request.agent,
        date: request.date ? Timestamp.fromDate(new Date(request.date)) : Timestamp.fromDate(new Date()),
        location: request.location,
        price: request.price,
        status: "Pending",
        remarks: request.remarks || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error adding order request:", error)
    }
  }

  const updateOrderRequestStatus = async (id: string, status: OrderRequestStatus) => {
    try {
      await updateDoc(doc(db, "orderRequests", id), {
        status,
        updatedAt: serverTimestamp(),
      })

      // If status is approved, create a new order
      if (status === "Approved") {
        const requestSnapshot = await getDocs(query(collection(db, "orderRequests"), where("__name__", "==", id)))
        if (!requestSnapshot.empty) {
          const requestData = requestSnapshot.docs[0].data()
          const newOrder: Order = {
            orderId: generateOrderId(),
            shopId: requestData.shopId,
            clientName: requestData.clientName,
            agent: requestData.agent,
            date: requestData.date ? new Date(requestData.date.seconds * 1000) : new Date(),
            location: requestData.location,
            price: requestData.price,
            status: "Pending", // Start as pending
          }
          await addOrder(newOrder)
        }
      }
    } catch (error) {
      console.error("Error updating order request status:", error)
    }
  }

  const deleteOrderRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orderRequests", id))
    } catch (error) {
      console.error("Error deleting order request:", error)
    }
  }

  // Reset all data
  const resetAllData = async () => {
    try {
      // Delete all collections
      const collections = ["clients", "orders", "deposits", "withdrawals", "orderRequests"]

      for (const collectionName of collections) {
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(collectionRef)

        snapshot.forEach(async (document) => {
          await deleteDoc(doc(db, collectionName, document.id))
        })
      }
    } catch (error) {
      console.error("Error resetting data:", error)
    }
  }

  // Export data as JSON
  const exportData = async (): Promise<string> => {
    const data = {
      clients,
      orders,
      deposits,
      withdrawals,
      orderRequests,
    }
    return JSON.stringify(data, null, 2)
  }

  // Import data from JSON
  const importData = async (jsonData: string): Promise<void> => {
    try {
      const data = JSON.parse(jsonData)

      // Clear existing data
      await resetAllData()

      // Import clients
      if (data.clients) {
        for (const client of data.clients) {
          await addClient(client)
        }
      }

      // Import orders
      if (data.orders) {
        for (const order of data.orders) {
          await addOrder(order)
        }
      }

      // Import deposits
      if (data.deposits) {
        for (const deposit of data.deposits) {
          await addDeposit(deposit)
        }
      }

      // Import withdrawals
      if (data.withdrawals) {
        for (const withdrawal of data.withdrawals) {
          await addWithdrawal(withdrawal)
        }
      }

      // Import order requests
      if (data.orderRequests) {
        for (const request of data.orderRequests) {
          // Use addDoc for order requests since they have auto-generated IDs
          await addDoc(collection(db, "orderRequests"), {
            shopId: request.shopId,
            clientName: request.clientName,
            agent: request.agent,
            date: request.date ? Timestamp.fromDate(new Date(request.date)) : Timestamp.fromDate(new Date()),
            location: request.location,
            price: request.price,
            status: request.status,
            remarks: request.remarks || "",
            createdAt: Timestamp.fromMillis(request.createdAt || Date.now()),
            updatedAt: serverTimestamp(),
          })
        }
      }
    } catch (error) {
      console.error("Error importing data:", error)
    }
  }

  return (
    <ClientContext.Provider
      value={{
        clients,
        orders,
        deposits,
        withdrawals,
        orderRequests,
        loading,
        addClient,
        updateClient,
        deleteClient,
        bulkDeleteClients,
        addOrder,
        updateOrder,
        deleteOrder,
        addDeposit,
        updateDeposit,
        deleteDeposit,
        addWithdrawal,
        updateWithdrawal,
        deleteWithdrawal,
        addOrderRequest,
        updateOrderRequestStatus,
        deleteOrderRequest,
        isShopIdUnique,
        generateOrderId,
        generateDepositId,
        generateWithdrawalId,
        resetAllData,
        exportData,
        importData,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error("useClientContext must be used within a ClientProvider")
  }
  return context
}

