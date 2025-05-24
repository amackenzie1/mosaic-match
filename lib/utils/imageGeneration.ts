import { config } from '@/lib/config'
import { ChatMessage } from '@/lib/types'
import axios from 'axios'
import { z } from 'zod'
import { anthropicBedrock, openaiImage } from '@amackenzie1/mosaic-lib'
import { checkFileExists, uploadUrlToS3 } from '@amackenzie1/mosaic-lib'
import { requestFile } from './s3cache'

const GPTDescriptionResponse = z.object({
  imagePrompt: z.string(),
  title: z.string(),
  description: z.string(),
  poem: z.string(),
  chatCategory: z.string(),
  suggestedStyles: z.array(z.string()),
})

export type GPTResponse = z.infer<typeof GPTDescriptionResponse>

export interface ImageContent {
  imagePrompt: string
  title: string
  description: string
  poem: string
  chatCategory: string
  suggestedStyles: string[]
}

export async function generateImagePromptFromChat(
  parsedData: ChatMessage[]
): Promise<ImageContent> {
  const chatText = parsedData
    .map((msg) => `${msg.user}: ${msg.message}`)
    .join('\n')
    .slice(-60000)

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
          ${chatText}
      
        Analyze this chat transcript and provide:
          1. An image prompt that:
             - Incorporates the style of an artist that matches the vibe of the conversation. Avoid mentioning the artist's name because that gets blocked.
             - Results in an artsy image that subtly incorporates objects or themes from the chat.
             - Is recognizable to the chatters as inspired by their conversation, while still being somewhat abstract.
             - Image should be beautiful and memorable.
          2. A short, humorous title for the artwork that relates to the conversation's themes.
          3. A witty description from an overly serious art connoisseur's perspective that touches on themes from the chat.
          4. A brief poem (4-6 lines) that relates to the image and incorporates themes from the chat.
          5. A chat category that best describes the relationship between the participants (romance, friendship, professional, family).
          6. A blend of four song styles inspired by this conversation.

          Format your response in the following JSON format:
          {
            "imagePrompt": "your image prompt here",
            "title": "your title here",
            "description": "your description here",
            "poem": "your poem here",
            "chatCategory": "one of: romance, friendship, professional, family",
            "suggestedStyles": ["style1", "style2", "style3", "style4"]
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
  const result = GPTDescriptionResponse.parse(parsed)

  if (!result) {
    throw new Error('No valid response in Claude result')
  }

  return {
    imagePrompt: result.imagePrompt,
    title: result.title,
    description: result.description,
    poem: result.poem,
    chatCategory: result.chatCategory,
    suggestedStyles: result.suggestedStyles,
  }
}

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

export const customImageSaver = async (
  path: string,
  hash: string,
  result: string
) => {
  const desiredFilePath = path.replace(':hash:', hash)
  await uploadUrlToS3(result, desiredFilePath, true)
  const response = await downsampleImage(desiredFilePath)
  console.log('downsample response', response)
}

export const customImageLoader = async (
  path: string,
  hash: string,
  token: string,
  refreshToken: () => Promise<string>
) => {
  const desiredFilePath = path.replace(':hash:', hash)
  const exists = await checkFileExists(desiredFilePath)
  if (!exists) {
    return null
  }
  const imageUrl = await requestFile(
    desiredFilePath,
    hash,
    token,
    refreshToken,
    true
  )
  return imageUrl
}

export const downsampleImage = async (key: string): Promise<string> => {
  const response = await axios.post(
    process.env.NEXT_PUBLIC_RUST_LAMBDA_ENDPOINT!,
    {
      action: 'downsample',
      key,
    }
  )
  return response.data
}
