import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from '../hooks/use-toast'
import { apiClient } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

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

interface Exception {
  date: string
  available: boolean
  reason?: string
}

interface Availability {
  weeklySchedule: WeeklySchedule
  exceptions: Exception[]
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '09:00', end: '10:00', available: true },
  { start: '10:00', end: '11:00', available: true },
  { start: '11:00', end: '12:00', available: true },
  { start: '14:00', end: '15:00', available: true },
  { start: '15:00', end: '16:00', available: true },
  { start: '16:00', end: '17:00', available: true }
]

const DAYS = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag'
}

export const TutorAvailability: React.FC = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const createDefaultAvailability = (): Availability => ({
    weeklySchedule: Object.keys(DAYS).reduce((acc, day) => ({
      ...acc,
      [day]: {
        enabled: true,
        timeSlots: [...DEFAULT_TIME_SLOTS]
      }
    }), {} as WeeklySchedule),
    exceptions: []
  })

  const [availability, setAvailability] = useState<Availability>(createDefaultAvailability())

  useEffect(() => {
    // Load current availability from backend
    const loadAvailability = async () => {
      try {
        const data = await apiClient.get<{ availability: Availability }>('/tutors/me/availability')
        if (data.availability && data.availability.weeklySchedule) {
          // Merge with defaults to ensure all days are present
          const mergedAvailability = {
            ...createDefaultAvailability(),
            ...data.availability,
            weeklySchedule: {
              ...createDefaultAvailability().weeklySchedule,
              ...data.availability.weeklySchedule
            }
          }
          setAvailability(mergedAvailability)
        }
      } catch (error) {
        console.error('Error loading availability:', error)
        // If no availability exists yet, keep the default values
      }
    }

    loadAvailability()
  }, [])

  const handleDayToggle = (day: string) => {
    setAvailability(prev => {
      if (!prev.weeklySchedule || !prev.weeklySchedule[day]) {
        return prev
      }
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            enabled: !prev.weeklySchedule[day].enabled
          }
        }
      }
    })
  }

  const handleTimeSlotToggle = (day: string, index: number) => {
    setAvailability(prev => {
      if (!prev.weeklySchedule || !prev.weeklySchedule[day] || !prev.weeklySchedule[day].timeSlots) {
        return prev
      }
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            timeSlots: prev.weeklySchedule[day].timeSlots.map((slot, i) =>
              i === index ? { ...slot, available: !slot.available } : slot
            )
          }
        }
      }
    })
  }

  const saveAvailability = async () => {
    setIsLoading(true)
    try {
      // Debug: Check authentication state
      const token = localStorage.getItem('auth_token')
      console.log('Auth token exists:', !!token)
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token')
      console.log('Current user:', user)
      console.log('User role:', user?.role)
      
      // If no token but user is authenticated, this suggests a login issue
      if (!token && user) {
        toast({
          title: 'Token-Problem erkannt',
          description: 'Bitte melden Sie sich erneut an, um das Problem zu beheben.',
          variant: 'destructive'
        })
        return
      }
      
      await apiClient.post('/tutors/availability', { availability })

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Ihre Verfügbarkeit wurde aktualisiert.'
      })
    } catch (error) {
      console.error('Error saving availability:', error)
      console.error('Error details:', error)
      
      // Check if it's an auth error
      if (error.status === 401) {
        toast({
          title: 'Authentifizierung fehlgeschlagen',
          description: 'Bitte melden Sie sich erneut an.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Fehler',
          description: 'Verfügbarkeit konnte nicht gespeichert werden.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Verfügbarkeit verwalten</CardTitle>
        <CardDescription>
          Legen Sie fest, wann Sie für Unterricht zur Verfügung stehen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(DAYS).map(([day, label]) => {
            const daySchedule = availability.weeklySchedule?.[day]
            if (!daySchedule) return null
            
            return (
              <div key={day} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label>{label}</Label>
                  </div>
                </div>

                {daySchedule.enabled && daySchedule.timeSlots && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {daySchedule.timeSlots.map((slot, index) => (
                    <div
                      key={`${day}-${index}`}
                      className={`p-3 rounded-lg border ${
                        slot.available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {slot.start} - {slot.end}
                        </span>
                        <Switch
                          checked={slot.available}
                          onCheckedChange={() => handleTimeSlotToggle(day, index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
          })}

          <div className="pt-6">
            <Button
              onClick={saveAvailability}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Wird gespeichert...' : 'Verfügbarkeit speichern'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 