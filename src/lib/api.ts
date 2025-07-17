// API Configuration and Service Layer
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'


// Types for API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface School {
  id: number
  uuid: string
  name: string
  description?: string
  location: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  certifications?: string[]
  features?: string[]
  rating: number
  review_count: number
  image_url?: string
  is_verified: boolean
  created_at: string
}

export interface Course {
  id: number
  uuid: string
  title: string
  description?: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  category: 'general' | 'business' | 'exam_prep' | 'conversation'
  price: number
  currency: string
  duration_weeks?: number
  hours_per_week?: number
  max_students?: number
  enrolled_students: number
  start_date: string
  end_date?: string
  schedule?: string
  is_online: boolean
  image_url?: string
  school_id: number
  school_name?: string
  school_location?: string
  school_rating?: number
  school_image?: string
  created_at: string
}

export interface Tutor {
  photo: string
  id: number
  bio?: string
  experience_years: number
  hourly_rate: number
  currency: string
  specializations: string[]
  languages: string[]
  certifications?: string[]
  rating: number
  review_count: number
  total_students: number
  total_hours: number
  availability?: Record<string, any>
  is_verified: boolean
  created_at: string
  user_id: number
  name: string
  email: string
  avatar_url?: string
  location?: string
}

export interface VisaService {
  id: number
  name: string
  description?: string
  price: number
  currency: string
  processing_time?: string
  required_documents?: string[]
  features?: string[]
  is_active: boolean
}

export interface Booking {
  id: number
  uuid: string
  user_id: number
  course_id?: number
  tutor_id?: number
  start_date: string
  end_date?: string
  time_slot?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_price: number
  currency: string
  notes?: string
  created_at: string
}

export interface CourseBooking {
  id: number
  uuid: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  start_date: string
  end_date?: string
  time_slot?: string
  duration_minutes?: number
  total_price: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  meeting_link?: string
  is_recurring: boolean
  recurring_pattern?: string
  created_at: string
  updated_at: string
  // Course information
  course_id: number
  course_title: string
  course_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  course_description?: string
  course_price: number
  duration_weeks?: number
  hours_per_week?: number
  max_students?: number
  enrolled_students: number
  course_start_date: string
  course_end_date?: string
  schedule?: string
  is_online: boolean
  course_image?: string
  // School information
  school_id: number
  school_name: string
  school_location: string
  school_address?: string
  school_phone?: string
  school_email?: string
  school_rating: number
  school_image?: string
  // Tutor information (if available)
  tutor_id?: number
  tutor_name?: string
  tutor_email?: string
  tutor_rate?: number
  tutor_bio?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  user: {
    id: number
    name: string
    email: string
    role: 'student' | 'tutor' | 'school' | 'admin'
    avatar_url?: string
  }
}

export interface Notification {
  id: number;
  uuid: string;
  sender_id: number;
  recipient_id: number;
  subject: string;
  message: string;
  is_read: boolean;
  message_type: string;
  related_booking_id?: number;
  created_at: string;
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// HTTP client with error handling
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Always get the latest token from localStorage
    const latestToken = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {})
    }

    // Only set Content-Type to application/json if not already set and not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (latestToken) {
      headers.Authorization = `Bearer ${latestToken}`
    }

    const config: RequestInit = {
      ...options,
      headers
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorCode = ''
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          errorCode = errorData.code || ''
        } catch {
          // If response is not JSON, use status text
        }
        
        throw new ApiError(errorMessage, response.status, errorCode)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error - unable to connect to server', 0, 'NETWORK_ERROR')
      }
      
      throw new ApiError('Unexpected error occurred', 500, 'UNKNOWN_ERROR')
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    console.log('API GET request:', endpoint, params); // Add this line for debugging
    const url = new URL(endpoint, this.baseURL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return this.request<T>(url.pathname + url.search)
  }

  async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {
      ...((customHeaders as Record<string, string>) || {})
    }

    // Always get the latest token from localStorage
    const latestToken = localStorage.getItem('auth_token');
    if (latestToken) {
      headers.Authorization = `Bearer ${latestToken}`;
    }

    // Don't set Content-Type for FormData, let browser handle it
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    })
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL)

// API Services
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<AuthTokens>('/auth/login', credentials),
  
  register: (data: { name: string; email: string; password: string; role: string }) =>
    apiClient.post<AuthTokens>('/auth/register', data),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  me: () =>
    apiClient.get('/auth/profile'),
  
  setToken: (token: string | null) => apiClient.setToken(token)
}

export const schoolsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    location?: string
    rating?: number
    search?: string
  }) =>
    apiClient.get<{ schools: School[]; pagination: any }>('/schools', params),
  
  getById: (id: number) =>
    apiClient.get<{ school: School; courses: Course[]; reviews: any[] }>(`/schools/${id}`),
  
  create: (data: Partial<School>) =>
    apiClient.post<{ school: School }>('/schools', data),
  
  update: (id: number, data: Partial<School>) =>
    apiClient.put<{ school: School }>(`/schools/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/schools/${id}`),
  
  getByUserId: (userId: number) =>
    apiClient.get<{ school: School }>(`/schools/by-user/${userId}`)
}

export const coursesApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    level?: string
    category?: string
    school_id?: number
    tutor_id?: number
    min_price?: number
    max_price?: number
    is_online?: boolean
    search?: string
  }) =>
    apiClient.get<{ courses: Course[]; pagination: any }>('/courses', params),
  
  getById: (id: number) =>
    apiClient.get<{ course: Course; similarCourses: Course[] }>(`/courses/${id}`),
  
  create: (data: Partial<Course>) =>
    apiClient.post<{ course: Course }>('/courses', data),
  
  update: (id: number, data: Partial<Course>) =>
    apiClient.put<{ course: Course }>(`/courses/${id}`, data),
  
  delete: (id: number) =>
    apiClient.delete(`/courses/${id}`),
  
  createTutorCourse: (data: any) =>
    apiClient.post<{ course: Course }>('/courses/tutor', data),
  
  deleteTutorCourse: (id: number) =>
    apiClient.delete<{ message: string }>(`/courses/tutor/${id}`)
}

export const tutorsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    min_rate?: number
    max_rate?: number
    specialization?: string
    rating?: number
    search?: string
  }) =>
    apiClient.get<{ tutors: Tutor[]; pagination: any }>('/tutors', params),
  
  getById: (id: number) =>
    apiClient.get<{ tutor: Tutor; reviews: any[]; bookedSlots: any[]; courses: Course[] }>(`/tutors/${id}`),
  
  registerTutor: (data: any) =>
    apiClient.post<{ tutor: Tutor; user: any }>('/tutors/register', data),
  
  createProfile: (data: Partial<Tutor>) =>
    apiClient.post<{ tutor: Tutor }>('/tutors/profile', data),
  
  updateProfile: (data: Partial<Tutor>) =>
    apiClient.put<{ tutor: Tutor }>('/tutors/profile', data),
  
  updateAvailability: (data: any) =>
    apiClient.put('/tutors/availability', data),
  
  getByUserId: (userId: number) =>
    apiClient.get<{ tutor: Tutor }>(`/tutors/by-user/${userId}`),
  
  uploadProfileDocuments: (formData: FormData) =>
    apiClient.post<{ success: boolean; photo: string; cv: string; certificates: string[] }>('/tutors/profile-documents', formData)
}

export const visaApi = {
  getAll: () =>
    apiClient.get<{ services: VisaService[] }>('/visa'),
  
  getById: (id: number) =>
    apiClient.get<{ service: VisaService }>(`/visa/${id}`),
  
  apply: (serviceId: number, data: any) =>
    apiClient.post(`/visa/${serviceId}/apply`, data)
}

export const bookingsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ bookings: Booking[]; pagination: any }>('/bookings', params),
  
  getById: (id: number) =>
    apiClient.get<{ booking: Booking }>(`/bookings/${id}`),
  
  create: (data: Partial<Booking>) =>
    apiClient.post<{ booking: Booking }>('/bookings', data),
  
  update: (id: number, data: Partial<Booking>) =>
    apiClient.put<{ booking: Booking }>(`/bookings/${id}`, data),
  
  updateStatus: async (id: number, status: string) => {
    const url = `${API_BASE_URL}/bookings/${id}/status`;
    const token = localStorage.getItem('auth_token');
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || errorData.message || 'Status update failed', response.status);
    }
    return response.json();
  },
  
  cancel: (id: number) =>
    apiClient.delete(`/bookings/${id}`),
  
  getStudentCourses: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ courseBookings: CourseBooking[]; pagination: any }>('/bookings/student/courses', params),
  
  getTutorNotifications: (params?: { is_read?: boolean }) =>
    apiClient.get<{ notifications: Notification[] }>('/bookings/notifications', params)
}

export const paymentsApi = {
  createIntent: (data: { amount: number; currency: string; booking_id?: number }) =>
    apiClient.post('/payments/create-intent', data),
  
  confirm: (data: { payment_intent_id: string; payment_method_id: string }) =>
    apiClient.post('/payments/confirm', data),
  
  getHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/payments/history', params)
}

// Export API client for advanced usage
export { apiClient }

// Health check utility
export const healthCheck = () =>
  fetch(`${API_BASE_URL.replace('/api', '')}/health`)
    .then(res => res.json())
    .catch(() => ({ status: 'ERROR', message: 'Server unreachable' })) 