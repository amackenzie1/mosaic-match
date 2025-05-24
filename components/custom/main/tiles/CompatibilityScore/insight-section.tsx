import { Card, CardContent, ScrollArea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import React from 'react'

interface InsightSectionProps {
  icon: LucideIcon
  title: string
  items: string[]
  color: string
  isMobile: boolean
}

export const InsightSection: React.FC<InsightSectionProps> = ({ 
  icon: Icon, 
  title, 
  items, 
  color, 
  isMobile 
}) => (
  <Card className="card-elevated">
    <CardContent className="padding-responsive">
      <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
        <Icon
          className="h-4 w-4 sm:h-5 sm:w-5"
          style={{ color }}
        />
        <h3 className="text-base sm:text-lg font-medium">{title}</h3>
      </div>
      <ScrollArea className={cn(
        "pr-3 sm:pr-4",
        isMobile ? "h-[200px]" : "h-[300px]"
      )}>
        <div className="spacing-responsive">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'p-2 sm:p-3 rounded-lg transition-colors',
                'bg-muted/50 hover:bg-muted/70'
              )}
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <p className="text-content text-xs sm:text-sm">{item}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
)