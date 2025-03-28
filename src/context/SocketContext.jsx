"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState({})
  const [incomingCall, setIncomingCall] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Determine the correct backend URL based on environment
      const SOCKET_URL = import.meta.env.PROD
        ? "https://vercelbackend-forchatapp-production.up.railway.app"
        : "http://localhost:4000"

      // Create socket connection with proper options
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem("token"),
        },
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      })

      newSocket.on("connect", () => {
        console.log("Connected to socket server")
      })

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message)
      })

      newSocket.on("users:online", (users) => {
        setOnlineUsers(users)
      })

      newSocket.on("call:incoming", (data) => {
        console.log("Incoming call:", data)
        setIncomingCall(data)
      })

      newSocket.on("disconnect", () => {
        console.log("Disconnected from socket server")
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [user])

  const value = {
    socket,
    onlineUsers,
    incomingCall,
    setIncomingCall,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

