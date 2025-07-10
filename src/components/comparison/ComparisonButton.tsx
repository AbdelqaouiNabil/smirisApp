import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComparison, ComparisonItem, ComparisonItemType } from '../../contexts/ComparisonContext'
import { useAuth } from '../../contexts/AuthContext'
import { BarChart3, Check, X } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface ComparisonButtonProps {
  item: {
    id: number
    type: ComparisonItemType
    data: any
  }
  className?: string
  variant?: 'default' | 'small' | 'icon'
}

export function ComparisonButton({ item, className = '', variant = 'default' }: ComparisonButtonProps) {
  const { addItem, removeItem, isInComparison, canAddMore } = useComparison()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isHovering, setIsHovering] = useState(false)

  const isAdded = isInComparison(item.id, item.type)
  const canAdd = canAddMore(item.type)

  const handleClick = () => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page if user is not authenticated
      navigate('/login')
      return
    }
    
    if (isAdded) {
      removeItem(item.id, item.type)
      toast({
        title: "Aus Vergleich entfernt",
        description: "Das Element wurde aus dem Vergleich entfernt.",
        duration: 2000,
      })
    } else {
      if (!canAdd) {
        toast({
          title: "Maximum erreicht",
          description: `Sie können maximal 4 ${getTypeName(item.type)} gleichzeitig vergleichen.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      const comparisonItem: ComparisonItem = {
        id: item.id,
        type: item.type,
        data: item.data
      }

      addItem(comparisonItem)
      toast({
        title: "Zum Vergleich hinzugefügt",
        description: `${getItemName(item.data, item.type)} wurde zum Vergleich hinzugefügt.`,
        duration: 2000,
      })
    }
  }

  const getTypeName = (type: ComparisonItemType) => {
    switch (type) {
      case 'school': return 'Schulen'
      case 'course': return 'Kurse'
      case 'tutor': return 'Tutoren'
      default: return 'Elemente'
    }
  }

  const getItemName = (data: any, type: ComparisonItemType) => {
    switch (type) {
      case 'school': return data.name
      case 'course': return data.title
      case 'tutor': return data.name
      default: return 'Element'
    }
  }

  const getButtonText = () => {
    if (variant === 'icon') return ''
    if (variant === 'small') return isAdded ? 'Entfernen' : 'Vergleichen'
    return isAdded ? 'Aus Vergleich entfernen' : 'Zum Vergleich hinzufügen'
  }

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    
    if (variant === 'icon') {
      return `${baseClasses} p-2 rounded-md ${
        isAdded 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
      }`
    }

    if (variant === 'small') {
      return `${baseClasses} px-3 py-1 text-xs rounded-md border ${
        isAdded
          ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
      }`
    }

    return `${baseClasses} px-4 py-2 text-sm rounded-md border ${
      isAdded
        ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
        : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
    }`
  }

  const getIcon = () => {
    if (variant === 'icon' && isAdded) {
      return <Check className="h-4 w-4" />
    }
    if (isAdded && isHovering) {
      return <X className="h-4 w-4" />
    }
    return <BarChart3 className="h-4 w-4" />
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`${getButtonClasses()} ${className}`}
      title={isAdded ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
    >
      {getIcon()}
      {variant !== 'icon' && (
        <span className="ml-2">{getButtonText()}</span>
      )}
    </button>
  )
}
