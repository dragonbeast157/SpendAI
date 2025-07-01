import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { type Insight } from '@/api/dashboard'

interface InsightCardProps {
  insight: Insight
}

export function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getColorClasses = () => {
    switch (insight.type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-100'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-100'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/50 dark:border-green-800 dark:text-green-100'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-950/50 dark:border-gray-800 dark:text-gray-100'
    }
  }

  const getBadgeVariant = () => {
    switch (insight.type) {
      case 'warning':
        return 'destructive'
      case 'success':
        return 'default'
      case 'info':
      default:
        return 'secondary'
    }
  }

  return (
    <Card className={`${getColorClasses()} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <Badge variant={getBadgeVariant()} className="text-xs">
                {insight.type}
              </Badge>
            </div>
            <p className="text-xs opacity-80">{insight.description}</p>
            {insight.actionText && (
              <Button size="sm" variant="outline" className="text-xs h-7">
                {insight.actionText}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}