"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")

      if (token) {
        try {
          const response = await axios.get("http://localhost:4000/api/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          setUser(response.data)
        } catch (error) {
          console.error("Failed to fetch user:", error)
          localStorage.removeItem("token")
        }
      }

      setLoading(false)
    }

    fetchUser()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      })

      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Login failed" }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post("http://localhost:4000/api/auth/register", {
        username,
        email,
        password,
      })

      localStorage.setItem("token", response.data.token)
      setUser(response.data.user)
      return response.data
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

