
import { useState, useEffect } from "react"
import { useSocket } from "../context/SocketContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Phone, Video, X } from "lucide-react"

const IncomingCallNotification = () => {
  const { incomingCall, setIncomingCall, socket } = useSocket()
  const [callerInfo, setCallerInfo] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (incomingCall) {
      fetchCallerInfo(incomingCall.from)
    }
  }, [incomingCall])

  const fetchCallerInfo = async (callerId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:4000/api/users/${callerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCallerInfo(response.data)
    } catch (error) {
      console.error("Failed to fetch caller info:", error)
    }
  }

  const handleAcceptCall = () => {
    if (socket && incomingCall) {
      socket.emit("call:accept", { to: incomingCall.from, signal: "accepted" })

      // Navigate to chat with call parameters
      navigate(`/chat?callTo=${incomingCall.from}&callType=${incomingCall.callType}&incoming=true`)

      // Clear the incoming call
      setIncomingCall(null)
    }
  }

  const handleRejectCall = () => {
    if (socket && incomingCall) {
      socket.emit("call:reject", { to: incomingCall.from })
      setIncomingCall(null)
    }
  }

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md">
        <div className="bg-indigo-600 p-4 text-white text-center">
          <h3 className="text-xl font-semibold">Incoming {incomingCall.callType} Call</h3>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-4">
            {callerInfo?.profilePicture ? (
              <img
                src={`http://localhost:4000${callerInfo.profilePicture}`}
                alt={callerInfo.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-600">{callerInfo?.username?.charAt(0).toUpperCase() || "?"}</span>
            )}
          </div>

          <h4 className="text-lg font-medium mb-1">{callerInfo?.username || "Unknown User"}</h4>
          <p className="text-gray-500 mb-6">is calling you...</p>

          <div className="flex space-x-4">
            <button
              onClick={handleRejectCall}
              className="flex items-center justify-center w-14 h-14 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={handleAcceptCall}
              className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full hover:bg-green-600"
            >
              {incomingCall.callType === "video" ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallNotification

