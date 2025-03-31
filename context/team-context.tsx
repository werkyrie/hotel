"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Agent, Penalty, Reward, TeamMetrics, Attendance } from "@/types/team"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, onSnapshot } from "firebase/firestore"

interface TeamContextType {
  agents: Agent[]
  penalties: Penalty[]
  rewards: Reward[]
  attendance: Attendance[]
  metrics: TeamMetrics
  addAgent: (agent: Omit<Agent, "id" | "commission" | "commissionRate">) => Promise<void>
  updateAgent: (agent: Agent) => Promise<void>
  deleteAgent: (id: string) => Promise<void>
  addPenalty: (penalty: Omit<Penalty, "id">) => Promise<void>
  updatePenalty: (penalty: Penalty) => Promise<void>
  deletePenalty: (id: string) => Promise<void>
  addReward: (reward: Omit<Reward, "id">) => Promise<void>
  updateReward: (reward: Reward) => Promise<void>
  deleteReward: (id: string) => Promise<void>
  addAttendance: (attendance: Omit<Attendance, "id">) => Promise<void>
  updateAttendance: (attendance: Attendance) => Promise<void>
  deleteAttendance: (id: string) => Promise<void>
  calculateCommission: (depositAmount: number) => { rate: number; amount: number }
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [metrics, setMetrics] = useState<TeamMetrics>({
    totalAgents: 0,
    totalAddedToday: 0,
    totalMonthlyAdded: 0,
    totalOpenAccounts: 0,
    totalDeposits: 0,
  })

  // Load data from Firebase on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Set up real-time listeners for each collection
        const agentsUnsubscribe = onSnapshot(collection(db, "agents"), (snapshot) => {
          const agentData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Agent[]
          setAgents(agentData)
        })

        const penaltiesUnsubscribe = onSnapshot(collection(db, "penalties"), (snapshot) => {
          const penaltyData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Penalty[]
          setPenalties(penaltyData)
        })

        const rewardsUnsubscribe = onSnapshot(collection(db, "rewards"), (snapshot) => {
          const rewardData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Reward[]
          setRewards(rewardData)
        })

        const attendanceUnsubscribe = onSnapshot(collection(db, "attendance"), (snapshot) => {
          const attendanceData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Attendance[]
          setAttendance(attendanceData)
        })

        // Clean up listeners on unmount
        return () => {
          agentsUnsubscribe()
          penaltiesUnsubscribe()
          rewardsUnsubscribe()
          attendanceUnsubscribe()
        }
      } catch (error) {
        console.error("Error loading team data:", error)

        // Fallback to localStorage if Firebase fails
        const savedAgents = localStorage.getItem("agents")
        const savedPenalties = localStorage.getItem("penalties")
        const savedRewards = localStorage.getItem("rewards")
        const savedAttendance = localStorage.getItem("attendance")

        if (savedAgents) setAgents(JSON.parse(savedAgents))
        if (savedPenalties) setPenalties(JSON.parse(savedPenalties))
        if (savedRewards) setRewards(JSON.parse(savedRewards))
        if (savedAttendance) setAttendance(JSON.parse(savedAttendance))
      }
    }

    loadData()
  }, [])

  // Update metrics whenever agents change
  useEffect(() => {
    const totalAgents = agents.length
    const totalAddedToday = agents.reduce((sum, agent) => sum + (agent.addedToday || 0), 0)
    const totalMonthlyAdded = agents.reduce((sum, agent) => sum + (agent.monthlyAdded || 0), 0)
    const totalOpenAccounts = agents.reduce((sum, agent) => sum + (agent.openAccounts || 0), 0)
    const totalDeposits = agents.reduce((sum, agent) => sum + (agent.totalDeposits || 0), 0)

    setMetrics({
      totalAgents,
      totalAddedToday,
      totalMonthlyAdded,
      totalOpenAccounts,
      totalDeposits,
    })
  }, [agents])

  // Calculate commission based on deposit amount
  const calculateCommission = (depositAmount: number) => {
    let rate = 0

    if (depositAmount >= 100000) {
      rate = 0.1 // 10%
    } else if (depositAmount >= 50000) {
      rate = 0.09 // 9%
    } else if (depositAmount >= 20000) {
      rate = 0.07 // 7%
    } else if (depositAmount >= 10000) {
      rate = 0.05 // 5%
    } else if (depositAmount >= 1000) {
      rate = 0.04 // 4%
    }

    const amount = depositAmount * rate

    return { rate, amount }
  }

  // Update agents with commission calculations
  useEffect(() => {
    const updateAgentsWithCommission = async () => {
      const updatedAgents = agents.map((agent) => {
        const { rate, amount } = calculateCommission(agent.totalDeposits || 0)
        return {
          ...agent,
          commission: amount,
          commissionRate: rate * 100, // Convert to percentage
        }
      })

      if (JSON.stringify(updatedAgents) !== JSON.stringify(agents)) {
        setAgents(updatedAgents)

        // Update commission values in Firebase
        for (const agent of updatedAgents) {
          try {
            const agentRef = doc(db, "agents", agent.id)
            await updateDoc(agentRef, {
              commission: agent.commission,
              commissionRate: agent.commissionRate,
            })
          } catch (error) {
            console.error(`Error updating commission for agent ${agent.id}:`, error)
          }
        }
      }
    }

    if (agents.length > 0) {
      updateAgentsWithCommission()
    }
  }, [agents])

  // Agent CRUD operations
  const addAgent = async (agent: Omit<Agent, "id" | "commission" | "commissionRate">) => {
    try {
      const { rate, amount } = calculateCommission(agent.totalDeposits || 0)
      const newAgent = {
        ...agent,
        commission: amount,
        commissionRate: rate * 100,
      }

      // Add to Firebase
      const docRef = await addDoc(collection(db, "agents"), newAgent)

      // Update local state with Firebase ID
      setAgents((prev) => [...prev, { ...newAgent, id: docRef.id } as Agent])

      // Backup to localStorage
      localStorage.setItem("agents", JSON.stringify([...agents, { ...newAgent, id: docRef.id }]))
    } catch (error) {
      console.error("Error adding agent:", error)

      // Fallback to localStorage only
      const newAgent: Agent = {
        ...agent,
        id: Math.random().toString(36).substring(2, 9),
        commission: 0,
        commissionRate: 0,
      }

      const { rate, amount } = calculateCommission(newAgent.totalDeposits || 0)
      newAgent.commission = amount
      newAgent.commissionRate = rate * 100

      setAgents((prev) => [...prev, newAgent])
      localStorage.setItem("agents", JSON.stringify([...agents, newAgent]))
    }
  }

  const updateAgent = async (updatedAgent: Agent) => {
    try {
      // Update in Firebase
      const agentRef = doc(db, "agents", updatedAgent.id)
      await updateDoc(agentRef, { ...updatedAgent })

      // Update local state
      setAgents((prev) => prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))

      // Backup to localStorage
      localStorage.setItem(
        "agents",
        JSON.stringify(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))),
      )
    } catch (error) {
      console.error("Error updating agent:", error)

      // Fallback to localStorage only
      setAgents((prev) => prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))
      localStorage.setItem(
        "agents",
        JSON.stringify(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))),
      )
    }
  }

  const deleteAgent = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "agents", id))

      // Delete related penalties, rewards, and attendance
      const penaltyQuery = query(collection(db, "penalties"), where("agentId", "==", id))
      const penaltyDocs = await getDocs(penaltyQuery)
      penaltyDocs.forEach(async (penaltyDoc) => {
        await deleteDoc(doc(db, "penalties", penaltyDoc.id))
      })

      const rewardQuery = query(collection(db, "rewards"), where("agentId", "==", id))
      const rewardDocs = await getDocs(rewardQuery)
      rewardDocs.forEach(async (rewardDoc) => {
        await deleteDoc(doc(db, "rewards", rewardDoc.id))
      })

      const attendanceQuery = query(collection(db, "attendance"), where("agentId", "==", id))
      const attendanceDocs = await getDocs(attendanceQuery)
      attendanceDocs.forEach(async (attendanceDoc) => {
        await deleteDoc(doc(db, "attendance", attendanceDoc.id))
      })

      // Update local state
      setAgents((prev) => prev.filter((agent) => agent.id !== id))
      setPenalties((prev) => prev.filter((penalty) => penalty.agentId !== id))
      setRewards((prev) => prev.filter((reward) => reward.agentId !== id))
      setAttendance((prev) => prev.filter((attendance) => attendance.agentId !== id))

      // Backup to localStorage
      localStorage.setItem("agents", JSON.stringify(agents.filter((agent) => agent.id !== id)))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.agentId !== id)))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.agentId !== id)))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((attendance) => attendance.agentId !== id)))
    } catch (error) {
      console.error("Error deleting agent:", error)

      // Fallback to localStorage only
      setAgents((prev) => prev.filter((agent) => agent.id !== id))
      setPenalties((prev) => prev.filter((penalty) => penalty.agentId !== id))
      setRewards((prev) => prev.filter((reward) => reward.agentId !== id))
      setAttendance((prev) => prev.filter((attendance) => attendance.agentId !== id))

      localStorage.setItem("agents", JSON.stringify(agents.filter((agent) => agent.id !== id)))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.agentId !== id)))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.agentId !== id)))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((attendance) => attendance.agentId !== id)))
    }
  }

  // Penalty CRUD operations
  const addPenalty = async (penalty: Omit<Penalty, "id">) => {
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, "penalties"), penalty)

      // Update local state with Firebase ID
      const newPenalty = { ...penalty, id: docRef.id } as Penalty
      setPenalties((prev) => [...prev, newPenalty])

      // Backup to localStorage
      localStorage.setItem("penalties", JSON.stringify([...penalties, newPenalty]))
    } catch (error) {
      console.error("Error adding penalty:", error)

      // Fallback to localStorage only
      const newPenalty: Penalty = {
        ...penalty,
        id: Math.random().toString(36).substring(2, 9),
      }
      setPenalties((prev) => [...prev, newPenalty])
      localStorage.setItem("penalties", JSON.stringify([...penalties, newPenalty]))
    }
  }

  const updatePenalty = async (updatedPenalty: Penalty) => {
    try {
      // Update in Firebase
      const penaltyRef = doc(db, "penalties", updatedPenalty.id)
      await updateDoc(penaltyRef, { ...updatedPenalty })

      // Update local state
      setPenalties((prev) => prev.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty)))

      // Backup to localStorage
      localStorage.setItem(
        "penalties",
        JSON.stringify(penalties.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty))),
      )
    } catch (error) {
      console.error("Error updating penalty:", error)

      // Fallback to localStorage only
      setPenalties((prev) => prev.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty)))
      localStorage.setItem(
        "penalties",
        JSON.stringify(penalties.map((penalty) => (penalty.id === updatedPenalty.id ? updatedPenalty : penalty))),
      )
    }
  }

  const deletePenalty = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "penalties", id))

      // Update local state
      setPenalties((prev) => prev.filter((penalty) => penalty.id !== id))

      // Backup to localStorage
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.id !== id)))
    } catch (error) {
      console.error("Error deleting penalty:", error)

      // Fallback to localStorage only
      setPenalties((prev) => prev.filter((penalty) => penalty.id !== id))
      localStorage.setItem("penalties", JSON.stringify(penalties.filter((penalty) => penalty.id !== id)))
    }
  }

  // Reward CRUD operations
  const addReward = async (reward: Omit<Reward, "id">) => {
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, "rewards"), reward)

      // Update local state with Firebase ID
      const newReward = { ...reward, id: docRef.id } as Reward
      setRewards((prev) => [...prev, newReward])

      // Backup to localStorage
      localStorage.setItem("rewards", JSON.stringify([...rewards, newReward]))
    } catch (error) {
      console.error("Error adding reward:", error)

      // Fallback to localStorage only
      const newReward: Reward = {
        ...reward,
        id: Math.random().toString(36).substring(2, 9),
      }
      setRewards((prev) => [...prev, newReward])
      localStorage.setItem("rewards", JSON.stringify([...rewards, newReward]))
    }
  }

  const updateReward = async (updatedReward: Reward) => {
    try {
      // Update in Firebase
      const rewardRef = doc(db, "rewards", updatedReward.id)
      await updateDoc(rewardRef, { ...updatedReward })

      // Update local state
      setRewards((prev) => prev.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward)))

      // Backup to localStorage
      localStorage.setItem(
        "rewards",
        JSON.stringify(rewards.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward))),
      )
    } catch (error) {
      console.error("Error updating reward:", error)

      // Fallback to localStorage only
      setRewards((prev) => prev.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward)))
      localStorage.setItem(
        "rewards",
        JSON.stringify(rewards.map((reward) => (reward.id === updatedReward.id ? updatedReward : reward))),
      )
    }
  }

  const deleteReward = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "rewards", id))

      // Update local state
      setRewards((prev) => prev.filter((reward) => reward.id !== id))

      // Backup to localStorage
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.id !== id)))
    } catch (error) {
      console.error("Error deleting reward:", error)

      // Fallback to localStorage only
      setRewards((prev) => prev.filter((reward) => reward.id !== id))
      localStorage.setItem("rewards", JSON.stringify(rewards.filter((reward) => reward.id !== id)))
    }
  }

  // Attendance CRUD operations
  const addAttendance = async (attendance: Omit<Attendance, "id">) => {
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, "attendance"), attendance)

      // Update local state with Firebase ID
      const newAttendance = { ...attendance, id: docRef.id } as Attendance
      setAttendance((prev) => [...prev, newAttendance])

      // Backup to localStorage
      localStorage.setItem("attendance", JSON.stringify([...attendance, newAttendance]))
    } catch (error) {
      console.error("Error adding attendance:", error)

      // Fallback to localStorage only
      const newAttendance: Attendance = {
        ...attendance,
        id: Math.random().toString(36).substring(2, 9),
      }
      setAttendance((prev) => [...prev, newAttendance])
      localStorage.setItem("attendance", JSON.stringify([...attendance, newAttendance]))
    }
  }

  const updateAttendance = async (updatedAttendance: Attendance) => {
    try {
      // Update in Firebase
      const attendanceRef = doc(db, "attendance", updatedAttendance.id)
      await updateDoc(attendanceRef, { ...updatedAttendance })

      // Update local state
      setAttendance((prev) =>
        prev.map((attendance) => (attendance.id === updatedAttendance.id ? updatedAttendance : attendance)),
      )

      // Backup to localStorage
      localStorage.setItem(
        "attendance",
        JSON.stringify(attendance.map((item) => (item.id === updatedAttendance.id ? updatedAttendance : item))),
      )
    } catch (error) {
      console.error("Error updating attendance:", error)

      // Fallback to localStorage only
      setAttendance((prev) =>
        prev.map((attendance) => (attendance.id === updatedAttendance.id ? updatedAttendance : attendance)),
      )
      localStorage.setItem(
        "attendance",
        JSON.stringify(attendance.map((item) => (item.id === updatedAttendance.id ? updatedAttendance : item))),
      )
    }
  }

  const deleteAttendance = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "attendance", id))

      // Update local state
      setAttendance((prev) => prev.filter((attendance) => attendance.id !== id))

      // Backup to localStorage
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((item) => item.id !== id)))
    } catch (error) {
      console.error("Error deleting attendance:", error)

      // Fallback to localStorage only
      setAttendance((prev) => prev.filter((attendance) => attendance.id !== id))
      localStorage.setItem("attendance", JSON.stringify(attendance.filter((item) => item.id !== id)))
    }
  }

  return (
    <TeamContext.Provider
      value={{
        agents,
        penalties,
        rewards,
        attendance,
        metrics,
        addAgent,
        updateAgent,
        deleteAgent,
        addPenalty,
        updatePenalty,
        deletePenalty,
        addReward,
        updateReward,
        deleteReward,
        addAttendance,
        updateAttendance,
        deleteAttendance,
        calculateCommission,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeamContext must be used within a TeamProvider")
  }
  return context
}

