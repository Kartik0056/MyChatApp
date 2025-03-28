"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
console.log("Backend API URL:", API_BASE_URL); 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")

      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
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

