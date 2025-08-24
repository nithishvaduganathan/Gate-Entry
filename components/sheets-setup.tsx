"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileSpreadsheet, ExternalLink, CheckCircle } from "lucide-react"
import { initializeGoogleSheets } from "@/lib/google-sheets"

export default function SheetsSetup() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleInitialize = async () => {
    setIsInitializing(true)
    try {
      await initializeGoogleSheets()
      setIsInitialized(true)
      alert("Google Sheets initialized successfully!")
    } catch (error) {
      alert("Failed to initialize Google Sheets. Please check your configuration.")
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          Google Sheets Integration
        </CardTitle>
        <CardDescription>Configure Google Sheets to automatically export gate entry data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Setup Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Create two Google Sheets: one for visitors, one for bus entries</li>
              <li>Get the Sheet IDs from the URLs</li>
              <li>Enable Google Sheets API and get an API key</li>
              <li>Add environment variables to your project</li>
              <li>Click "Initialize Sheets" to set up headers</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Required Environment Variables:</Label>
            <div className="mt-2 space-y-1 text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded">
              <div>NEXT_PUBLIC_VISITORS_SHEET_ID=your_visitors_sheet_id</div>
              <div>NEXT_PUBLIC_BUS_ENTRIES_SHEET_ID=your_bus_entries_sheet_id</div>
              <div>GOOGLE_SHEETS_API_KEY=your_api_key</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleInitialize}
              disabled={isInitializing || isInitialized}
              className="flex items-center space-x-2"
            >
              {isInitialized ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Initialized</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isInitializing ? "Initializing..." : "Initialize Sheets"}</span>
                </>
              )}
            </Button>

            <Button variant="outline" asChild>
              <a
                href="https://console.developers.google.com/apis/library/sheets.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Enable API</span>
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
