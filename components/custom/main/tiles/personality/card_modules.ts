import { ChatMessage } from '@/lib/types'

// Types
export interface EmojiAnalysis {
  emoji: string
  count: number
  userId: string
}

export interface ChatAnalysis {
  emojiStats: EmojiAnalysis[]
}

export async function analyzeChat(
  messages: ChatMessage[]
): Promise<ChatAnalysis> {
  try {
    const userIds = [...new Set(messages.map((m) => m.user))]
    const emojiStats: EmojiAnalysis[] = []

    for (const userId of userIds) {
      const userMessages = messages.filter((m) => m.user === userId)

      // Emoji analysis
      const userEmojiStats = analyzeEmojis(userMessages).map((stat) => ({
        ...stat,
        userId,
      }))
      emojiStats.push(...userEmojiStats)
    }

    return {
      emojiStats,
    }
  } catch (error) {
    console.error('Error in chat analysis:', error)
    return {
      emojiStats: [],
    }
  }
}

function analyzeEmojis(
  messages: ChatMessage[]
): Omit<EmojiAnalysis, 'userId'>[] {
  // Updated emoji regex pattern that better handles modern emojis including skin tones and ZWJ sequences
  const emojiRegex =
    /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\uFE0F/gu
  const emojiCounts = new Map<string, number>()

  messages.forEach((msg) => {
    const emojis = msg.message.match(emojiRegex) || []
    emojis.forEach((emoji) => {
      if (emoji.trim()) {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1)
      }
    })
  })

  return Array.from(emojiCounts.entries())
    .map(([emoji, count]) => ({
      emoji,
      count,
    }))
    .filter((stat) => stat.emoji.trim())
    .sort((a, b) => b.count - a.count)
    .slice(0, 7) // Get top 7 emojis
}
