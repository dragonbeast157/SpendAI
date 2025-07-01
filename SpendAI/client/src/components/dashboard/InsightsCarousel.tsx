import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, TrendingUp, Coffee, Trophy, Building2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Insight {
  _id: string
  title: string
  description: string
  icon: string
  type: 'info' | 'warning' | 'success' | 'policy'
}

interface InsightsCarouselProps {
  insights: Insight[]
}

export function InsightsCarousel({ insights }: InsightsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'restaurant':
        return <TrendingUp className="h-6 w-6" />
      case 'coffee':
        return <Coffee className="h-6 w-6" />
      case 'celebration':
        return <Trophy className="h-6 w-6" />
      case 'policy':
        return <Building2 className="h-6 w-6" />
      default:
        return <TrendingUp className="h-6 w-6" />
    }
  }

  const getCardColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200'
      case 'success':
        return 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
      case 'policy':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
    }
  }

  const getTextColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-700'
      case 'success':
        return 'text-green-700'
      case 'policy':
        return 'text-blue-700'
      default:
        return 'text-gray-700'
    }
  }

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length)
  }

  const prevInsight = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length)
  }

  if (!insights.length) return null

  const currentInsight = insights[currentIndex]

  return (
    <div className="space-y-4">
      <Card className={cn("border-2", getCardColor(currentInsight.type))}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              currentInsight.type === 'warning' && "bg-yellow-200",
              currentInsight.type === 'success' && "bg-green-200",
              currentInsight.type === 'policy' && "bg-blue-200",
              !['warning', 'success', 'policy'].includes(currentInsight.type) && "bg-gray-200"
            )}>
              {getIcon(currentInsight.icon)}
            </div>
            <div className="flex-1">
              <h4 className={cn(
                "font-semibold mb-2",
                getTextColor(currentInsight.type)
              )}>
                {currentInsight.title}
              </h4>
              <p className="text-sm text-gray-600">{currentInsight.description}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                Learn More
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {insights.length > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={prevInsight}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex space-x-1">
            {insights.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                )}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={nextInsight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}