
import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSocket } from "../context/SocketContext"
import { useAuth } from "../context/AuthContext"
import axios from "axios"

import {
  Phone,
  Mic,
  Video,
  X,
  MicOff,
  VideoOff,
} from "lucide-react"
const CallInterface = ({ callTo, callType, onEndCall }) => {
  const { socket } = useSocket()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const isIncoming = queryParams.get("incoming") === "true"

  const [callStatus, setCallStatus] = useState(isIncoming ? "connected" : "initiating")
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio")
  const [callerStream, setCallerStream] = useState(null)
  const [receiverStream, setReceiverStream] = useState(null)
  const [callData, setCallData] = useState(null)
  const [receiverInfo, setReceiverInfo] = useState(null)

  const callerVideo = useRef()
  const receiverVideo = useRef()
  const callTimerRef = useRef()
  const callStartTimeRef = useRef()

  // Fetch receiver info
  useEffect(() => {
    const fetchReceiverInfo = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`http://localhost:4000/api/users/${callTo}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setReceiverInfo(response.data)
      } catch (error) {
        console.error("Failed to fetch receiver info:", error)
      }
    }

    if (callTo) {
      fetchReceiverInfo()
    }
  }, [callTo])

  // Initialize media stream for local preview
  useEffect(() => {
    const getMedia = async () => {
      try {
        const constraints = {
          audio: true,
          video: callType === "video",
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setCallerStream(stream)

        if (callerVideo.current) {
          callerVideo.current.srcObject = stream
        }

        // If this is an outgoing call, initiate it
        if (!isIncoming) {
          setCallStatus("ringing")
          createCallMessage()

          // Notify the other user about the call
          if (socket && callTo) {
            socket.emit("call:signal", {
              to: callTo,
              signal: "calling",
              callType,
            })
          }
        } else {
          // If this is an incoming call that was accepted, start the timer
          setCallStatus("connected")
          startCallTimer()
        }
      } catch (error) {
        console.error("Error accessing media devices:", error)
      }
    }

    getMedia()

    return () => {
      // Clean up streams when component unmounts
      if (callerStream) {
        callerStream.getTracks().forEach((track) => track.stop())
      }
      if (receiverStream) {
        receiverStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [callType, isIncoming, socket, callTo])

  // Socket event listeners for call status updates
  useEffect(() => {
    if (!socket) return

    // Handle call accepted
    socket.on("call:accepted", ({ from }) => {
      console.log("Call accepted by:", from)
      setCallStatus("connected")
      startCallTimer()
    })

    // Handle call rejected
    socket.on("call:rejected", () => {
      console.log("Call rejected")
      setCallStatus("ended")
      endCall("rejected")
    })

    // Handle call ended
    socket.on("call:ended", () => {
      console.log("Call ended by other user")
      setCallStatus("ended")
      endCall("ended")
    })

    return () => {
      socket.off("call:accepted")
      socket.off("call:rejected")
      socket.off("call:ended")
    }
  }, [socket])

  const createCallMessage = async () => {
    try {
      const token = localStorage.getItem("token")

      // First create or get conversation
      const convResponse = await axios.post(
        "http://localhost:4000/api/conversations",
        { recipientId: callTo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Then create call message
      const msgResponse = await axios.post(
        `http://localhost:4000/api/conversations/${convResponse.data._id}/messages`,
        {
          text: `${callType === "audio" ? "Audio" : "Video"} call`,
          callType: callType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setCallData({
        conversationId: convResponse.data._id,
        messageId: msgResponse.data._id,
      })
    } catch (error) {
      console.error("Failed to create call message:", error)
    }
  }

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now()
    callTimerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      setCallDuration(duration)
    }, 1000)
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleMute = () => {
    if (callerStream) {
      callerStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (callType === "video" && callerStream) {
      callerStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const endCall = async (status = "ended") => {
    // Stop timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }

    // Stop streams
    if (callerStream) {
      callerStream.getTracks().forEach((track) => track.stop())
    }
    if (receiverStream) {
      receiverStream.getTracks().forEach((track) => track.stop())
    }

    // Update call status in database
    if (callData) {
      try {
        const token = localStorage.getItem("token")
        await axios.put(
          `http://localhost:4000/api/messages/${callData.messageId}/call-status`,
          {
            status: status,
            duration: callDuration,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      } catch (error) {
        console.error("Failed to update call status:", error)
      }
    }

    // Emit call end event
    if (socket && callTo) {
      socket.emit("call:end", { to: callTo })
    }

    // Call the onEndCall callback
    if (onEndCall) {
      onEndCall()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-4xl">
        <div className="p-4 bg-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white mr-3">
              {receiverInfo?.profilePicture ? (
                <img
                  src={`http://localhost:4000${receiverInfo.profilePicture}`}
                  alt={receiverInfo.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                receiverInfo?.username?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div>
              <h3 className="text-white font-medium">{receiverInfo?.username || "User"}</h3>
              <p className="text-gray-400 text-sm">
                {callStatus === "initiating" && "Initiating call..."}
                {callStatus === "ringing" && "Ringing..."}
                {callStatus === "connected" && formatCallDuration(callDuration)}
                {callStatus === "ended" && "Call ended"}
              </p>
            </div>
          </div>
          <button onClick={() => endCall()} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative">
          {/* Main video/audio area */}
          <div className="w-full h-[60vh] bg-gray-800 flex items-center justify-center">
            {callType === "video" ? (
              <div className="w-full h-full flex items-center justify-center">
                {callStatus === "connected" ? (
                  <div className="text-white text-center">
                    <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center mb-4">
                      <span className="text-4xl text-white">
                        {receiverInfo?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <p>Video call connected</p>
                    <p className="text-gray-400">
                      {isIncoming ? "You accepted this call" : "Call connected successfully"}
                    </p>
                  </div>
                ) : (
                  <div className="text-white text-center">
                    <div className="animate-pulse mb-4">
                      <Phone className="h-16 w-16 mx-auto text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-medium">
                      {callStatus === "ringing" ? `Calling ${receiverInfo?.username || "User"}...` : "Connecting..."}
                    </h3>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center mb-4">
                  <span className="text-4xl text-white">{receiverInfo?.username?.charAt(0).toUpperCase() || "U"}</span>
                </div>
                <p className="text-white">{callStatus === "connected" ? "Call connected" : "Calling..."}</p>
              </div>
            )}
          </div>

          {/* Self video (small) */}
          {callType === "video" && callerStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
              <video ref={callerVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <span className="text-white text-lg">Camera Off</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800 flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMuted ? "bg-red-500 text-white" : "bg-gray-600 text-white"
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            onClick={() => endCall()}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <Phone className="h-8 w-8 transform rotate-135" />
          </button>

          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVideoOff ? "bg-red-500 text-white" : "bg-gray-600 text-white"
              }`}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallInterface

