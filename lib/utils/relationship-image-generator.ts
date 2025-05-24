import { config } from '@/lib/config'
import { anthropicBedrock, openaiImage } from '@amackenzie1/mosaic-lib'
import { z } from 'zod'

const ImagePromptResponse = z.object({
  imagePrompt: z.string(),
  title: z.string(),
  description: z.string(),
  poem: z.string(),
})

export type RelationshipImageContent = {
  imagePrompt: string
  title: string
  description: string
  poem: string
}

/**
 * Generate an image prompt from a chat text
 */
export async function generatePromptFromChat(
  chatContent: string
): Promise<RelationshipImageContent> {
  // Trim the content to the maximum context size
  const trimmedChat = chatContent.slice(-60000)

  const response = await anthropicBedrock({
    model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a poetic artist who looks at chats and creates beautiful descriptions and poems from them.`,
      },
      {
        role: 'user',
        content: `Conversation to analyze:
          ${trimmedChat}
      
        Analyze this chat transcript and provide:
          1. An image prompt that:
             - Incorporates the style of an artist that matches the vibe of the conversation. Avoid mentioning the artist's name because that gets blocked.
             - Results in a surreal, symbolic image that represents the essence of the relationship between the people in this conversation.
             - Is recognizable to the chatters as inspired by their relationship, while still being somewhat abstract and artistic.
             - Image should be beautiful and memorable, capturing their relationship dynamics.
          2. A short, meaningful title for the artwork that relates to the relationship themes.
          3. A thoughtful description from an art connoisseur's perspective that touches on the relationship dynamics revealed in the chat.
          4. A brief poem (4-6 lines) that captures the essence of the relationship.

          Format your response in the following JSON format:
          {
            "imagePrompt": "your image prompt here",
            "title": "your title here",
            "description": "your description here",
            "poem": "your poem here"
          }`,
      },
    ],
    temperature: 1,
  })

  if (response.content[0]?.type !== 'text') {
    throw new Error('Invalid response type from Claude')
  }

  const content = response.content[0].text
  const parsed = JSON.parse(content)
  const result = ImagePromptResponse.parse(parsed)

  if (!result) {
    throw new Error('No valid response in Claude result')
  }

  return {
    imagePrompt: result.imagePrompt,
    title: result.title,
    description: result.description,
    poem: result.poem,
  }
}

/**
 * Generate an image from a prompt using OpenAI's DALL-E
 */
export async function generateImage(imagePrompt: string): Promise<string> {
  const imageResponse = await openaiImage({
    model: config.imageModel,
    prompt: imagePrompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  })

  return imageResponse.data[0]?.url || ''
} 