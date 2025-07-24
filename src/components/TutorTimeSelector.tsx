import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Clock, Calendar, Star, Users, Zap } from 'lucide-react'
import { apiClient } from '../lib/api'

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  [key: string]: DaySchedule
}

interface Availability {
  weeklySchedule: WeeklySchedule
  exceptions: any[]
}

interface TutorTimeSelectorProps {
  tutorId: number
  selectedDate: string
  selectedTime: string
  onTimeChange: (time: string) => void
  className?: string
  studentBookedSlots?: string[] // Add this prop
}

const DAYS_MAP = {
  0: 'sunday',
  1: 'monday', 
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
}

const DAYS_GERMAN = {
  sunday: 'Sonntag',
  monday: 'Montag',
  tuesday: 'Dienstag', 
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag'
}

export const TutorTimeSelector: React.FC<TutorTimeSelectorProps> = ({
  tutorId,
  selectedDate,
  selectedTime,
  onTimeChange,
  className = '',
  studentBookedSlots = [], // Default to empty array
}) => {
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    const loadAvailability = async () => {
      if (!tutorId) return
      
      setLoading(true)
      try {
        // In a real scenario, you'd call the specific tutor's availability
        // For now, we'll use a generic endpoint that returns availability
        const response = await apiClient.get(`/tutors/${tutorId}`)
        
        // If the tutor has availability data in their profile
        if ((response as any).tutor && (response as any).tutor.availability) {
          setAvailability((response as any).tutor.availability)
        } else {
          // Fallback to default availability structure
          setAvailability({
            weeklySchedule: {},
            exceptions: []
          })
        }
      } catch (error) {
        console.error('Error loading tutor availability:', error)
        // Set empty availability on error
        setAvailability({
          weeklySchedule: {},
          exceptions: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [tutorId])

  useEffect(() => {
    if (!availability || !selectedDate) {
      setAvailableSlots([])
      return
    }

    // Get day of week from selected date
    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()
    const dayName = DAYS_MAP[dayOfWeek as keyof typeof DAYS_MAP]
    
    // Get the day's schedule
    const daySchedule = availability?.weeklySchedule?.[dayName]
    
    if (daySchedule && daySchedule.enabled && daySchedule.timeSlots) {
      // Filter only available time slots and ensure proper time format
      const available = daySchedule.timeSlots
        .filter(slot => slot.available)
        .map(slot => ({
          ...slot,
          // Ensure time is in HH:MM format
          start: slot.start.length === 5 ? slot.start : `${slot.start.padStart(2, '0')}:00`,
          end: slot.end.length === 5 ? slot.end : `${slot.end.padStart(2, '0')}:00`
        }))
      setAvailableSlots(available)
    } else {
      // If no schedule is found, show no available slots
      setAvailableSlots([])
    }
  }, [availability, selectedDate])

  const getTimeSlotLabel = (slot: TimeSlot) => {
    // Ensure times are in HH:MM format
    const start = slot.start.length === 5 ? slot.start : `${slot.start.padStart(2, '0')}:00`
    const end = slot.end.length === 5 ? slot.end : `${slot.end.padStart(2, '0')}:00`
    return `${start} - ${end}`
  }

  const getTimeSlotValue = (slot: TimeSlot) => {
    // Always return time in HH:MM format
    return slot.start.length === 5 ? slot.start : `${slot.start.padStart(2, '0')}:00`
  }

  const getPopularityBadge = (time: string) => {
    // Simulate popularity based on time
    const hour = parseInt(time.split(':')[0])
    if (hour >= 14 && hour <= 16) {
      return { label: '🔥 Beliebt', color: 'bg-red-100 text-red-700 border-red-200' }
    } else if (hour >= 9 && hour <= 11) {
      return { label: '⭐ Empfohlen', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    } else if (hour >= 18 && hour <= 20) {
      return { label: '🌅 Abends', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    }
    return null
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    const date = new Date(selectedDate)
    const dayName = DAYS_GERMAN[DAYS_MAP[date.getDay() as keyof typeof DAYS_MAP] as keyof typeof DAYS_GERMAN]
    return `${dayName}, ${date.toLocaleDateString('de-DE')}`
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          <Clock className="inline w-4 h-4 mr-2" />
          Verfügbare Zeiten
        </label>
        {selectedDate && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {formatSelectedDate()}
          </span>
        )}
      </div>

      {!selectedDate ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Calendar className="mx-auto w-8 h-8 mb-2 text-gray-400" />
          <p className="text-sm">Bitte wählen Sie zuerst ein Datum</p>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-red-50 rounded-lg border border-red-200">
          <Clock className="mx-auto w-8 h-8 mb-2 text-red-400" />
          <p className="text-sm font-medium text-red-600">Keine verfügbaren Zeiten</p>
          <p className="text-xs text-red-500 mt-1">Der Tutor ist an diesem Tag nicht verfügbar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Time Slots Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSlots.map((slot, index) => {
              const timeValue = getTimeSlotValue(slot)
              const timeLabel = getTimeSlotLabel(slot)
              const isSelected = selectedTime === timeValue
              const popularity = getPopularityBadge(slot.start)
              const isBookedByStudent = studentBookedSlots.includes(timeValue)
              
              return (
                <button
                  key={index}
                  onClick={() => !isBookedByStudent && onTimeChange(timeValue)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
                      : isBookedByStudent
                        ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm'
                    }
                    group
                  `}
                  disabled={isBookedByStudent}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium text-sm ${isSelected ? 'text-blue-700' : isBookedByStudent ? 'text-gray-400' : 'text-gray-900'}`}>
                        {timeLabel}
                      </div>
                      <div className="flex items-center mt-1 space-x-1">
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : isBookedByStudent ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                        <span className={`text-xs ${isBookedByStudent ? 'text-gray-400' : 'text-gray-500'}`}>{isBookedByStudent ? 'Konflikt' : 'Verfügbar'}</span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {popularity && !isBookedByStudent && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full border ${popularity.color}`}>
                        {popularity.label}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Alternative: Dropdown Selector for mobile or preference */}
          <div className="mt-4 md:hidden">
            <Select value={selectedTime} onValueChange={onTimeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Oder aus der Liste wählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot, index) => (
                  <SelectItem key={index} value={getTimeSlotValue(slot)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{getTimeSlotLabel(slot)}</span>
                      {getPopularityBadge(slot.start) && (
                        <span className="ml-2 text-xs text-gray-500">
                          {getPopularityBadge(slot.start)?.label}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Info */}
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center text-sm text-emerald-700">
              <Zap className="w-4 h-4 mr-2" />
              <span className="font-medium">{availableSlots.length} verfügbare Zeitslots</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Alle Zeiten sind in der lokalen Zeitzone (CET/CEST)
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 