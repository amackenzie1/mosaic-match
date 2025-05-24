import { config } from '@/lib/config'
import { ChatMessage } from '@/lib/types'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
import { uploadJsonToS3 } from '@amackenzie1/mosaic-lib'

// Define the stats schema
export const PersonalityStatsSchema = z.object({
  intelligence: z.number(),
  morality: z.number(),
  wisdom: z.number(),
  independence: z.number(),
  influence: z.number(),
})

export type PersonalityStats = z.infer<typeof PersonalityStatsSchema>

// Define the user stats response schema for multiple users
export const UserStatsResponseSchema = (topUsers: [string, string]) =>
  z.object({
    [topUsers[0]]: z.object({
      stats: PersonalityStatsSchema,
      rationale: z.string(),
    }),
    [topUsers[1]]: z.object({
      stats: PersonalityStatsSchema,
      rationale: z.string(),
    }),
  })

export type UserStatsResponse = z.infer<
  ReturnType<typeof UserStatsResponseSchema>
>

export const generateUserStatsPrompt = (
  topUsers: [string, string],
  chatText: string
) => `Here's the chat:
${chatText}

Scoring guidelines:
Use the full range of scores (0-100) and provide specific evidence from their messages.

Intelligence (0-100):
95-100: Exceptional intellectual capacity, creates novel insights, handles complex topics masterfully
80-94: Strong analytical skills, makes insightful connections, explains complex ideas well
60-79: Average reasoning, follows and contributes to discussions competently
40-59: Basic comprehension, occasional misunderstandings, simpler contributions
0-39: Frequent confusion, misses key points, struggles with basic concepts

Morality (0-100):
95-100: Exemplary ethical behavior, champions others' wellbeing, actively prevents harm
80-94: Strong moral compass, consistent empathy, considers ethical implications
60-79: Generally ethical, follows social norms, basic consideration for others
40-59: Inconsistent ethics, occasional disregard for others, self-focused
0-39: Poor ethical judgment, manipulative, disregards others' wellbeing

Wisdom (0-100):
95-100: Exceptional judgment, learns deeply from experience, gives profound advice
80-94: Good life insights, learns from mistakes, shares valuable perspectives
60-79: Average judgment, learns obvious lessons, basic advice-giving
40-59: Limited learning from experience, repeats mistakes, superficial insights
0-39: Poor judgment, doesn't learn from mistakes, gives harmful advice

Independence (0-100):
95-100: Highly autonomous, clear boundaries, leads initiatives confidently
80-94: Self-directed, makes own decisions, healthy interdependence
60-79: Moderate autonomy, sometimes seeks validation, follows others' lead
40-59: Often dependent, easily influenced, needs frequent guidance
0-39: Highly dependent, no clear boundaries, constant validation seeking

Influence (0-100):
95-100: Natural leader, highly persuasive, shapes group dynamics and decisions
80-94: Often takes lead, respected voice, meaningful impact on discussions
60-79: Sometimes influential, occasional leadership moments, contributes ideas
40-59: Limited influence, follows more than leads, minimal impact
0-39: No influence, passive follower, ideas rarely acknowledged

Scoring requirements:
- Base scores on specific message examples
- Consider patterns across multiple messages
- Note both positive and negative instances
- Account for context and conversation dynamics
- Provide clear evidence for extreme scores (very high or very low)

Analyze each user's messages and provide:
{
  "${topUsers[0]}": {
    "stats": {
      "intelligence": number,
      "morality": number,
      "wisdom": number,
      "independence": number,
      "influence": number
    },
    "rationale": string  // Brief explanation with specific examples
  },
  "${topUsers[1]}": {
    "stats": {
      "intelligence": number,
      "morality": number,
      "wisdom": number,
      "independence": number,
      "influence": number
    },
    "rationale": string  // Brief explanation with specific examples
  }
}`

// Helper function to calculate stats for multiple users
export const calculateMultiUserStats = async (
  parsedData: ChatMessage[]
): Promise<UserStatsResponse> => {
  // Simple raw message logging
  console.log(
    'Raw Chat Messages:',
    parsedData.slice(0, 5).map((msg) => ({
      user: msg.user,
      message: msg.message,
      raw: msg,
    }))
  )

  // Extract and sort users by message count, then take top 2 and sort alphabetically
  const userCounts = parsedData.reduce((acc, msg) => {
    acc[msg.user] = (acc[msg.user] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const topUsers = Object.keys(userCounts)
    .sort((a, b) => userCounts[b] - userCounts[a]) // Sort by message count
    .slice(0, 2) // Take top 2
    .sort() as [string, string] // Sort alphabetically

  // Standardize chat text format
  const chatText = parsedData
    .map((msg) => `${msg.user}: ${msg.message}`)
    .join('\n')
    .slice(-60000)

  const completion = await openaiBeta({
    model: config.textModel,
    messages: [
      {
        role: 'system',
        content: `You are a master psychologist that analyzes peoples chats and assigns them attribute scores. Note that user_1 corresponds to ${topUsers[0]} and user_2 corresponds to ${topUsers[1]}.`,
      },
      {
        role: 'user',
        content: generateUserStatsPrompt(topUsers, chatText),
      },
    ],
    temperature: 0,
    response_format: zodResponseFormat(
      UserStatsResponseSchema(topUsers),
      'gptResponse'
    ),
    max_tokens: 2000,
  })

  const result = UserStatsResponseSchema(topUsers).parse(
    completion.choices[0].message.parsed
  )

  // Add S3 caching
  await uploadJsonToS3('chat/:hash:/numerical-stats.json', result)

  return result
}
