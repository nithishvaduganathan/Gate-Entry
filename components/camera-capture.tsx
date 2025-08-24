"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X } from "lucide-react"

interface CameraCaptureProps {
  onPhotoCapture: (photoBlob: Blob) => void
  onClose: () => void
}

export default function CameraCapture({ onPhotoCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => {
        console.error("[v0] Video play error:", err)
        setError("Failed to start video preview")
      })
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Starting camera...")

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Changed facingMode from "user" to "environment" to use back camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      console.log("[v0] Camera stream obtained:", mediaStream)
      setStream(mediaStream)
    } catch (error) {
      console.error("[v0] Error accessing camera:", error)
      setError("Unable to access camera. Please check permissions and try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      console.log("[v0] Stopping camera stream")
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      console.log("[v0] Capturing photo, video dimensions:", video.videoWidth, video.videoHeight)

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const dataURL = canvas.toDataURL("image/jpeg", 0.8)
        console.log("[v0] Photo captured successfully")
        setCapturedPhoto(dataURL)
        stopCamera()
      } else {
        console.error("[v0] Cannot capture photo - video not ready")
        setError("Camera not ready. Please wait and try again.")
      }
    }
  }, [stopCamera])

  const confirmPhoto = useCallback(() => {
    if (capturedPhoto && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            onPhotoCapture(blob)
            onClose()
          }
        },
        "image/jpeg",
        0.8,
      )
    }
  }, [capturedPhoto, onPhotoCapture, onClose])

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null)
    startCamera()
  }, [startCamera])

  const handleClose = useCallback(() => {
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  const handleVideoLoadedMetadata = () => {
    console.log("[v0] Video metadata loaded")
  }

  const handleVideoCanPlay = () => {
    console.log("[v0] Video can play")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
              {!stream && !capturedPhoto && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera className="w-12 h-12 mb-4 opacity-50" />
                  {error && <p className="text-red-400 text-sm mb-4 text-center px-4">{error}</p>}
                  <Button onClick={startCamera} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                    {isLoading ? "Starting Camera..." : "Start Camera"}
                  </Button>
                </div>
              )}

              {stream && !capturedPhoto && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onCanPlay={handleVideoCanPlay}
                />
              )}

              {capturedPhoto && (
                <img src={capturedPhoto || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
              )}
            </div>

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {stream && !capturedPhoto && (
                <>
                  <Button onClick={handleClose} variant="outline" size="lg">
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-5 h-5 mr-2" />
                    Capture
                  </Button>
                </>
              )}

              {capturedPhoto && (
                <>
                  <Button onClick={retakePhoto} variant="outline" size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retake
                  </Button>
                  <Button onClick={confirmPhoto} size="lg" className="bg-green-600 hover:bg-green-700">
                    <Check className="w-5 h-5 mr-2" />
                    Use Photo
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
