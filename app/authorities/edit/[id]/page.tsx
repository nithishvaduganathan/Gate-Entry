"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Shield, Save } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Authority {
  id: string
  name: string
  designation: string
  department: string | null
  phone: string | null
  email: string | null
  is_active: boolean
}

export default function EditAuthorityPage() {
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    department: "",
    phone: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const params = useParams()
  const authorityId = params.id as string

  useEffect(() => {
    if (authorityId) {
      fetchAuthority()
    }
  }, [authorityId])

  const fetchAuthority = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("authorities").select("*").eq("id", authorityId).single()

    if (data) {
      setFormData({
        name: data.name,
        designation: data.designation,
        department: data.department || "",
        phone: data.phone || "",
        email: data.email || "",
      })
    }
    setIsLoadingData(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("authorities")
        .update({
          name: formData.name,
          designation: formData.designation,
          department: formData.department || null,
          phone: formData.phone || null,
          email: formData.email || null,
        })
        .eq("id", authorityId)

      if (error) throw error

      alert("Authority updated successfully!")
      router.push("/authorities")
    } catch (error) {
      console.error("Error updating authority:", error)
      alert("Error updating authority. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center">Loading authority data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/authorities">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Authority</h1>
            <p className="text-sm text-gray-600">Update authority profile</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>Update authority details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => setFormData({ ...formData, designation: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Principal">Principal</SelectItem>
                    <SelectItem value="HOD">HOD (Head of Department)</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="e.g., Computer Science, Administration"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>Optional contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-XXXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || !formData.name || !formData.designation}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Updating Authority..." : "Update Authority"}
          </Button>
        </form>
      </div>
    </div>
  )
}
