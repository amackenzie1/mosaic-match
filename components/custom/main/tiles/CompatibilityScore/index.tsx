import { Card, CardContent, CardHeader, CardTitle, Progress, ScrollArea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, UserAvatar, useIsMobile, InsightCard } from '@/components/ui'
import { useGeneralInfo } from '@/lib/contexts/general-info'
import { useUserColors } from '@/lib/hooks/useUserColors'
import { cn } from '@/lib/utils'
import {
  analyzeCompatibility,
  CompatibilityResponseType,
} from '@/lib/utils/compatibility'
import { useS3Fetcher } from '@/lib/utils/fetcher'
import { updateUserReferences } from '@/lib/utils/general'
import { AlertTriangle, Heart, Info, Lightbulb } from 'lucide-react'
import React from 'react'
import { ScoreDisplay } from './score-display'
import { InsightSection } from './insight-section'

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'var(--chart-3)'
  if (score >= 80) return 'var(--chart-3-85)'
  if (score >= 70) return 'var(--chart-3-70)'
  if (score >= 60) return 'var(--chart-3-55)'
  return 'var(--chart-3-40)'
}

const getScoreLabel = (score: number): string => {
  if (score >= 90) return 'Exceptional'
  if (score >= 80) return 'Strong'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Challenging'
}

const CompatibilityScore: React.FC = () => {
  const { file, users } = useGeneralInfo()
  const { getUserColors } = useUserColors()
  const isMobile = useIsMobile()

  const {
    data: compatibility,
    isLoading,
    error,
  } = useS3Fetcher<CompatibilityResponseType>({
    generator: analyzeCompatibility,
    cachePath: 'chat/:hash:/compatibility.json',
  })

  if (isLoading || error || !compatibility || !users) {
    if (!file) return null
    return isLoading ? (
      <Card>
        <CardContent className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    ) : null
  }

  const updatedStrengths = compatibility.strengths.map((strength) =>
    updateUserReferences(strength, users)
  )
  const updatedChallenges = compatibility.challenges.map((challenge) =>
    updateUserReferences(challenge, users)
  )
  const updatedRecommendations = compatibility.recommendations.map(
    (recommendation) => updateUserReferences(recommendation, users)
  )
  const updatedOffTheRecordInsights = updateUserReferences(
    compatibility.offTheRecordInsights,
    users
  )

  const scoreColor = getScoreColor(compatibility.overallScore)

  const insightSections = [
    {
      icon: Heart,
      title: 'Relationship Strengths',
      items: updatedStrengths,
      color: getUserColors(users[0]).primary,
    },
    {
      icon: AlertTriangle,
      title: 'Potential Challenges',
      items: updatedChallenges,
      color: getUserColors(users[1]).primary,
    },
    {
      icon: Lightbulb,
      title: 'Growth Opportunities',
      items: updatedRecommendations,
      color: scoreColor,
    },
  ]

  return (
    <div className="spacing-responsive">
      <Card>
        <CardHeader className="padding-responsive">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl sm:text-2xl">Compatibility Analysis</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    Analysis of various relationship aspects to provide a
                    compatibility score out of 100.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="padding-responsive spacing-responsive">
          <div className="flex justify-between items-center">
            {users.map((user, index) => {
              const userColors = getUserColors(user)
              const isLeft = index === 0
              return (
                <div key={user.username} className="flex items-center gap-2 sm:gap-3">
                  {isLeft ? (
                    <>
                      <UserAvatar
                        name={user.name}
                        color={userColors.primary}
                        size={isMobile ? "md" : "lg"}
                      />
                      <span className="font-semibold text-responsive">{user.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-responsive">{user.name}</span>
                      <UserAvatar
                        name={user.name}
                        color={userColors.primary}
                        size={isMobile ? "md" : "lg"}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <ScoreDisplay 
            score={compatibility.overallScore}
            label={getScoreLabel(compatibility.overallScore)}
            color={scoreColor}
          />

          <InsightCard 
            text={updatedOffTheRecordInsights}
            color="hsl(var(--chart-3))"
            className="text-xs sm:text-sm leading-relaxed"
          />

          <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-3">
            {insightSections.map((section) => (
              <InsightSection
                key={section.title}
                icon={section.icon}
                title={section.title}
                items={section.items}
                color={section.color}
                isMobile={isMobile}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompatibilityScore