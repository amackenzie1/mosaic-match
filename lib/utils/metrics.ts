import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { config } from '@/lib/config'
import { ChatMessage } from '@/lib/types'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
import { openrouter } from '@amackenzie1/mosaic-lib'

const parseDuration = (durationStr: string): number => {
  try {
    const parts = durationStr.split(' ')
    let totalSeconds = 0
    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i])
      const unit = parts[i + 1].toLowerCase()
      if (unit.startsWith('hr')) totalSeconds += value * 3600
      else if (unit.startsWith('min')) totalSeconds += value * 60
      else if (unit.startsWith('sec')) totalSeconds += value
    }
    return totalSeconds
  } catch (error) {
    console.error('Error parsing duration:', error)
    return 0
  }
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const hoursDisplay = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''
  const minutesDisplay =
    minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''
  const secondsDisplay =
    seconds > 0 ? `${seconds} second${seconds !== 1 ? 's' : ''}` : ''

  const result = [hoursDisplay, minutesDisplay, secondsDisplay]
    .filter(Boolean)
    .join(', ')
  return result || '0 seconds'
}

const videoCallPatterns = [
  /video call.*?(\d+\s*(?:hr|min|sec))/i,
  /video chat.*?(\d+\s*(?:hr|min|sec))/i,
]

const voiceCallPatterns = [
  /voice call.*?(\d+\s*(?:hr|min|sec))/i,
  /audio call.*?(\d+\s*(?:hr|min|sec))/i,
  /call.*?(\d+\s*(?:hr|min|sec))/i,
]

const missedCallPatterns = [
  /missed video call/i,
  /missed voice call/i,
  /missed call/i,
  /no answer/i,
  /missed group voice call/i,
]

const calculateMostCommonMessages = (
  chatData: ChatMessage[]
): [string, number][] => {
  const commonSystemMessages = [
    'image absente',
    'vidéo absente',
    'audio omis',
    'vous avez supprimé ce message',
    'image omitted',
    'video omitted',
    'audio omitted',
    'you deleted this message',
    '<media omitted>',
    'null',
    'missed video call',
    'missed voice call',
    'missed call',
    'no answer',
    'missed group voice call',
    'sticker omitted',
  ]

  const messageCounts = chatData.reduce((acc, message) => {
    const content = message.message.trim().toLowerCase()
    if (
      content !== '' &&
      content.length > 1 &&
      !commonSystemMessages.some((sysMsg) => content.includes(sysMsg))
    ) {
      acc[content] = (acc[content] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return Object.entries(messageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
}

const calculateCallTimes = (chatData: ChatMessage[]) => {
  let videoCallSeconds = 0
  let voiceCallSeconds = 0
  let missedCalls = 0
  const missedCallMessages: string[] = []

  chatData.forEach((message) => {
    const content = message.message

    for (const pattern of videoCallPatterns) {
      const match = content.match(pattern)
      if (match) {
        videoCallSeconds += parseDuration(match[1])
        break
      }
    }

    for (const pattern of voiceCallPatterns) {
      const match = content.match(pattern)
      if (match) {
        voiceCallSeconds += parseDuration(match[1])
        break
      }
    }

    for (const pattern of missedCallPatterns) {
      if (pattern.test(content)) {
        missedCalls++
        missedCallMessages.push(content)
        break
      }
    }
  })

  return {
    videoCallTime: formatDuration(videoCallSeconds),
    voiceCallTime: formatDuration(voiceCallSeconds),
    missedCalls,
    missedCallMessages,
  }
}

const calculateAdditionalMetrics = (chatData: ChatMessage[]) => {
  const totalMessages = chatData.length
  const totalWords = chatData.reduce(
    (acc, message) => acc + message.message.split(/\s+/).length,
    0
  )

  const firstMessageDate = new Date(chatData[0].date)
  const lastMessageDate = new Date(chatData[chatData.length - 1].date)
  const totalDays = Math.ceil(
    (lastMessageDate.getTime() - firstMessageDate.getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return {
    totalMessages,
    totalWords,
    totalDays,
    averageMessagesPerDay: totalMessages / totalDays,
    averageWordsPerMessage: totalWords / totalMessages,
  }
}

const SystemMessageSchema = z.object({
  content: z.string(),
})

const filterSystemMessages = async (
  messages: [string, number][]
): Promise<[string, number][]> => {
  try {
    const response = await openaiBeta({
      model: config.textModel,
      messages: [
        {
          role: 'system',
          content:
            "You are an AI assistant that filters out system messages and variations of 'omitted' messages from a list of common chat messages.",
        },
        {
          role: 'user',
          content: `Filter out system messages and variations of "video absent, call missed, supprime message, omitted/omis message" as well as common conversational words from this list. Return only the filtered list of interesting word messages with their counts, separated by newlines:\n\n${messages
            .map(([msg, count]) => `${msg}: ${count}`)
            .join('\n')}`,
        },
      ],
      response_format: zodResponseFormat(SystemMessageSchema, 'content'),
      temperature: 0,
    })

    const filteredMessages = SystemMessageSchema.parse(
      response.choices[0].message.parsed
    )
      .content.split('\n')
      .map((line: string) => {
        const [msg, countStr] = line.split(': ')
        return [msg.trim(), parseInt(countStr.trim())] as [string, number]
      })
      .filter(([msg, count]: [string, number]) => msg && !isNaN(count))

    return filteredMessages.length > 0 ? filteredMessages : messages
  } catch (error) {
    console.error('Error filtering system messages:', error)
    return messages
  }
}

export const calculateAllMetrics = async (
  chatData: ChatMessage[]
): Promise<string[]> => {
  const commonMessages = calculateMostCommonMessages(chatData)
  const filteredCommonMessages = await filterSystemMessages(commonMessages)
  const callTimes = calculateCallTimes(chatData)
  const additionalMetrics = calculateAdditionalMetrics(chatData)

  const { videoCallTime, voiceCallTime, missedCalls } = callTimes
  const {
    totalMessages,
    totalWords,
    totalDays,
    averageMessagesPerDay,
    averageWordsPerMessage,
  } = additionalMetrics

  const result = [
    videoCallTime !== '0 seconds'
      ? `Video call duration: ${videoCallTime}`
      : 'No video calls recorded',
    voiceCallTime !== '0 seconds'
      ? `Voice call duration: ${voiceCallTime}`
      : 'No voice calls recorded',
    `Missed calls: ${missedCalls}`,
    filteredCommonMessages.length > 0 && filteredCommonMessages[0][1] > 1
      ? `Most frequent message: "${filteredCommonMessages[0][0]}" (${filteredCommonMessages[0][1]} times)`
      : 'No common messages found',
    `Total messages: ${totalMessages}`,
    `Total words: ${totalWords}`,
    `Conversation duration: ${totalDays} days`,
    `Messages per day: ${averageMessagesPerDay.toFixed(1)}`,
    `Average message length: ${averageWordsPerMessage.toFixed(1)} words`,
  ]

  return result
}
