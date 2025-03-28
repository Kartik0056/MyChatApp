
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import { format } from "date-fns"
import { Link } from "react-router-dom"
// import { ChatIcon, MailIcon, InboxIcon, ArrowLeftIcon } from "@heroicons/react/outline"
import { 
  MessageSquare as ChatIcon, 
  Mail, 
  Inbox, 
  Ban,
  CheckCircle,
  ArrowLeft 
} from "lucide-react";
const REACT_APP_BACKEND_URL = "https://vercelbackend-forchatapp-production.up.railway.app"
const API_BASE_URL = REACT_APP_BACKEND_URL || "http://localhost:4000";


const Dashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_BASE_URL}/api/users/dashboard/data`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setDashboardData(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    const fetchBlockedUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/users/blocked/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        // console.log(response,"this is response"); // Debugging output
        setBlockedUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch blocked users:", error);
      }
    };
    

    fetchDashboardData();
    fetchBlockedUsers();
  }, [])

  const handleUnblockUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/users/unblock/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error("Failed to unblock user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/chat" className="mr-4">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Conversations */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                <ChatIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-gray-500">Total Conversations</p>
                <h2 className="text-2xl font-bold">{dashboardData?.totalConversations || 0}</h2>
              </div>
            </div>
          </div>

          {/* Messages Sent */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <p className="text-gray-500">Messages Sent</p>
                <h2 className="text-2xl font-bold">{dashboardData?.totalMessagesSent || 0}</h2>
              </div>
            </div>
          </div>

          {/* Messages Received */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <p className="text-gray-500">Messages Received</p>
                <h2 className="text-2xl font-bold">{dashboardData?.totalMessagesReceived || 0}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-700">Recent Conversations</h3>
          </div>
          <div className="divide-y">
            {dashboardData?.recentConversations?.length > 0 ? (
              dashboardData.recentConversations.map((conversation) => {
                const otherUser = conversation.participants.find((p) => p._id !== user?._id)

                return (
                  <Link
                    key={conversation._id}
                    to={`/chat?conversationId=${conversation._id}`}
                    className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {otherUser?.profilePicture ? (
                        <img
                          src={`${API_BASE_URL}${otherUser.profilePicture}`}
                          alt={otherUser.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                          {otherUser?.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {otherUser?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{otherUser?.username}</h4>
                        <span className="text-xs text-gray-500">
                          {conversation.updatedAt && format(new Date(conversation.updatedAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage
                          ? conversation.lastMessage.file
                            ? "Sent a file"
                            : conversation.lastMessage.text
                          : "No messages yet"}
                      </p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="p-4 text-center text-gray-500">No recent conversations</div>
            )}
          </div>
        </div>
        
        {/* Blocked Users Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Blocked Users</h3>
          {blockedUsers.length > 0 ? (
            <ul className="divide-y">
              {blockedUsers.map((user) => (
                <li key={user._id} className="flex justify-between items-center py-4">
                  <div className="flex items-center">
                    <Ban className="h-6 w-6 text-red-500 mr-3" />
                    <p className="text-gray-800">{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleUnblockUser(user._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> Unblock
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No blocked users</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

