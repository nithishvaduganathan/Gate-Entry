"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, Volume2, X } from "lucide-react"
import type SpeechRecognition from "speech-recognition"

interface SpeechInputProps {
  onTranscript: (text: string, field: string) => void
  onClose: () => void
}

export default function SpeechInput({ onTranscript, onClose }: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [selectedField, setSelectedField] = useState<string>("name")
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "en-IN" // Indian English

        recognitionInstance.onresult = (event) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(finalTranscript + interimTranscript)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        recognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
          if (event.error === "not-allowed") {
            alert("Microphone access denied. Please allow microphone permissions.")
          }
        }

        setRecognition(recognitionInstance)
        setIsSupported(true)
      } else {
        setIsSupported(false)
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript("")
      recognition.start()
      setIsListening(true)
    }
  }, [recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition, isListening])

  const useTranscript = useCallback(() => {
    if (transcript.trim()) {
      onTranscript(transcript.trim(), selectedField)
      onClose()
    }
  }, [transcript, selectedField, onTranscript, onClose])

  const clearTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MicOff className="w-5 h-5 mr-2" />
              Speech Recognition Not Supported
            </CardTitle>
            <CardDescription>Your browser doesn't support speech recognition. Please use manual input.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Voice Input
          </CardTitle>
          <CardDescription>Select a field and speak to fill it automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Field Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Field:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedField === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedField("name")}
              >
                Name
              </Button>
              <Button
                variant={selectedField === "phone" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedField("phone")}
              >
                Phone
              </Button>
              <Button
                variant={selectedField === "purpose" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedField("purpose")}
                className="col-span-2"
              >
                Purpose
              </Button>
            </div>
          </div>

          {/* Transcript Display */}
          <div className="min-h-[100px] p-3 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-2">
              {isListening ? "Listening..." : "Transcript will appear here"}
            </div>
            <div className="text-sm">{transcript || ""}</div>
          </div>

          {/* Controls */}
          <div className="flex space-x-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              className="flex-1"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>

            {transcript && (
              <Button onClick={clearTranscript} variant="outline">
                Clear
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={useTranscript}
              disabled={!transcript.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Use Text
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
