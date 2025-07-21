import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, ApiError } from '../lib/api'

export interface StudentRegistrationData {
  email: string
  familyName: string
  firstName: string
  city: string
  whatsappNumber: string
  bestCallTime: string
  educationLevel: string
  baccalaureatGrade: string
  interestedOffer: string
  studyBudget: string
  howFoundUs: string
  studyFinancing: string
  currentLanguageLevel: string
  password: string
}

interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'tutor' | 'admin' | 'school'
  avatar_url?: string
  // Erweiterte Felder für Studenten
  familyName?: string
  firstName?: string
  city?: string
  whatsappNumber?: string
  bestCallTime?: string
  educationLevel?: string
  baccalaureatGrade?: string
  interestedOffer?: string
  studyBudget?: string
  howFoundUs?: string
  studyFinancing?: string
  currentLanguageLevel?: string
  // Erweiterte Felder für Schulen
  schoolId?: number
  address?: string
  phone?: string
  description?: string
  // Erweiterte Felder für Admins
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  handleAuthentication: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>
  registerStudent: (data: StudentRegistrationData) => Promise<boolean>
  isLoading: boolean
  hasRole: (role: string) => boolean
  canAccessAdminPanel: () => boolean
  canManageSchool: (schoolId?: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing authentication token
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token')
      console.log('Checking auth on page load, token exists:', !!token)
      if (token) {
        try {
          authApi.setToken(token)
          console.log('Calling /auth/profile to validate token...')
          const response = await authApi.me() as any
          console.log('Profile response:', response)
          setUser(response.user || response)
          console.log('User set successfully')
        } catch (error) {
          console.error('Token validation failed:', error)
          // Token is invalid, remove it
          localStorage.removeItem('auth_token')
          localStorage.removeItem('germansphere_user')
          authApi.setToken(null)
          console.log('Token removed from localStorage')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthentication = async (accessToken: string, refreshToken: string) => {
    setIsLoading(true);
    try {
      // 1. Store tokens
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      authApi.setToken(accessToken);

      // 2. Fetch user profile
      const response = await authApi.me() as any;
      setUser(response.user || response);
      localStorage.setItem('germansphere_user', JSON.stringify(response.user || response));
      
      console.log('User authenticated successfully via callback');
    } catch (error) {
      console.error('Failed to handle authentication callback:', error);
      // Clean up on error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('germansphere_user');
      authApi.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // 1. Call backend API
      const response = await authApi.login({ email, password })
      
      // Debug: Log the response to see what we're getting
      console.log('Login response:', response)
      console.log('Access token:', response.access_token)
      
      // 2. Store JWT token - ensure it's stored correctly
      const token = response.access_token
      if (token) {
        localStorage.setItem('auth_token', token)
        authApi.setToken(token)
        console.log('Token stored successfully')
      } else {
        console.error('No access token received from backend')
      }
      
      // 3. Store user object in localStorage
      localStorage.setItem('germansphere_user', JSON.stringify(response.user))
      
      setUser(response.user)
      setIsLoading(false)
      return true
    } catch (err) {
      console.error('Login error:', err)
      setIsLoading(false)
      return false
    }
  }

  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.register({ name, email, password, role })
      
      // Set the token for future requests - ensure it's stored correctly
      const token = response.access_token
      localStorage.setItem('auth_token', token)
      authApi.setToken(token)
      
      // Store the user data
      setUser(response.user)
      localStorage.setItem('germansphere_user', JSON.stringify(response.user))
      
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Registration error:', error)
      setIsLoading(false)
      return false
    }
  }

  const registerStudent = async (data: StudentRegistrationData): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Create registration payload with student-specific data
      const registrationData = {
        name: `${data.firstName} ${data.familyName}`,
        email: data.email,
        password: data.password,
        role: 'student',
        // Additional student data
        ...data
      }
      
      const response = await authApi.register(registrationData)
      
      // Set the token for future requests - ensure it's stored correctly
      const token = response.access_token
      localStorage.setItem('auth_token', token)
      authApi.setToken(token)
      
      // Store the user data with additional fields
      const userWithExtras = {
        ...response.user,
        familyName: data.familyName,
        firstName: data.firstName,
        city: data.city,
        whatsappNumber: data.whatsappNumber,
        bestCallTime: data.bestCallTime,
        educationLevel: data.educationLevel,
        baccalaureatGrade: data.baccalaureatGrade,
        interestedOffer: data.interestedOffer,
        studyBudget: data.studyBudget,
        howFoundUs: data.howFoundUs,
        studyFinancing: data.studyFinancing,
        currentLanguageLevel: data.currentLanguageLevel
      }
      
      setUser(userWithExtras)
      localStorage.setItem('germansphere_user', JSON.stringify(userWithExtras))
      
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Student registration error:', error)
      setIsLoading(false)
      return false
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const canAccessAdminPanel = (): boolean => {
    return user?.role === 'admin'
  }

  const canManageSchool = (schoolId?: number): boolean => {
    if (user?.role === 'admin') return true
    if (user?.role === 'school') {
      return schoolId ? user.schoolId === schoolId : true
    }
    return false
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clean up local state regardless of API call success
      setUser(null)
      authApi.setToken(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('germansphere_user')
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    handleAuthentication,
    logout,
    register,
    registerStudent,
    isLoading,
    hasRole,
    canAccessAdminPanel,
    canManageSchool
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
