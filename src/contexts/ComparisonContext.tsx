import React, { createContext, useContext, useState, ReactNode } from 'react'

export type ComparisonItemType = 'school' | 'course' | 'tutor'

export interface ComparisonItem {
  id: number
  type: ComparisonItemType
  data: any
}

interface ComparisonContextType {
  items: ComparisonItem[]
  addItem: (item: ComparisonItem) => void
  removeItem: (id: number, type: ComparisonItemType) => void
  clearItems: (type?: ComparisonItemType) => void
  getItemsByType: (type: ComparisonItemType) => ComparisonItem[]
  isInComparison: (id: number, type: ComparisonItemType) => boolean
  canAddMore: (type: ComparisonItemType) => boolean
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

const MAX_ITEMS_PER_TYPE = 4

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([])

  const addItem = (item: ComparisonItem) => {
    setItems(prev => {
      // Check if item already exists
      const exists = prev.some(i => i.id === item.id && i.type === item.type)
      if (exists) return prev

      // Check if we can add more of this type
      const itemsOfType = prev.filter(i => i.type === item.type)
      if (itemsOfType.length >= MAX_ITEMS_PER_TYPE) return prev

      return [...prev, item]
    })
  }

  const removeItem = (id: number, type: ComparisonItemType) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.type === type)))
  }

  const clearItems = (type?: ComparisonItemType) => {
    if (type) {
      setItems(prev => prev.filter(item => item.type !== type))
    } else {
      setItems([])
    }
  }

  const getItemsByType = (type: ComparisonItemType) => {
    return items.filter(item => item.type === type)
  }

  const isInComparison = (id: number, type: ComparisonItemType) => {
    return items.some(item => item.id === id && item.type === type)
  }

  const canAddMore = (type: ComparisonItemType) => {
    const itemsOfType = items.filter(item => item.type === type)
    return itemsOfType.length < MAX_ITEMS_PER_TYPE
  }

  return (
    <ComparisonContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearItems,
      getItemsByType,
      isInComparison,
      canAddMore
    }}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}
