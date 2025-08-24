
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    try {
      const currentUser = localStorage.getItem("currentUser")
      console.log("Current user in localStorage:", currentUser) // Debug log
      
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        console.log("Parsed user data:", userData) // Debug log
        router.push("/dashboard")
      } else {
        console.log("No user found, redirecting to login") // Debug log
        router.push("/login")
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    } finally {
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
