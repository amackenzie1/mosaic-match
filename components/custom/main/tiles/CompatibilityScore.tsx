import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import UserAvatar from '@/components/ui/user-avatar'
import { useIsMobile } from '@/components/ui/use-mobile'
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

const InsightItem: React.FC<{
  text: string
  color: string
}> = ({ text, color }) => {
  return (
    <div
      className="p-4 rounded-lg mb-4 bg-background/60 hover:bg-background/80 transition-colors"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <p className="text-content text-sm">{text}</p>
    </div>
  )
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'hsl(var(--chart-3))'
  if (score >= 80) return 'hsl(var(--chart-3) / 0.85)'
  if (score >= 70) return 'hsl(var(--chart-3) / 0.7)'
  if (score >= 60) return 'hsl(var(--chart-3) / 0.55)'
  return 'hsl(var(--chart-3) / 0.4)'
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
    if (!file) {
      return null
    }
    return isLoading ? (
      <Card>
        <CardContent className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    ) : null
  }

  // Update all text content with current user names
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
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
        <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-8">
          {/* User Profiles and Score */}
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
                      <span className="font-semibold text-sm sm:text-base">{user.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-sm sm:text-base">{user.name}</span>
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

          {/* Score Overview and Progress */}
          <Card className="border shadow-sm">
            <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Compatibility Score
                    </h3>
                    <p className="text-content text-xs sm:text-sm">
                      {getScoreLabel(compatibility.overallScore)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span
                      className="text-2xl sm:text-4xl font-bold tabular-nums"
                      style={{ color: 'hsl(var(--chart-3))' }}
                    >
                      {compatibility.overallScore}
                    </span>
                    <span className="text-content text-base sm:text-lg">/100</span>
                  </div>
                </div>
                <Progress
                  value={compatibility.overallScore}
                  className="bg-muted h-2 sm:h-3"
                  style={
                    {
                      '--progress-indicator': getScoreColor(
                        compatibility.overallScore
                      ),
                    } as React.CSSProperties
                  }
                />
              </div>

              <div
                className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                style={{ borderLeft: `4px solid hsl(var(--chart-3))` }}
              >
                <p className="text-content text-xs sm:text-sm leading-relaxed">
                  {updatedOffTheRecordInsights}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Insights Sections */}
          <div className="grid gap-3 sm:gap-6 grid-cols-1 md:grid-cols-3">
            {[
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
            ].map((section) => (
              <Card
                key={section.title}
                className="bg-background border shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                    <section.icon
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      style={{ color: section.color }}
                    />
                    <h3 className="text-base sm:text-lg font-medium">{section.title}</h3>
                  </div>
                  <ScrollArea className={cn(
                    "pr-3 sm:pr-4",
                    isMobile ? "h-[200px]" : "h-[300px]"
                  )}>
                    <div className="space-y-3 sm:space-y-4">
                      {section.items.map((item, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-2 sm:p-3 rounded-lg transition-colors',
                            'bg-muted/50 hover:bg-muted/70'
                          )}
                          style={{ borderLeft: `3px solid ${section.color}` }}
                        >
                          <p className="text-content text-xs sm:text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompatibilityScore
