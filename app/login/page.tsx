"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeProvider } from "@/components/theme-provider"
import { Fingerprint, Mail, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { login, isAuthenticated, loginError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeout = searchParams.get("timeout")

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Set error message if login error exists
  useEffect(() => {
    if (loginError) {
      setErrorMessage(loginError)
    }
  }, [loginError])

  // Set timeout message
  useEffect(() => {
    if (timeout) {
      setErrorMessage("Your session has expired. Please log in again.")
    }
  }, [timeout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await login(email, password)
      if (!result.success) {
        setErrorMessage(result.message)
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.6,
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)",
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4">
        {/* Background gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 z-0">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
          <div className="absolute inset-0 backdrop-blur-[100px]" />

          {/* Animated background blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md text-center text-white mb-8 z-10"
          >
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
              className="text-4xl font-bold mb-2"
            >
              Client Management System
            </motion.h1>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
              className="text-white/80 text-lg"
            >
              Streamline your client operations with our powerful management tools
            </motion.p>
          </motion.div>
        )}

        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-md z-10"
          >
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl shadow-purple-500/30 rounded-2xl">
              <CardHeader className="space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                    delay: 0.5,
                  }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                <CardDescription className="text-white/70">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert className="mb-6 bg-red-500/20 backdrop-blur-md text-white border-red-500/30">
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="email" className="text-sm font-medium text-white">
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50 group-hover:text-white/70 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/30"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div className="space-y-2" variants={itemVariants}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-white">
                        Password
                      </Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-purple-200 hover:text-white"
                        type="button"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="relative group">
                      <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-white/50 group-hover:text-white/70 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/30"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={buttonVariants} whileHover="hover">
                    <Button
                      type="submit"
                      className="w-full py-6 text-base font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-purple-500/40 group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Authenticating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </CardContent>

              <CardFooter className="flex justify-center border-t border-white/10 p-6">
                <p className="text-sm text-white/60">Need help? Contact your system administrator</p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-sm text-white/70 z-10"
          >
            © {new Date().getFullYear()} Client Management System. All rights reserved.
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0V20M0 1H20' stroke='white' strokeOpacity='0.1'/%3E%3C/svg%3E%0A");
        }
      `}</style>
    </ThemeProvider>
  )
}

