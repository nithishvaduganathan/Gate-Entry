
"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  username: string
  role: string
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("currentUser")
      }
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem("currentUser")
    setUser(null)
    window.location.href = "/login"
  }

  return { user, loading, logout }
}
