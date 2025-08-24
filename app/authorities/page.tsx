"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Plus, Edit, Trash2, Phone, Mail, Building } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/router'; // Import useRouter

// Dummy user object for demonstration. In a real app, this would come from authentication context or state.
const user = {
  id: '1',
  email: 'admin@example.com',
  role: 'admin', // 'admin', 'authority', 'user'
};

interface Authority {
  id: string
  name: string
  designation: string
  department: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

export default function AuthoritiesPage() {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active")
  const router = useRouter(); // Initialize router

  // Redirect to login if user is not authenticated or not an admin
  useEffect(() => {
    // In a real app, you'd check actual authentication status and role.
    // For this example, we assume the user object is available and check its role.
    if (!user || user.role !== 'admin') {
      router.push('/login'); // Redirect to login page
    }
  }, [router]);


  useEffect(() => {
    fetchAuthorities()
  }, [filter])

  const fetchAuthorities = async () => {
    const supabase = createClient()
    let query = supabase
      .from("authorities")
      .select("*")
      .order("designation", { ascending: true })
      .order("name", { ascending: true })

    if (filter !== "all") {
      query = query.eq("is_active", filter === "active")
    }

    const { data, error } = await query

    if (data) {
      setAuthorities(data)
    }
    setIsLoading(false)
  }

  const toggleAuthorityStatus = async (authorityId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from("authorities").update({ is_active: !currentStatus }).eq("id", authorityId)

    if (!error) {
      fetchAuthorities()
      alert(`Authority ${!currentStatus ? "activated" : "deactivated"} successfully!`)
    } else {
      alert("Error updating authority status. Please try again.")
    }
  }

  const deleteAuthority = async (authorityId: string) => {
    if (!confirm("Are you sure you want to delete this authority? This action cannot be undone.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("authorities").delete().eq("id", authorityId)

    if (!error) {
      fetchAuthorities()
      alert("Authority deleted successfully!")
    } else {
      alert("Error deleting authority. Please try again.")
    }
  }

  const getDesignationColor = (designation: string) => {
    switch (designation) {
      case "Principal":
        return "bg-purple-100 text-purple-800"
      case "HOD":
        return "bg-blue-100 text-blue-800"
      case "Staff":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading authorities...</div>
        </div>
      </div>
    )
  }

  // If not an admin, redirect to login (this check is also in useEffect)
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You do not have permission to view this page. Please log in as an administrator.</p>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Authority Management</h1>
            <p className="text-sm text-gray-600">Manage college authorities</p>
          </div>
          <Link href="/authorities/add">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </Link>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
            className={filter === "active" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            Active
          </Button>
          <Button
            variant={filter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("inactive")}
          >
            Inactive
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
        </div>

        {/* Authorities List */}
        <div className="space-y-4">
          {authorities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">No authorities found</CardContent>
            </Card>
          ) : (
            authorities.map((authority) => (
              <Card key={authority.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <CardTitle className="text-base">{authority.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDesignationColor(authority.designation)}>{authority.designation}</Badge>
                      <Badge
                        className={authority.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {authority.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {authority.department && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{authority.department}</span>
                    </div>
                  )}

                  {authority.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{authority.phone}</span>
                    </div>
                  )}

                  {authority.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{authority.email}</span>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Link href={`/authorities/edit/${authority.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center space-x-1 bg-transparent">
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAuthorityStatus(authority.id, authority.is_active)}
                      className={
                        authority.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
                      }
                    >
                      {authority.is_active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAuthority(authority.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href="/authority-approvals">
            <Button variant="outline" className="w-full bg-transparent">
              Pending Approvals
            </Button>
          </Link>
          <Button onClick={fetchAuthorities} variant="outline" className="w-full bg-transparent">
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  )
}