import { ChatMessage } from "@/lib/types";
import { z } from "zod";
import { anthropicBedrock } from "@amackenzie1/mosaic-lib";

// Define the response schema to match our existing structure
const ClipSchema = z.object({
  title: z.string(),
  start_index: z.number(),
  end_index: z.number(),
  social_share_caption: z.string(),
  viral_score: z.number().min(1).max(100),
});

const ClipsResponseSchema = z.object({
  clips: z.array(ClipSchema),
});

export type Clip = z.infer<typeof ClipSchema>;
export type ClipsResponseType = z.infer<typeof ClipsResponseSchema>;

// Target size for chunks (approximately 20k characters)
const TARGET_CHUNK_SIZE = 200000;

function splitIntoLargeChunks(messages: ChatMessage[]): ChatMessage[][] {
  const chunks: ChatMessage[][] = [];
  let currentChunk: ChatMessage[] = [];
  let currentSize = 0;

  for (const message of messages) {
    const messageSize = JSON.stringify(message).length;

    if (
      currentSize + messageSize > TARGET_CHUNK_SIZE &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(message);
    currentSize += messageSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function evaluateConversationChunk(
  messages: ChatMessage[],
  chunkId: number
): Promise<ClipsResponseType> {
  const conversation = messages
    .map((msg) => `${msg.user}: ${msg.message} [${msg.index}]`)
    .join("\n");

  const prompt = `You are analyzing chat conversations to identify moments that would be compelling on social media. We're looking for exchanges that are either completely unhinged or incredibly sweet and heartwarming.
  Literally just find the craziest/funniest/stupidest chats. As unique and creative and cute as possible, not just straight nsfw. (No inventing stuff though!! If there's not enough content just don't include any quotes. I repeat, no inventing.)

  Here's the conversation chunk (#${chunkId}):
  ${conversation}

  Respond in JSON format with a list of clips. For each clip, include:
  - title: A Reddit-style title for the clip (catchy but not clickbait)
  - start_index: The index of the first message in the clip (use the number in square brackets)
  - end_index: The index of the last message in the clip (use the number in square brackets)
  - social_share_caption: A short, punchy, Instagram-style caption
  - viral_score: A number from 1-100 indicating how viral-worthy this clip is (be VERY selective)

  Rules:
  - Each clip should contain 4-10 messages maximum
  - Use the exact message indexes provided in square brackets
  - Only include truly viral-worthy moments (viral_score should be high)
  - The title should be attention-grabbing but accurate
  - The social_share_caption should be short and engaging

  Format:
  {
    "clips": [
      {
        "title": "...",
        "start_index": number,
        "end_index": number,
        "social_share_caption": "...",
        "viral_score": number
      },
      ...
    ]
  }`;

  try {
    const response = await anthropicBedrock({
      model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    if (response.content[0]?.type !== "text") {
      throw new Error("Invalid response type from Claude");
    }

    let content = response.content[0].text;
    // Remove anything before the first { and after the last }
    content = content.substring(
      content.indexOf("{"),
      content.lastIndexOf("}") + 1
    );

    try {
      console.log("Content about to be parsed:", content);
      const jsonParsed = JSON.parse(content);
      return ClipsResponseSchema.parse(jsonParsed);
    } catch (parseError) {
      console.error(`JSON Parse Error in chunk ${chunkId}:`, parseError);
      console.error(`Problematic content from chunk ${chunkId}:`, content);
      return { clips: [] };
    }
  } catch (error) {
    console.error(`Error processing chunk ${chunkId}:`, error);
    return { clips: [] };
  }
}

export async function detectClips(
  messages: ChatMessage[]
): Promise<ClipsResponseType> {
  if (!messages.length) {
    return { clips: [] };
  }

  // Split messages into chunks
  const chunks = splitIntoLargeChunks(messages);
  console.log(`Split conversation into ${chunks.length} chunks`);

  // Process all chunks in parallel
  const chunkResults = await Promise.all(
    chunks.map((chunk, index) => evaluateConversationChunk(chunk, index + 1))
  );

  // Combine all clips
  const allClips = chunkResults.flatMap((result) => result.clips);

  // Sort by viral score
  allClips.sort((a, b) => b.viral_score - a.viral_score);

  return {
    clips: allClips.map((clip) => ({
      title: clip.title,
      start_index: clip.start_index,
      end_index: clip.end_index,
      social_share_caption: clip.social_share_caption,
      viral_score: clip.viral_score,
    })),
  };
}

// Export the old function name for backward compatibility
export const detectViralClips = detectClips;
