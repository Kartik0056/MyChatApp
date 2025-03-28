
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import { useNavigate, useLocation } from "react-router-dom"
import { format } from "date-fns"
import axios from "axios"
import CallInterface from "../components/CallInterface"
import {
  Paperclip,
  Send,
  Search,
  X,
  User,
  Settings,
  Phone,
  Video,
  MoreVertical,
  Trash,
  LogOut,
  BarChart,
} from "lucide-react"
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const Chat = () => {
  const { user, logout } = useAuth()
  const { socket, onlineUsers } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCallInterface, setShowCallInterface] = useState(false)
  const [callData, setCallData] = useState(null)
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)
useEffect(()=>{
  const currentUser = async() =>{
    try{
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_BASE_URL}/api/users/me`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(response,"this is current user response")
      setCurrentUser(response.data)
    }
    catch(error) {
      console.log("Have some error in fatching data", error)
    }
  }
  currentUser();
},[])
  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Check for call parameters in URL
  useEffect(() => {
    const callTo = queryParams.get("callTo")
    const callType = queryParams.get("callType")
    const conversationId = queryParams.get("conversationId")

    if (callTo && callType) {
      setCallData({ callTo, callType })
      setShowCallInterface(true)
    }

    if (conversationId) {
      // Find and select the conversation
      const conversation = conversations.find((c) => c._id === conversationId)
      if (conversation) {
        setSelectedConversation(conversation)
      }
    }
  }, [queryParams, conversations])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_BASE_URL}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setConversations(response.data)

        // Select first conversation if none is selected
        if (response.data.length > 0 && !selectedConversation) {
          const conversationId = queryParams.get("conversationId")
          if (conversationId) {
            const conversation = response.data.find((c) => c._id === conversationId)
            if (conversation) {
              setSelectedConversation(conversation)
            } else {
              setSelectedConversation(response.data[0])
            }
          } else {
            setSelectedConversation(response.data[0])
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error)
      }
    }

    if (user) {
      fetchConversations()
    }
  }, [user, queryParams])

  // Fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return

      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(
          `${API_BASE_URL}/api/messages/${selectedConversation._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        setMessages(response.data)

        // Join conversation room for real-time updates
        if (socket) {
          socket.emit("conversation:join", selectedConversation._id)
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      }
    }

    fetchMessages()

    // Leave conversation room when changing conversations
    return () => {
      if (socket && selectedConversation) {
        socket.emit("conversation:leave", selectedConversation._id)
      }
    }
  }, [selectedConversation, socket])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Listen for new messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message) => {
      if (selectedConversation && message.conversation === selectedConversation._id) {
        setMessages((prevMessages) => [...prevMessages, message])
      }

      // Update last message in conversations list
      setConversations((prevConversations) =>
        prevConversations.map((conv) => {
          if (conv._id === message.conversation) {
            return { ...conv, lastMessage: message }
          }
          return conv
        }),
      )
    }

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, selectedConversation])

  const handleSendMessage = async (e) => {
    e.preventDefault();
  
    if ((!messageInput.trim() && !file) || !selectedConversation) return;
  
    setLoading(true);
  
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
  
      if (messageInput.trim()) {
        formData.append("text", messageInput);
      }
  
      if (file) {
        formData.append("file", file);
      }
  
      const response = await axios.post(
        `${API_BASE_URL}/api/messages/${selectedConversation._id}/messages`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      const newMessage = response.data; // Get the sent message
  
      // Emit the new message event using Socket.io
      socket.emit("message:new", newMessage);
  
      // Update UI instantly
      setMessages((prevMessages) => [...prevMessages, newMessage]);
  
      // Clear input
      setMessageInput("");
      setFile(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleFileClick = () => {
    fileInputRef.current.click()
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`${API_BASE_URL}/api/users/search?query=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSearchResults(response.data)
    } catch (error) {
      console.error("Failed to search users:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const startConversation = async (userId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `${API_BASE_URL}/api/conversations`,
        { recipientId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Add the new conversation to the list if it's not already there
      if (!conversations.find((c) => c._id === response.data._id)) {
        setConversations([response.data, ...conversations])
      }

      // Select the conversation
      setSelectedConversation(response.data)

      // Clear search
      setSearchQuery("")
      setSearchResults([])
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }

  const deleteConversation = async () => {
    if (!selectedConversation) return

    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_BASE_URL}/api/messages/${selectedConversation._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Remove conversation from list
      setConversations(conversations.filter((c) => c._id !== selectedConversation._id))

      // Select another conversation if available
      if (conversations.length > 1) {
        const nextConversation = conversations.find((c) => c._id !== selectedConversation._id)
        setSelectedConversation(nextConversation)
      } else {
        setSelectedConversation(null)
      }

      setShowDropdown(false)
    } catch (error) {
      console.error("Failed to delete conversation:", error)
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_BASE_URL}/api/messages/${messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Remove message from list
      setMessages(messages.filter((m) => m._id !== messageId))
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
  }

  const handleStartCall = (callType) => {
    if (!selectedConversation) return

    const otherUser = getOtherUser(selectedConversation)
    setCallData({ callTo: otherUser._id, callType })
    setShowCallInterface(true)
    setShowDropdown(false)
  }

  const handleEndCall = () => {
    setShowCallInterface(false)
    setCallData(null)

    // Remove call parameters from URL
    navigate("/chat")
  }

  const getLastSeen = (userId) => {
    if (!userId) return "Offline"

    const user = onlineUsers[userId]
    if (!user) return "Offline"

    if (user.online) return "Online"

    return `Last seen ${format(new Date(user.lastSeen), "MMM d, h:mm a")}`
  }

  const getOtherUser = (conversation) => {
    if (!conversation || !conversation.participants) return {}
    return conversation.participants.find((p) => p._id !== user?._id) || {}
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    } catch (error) {
      console.error("Failed to logout:", error)
    } finally {
      logout()
      navigate("/login")
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
          <div className="p-4 border-b bg-white flex items-center">
      {/* Profile Picture */}
      <div className="relative">
        {currentUser?.profilePicture ? (
          <img
            src={`${API_BASE_URL}${currentUser.profilePicture}`}
            alt={currentUser.username}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      </div>

      {/* Username */}
      <div className="ml-3">
        <h2 className="text-lg font-semibold">{currentUser?.username || "Loading..."}</h2>
        <p className="text-sm text-gray-500">Online</p>
      </div>
    </div>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        navigate("/profile")
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Settings className="h-5 w-5 mr-2 text-gray-500" />
                      Profile Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        navigate("/dashboard")
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <BarChart className="h-5 w-5 mr-2 text-gray-500" />
                      Dashboard
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="h-5 w-5 mr-2 text-red-500" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                  onClick={() => {
                    setSearchQuery("")
                    setSearchResults([])
                  }}
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="mt-2 w-full p-2 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="p-4 border-b">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Search Results</h2>
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="p-2 border-b cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => startConversation(user._id)}
              >
                <div className="flex items-center">
                  {user.profilePicture ? (
                    <img
                      src={`${API_BASE_URL}${user.profilePicture}`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button className="text-indigo-500 hover:text-indigo-700">
                  <Send className="h-5 w-5 transform rotate-90" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Conversations list */}
        <div className="overflow-y-auto flex-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const isOnline = onlineUsers[otherUser?._id]?.online

              return (
                <div
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?._id === conversation._id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      {otherUser?.profilePicture ? (
                        <img
                          src={`${API_BASE_URL}${otherUser.profilePicture}`}
                          alt={otherUser.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                          {otherUser?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-medium">{otherUser?.username}</h2>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(conversation.lastMessage.createdAt), "h:mm a")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage
                          ? conversation.lastMessage.file
                            ? "Sent a file"
                            : conversation.lastMessage.callType !== "none"
                              ? `${conversation.lastMessage.callType === "audio" ? "Audio" : "Video"} call`
                              : conversation.lastMessage.text
                          : "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm">Search for users to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="relative cursor-pointer"
                    onClick={() => navigate(`/user/${getOtherUser(selectedConversation)._id}`)}
                  >
                    {getOtherUser(selectedConversation)?.profilePicture ? (
                      <img
                        src={`${API_BASE_URL}${getOtherUser(selectedConversation).profilePicture}`}
                        alt={getOtherUser(selectedConversation).username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                        {getOtherUser(selectedConversation)?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {onlineUsers[getOtherUser(selectedConversation)?._id]?.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-medium">{getOtherUser(selectedConversation)?.username}</h2>
                    <p className="text-xs text-gray-500">{getLastSeen(getOtherUser(selectedConversation)?._id)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartCall("audio")}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Voice Call"
                  >
                    <Phone className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleStartCall("video")}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Video Call"
                  >
                    <Video className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigate(`/user/${getOtherUser(selectedConversation)._id}`)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="View Profile"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={deleteConversation}
                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            <Trash className="h-5 w-5 mr-2 text-red-500" />
                            Delete Conversation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isOwnMessage = message.sender === user?._id

                  // Skip deleted messages
                  if (message.isDeleted) return null

                  // Handle call messages
                  if (message.callType !== "none") {
                    return (
                      <div key={message._id} className="flex justify-center my-4">
                        <div className="bg-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                          {`${isOwnMessage ? "You" : getOtherUser(selectedConversation)?.username} initiated a ${message.callType} call`}
                          {message.callStatus === "accepted" &&
                            ` • ${Math.floor(message.callDuration / 60)}:${(message.callDuration % 60).toString().padStart(2, "0")}`}
                          {message.callStatus === "rejected" && " • Declined"}
                          {message.callStatus === "ended" && " • Ended"}
                          {message.callStatus === "initiated" && " • Missed"}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={message._id} className={`mb-4 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div className="group relative">
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            isOwnMessage ? "bg-indigo-500 text-white" : "bg-white text-gray-800"
                          }`}
                        >
                          {message.text && <p>{message.text}</p>}

                          {message.file && (
                            <div className="mt-2">
                              {message.file.mimetype.startsWith("image/") ? (
                                <img
                                  src={`${API_BASE_URL}/uploads/${message.file.filename}`}
                                  alt="Shared image"
                                  className="max-w-full rounded"
                                />
                              ) : (
                                <a
                                  href={`http://localhost:4000/uploads/${message.file.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm underline"
                                >
                                  <Paperclip className="w-4 h-4 mr-1" />
                                  {message.file.originalname}
                                </a>
                              )}
                            </div>
                          )}

                          <div className={`text-xs mt-1 ${isOwnMessage ? "text-indigo-200" : "text-gray-500"}`}>
                            {format(new Date(message.createdAt), "h:mm a")}
                          </div>
                        </div>

                        {/* Delete button for own messages */}
                        {isOwnMessage && (
                          <button
                            onClick={() => deleteMessage(message._id)}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 bg-white border-t">
              {file && (
                <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
                  <span className="text-sm truncate">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-red-500 text-sm">
                    Remove
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center">
                <button type="button" onClick={handleFileClick} className="p-2 text-gray-500 hover:text-gray-700">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-l focus:outline-none "
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || (!messageInput.trim() && !file)}
                  className="p-2 bg-indigo-500 text-white rounded-r hover:bg-indigo-600 disabled:bg-indigo-300"
                >
                  <Send className="w-5 h-5 transform" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-600">Select a conversation</h2>
              <p className="text-gray-500">Choose a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Call interface */}
      {showCallInterface && callData && (
        <CallInterface callTo={callData.callTo} callType={callData.callType} onEndCall={handleEndCall} />
      )}
    </div>
  )
}

export default Chat

