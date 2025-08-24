
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Bus, 
  UserCheck, 
  BarChart3,
  FileText,
  Settings
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">SINCET Gate Entry System</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Visitor Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                Visitor Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Register new visitors entering the campus</p>
              <Link href="/visitor-entry">
                <Button className="w-full">
                  Add Visitor Entry
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Vehicle Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bus className="w-5 h-5 mr-2 text-blue-600" />
                Vehicle Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Register vehicles entering the campus</p>
              <Link href="/vehicle-entry">
                <Button className="w-full">
                  Add Vehicle Entry
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View entry statistics and reports</p>
              <Link href="/dashboard">
                <Button className="w-full" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Entries List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                All Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View all visitor and vehicle entries</p>
              <Link href="/entries">
                <Button className="w-full" variant="outline">
                  View Entries
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Authorities Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-red-600" />
                Authorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage college authorities</p>
              <Link href="/authorities">
                <Button className="w-full" variant="outline">
                  Manage Authorities
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Generate and export reports</p>
              <Link href="/reports">
                <Button className="w-full" variant="outline">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
