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
      const newSocket = io("http://localhost:4000", {
        auth: {
          token: localStorage.getItem("token"),
        },
      })

      newSocket.on("connect", () => {
        console.log("Connected to socket server")
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

