import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import UserAvatar from '@/components/ui/user-avatar'
import { useIsMobile } from '@/components/ui/use-mobile'
import { useGeneralInfo } from '@/lib/contexts/general-info'
import { useThemeColors } from '@/lib/hooks/useThemeColors'
import { useUserColors } from '@/lib/hooks/useUserColors'
import { cn } from '@/lib/utils'
import {
  AnalysisResult,
  performMBTIAnalysis,
} from '@/lib/utils/MBTIAnalysisLogic'
import { useS3Fetcher } from '@/lib/utils/fetcher'
import { updateUserReferences } from '@/lib/utils/general'
import { MBTILetter, traits } from '@/lib/utils/mbti'
import { AlertCircle, Crown, Info, Lightbulb } from 'lucide-react'
import React from 'react'

const LetterDisplay: React.FC<{
  letter: string
  count: number
  totalCount: number
  userColors: ReturnType<typeof useUserColors>['getUserColors'] extends (
    user: any
  ) => infer R
    ? R
    : never
}> = ({ letter, count, totalCount, userColors }) => {
  const percentage = (count / totalCount) * 100
  const size = Math.max(20, Math.min(100, percentage))
  const color = percentage > 75 ? userColors.primary : 'currentColor'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="cursor-help transition-colors"
            style={{
              fontSize: `${size}px`,
              color,
              fontWeight: percentage > 75 ? 'bold' : 'normal',
            }}
          >
            {letter}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {letter}: {percentage.toFixed(1)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const MBTIDisplay: React.FC<{
  user: { username: string; name: string }
  mbtiType: string
  letterCounts: { [key: string]: number }
  description: string
}> = ({ user, mbtiType, letterCounts, description }) => {
  const isMobile = useIsMobile()
  const { getUserColors } = useUserColors()
  const colors = useThemeColors()
  const userColors = getUserColors(user)

  // Normalize letter counts to ensure case-insensitive comparison
  const normalizedCounts = Object.entries(letterCounts).reduce(
    (acc, [key, value]) => {
      const upperKey = key.toUpperCase()
      acc[upperKey] = (acc[upperKey] || 0) + value
      return acc
    },
    {} as { [key: string]: number }
  )

  const getLetterPairStats = (
    letter1: string,
    letter2: string,
    isVariant = false
  ) => {
    if (isVariant) {
      // Handle A vs T (Turbulent) case
      const count1 = normalizedCounts[letter1.toLowerCase()] || 0
      const count2 = normalizedCounts[letter2.toLowerCase()] || 0
      const total = count1 + count2
      if (total === 0) return { percent1: 50, percent2: 50, dominant: letter1 }
      const percent1 = (count1 / total) * 100
      const percent2 = (count2 / total) * 100
      return {
        percent1,
        percent2,
        dominant: percent1 >= percent2 ? letter1 : letter2,
      }
    } else if (letter1 === 'T' && letter2 === 'F') {
      // Handle T (Thinking) vs F case
      const count1 = normalizedCounts['T'] || 0
      const count2 = normalizedCounts['F'] || 0
      const total = count1 + count2
      if (total === 0) return { percent1: 50, percent2: 50, dominant: letter1 }
      const percent1 = (count1 / total) * 100
      const percent2 = (count2 / total) * 100
      return {
        percent1,
        percent2,
        dominant: percent1 >= percent2 ? letter1 : letter2,
      }
    } else {
      // Handle all other letter pairs
      const count1 = normalizedCounts[letter1] || 0
      const count2 = normalizedCounts[letter2] || 0
      const total = count1 + count2
      if (total === 0) return { percent1: 50, percent2: 50, dominant: letter1 }
      const percent1 = (count1 / total) * 100
      const percent2 = (count2 / total) * 100
      return {
        percent1,
        percent2,
        dominant: percent1 >= percent2 ? letter1 : letter2,
      }
    }
  }

  const renderLetterPair = (
    letter1: string,
    letter2: string,
    isVariant = false
  ) => {
    const { percent1, percent2, dominant } = getLetterPairStats(
      letter1,
      letter2,
      isVariant
    )
    const count =
      dominant === letter1
        ? normalizedCounts[letter1] || 0
        : normalizedCounts[letter2] || 0
    const total =
      (normalizedCounts[letter1] || 0) + (normalizedCounts[letter2] || 0)

    return (
      <LetterDisplay
        letter={dominant}
        count={count}
        totalCount={total}
        userColors={userColors}
      />
    )
  }

  const renderVariant = (variant: string) => {
    const count = letterCounts[variant] || 0
    const totalCount = letterCounts['a'] + letterCounts['t']
    const percentage = (count / totalCount) * 100

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center">
              <span className="text-xl mx-1">-</span>
              <span
                className="text-2xl cursor-help"
                style={{
                  color: percentage > 75 ? userColors.primary : 'currentColor',
                  fontWeight: percentage > 75 ? 'bold' : 'normal',
                }}
              >
                {variant.toUpperCase()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {variant.toUpperCase()}: {percentage.toFixed(1)}%
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const mbtiTypeKey = `${mbtiType.split('-')[0]}-${
    mbtiType.split('-')[1]
  }` as MBTILetter

  const getDescription = (letter: string) => {
    switch (letter) {
      case 'E':
        return 'Extroverted - Gains energy from social interaction, outgoing, expressive, and oriented towards the external world'
      case 'I':
        return 'Introverted - Gains energy from solitude, reflective, reserved, and oriented towards inner thoughts and feelings'
      case 'N':
        return 'Intuitive - Focuses on patterns and possibilities, abstract thinking, and future-oriented'
      case 'S':
        return 'Sensing - Focuses on concrete details, practical matters, and present reality'
      case 'T':
        return 'Thinking - Makes decisions based on logic, objective analysis, and impersonal criteria'
      case 'F':
        return 'Feeling - Makes decisions based on personal values, harmony, and impact on people'
      case 'J':
        return 'Judging - Prefers structure, planning, and organized approach to life'
      case 'P':
        return 'Perceiving - Prefers flexibility, spontaneity, and adaptable approach to life'
      case 'A':
        return "Assertive - Self-assured, even-tempered, and resistant to stress. Confident in their abilities and don't worry too much about problems."
      case 'T':
        return 'Turbulent - Self-conscious and sensitive to stress. Likely to experience a wide range of emotions and tend to be success-driven perfectionists.'
      default:
        return ''
    }
  }

  return (
    <Card
      className="bg-background border-2 shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, hsl(var(--chart-1)) / 0.05, transparent)`,
        borderColor: userColors.primary,
      }}
    >
      <div className="flex flex-col divide-y divide-border">
        {/* Header Section with User and Type */}
        <div className={cn("p-3 sm:p-4 md:p-6")}>
          <div className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-8"
          )}>
            <div className="flex items-center gap-2 sm:gap-3">
              <UserAvatar
                name={user.name}
                color={userColors.primary}
                size={isMobile ? "sm" : "lg"}
              />
              <CardTitle className={cn("text-base sm:text-xl")}>{user.name}</CardTitle>
            </div>
            <div className={cn(
              "flex items-center gap-1 font-light tracking-wider",
              isMobile ? "text-2xl sm:text-3xl" : "text-4xl"
            )}>
              {renderLetterPair('E', 'I')}
              {renderLetterPair('N', 'S')}
              {renderLetterPair('T', 'F')}
              {renderLetterPair('J', 'P')}
              {renderLetterPair('A', 'T', true)}
            </div>
          </div>

          {/* Personality Sliders */}
          <div className={cn(
            isMobile ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" : "grid grid-cols-5 gap-4"
          )}>
            {[
              ['E', 'I'],
              ['N', 'S'],
              ['T', 'F'],
              ['J', 'P'],
              ['A', 'T'],
            ].map(([l1, l2], index) => {
              const isVariant = index === 4
              const { percent1, percent2, dominant } = getLetterPairStats(
                l1,
                l2,
                isVariant
              )

              return (
                <TooltipProvider key={l1 + l2}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group">
                        <div className="flex justify-between text-sm mb-2">
                          <span
                            className="transition-colors"
                            style={{
                              color:
                                dominant === l1
                                  ? userColors.primary
                                  : 'hsl(var(--muted-foreground))',
                              fontWeight: dominant === l1 ? '500' : 'normal',
                            }}
                          >
                            {l1}
                          </span>
                          <span
                            className="transition-colors"
                            style={{
                              color:
                                dominant === l2
                                  ? userColors.primary
                                  : 'hsl(var(--muted-foreground))',
                              fontWeight: dominant === l2 ? '500' : 'normal',
                            }}
                          >
                            {l2}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted/20 overflow-hidden flex">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${percent1}%`,
                              backgroundColor:
                                dominant === l1
                                  ? userColors.primary
                                  : 'hsl(var(--muted-foreground))',
                              opacity: dominant === l1 ? 1 : 0.2,
                            }}
                          />
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${percent2}%`,
                              backgroundColor:
                                dominant === l2
                                  ? userColors.primary
                                  : 'hsl(var(--muted-foreground))',
                              opacity: dominant === l2 ? 1 : 0.2,
                            }}
                          />
                        </div>
                        <div className="absolute inset-x-0 -bottom-6 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {Math.round(percent1)}% / {Math.round(percent2)}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[300px] p-3">
                      <div className="space-y-2">
                        <p>
                          <strong
                            style={{
                              color:
                                dominant === l1
                                  ? userColors.primary
                                  : 'inherit',
                            }}
                          >
                            {l1}:
                          </strong>{' '}
                          {getDescription(l1)}
                        </p>
                        <p>
                          <strong
                            style={{
                              color:
                                dominant === l2
                                  ? userColors.primary
                                  : 'inherit',
                            }}
                          >
                            {l2}:
                          </strong>{' '}
                          {getDescription(l2)}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </div>

        {/* Strengths and Weaknesses Grid */}
        <div className={cn(
          "grid divide-y md:divide-y-0 md:divide-x divide-border",
          "md:grid-cols-2"
        )}>
          <div className={cn("p-3 sm:p-4 md:p-6")}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Crown
                className={cn("text-[hsl(var(--chart-2))]", isMobile ? "h-4 w-4" : "h-5 w-5")}
              />
              <h3 className={cn("font-medium", isMobile ? "text-sm sm:text-base" : "text-lg")}>
                Archetype Strengths
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {traits[mbtiTypeKey].strengths.map((strength, index) => (
                <div
                  key={index}
                  className={cn(
                    "inline-flex items-center rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors",
                    isMobile ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
                  )}
                  style={{
                    borderLeft: `2px solid ${userColors.primary}`,
                  }}
                >
                  {strength}
                </div>
              ))}
            </div>
          </div>

          <div className={cn("p-3 sm:p-4 md:p-6")}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <AlertCircle 
                className={cn("text-destructive", isMobile ? "h-4 w-4" : "h-5 w-5")}
              />
              <h3 className={cn("font-medium", isMobile ? "text-sm sm:text-base" : "text-lg")}>
                Archetype Weaknesses
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {traits[mbtiTypeKey].weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  className={cn(
                    "inline-flex items-center rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors",
                    isMobile ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
                  )}
                  style={{
                    borderLeft: `2px solid hsl(var(--destructive))`,
                  }}
                >
                  {weakness}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personality Analysis */}
        <div className={cn("p-3 sm:p-4 md:p-6")}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Lightbulb
              className={cn("text-[hsl(var(--chart-3))]", isMobile ? "h-4 w-4" : "h-5 w-5")}
            />
            <h3 className={cn("font-medium", isMobile ? "text-sm sm:text-base" : "text-lg")}>
              Personality Analysis
            </h3>
          </div>
          <div
            className={cn(
              "rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors",
              isMobile ? "p-3" : "p-4"
            )}
            style={{
              borderLeft: `2px solid ${userColors.primary}`,
            }}
          >
            <p className={cn("text-content", isMobile && "text-xs sm:text-sm")}>{description}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

const MBTIAnalysis: React.FC = () => {
  const { file, users } = useGeneralInfo()
  const isMobile = useIsMobile()
  const { getUserColors } = useUserColors()
  const colors = useThemeColors()

  const {
    data: analysis,
    isLoading,
    error,
  } = useS3Fetcher<AnalysisResult>({
    generator: performMBTIAnalysis,
    cachePath: 'chat/:hash:/mbti.json',
  })

  if (isLoading || error || !analysis || !users) {
    if (!file) {
      return null
    }
    return isLoading ? (
      <Card>
        <CardContent className={cn("flex justify-center", isMobile ? "p-6 sm:p-8" : "p-12")}>
          <div className={cn(
            "animate-spin rounded-full border-b-2 border-primary",
            isMobile ? "h-6 w-6" : "h-8 w-8"
          )} />
        </CardContent>
      </Card>
    ) : null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className={cn(isMobile ? "p-3 sm:p-4" : "p-6")}>
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className={cn(isMobile ? "text-lg sm:text-xl" : "text-2xl")}>
                Personality Analysis
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className={cn(isMobile && "text-xs")}>
                      Analysis of personality types based on the MBTI framework,
                      showing personality traits, strengths, and growth areas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-4 sm:space-y-6", isMobile ? "p-2 sm:p-4" : "p-6")}>
          {Object.entries(analysis?.finalPredictions || {}).map(
            ([participant, mbtiType]) => {
              const user = users.find((u) => u.username === participant)
              if (!user) return null

              const cachedDescription = analysis?.gptDescriptions[participant]
              const updatedDescription = updateUserReferences(
                cachedDescription,
                users
              )

              return (
                <MBTIDisplay
                  key={participant}
                  user={user}
                  mbtiType={mbtiType}
                  letterCounts={analysis.letterCounts[participant]}
                  description={
                    updatedDescription || 'Unable to generate profile.'
                  }
                />
              )
            }
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MBTIAnalysis
