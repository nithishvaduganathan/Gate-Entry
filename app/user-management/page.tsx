
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Edit, Shield, UserX, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import ProtectedLayout from "@/components/protected-layout"
import type { UserProfile, UserRole } from "@/lib/auth"

interface UserWithRole {
  id: string
  email: string
  full_name: string | null
  department: string | null
  is_active: boolean
  role_name: UserRole
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [roles, setRoles] = useState<{ id: string; name: UserRole }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        department,
        is_active,
        created_at,
        user_roles(id, name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data.map(user => ({
        ...user,
        role_name: user.user_roles?.name as UserRole || 'user'
      })))
    }
    setLoading(false)
  }

  const fetchRoles = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_roles')
      .select('id, name')
      .order('name')

    if (data) {
      setRoles(data)
    }
  }

  const updateUserRole = async (userId: string, roleId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (!error) {
      fetchUsers()
      alert('User role updated successfully!')
    } else {
      alert('Error updating user role')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId)

    if (!error) {
      fetchUsers()
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } else {
      alert('Error updating user status')
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'authority': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <ProtectedLayout requiredPermissions={['create_users']}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout requiredPermissions={['create_users']}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600">Manage system users and their roles</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {users.length} Total Users
          </Badge>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Label htmlFor="search">Search Users</Label>
          <Input
            id="search"
            placeholder="Search by email, name, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.full_name || 'No name provided'}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.department && (
                          <p className="text-xs text-gray-500">{user.department}</p>
                        )}
                      </div>
                      <Badge className={getRoleColor(user.role_name)}>
                        {user.role_name.toUpperCase()}
                      </Badge>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Role Selection */}
                    <select
                      value={roles.find(r => r.name === user.role_name)?.id || ''}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {/* Toggle Status */}
                    <Button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">No users match your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  )
}
