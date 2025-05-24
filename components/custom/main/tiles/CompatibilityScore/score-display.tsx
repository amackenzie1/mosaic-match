import { Card, CardContent, Progress } from '@/components/ui'
import React from 'react'

interface ScoreDisplayProps {
  score: number
  label: string
  color: string
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, label, color }) => (
  <Card className="border shadow-sm">
    <CardContent className="padding-responsive spacing-responsive">
      <div className="flex flex-col space-y-3 sm:space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold">
              Compatibility Score
            </h3>
            <p className="text-content text-xs sm:text-sm">
              {label}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span
              className="text-2xl sm:text-4xl font-bold tabular-nums"
              style={{ color: 'hsl(var(--chart-3))' }}
            >
              {score}
            </span>
            <span className="text-content text-base sm:text-lg">/100</span>
          </div>
        </div>
        <Progress
          value={score}
          className="bg-muted h-2 sm:h-3"
          style={
            {
              '--progress-indicator': color,
            } as React.CSSProperties
          }
        />
      </div>
    </CardContent>
  </Card>
)