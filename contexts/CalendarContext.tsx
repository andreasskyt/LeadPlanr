'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CalendarAccount } from '@/lib/db'
import { Calendar } from '@/lib/calendar-service'
import { useCalendarSelection } from '@/hooks/useCalendarSelection'

interface CalendarContextType {
  accounts: CalendarAccount[]
  availableCalendars: Calendar[]
  selectedCalendarId: string | null
  setSelectedCalendarId: (id: string | null) => void
  loading: boolean
  accountsLoading: boolean
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  useEffect(() => {
    const fetchAccounts = async () => {
      setAccountsLoading(true)
      try {
        const response = await fetch('/api/calendar-accounts')
        if (!response.ok) throw new Error('Failed to fetch calendar accounts')
        const data = await response.json()
        setAccounts(data)
      } catch (error) {
        console.error('Error fetching calendar accounts:', error)
      } finally {
        setAccountsLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const { availableCalendars, selectedCalendarId, setSelectedCalendarId, loading } = useCalendarSelection(accounts)

  return (
    <CalendarContext.Provider value={{
      accounts,
      availableCalendars,
      selectedCalendarId,
      setSelectedCalendarId,
      loading,
      accountsLoading,
    }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
} 