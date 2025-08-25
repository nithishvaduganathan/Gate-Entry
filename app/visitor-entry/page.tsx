"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Mic, User, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { sendToWebhook } from "@/lib/csv-export"
import CameraCapture from "@/components/camera-capture"
import SpeechInput from "@/components/speech-input"

interface Authority {
  id: string
  name: string
  designation: string
  department: string | null
  email: string | null
  is_active: boolean
}

export default function VisitorEntryPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "", // Added email field
    purpose: "",
    authorityId: "",
    notes: "",
  })
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showSpeechInput, setShowSpeechInput] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchAuthorities()
  }, [])

  const fetchAuthorities = async () => {
    try {
      console.log('Creating Supabase client...')
      const supabase = createClient()
      
      // Log environment variables (for debugging - remove in production)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
      
      console.log('Fetching authorities from database...')
      const { data, error, status } = await supabase
        .from("authorities")
        .select("id, name, designation, department, email, is_active")
        .eq("is_active", true)
        .order("name")

      console.log('Query status:', status)
      
      if (error) {
        console.error('Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Successfully fetched authorities:', data)
      setAuthorities(data || [])
    } catch (error) {
      console.error('Error in fetchAuthorities:', {
        error,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        }
      })
    }
  }

  const handlePhotoCapture = (photoBlob: Blob) => {
    setCapturedPhoto(photoBlob)
    const previewUrl = URL.createObjectURL(photoBlob)
    setPhotoPreview(previewUrl)
  }

  const handleSpeechTranscript = (text: string, field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: text,
    }))
  }

  const uploadPhoto = async (photoBlob: Blob): Promise<string | null> => {
    try {
      const supabase = createClient()
      const fileName = `visitor-${Date.now()}.jpg`

      const { data, error } = await supabase.storage.from("visitor-photos").upload(fileName, photoBlob, {
        contentType: "image/jpeg",
      })

      if (error) {
        console.error("Photo upload error:", error)
        return null
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("visitor-photos").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Error uploading photo:", error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let photoUrl = null

      if (capturedPhoto) {
        photoUrl = await uploadPhoto(capturedPhoto)
      }

      const supabase = createClient()

      // Determine status and if permission is required
      const selectedAuthority = authorities.find((auth) => auth.id === formData.authorityId);
      const requiresPermission = !!formData.authorityId;
      const permissionGranted = !requiresPermission; // Automatically approved if no authority is selected
      let visitorStatus = requiresPermission ? "pending" : "approved";

      console.log('Creating visitor record with data:', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        purpose: formData.purpose,
        authority_id: formData.authorityId || null,
        status: visitorStatus,
        photo_url: photoUrl,
        notes: formData.notes,
        created_by: "Gatekeeper",
        authority_permission_granted: permissionGranted,
        permission_granted_at: permissionGranted ? new Date().toISOString() : null,
      })

      const { data: visitor, error } = await supabase
        .from("visitors")
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          purpose: formData.purpose,
          authority_id: formData.authorityId || null,
          status: visitorStatus,
          photo_url: photoUrl,
          notes: formData.notes,
          created_by: "Gatekeeper",
          authority_permission_granted: permissionGranted,
          permission_granted_at: permissionGranted ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (error) throw error

      // Create notifications for authority and admin if required
      if (formData.authorityId && visitor) {
        // Notification for the selected authority
        await supabase.from("notifications").insert({
          visitor_id: visitor.id,
          authority_id: formData.authorityId,
          type: "visitor_request",
          title: "New Visitor Permission Request",
          message: `${formData.name} (${formData.email}) is requesting permission to enter. Purpose: ${formData.purpose}`,
          is_read: false,
        })

        // Also create notification for admin if the selected authority is not a principal
        if (selectedAuthority?.designation !== 'Principal') {
          const adminAuthority = authorities.find(auth => auth.designation === 'Principal')
          if (adminAuthority) {
            await supabase.from("notifications").insert({
              visitor_id: visitor.id,
              authority_id: adminAuthority.id,
              type: "visitor_request",
              title: "New Visitor Permission Request (Admin Copy)",
              message: `${formData.name} (${formData.email}) is requesting permission to enter. Purpose: ${formData.purpose}. Assigned to: ${selectedAuthority?.name || 'Unknown'}`,
              is_read: false,
            })
          }
        }
      }

      // Simulate webhook call
      const webhookSuccess = await sendToWebhook(
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          purpose: formData.purpose,
          entryTime: new Date().toISOString(),
          authorityName: selectedAuthority ? `${selectedAuthority.name} (${selectedAuthority.designation})` : undefined,
          status: visitorStatus,
          photoUrl: photoUrl || undefined,
          notes: formData.notes || undefined,
        },
        "visitor",
      )

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        purpose: "",
        authorityId: "",
        notes: "",
      })
      setCapturedPhoto(null)
      setPhotoPreview(null)

      if (webhookSuccess) {
        alert("Visitor registered successfully and sent to external system!")
      } else {
        alert("Visitor registered successfully! (External system integration not configured)")
      }
    } catch (error: any) {
      console.error("Error registering visitor:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack,
        response: error.response?.data || 'No response data',
        status: error.status,
        statusCode: error.statusCode,
        statusText: error.statusText,
      })
      alert(`Error registering visitor: ${error.message || 'Unknown error'}. Please check the console for more details.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Visitor Entry</h1>
            <p className="text-sm text-gray-600">Register unknown visitor</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Capture */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Visitor Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photoPreview ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Captured visitor"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setCapturedPhoto(null)
                        setPhotoPreview(null)
                      }}
                    >
                      Remove Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowCamera(true)}
                    >
                      Retake Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-transparent"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm">Capture Photo</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Visitor Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <User className="w-4 h-4 mr-2" />
                Visitor Details
              </CardTitle>
              <CardDescription>Enter visitor information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Input Toggle */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpeechInput(true)}
                  className="flex items-center space-x-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Voice Input</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter visitor's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-XXXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {/* Email Input Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of visit..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Authority Permission */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Authority Permission
              </CardTitle>
              <CardDescription>Select authority for permission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authority">Select Authority</Label>
                <Select
                  value={formData.authorityId}
                  onValueChange={(value) => setFormData({ ...formData, authorityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose authority (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorities.map((authority) => (
                      <SelectItem key={authority.id} value={authority.id}>
                        {authority.name} - {authority.designation}
                        {authority.department && ` (${authority.department})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Entry Time Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Entry Time: {new Date().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isLoading || !formData.name || !formData.phone || !formData.email || !formData.purpose}
          >
            {isLoading ? "Registering..." : "Register Visitor"}
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href="/entries">
            <Button variant="outline" className="w-full bg-transparent">
              View Entries
            </Button>
          </Link>
          <Link href="/visitor-list">
            <Button variant="outline" className="w-full bg-transparent">
              All Visitors
            </Button>
          </Link>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && <CameraCapture onPhotoCapture={handlePhotoCapture} onClose={() => setShowCamera(false)} />}

      {/* Speech Input Modal */}
      {showSpeechInput && (
        <SpeechInput onTranscript={handleSpeechTranscript} onClose={() => setShowSpeechInput(false)} />
      )}
    </div>
  )
}