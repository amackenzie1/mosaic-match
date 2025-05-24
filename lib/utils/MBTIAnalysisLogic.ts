import { config } from '@/lib/config'
import { ChatMessage } from '@/lib/types'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
// Types and schemas
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
      parsed?: unknown
    }
  }>
}

export interface AnalysisResult {
  finalPredictions: { [key: string]: string }
  gptDescriptions: { [key: string]: string }
  chunkCount: number
  letterCounts: { [key: string]: { [key: string]: number } }
}

const MBTIResponse = z.object({
  user1_type: z.string(),
  user2_type: z.string(),
  user1_justification: z.string(),
  user2_justification: z.string(),
})

type MBTIResponseType = z.infer<typeof MBTIResponse>

const GPTDescriptionResponse = z.object({
  u1: z.string(),
  u2: z.string(),
})

// Utility Functions
export const createAdaptiveChunks = (
  messages: ChatMessage[],
  maxChunkCount = 1000,
  minMessagesPerParticipant = 7
): [number, number][] => {
  const totalMessages = messages.length
  const chunks: [number, number][] = []

  let start = 0
  while (start < totalMessages && chunks.length < maxChunkCount) {
    let end = start
    const participantCounts: { [key: string]: number } = {}

    while (end < totalMessages) {
      const user = messages[end].user
      participantCounts[user] = (participantCounts[user] || 0) + 1
      end++

      if (
        Object.values(participantCounts).every(
          (count) => count >= minMessagesPerParticipant
        )
      ) {
        chunks.push([start, end])
        start = end
        break
      }
    }

    // If we've reached the end without finding a valid chunk, break the loop
    if (end === totalMessages) {
      break
    }
  }

  return chunks
}

const createPrompt = (
  messages: ChatMessage[],
  start: number,
  end: number,
  topUsers: string[]
): string => {
  let prompt = `Analyze the following WhatsApp conversation chunk and predict the MBTI personality types of the participants. Provide only the MBTI type for each participant.

Consider the following aspects when analyzing:

E (Extraversion) vs I (Introversion):
   - E: Prefers social interaction and gains energy from engaging with the external world.
   - I: Prefers solitude and gains energy from internal reflection and time alone.

N (Intuition) vs S (Sensing):
   - N: Focuses on patterns, possibilities, and abstract concepts beyond immediate data.
   - S: Focuses on concrete, practical information gathered through the five senses.

T (Thinking) vs F (Feeling):
   - T: Makes decisions based on logic, objective analysis, and impersonal criteria.
   - F: Makes decisions based on personal values, emotions, and consideration of others.

P (Perceiving) vs J (Judging):
   - P: Prefers flexibility, spontaneity, and keeping options open in lifestyle and decision-making.
   - J: Prefers structure, organization, and planning in lifestyle and decision-making.

A (Assertive) vs T (Turbulent):
   - A: Exhibits self-confidence, handles stress calmly, and remains emotionally stable.
   - T: Prone to self-doubt and stress, continually strives for improvement, and may be perfectionistic.

The classification given to one person should have absolutely no effect on the classification of another. Also output a VERY BRIEF justification for your classifications. Format should be as follows:

{
  "user1_type": "5-letter MBTI type (formatted as ____-_)",
  "user2_type": "5-letter MBTI type (formatted as ____-_)",
  "user1_justification": "Brief justification",
  "user2_justification": "Brief justification",
}

Based on these messages, what are the likely MBTI types of each participant?

`

  prompt += 'Conversation:\n\n'
  for (let i = start; i < end; i++) {
    // Replace actual usernames with user_1 and user_2
    const username = messages[i].user === topUsers[0] ? 'user_1' : 'user_2'
    prompt += `${username}: ${messages[i].message}\n`
  }

  return prompt
}

const countMbtiLetters = (mbtiList: string[]): { [key: string]: number } => {
  const letterCounts: { [key: string]: number } = {
    E: 0,
    I: 0,
    N: 0,
    S: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
    a: 0,
    t: 0,
  }

  mbtiList.forEach((mbti) => {
    let [type, variant] = mbti.split('-')

    // Ensure that variant is defined and set to a default value if not
    variant = variant ? variant.toLowerCase() : ''

    type.split('').forEach((letter) => {
      if (letter in letterCounts) {
        letterCounts[letter]++
      }
    })

    // Only count 'a' or 't' if they exist
    if (variant === 'a' || variant === 't') {
      letterCounts[variant]++
    }
  })

  return letterCounts
}

const determineFinalMbti = (letterCounts: {
  [key: string]: number
}): string => {
  const pairs = [
    ['E', 'I'],
    ['N', 'S'],
    ['T', 'F'],
    ['J', 'P'],
    ['a', 't'],
  ]

  let finalMbti = ''

  pairs.forEach(([a, b]) => {
    if (letterCounts[a] > letterCounts[b]) {
      finalMbti += a.toUpperCase()
    } else if (letterCounts[b] > letterCounts[a]) {
      finalMbti += b.toUpperCase()
    } else {
      // If tied, choose randomly
      finalMbti += Math.random() < 0.5 ? a.toUpperCase() : b.toUpperCase()
    }
  })

  // Add the hyphen before the last character (a/t)
  return finalMbti.slice(0, 4) + '-' + finalMbti.slice(4).toLowerCase()
}

async function generateMBTIDescriptions(
  mbtiTypes: { [key: string]: string },
  chatHistories: { [key: string]: string }
): Promise<{ [key: string]: string }> {
  const usernames = Object.keys(mbtiTypes)
  try {
    const inputPrompt = `Based on the following chat histories, provide brief (4-6 sentences each) humorous (slightly unhinged and lean a bit dark, but nothing too inappropriate) and insightful descriptions for both users. Include key traits, strengths, and potential weaknesses of their MBTI types. The descriptions should reference each user's specific messages and behaviors and not be generic. Ensure that both descriptions are distinct in their words and analogies when describing each user, and that you generate COMPLETE SENTENCES FOR EACH USER.

User 1 (${usernames[0]}, ${mbtiTypes[usernames[0]]}):
${chatHistories[usernames[0]].slice(-15000)}

User 2 (${usernames[1]}, ${mbtiTypes[usernames[1]]}):
${chatHistories[usernames[1]].slice(-15000)}

Provide the descriptions in the following JSON format, ensuring it's valid JSON:
{
  "${usernames[0]}": "Description for ${usernames[0]}",
  "${usernames[1]}": "Description for ${usernames[1]}"
}`

    const completion = await openaiBeta({
      model: config.textModel,
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that provides humorous and insightful MBTI personality descriptions. Always respond in valid JSON format with keys for each username and values as string descriptions. Ensure your response can be parsed by JSON.parse().',
        },
        {
          role: 'user',
          content: inputPrompt,
        },
      ],
      response_format: zodResponseFormat(
        GPTDescriptionResponse,
        'gptDescriptionResponse'
      ),
      temperature: 1,
      max_tokens: 6000,
    })

    console.log('MBTI response: ', completion)
    const result = GPTDescriptionResponse.parse(
      completion.choices[0].message.parsed
    )

    if (result) {
      return {
        [usernames[0]]: result.u1,
        [usernames[1]]: result.u2,
      }
    } else {
      throw new Error('Failed to parse GPT response')
    }
  } catch (error) {
    return Object.fromEntries(
      Object.keys(mbtiTypes).map((username) => [
        username,
        'Error generating MBTI description.',
      ])
    )
  }
}

// Main analysis function
export const performMBTIAnalysis = async (
  parsedData: ChatMessage[]
): Promise<AnalysisResult> => {
  const allUsers = parsedData.reduce((acc, msg) => {
    acc[msg.user] = (acc[msg.user] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const sortedUsers = Object.keys(allUsers).sort(
    (a, b) => allUsers[b] - allUsers[a]
  )

  const topUsers = sortedUsers.slice(0, 2)
  topUsers.sort()

  const chunks = createAdaptiveChunks(parsedData)
  const predictions = await processChunks(chunks, parsedData, topUsers)
  const result = await calculateFinalPredictions(
    predictions,
    parsedData,
    topUsers
  )

  return { ...result, chunkCount: chunks.length }
}

const processChunks = async (
  chunks: [number, number][],
  parsedData: ChatMessage[],
  topUsers: string[]
): Promise<MBTIResponseType[]> => {
  // Prepare all valid prompts first
  const validPrompts = chunks
    .map((chunk) => {
      const [start, end] = chunk
      const chunkData = parsedData.slice(start, end)

      const messageCounts = chunkData.reduce((counts, msg) => {
        counts[msg.user] = (counts[msg.user] || 0) + 1
        return counts
      }, {} as { [key: string]: number })

      if (!topUsers.every((user) => (messageCounts[user] || 0) >= 6)) {
        return null
      }

      return {
        messages: [
          {
            role: 'system' as const,
            content: `You are an MBTI expert analyzing chat conversations. Note that user_1 corresponds to ${topUsers[0]} and user_2 corresponds to ${topUsers[1]}. When providing justifications, ensure that user1_justification is about ${topUsers[0]} and user2_justification is about ${topUsers[1]}. Provide your response in a JSON format`,
          },
          {
            role: 'user' as const,
            content: createPrompt(parsedData, start, end, topUsers),
          },
        ],
        response_format: zodResponseFormat(MBTIResponse, 'mbtiResponse'),
        temperature: 0,
      }
    })
    .filter((prompt): prompt is NonNullable<typeof prompt> => prompt !== null)

  // Create batches of 25 prompts
  const batches = Array.from(
    { length: Math.ceil(validPrompts.length / 25) },
    (_, i) => validPrompts.slice(i * 25, (i + 1) * 25)
  )

  // Process all batches in parallel
  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      try {
        const responses = await openaiBeta(
          batch.map((prompt) => {
            return {
              model: config.textModel,
              ...prompt,
            }
          })
        )

        return responses
          .map((response: OpenAIResponse) => {
            try {
              const content = response.choices[0].message.content
              if (!content) return null

              const parsed = JSON.parse(content)
              if (!MBTIResponse.safeParse(parsed).success) return null

              return parsed
            } catch (error) {
              console.error('Error processing response:', error)
              return null
            }
          })
          .filter(
            (response: unknown): response is MBTIResponseType =>
              response !== null
          )
      } catch (error) {
        console.error('Batch processing error:', error)
        return []
      }
    })
  )

  // Flatten the results from all batches
  return batchResults.flat()
}

const calculateFinalPredictions = async (
  predictions: MBTIResponseType[],
  parsedData: ChatMessage[],
  topUsers: string[]
): Promise<Omit<AnalysisResult, 'chunkCount'>> => {
  const allPredictions: { [key: string]: string[] } = {
    [topUsers[0]]: [],
    [topUsers[1]]: [],
  }

  predictions.forEach((prediction) => {
    allPredictions[topUsers[0]].push(prediction.user1_type)
    allPredictions[topUsers[1]].push(prediction.user2_type)
  })

  const finalPredictions: { [key: string]: string } = {}
  const letterCounts: { [key: string]: { [key: string]: number } } = {}
  const chatHistories: { [key: string]: string } = {}

  for (const [participant, mbtiList] of Object.entries(allPredictions)) {
    const letterCount = countMbtiLetters(mbtiList)
    const mbtiType = determineFinalMbti(letterCount)
    letterCounts[participant] = letterCount
    finalPredictions[participant] = mbtiType

    chatHistories[participant] = parsedData
      .filter((msg) => msg.user === participant)
      .map((msg) => `${msg.user}: ${msg.message}`)
      .join('\n')
  }

  const gptDescriptions = await generateMBTIDescriptions(
    finalPredictions,
    chatHistories
  )

  return { finalPredictions, gptDescriptions, letterCounts }
}
