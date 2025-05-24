import axios, { AxiosError } from 'axios'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { config } from '@/lib/config'
import { openaiBeta } from '@amackenzie1/mosaic-lib'
import { requestFileWithToken } from './s3cache'
import { checkFileExists, uploadBlobToS3, uploadJsonToS3 } from '@amackenzie1/mosaic-lib'
import { ChatMessage } from '@/lib/types'

const SongResponseSchema = z.object({
  prompt: z.string(),
  tags: z.string(),
  title: z.string(),
  make_instrumental: z.boolean(),
  wait_audio: z.boolean(),
})

export type Song = {
  audioUrl: string
  imageUrl?: string
  title: string
}

export type SongContent = {
  songs: Song[]
  lyrics: string
}

const generatePrompt = (
  chatText: string,
  category: string,
  styles: string[],
  inspiration: string
): string => {
  return `Create personalized song lyrics based on the given chat, making sure that they reflect the chat's ${category} nature. The song should be in a ${styles.join(
    ', '
  )} style and inspired by ${inspiration}. 
  The lyrics should capture key elements, themes, and moments from the chat, making it recognizable to the people involved if they were to hear it. Format the output to include sections like verses, choruses, bridges, and outros using line breaks (e.g., /n) to indicate spacing, but don't constrain to a specific structure (end song with [End] tag). 
  Remember the song is meant to be around 1 minute 15 seconds in length and doesn't include anything NSFW. Include tags relevent to lyrics, styles, and especially the inspiration. Pay attention to if the inspiration indicates multiple languages and include that in how you create your lyrics. 

Output Format:
{
  "prompt": "[Verse 1]\\n[Insert first verse here]\\n\\n[Chorus]\\n[Insert chorus here]\\n\\n[Bridge]\\n[Insert bridge here]\\n\\n[Chorus]\\n[Repeat chorus]" (Use this sort of syntax for song creation),
  "tags": "tag1, tag2, ...", // (song tags that should include the ones listed above. This is where you control the rhythm/style of music.)
  "title": "Insert song title here",
  "make_instrumental": false,
  "wait_audio": true
}

Here's the chat:
${chatText}

IF THE CHAT CONTAINS THEMES THAT YOU WOULD PREFER TO AVOID, DO NOT GO INTO DETAIL ABOUT THEM. CHOOSE YOUR OWN OUTPUTS BUT THE LYRICS SHOULD STILL BE RECOGNIZABLE AS INSPIRED BY THE CHAT AND IN THE LANGUAGES INDICATED BY INSPIRATION.
`
}

const generateSongLyrics = async (
  chatTextSlice: string,
  category: string,
  styles: string[],
  inspiration: string
): Promise<z.infer<typeof SongResponseSchema>> => {
  console.log('Generating song lyrics with GPT...')
  console.log('Input to GPT:', {
    chatTextLength: chatTextSlice.length,
    category,
    styles,
    inspiration,
  })

  const completion = await openaiBeta({
    model: config.textModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI that analyzes chat conversations and generates creative song lyrics.',
      },
      {
        role: 'user',
        content: generatePrompt(chatTextSlice, category, styles, inspiration),
      },
    ],
    response_format: zodResponseFormat(SongResponseSchema, 'songResponse'),
    max_tokens: 1000,
  })

  const result = SongResponseSchema.parse(completion.choices[0].message.parsed)

  if (!result) {
    throw new Error('No valid response in GPT result')
  }

  return result
}

export const callAIML = async (
  songResponse: z.infer<typeof SongResponseSchema>
) => {
  console.log('Calling AIML')
  console.log('Input to AIML:', {
    prompt: songResponse.prompt,
    tags: songResponse.tags,
    title: songResponse.title,
    make_instrumental: songResponse.make_instrumental,
    wait_audio: songResponse.wait_audio,
  })

  const url = 'https://api.aimlapi.com/v2/generate/audio/suno-ai/clip'
  const headers = {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
    'Content-Type': 'application/json',
  }

  songResponse.prompt = songResponse.prompt.slice(0, 1200)
  songResponse.wait_audio = false

  const { clip_ids } = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: songResponse.prompt,
      tags: songResponse.tags,
      title: songResponse.title,
    }),
  }).then((res) => res.json())

  console.log('Generated clip ids:', clip_ids)

  // Add a 10-second delay before checking the results
  await new Promise((resolve) => setTimeout(resolve, 10000))

  let results = []
  const maxRetries = 5
  const baseDelay = 5000 // 5 seconds

  let baseUrl = 'https://api.aimlapi.com/?ids='
  let urls = clip_ids.map((id: string) => `${baseUrl}${id}`)
  console.log('urls', urls)
  for (let url of urls) {
    let retries = 0
    while (retries < maxRetries) {
      const response = await axios.get(url, { headers })
      if (response.data[0].audio_url) {
        results.push(response.data[0])
        break
      }
      const delay = baseDelay * Math.pow(2, retries)
      console.log(`Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      retries++
    }
  }
  return results
}

export const generateSongAndContent = async (
  parsedData: ChatMessage[],
  category: string,
  styles: string[],
  inspiration: string,
  onProgress: (step: number, progress: number) => void
): Promise<SongContent> => {
  console.log('Starting song generation process...')
  onProgress(0, 0)

  // Use the same chat slicing approach as image generation
  const chatText = parsedData
    .map((msg) => `${msg.user}: ${msg.message}`)
    .join('\n')
  const chatTextSlice = chatText.slice(-70000)

  onProgress(0, 50)
  const songResponse = await generateSongLyrics(
    chatTextSlice,
    category,
    styles,
    inspiration
  )
  console.log('Song response:', songResponse)
  onProgress(0, 100)

  try {
    onProgress(1, 100)
    const result = await callAIML(songResponse)
    console.log('AIML result:', result)
    if (result.length >= 2 && result[0].audio_url && result[1].audio_url) {
      onProgress(2, 50)
      const songContent: SongContent = {
        songs: [
          {
            audioUrl: result[0].audio_url,
            imageUrl: result[0].image_url,
            title: `${songResponse.title} - Version 1`,
          },
          {
            audioUrl: result[1].audio_url,
            imageUrl: result[1].image_url,
            title: `${songResponse.title} - Version 2`,
          },
        ],
        lyrics: songResponse.prompt,
      }
      onProgress(2, 100)
      return songContent
    } else {
      throw new Error('Not enough audio URLs found in the response')
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      console.error(
        'Axios error:',
        axiosError.message,
        axiosError.response?.data
      )
      throw new Error(`Song generation failed: ${axiosError.message}`)
    } else {
      console.error('Unknown error:', error)
      throw new Error('An unknown error occurred during song generation')
    }
  }
}

export const customSongLoader = async (
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
  const response = (await requestFileWithToken(
    token,
    refreshToken,
    desiredPath
  )) as SongContent
  const filesExist = await Promise.all([
    checkFileExists(`chat/${hash}/suno/mp3s/1.mp3`),
    checkFileExists(`chat/${hash}/suno/mp3s/2.mp3`),
    checkFileExists(`chat/${hash}/suno/images/1.png`),
    checkFileExists(`chat/${hash}/suno/images/2.png`),
  ])
  // request presigned urls for the files that do exist in s3
  const urls = await Promise.all(
    filesExist.map((exists, index) => {
      const fileType = index < 2 ? 'mp3s' : 'images'
      const extension = index < 2 ? 'mp3' : 'png'
      if (exists) {
        return requestFileWithToken(
          token,
          refreshToken,
          `chat/${hash}/suno/${fileType}/${(index % 2) + 1}.${extension}`,
          true
        )
      }
      return null
    })
  )
  // replace the audio urls with the presigned urls
  response.songs.forEach((song, index) => {
    song.audioUrl = urls[index] || song.audioUrl
    song.imageUrl = urls[index + 2] || song.imageUrl
  })
  return response
}

export const customSongSaver = async (
  path: string,
  hash: string,
  result: SongContent
) => {
  const desiredPath = path.replace(':hash:', hash)
  await Promise.all([
    uploadJsonToS3(desiredPath, result),
    downloadAudio(result, hash),
  ])
}

export const downloadAudio = async (songContent: SongContent, hash: string) => {
  console.log('Starting downloadAudio function')
  console.log('Received songContent:', JSON.stringify(songContent, null, 2))
  console.log('Hash:', hash)

  const audioUrls = songContent.songs.map((song) => song.audioUrl)
  console.log('Audio URLs:', audioUrls)

  const audio = await Promise.all(
    audioUrls.map(async (url, index) => {
      if (!url) {
        console.error(`Invalid audio URL for song index ${index}:`, url)
        return null
      }
      try {
        console.log(`Fetching audio from URL for song index ${index}:`, url)
        const response = await fetch(url)
        if (!response.ok) {
          console.error(
            `Failed to fetch audio for song index ${index}:`,
            response.statusText
          )
          return null
        }
        return response
      } catch (error) {
        console.error(`Error fetching audio for song index ${index}:`, error)
        return null
      }
    })
  )

  const audioBlobs = await Promise.all(
    audio.map((audio, index) => {
      if (!audio) {
        console.error(`No audio response for song index ${index}`)
        return null
      }
      console.log(`Converting audio response to blob for song index ${index}`)
      return audio.blob()
    })
  )

  const imageBlobs = await Promise.all(
    songContent.songs.map((song, index) => {
      if (song.imageUrl) {
        console.log(
          `Fetching image from URL for song index ${index}:`,
          song.imageUrl
        )
        return fetch(song.imageUrl)
          .then((res) => {
            if (!res.ok) {
              console.error(
                `Failed to fetch image for song index ${index}:`,
                res.statusText
              )
              return null
            }
            return res.blob()
          })
          .catch((error) => {
            console.error(
              `Error fetching image for song index ${index}:`,
              error
            )
            return null
          })
      }
      console.warn(`No image URL for song index ${index}`)
      return null
    })
  )

  console.log('audioBlobs', audioBlobs)
  console.log('imageBlobs', imageBlobs)

  await Promise.all([
    audioBlobs[0] &&
      uploadBlobToS3(audioBlobs[0], `chat/${hash}/suno/mp3s/1.mp3`),
    audioBlobs[1] &&
      uploadBlobToS3(audioBlobs[1], `chat/${hash}/suno/mp3s/2.mp3`),
    imageBlobs[0] &&
      uploadBlobToS3(imageBlobs[0], `chat/${hash}/suno/images/1.png`),
    imageBlobs[1] &&
      uploadBlobToS3(imageBlobs[1], `chat/${hash}/suno/images/2.png`),
  ])

  console.log('Audio and images uploaded successfully')
}
