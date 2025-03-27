
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import { format } from "date-fns"
// import { ArrowLeftIcon, ChatIcon, BanIcon, PhoneIcon, VideoCameraIcon } from "@heroicons/react/outline"
import { 
  ArrowLeft, 
  MessageSquare as ChatIcon, 
  Ban, 
  Phone, 
  Video 
} from "lucide-react";

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")

        // Check if user is blocked
        const blockedResponse = await axios.get("http://localhost:4000/api/users/blocked/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setIsBlocked(blockedResponse.data.some((blockedUser) => blockedUser._id === userId))

        // Fetch user profile
        const profileResponse = await axios.get(`http://localhost:4000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setProfile(profileResponse.data)
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
        setError(error.response?.data?.message || "Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const handleStartChat = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:4000/api/conversations",
        { recipientId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      navigate(`/chat?conversationId=${response.data._id}`)
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }

  const handleBlockUser = async () => {
    try {
      const token = localStorage.getItem("token")

      if (isBlocked) {
        await axios.post(
          `http://localhost:4000/api/users/unblock/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        setIsBlocked(false)
      } else {
        await axios.post(
          `http://localhost:4000/api/users/block/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        setIsBlocked(true)
      }
    } catch (error) {
      console.error("Failed to block/unblock user:", error)
    }
  }

  const handleStartCall = (callType) => {
    navigate(`/chat?callTo=${userId}&callType=${callType}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => navigate(-1)} className="flex items-center text-indigo-500">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 mb-6">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center">
              {profile?.profilePicture ? (
                <img
                  src={`http://localhost:4000${profile.profilePicture}`}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 mb-4">
                  {profile?.username.charAt(0).toUpperCase()}
                </div>
              )}

              <h1 className="text-2xl font-bold text-gray-800">{profile?.username}</h1>
              <p className="text-gray-500 mb-4">{profile?.email}</p>

              <div className="text-sm text-gray-500 mb-6">
                Joined {profile?.createdAt && format(new Date(profile.createdAt), "MMMM yyyy")}
              </div>

              <div className="w-full max-w-md bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-gray-700 font-medium mb-2">Bio</h3>
                <p className="text-gray-600">{profile?.bio || "No bio available"}</p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleStartChat}
                  className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                >
                  <ChatIcon className="h-5 w-5 mr-2" />
                  Message
                </button>

                <button
                  onClick={() => handleStartCall("audio")}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Voice Call
                </button>

                <button
                  onClick={() => handleStartCall("video")}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Video Call
                </button>

                <button
                  onClick={handleBlockUser}
                  className={`flex items-center px-4 py-2 ${
                    isBlocked ? "bg-gray-500 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
                  } text-white rounded-md transition-colors`}
                >
                  <Ban className="h-5 w-5 mr-2" />
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

