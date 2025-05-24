import { cn } from '@/lib/utils'
import React, { CSSProperties } from 'react'

interface InsightCardProps {
  text: string
  color?: string
  className?: string
}

export const InsightCard: React.FC<InsightCardProps> = ({ 
  text, 
  color, 
  className 
}) => {
  return (
    <div
      className={cn('insight-card', className)}
      style={{ '--accent-color': color } as CSSProperties}
    >
      <p className="text-content text-sm">{text}</p>
    </div>
  )
}