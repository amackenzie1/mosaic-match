import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { config } from '@/lib/config'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
import { checkFileExists, uploadJsonToS3 } from '@amackenzie1/mosaic-lib'
import { requestFileWithToken } from './s3cache'
import { ChatMessage } from '@/lib/types'

// Define types
export interface Chapter {
  title: string
  summary: string
}

export interface MissingEvent {
  eventPrompt: string
  userInput?: string
}

// Story styles - single source of truth
export const STORY_STYLES = [
  {
    name: 'Fantasy',
    description:
      'A magical world where your story unfolds with elements of wonder and mysticism',
    example: 'Think Lord of the Rings or Harry Potter style narrative',
  },
  {
    name: 'Sci-Fi',
    description:
      'Your story reimagined in a futuristic setting with advanced technology',
    example: 'Similar to Star Wars or Dune',
  },
  {
    name: 'Romance',
    description:
      'A heartfelt journey focusing on relationships and emotional connections',
    example: 'In the style of Nicholas Sparks or Jane Austen',
  },
  {
    name: 'Mystery',
    description: 'Your story told through the lens of intrigue and suspense',
    example: 'Like Sherlock Holmes or Agatha Christie',
  },
  {
    name: 'Shakespearean',
    description: 'A shakespearean play full of drama and twists',
    example: 'Like Romeo and Juliet',
  },
]

// Define schema for story response
const StoryResponseSchema = z.object({
  chapters: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
    })
  ),
})

const StoryContentResponseSchema = z.object({
  content: z.string(),
})

// Define style-specific system prompts
const STYLE_PROMPTS = {
  Fantasy: {
    system: `You are a master of fantasy storytelling in the vein of J.R.R. Tolkien and J.K. Rowling. Transform chat conversations into magical storybook chapters filled with wonder and mysticism. Each chapter should be structured into distinct scenes that could be beautifully illustrated, incorporating fantasy elements while staying true to the emotional core of the conversation.`,
    style_guide: `
- Weave in magical elements naturally without overshadowing the core story
- Use rich, enchanting descriptions that paint a vivid picture
- Include subtle world-building details that enhance the fantasy setting
- Balance magical elements with relatable emotional moments
- Consider how magical effects could be illustrated dramatically`,
  },
  'Sci-Fi': {
    system: `You are an expert science fiction storyteller in the tradition of Isaac Asimov and Arthur C. Clarke. Transform chat conversations into futuristic storybook chapters that blend technology with human emotion. Each scene should be visually striking and suitable for illustration, incorporating sci-fi elements while maintaining the conversation's emotional authenticity.`,
    style_guide: `
- Integrate futuristic technology seamlessly into the narrative
- Create vivid descriptions of sci-fi environments and gadgets
- Balance technical elements with human connection
- Include memorable visual set-pieces perfect for illustration
- Maintain scientific plausibility while embracing wonder`,
  },
  Romance: {
    system: `You are a skilled romance storyteller in the style of Jane Austen and Nicholas Sparks. Transform chat conversations into heartfelt storybook chapters that capture the beauty of human connection. Each scene should be emotionally resonant and perfect for illustration, focusing on meaningful moments and subtle expressions.`,
    style_guide: `
- Focus on emotional dynamics and subtle interactions
- Paint vivid pictures of meaningful locations and moments
- Capture body language and facial expressions in detail
- Create atmospheric scenes perfect for romantic illustrations
- Balance dialogue with internal reflection`,
  },
  Mystery: {
    system: `You are a masterful mystery storyteller in the tradition of Agatha Christie and Arthur Conan Doyle. Transform chat conversations into intriguing storybook chapters filled with subtle clues and atmospheric tension. Each scene should be visually interesting and illustration-worthy, building suspense while revealing character.`,
    style_guide: `
- Create atmospheric descriptions that set the mood
- Include subtle visual details that could be hidden in illustrations
- Focus on character expressions and body language
- Build tension through environmental descriptions
- Balance dialogue with observational details`,
  },
  Shakespearean: {
    system: `You are a virtuoso of Shakespearean storytelling. Transform chat conversations into dramatic storybook chapters with the flair and poetry of the Bard himself. Each scene should be theatrically vivid and perfect for illustration, while maintaining the emotional truth of the conversation.`,
    style_guide: `
- Use poetic language that remains accessible
- Create dramatic scenes worthy of the stage
- Include asides and soliloquies when appropriate
- Focus on grand gestures and emotional moments
- Balance period elements with relatable feelings`,
  },
}

// Core story generation logic - no tokens needed
export async function generateChapters(
  style: string,
  chatData: ChatMessage[]
): Promise<Chapter[]> {
  try {
    console.log('Starting generateChapters function...', {
      style,
      chatDataLength: chatData?.length,
    })

    const chatText = chatData
      .map((msg) => `${msg.user}: ${msg.message}`)
      .join('\n')
      .slice(-70000)

    console.log('Prepared chat text for OpenAI:', {
      chatTextLength: chatText.length,
      firstFewChars: chatText.slice(0, 100),
    })

    const response = await openaiBeta({
      model: config.textModel,
      messages: [
        {
          role: 'system',
          content: `You are a creative writing assistant that transforms chat conversations into fun story chapters. Create engaging chapter titles and summaries in the requested style. Try to find four distinct "arcs" in the chats that are easily convertable to a story and create a chapter for each arc.`,
        },
        {
          role: 'user',
          content: `Here is the chat conversation:
${chatText}

Please create 4 fun chapter titles and summaries in ${style} style based on this chat conversation. Make it feel like a complete story arc. VERY IMPORTANT!! THE CHAPTERS AND STORIES SHOULD BE DIRECTLY INSPIRED BY THE CHAT AND THE EVENTS THAT TAKE PLACE IN IT!! Format the chapters and description keeping in mind that you will need to eventually create a full chapter from this title and description.

Respond in this exact JSON format:
{
  "chapters": [
    {
      "title": "An engaging ${style} style chapter title",
      "summary": "A brief, fun summary of what this chapter would be about"
    }
  ]
}`,
        },
      ],
      response_format: zodResponseFormat(StoryResponseSchema, 'chapters'),
      temperature: 1,
    })

    const parsed = StoryResponseSchema.parse(
      response.choices[0]?.message.parsed
    )
    if (!parsed) {
      throw new Error('No content in response')
    }
    return parsed.chapters
  } catch (error) {
    console.error('Error in generateChapters:', error)
    throw error
  }
}

export async function generateChapterContent(
  style: string,
  chapterIndex: number,
  chatData: ChatMessage[]
): Promise<string> {
  try {
    console.log('Generating chapter content...')

    const chatText = chatData
      .map((msg) => `${msg.user}: ${msg.message}`)
      .join('\n')
      .slice(-70000)

    const stylePrompt = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || {
      system:
        'You are a creative writing assistant that transforms chat conversations into engaging stories.',
      style_guide: '',
    }

    const response = await openaiBeta({
      model: config.textModel,
      messages: [
        {
          role: 'system',
          content: `${stylePrompt.system} You are creating a storybook chapter where each scene will be paired with a custom illustration. For each scene, you will provide both the narrative text and a detailed image generation prompt that captures the scene's key visual elements.`,
        },
        {
          role: 'user',
          content: `Here is the chat conversation to transform:
${chatText}

Please write chapter ${
            chapterIndex + 1
          } in ${style} style based on this chat conversation. Format it as an illustrated storybook chapter with the following structure:

[Chapter Title]

[Scene 1]
{Narrative Text}
A vivid, descriptive paragraph setting the scene and telling part of the story. Focus on visual elements and emotional moments that will make for a compelling illustration.

{Image Prompt}
A detailed prompt for an AI image generation model (like DALL-E or Midjourney) that captures the key visual elements of this scene. Include style, mood, composition, lighting, and important details. Format: "Illustration prompt: [your prompt]"

[Scene 2]
{Narrative Text}
Another vivid scene that advances the story, written with visual storytelling in mind.

{Image Prompt}
A detailed image generation prompt for this scene.

[Scene 3 (if needed)]
{Narrative Text}
A final scene that brings the chapter to a satisfying conclusion.

{Image Prompt}
A detailed image generation prompt for this scene.

Style-specific guidelines:
${stylePrompt.style_guide}

General guidelines:
- Each scene should be a distinct moment that will make for a striking illustration
- Keep scenes focused and visually rich (1-2 paragraphs each)
- Include clear visual details that will translate well to illustrations
- Ensure each scene could work as a storybook page spread
- Image prompts should be detailed and specific, including:
  * Main subject and action
  * Environment and setting
  * Lighting and atmosphere
  * Style and artistic approach
  * Important details and props
  * Character expressions and poses
  * Composition suggestions
- VERY IMPORTANT: Make sure the story and scenes are directly inspired by events and dialogue from the chat conversation

Please format with clear spacing between scenes, and clearly separate narrative text from image prompts.

Remember that this will be a physical storybook, so each scene needs to be visually engaging and worthy of a full-page illustration.`,
        },
      ],
      response_format: zodResponseFormat(StoryContentResponseSchema, 'content'),
    })

    return StoryContentResponseSchema.parse(response.choices[0].message.parsed)
      .content
  } catch (error) {
    console.error('Error generating chapter content:', error)
    throw error
  }
}

// S3 operations that need tokens
export const storyS3Operations = {
  loadStory: async (
    path: string,
    hash: string,
    token: string,
    refreshToken: () => Promise<string>
  ) => {
    const desiredPath = path.replace(':hash:', hash)
    const exists = await checkFileExists(desiredPath)
    if (!exists) {
      return null
    }
    return await requestFileWithToken(token, refreshToken, desiredPath)
  },

  saveStory: async (path: string, hash: string, result: any) => {
    const desiredPath = path.replace(':hash:', hash)
    await uploadJsonToS3(desiredPath, result)
  },
}
