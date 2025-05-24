import { ChatMessage } from "@/lib/types";
import { z } from "zod";
import { anthropicBedrock } from "@amackenzie1/mosaic-lib";

// Define response schema
const CompatibilityResponse = z.object({
  reasoning: z.string(),
  strengths: z.array(z.string()),
  challenges: z.array(z.string()),
  recommendations: z.array(z.string()),
  scoreJustification: z.string(),
  offTheRecordInsights: z.string(),
  exampleInteractions: z.array(z.string()).optional(),
  overallScore: z.number(),
});

export type CompatibilityResponseType = z.infer<typeof CompatibilityResponse>;

// First, let's create a default compatibility result for when analysis fails
const DEFAULT_COMPATIBILITY_RESULT: CompatibilityResponseType = {
  reasoning: "",
  strengths: [],
  challenges: [],
  recommendations: [],
  scoreJustification: "",
  offTheRecordInsights: "",
  exampleInteractions: [],
  overallScore: 0,
};

// Updated chunking function to work with sorted messages
const createMessageChunks = (
  messages: ChatMessage[],
  maxTokens: number = 100000
): string[] => {
  console.log("Creating chunks from messages:", {
    totalMessages: messages.length,
    firstMessageDate: messages[0]?.date,
    lastMessageDate: messages[messages.length - 1]?.date,
    isAscending: messages[0]?.date <= messages[messages.length - 1]?.date,
  });

  // Convert messages to string format and estimate tokens
  const messageStrings = messages.map((msg) => `${msg.user}: ${msg.message}`);
  const totalTokens = messageStrings.join("\n").length / 2;

  // Only chunk if we exceed maxTokens
  if (totalTokens <= maxTokens) {
    console.log("Using single chunk - under token limit");
    return [messageStrings.join("\n")];
  }

  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const message of messageStrings) {
    const messageTokens = (message.length + 1) / 4; // +1 for newline
    if (currentTokens + messageTokens >= maxTokens) {
      chunks.push(currentChunk.trim());
      currentChunk = message + "\n";
      currentTokens = messageTokens;
    } else {
      currentChunk += message + "\n";
      currentTokens += messageTokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  console.log("Created chunks:", {
    numberOfChunks: chunks.length,
    chunkSizes: chunks.map((chunk) => chunk.length),
  });

  return chunks;
};

// Enhanced analyzeChunk function with a rigorous, scientifically-based prompt
const analyzeChunk = async (
  conversationChunk: string,
  users: string[],
  chunkIndex: number,
  totalChunks: number
): Promise<CompatibilityResponseType | null> => {
  console.log(
    `Analyzing conversation chunk ${chunkIndex + 1}/${totalChunks} (${
      chunkIndex === 0 ? "most recent" : "older"
    } messages):`,
    conversationChunk
  );

  // get anything like surrogate pairs or emojis out of the conversation chunk
  conversationChunk = conversationChunk.replace(/[^\p{L}\p{N}\s]/gu, "");

  const prompt = `Conversation to analyze:
${conversationChunk}

Analyze how ${users.join(
    " and "
  )} interact and what makes their dynamic work. Be specific and use examples from their conversation to support your observations. Write in full paragraphs and don't be afraid to go into detail about what you notice.

Provide your analysis in this JSON format:
{
  "strengths": ["Write detailed observations about what works well, with specific examples", "..."],
  "challenges": ["Describe specific situations or patterns that create friction", "..."],
  "recommendations": ["What might improve their dynamic?", "..."],
  "reasoning": "Write a thorough paragraph analyzing their core dynamic, supported by specific examples",
  "scoreJustification": "Explain your scoring rationale in detail, referencing specific patterns you've observed",
  "offTheRecordInsights": "As an aside, how would you describe these two? Off the record, anything pariticularly interesting/non-obvious about their dynamic?",
  "exampleInteractions": ["Include extended, verbatim quotes of their conversations - use their exact words, not summaries. Include multiple messages in each exchange to show the flow of conversation. Don't be afraid to include longer exchanges that really showcase their dynamic. NOTE: use the newline symbol to separate messages (rather than an actual new line), remember that your response is going straight into a JSON parser.", "..."],
  "overallScore": <number between 0 and 100>
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
    // remove anything before the first { and after the last }
    content = content.substring(
      content.indexOf("{"),
      content.lastIndexOf("}") + 1
    );

    try {
      console.log("Content about to be parsed:", content);
      console.log("Content length:", content.length);
      console.log("First 100 chars:", content.substring(0, 100));
      console.log("Last 100 chars:", content.substring(content.length - 100));

      const jsonParsed = JSON.parse(content);

      // Log raw response with chunk number
      console.log(`Raw Claude response for chunk ${chunkIndex + 1}:`, content);

      const transformedResponse = {
        ...jsonParsed,
      };

      // Log transformed response with chunk number
      console.log(
        `Transformed response for chunk ${chunkIndex + 1}:`,
        JSON.stringify(transformedResponse, null, 2)
      );

      const parsed = CompatibilityResponse.parse(transformedResponse);
      return parsed;
    } catch (parseError) {
      console.error(`JSON Parse Error in chunk ${chunkIndex + 1}:`, parseError);
      console.error(
        `Problematic content from chunk ${chunkIndex + 1}:`,
        content
      );
      // Try to identify where the JSON is malformed
      const lines = content.split("\n");
      lines.forEach((line: string, index: number) => {
        console.log(`Line ${index + 1}:`, line);
      });
      return null;
    }
  } catch (error) {
    console.error(
      `Error analyzing conversation chunk ${chunkIndex + 1}:`,
      error
    );
    return null;
  }
};

// Updated analyzeCompatibility function without fixed chunking
export const analyzeCompatibility = async (
  messages: ChatMessage[]
): Promise<CompatibilityResponseType> => {
  console.log("Compatibility Analysis - Verifying message order:", {
    totalMessages: messages.length,
    firstMessage: {
      date: messages[0]?.date,
      index: messages[0]?.index,
    },
    lastMessage: {
      date: messages[messages.length - 1]?.date,
      index: messages[messages.length - 1]?.index,
    },
    isChronological: messages[0]?.date <= messages[messages.length - 1]?.date,
  });

  const users = Array.from(new Set(messages.map((m) => m.user))).sort();
  const messageChunks = createMessageChunks(messages);

  // Process all chunks in parallel
  const chunkPromises = messageChunks.map((chunk, i) =>
    analyzeChunk(chunk, users, i, messageChunks.length)
  );

  const chunkResults = await Promise.all(chunkPromises);
  const validResults = chunkResults.filter(
    (result): result is CompatibilityResponseType => result !== null
  );

  if (validResults.length === 0) {
    return DEFAULT_COMPATIBILITY_RESULT;
  }

  // If we only have one chunk, return its results directly
  if (validResults.length === 1) {
    const result = validResults[0];
    return result;
  }

  // Create a summary of all chunks with timestamps
  const summaryPrompt = `You've analyzed multiple conversation chunks between ${users.join(
    " and "
  )}. Here are the results from oldest to newest:

${validResults
  .map(
    (result, index) => `
Chunk ${index + 1}:
Reasoning: ${result.reasoning}

Strengths:
${result.strengths.join("\n")}

Challenges:
${result.challenges.join("\n")}

Key Interactions (Verbatim Quotes):
${result.exampleInteractions?.join("\n\n") || ""}

Recommendations:
${result.recommendations.join("\n")}

Score Justification: ${result.scoreJustification}
Off The Record Insights: ${result.offTheRecordInsights}
Overall Score: ${result.overallScore}
`
  )
  .join("\n\n")}

Looking at their overall dynamic and these example interactions, what stands out? Write a thorough analysis that includes specific examples from their conversations. Don't be afraid to write detailed paragraphs that really capture the nuances of their interaction style.

Provide your final analysis in this JSON format:
{
  "strengths": ["Write detailed observations about what works well, with specific examples", "..."],
  "challenges": ["Describe specific situations or patterns that create friction", "..."],
  "recommendations": ["What might improve their dynamic?", "..."],
  "reasoning": "Write a thorough paragraph analyzing their core dynamic, supported by specific examples",
  "scoreJustification": "Explain your scoring rationale in detail, referencing specific patterns you've observed",
  "offTheRecordInsights": "As an aside, how would you describe these two? Off the record, anything pariticularly interesting/non-obvious about their dynamic?",
  "overallScore": <number between 0 and 100>
}`;

  try {
    const response = await anthropicBedrock({
      model: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      temperature: 0,
    });

    if (response.content[0]?.type !== "text") {
      throw new Error("Invalid response type from Claude");
    }

    let content = response.content[0].text;
    content = content.substring(
      content.indexOf("{"),
      content.lastIndexOf("}") + 1
    );

    const aggregatedResult = CompatibilityResponse.parse(JSON.parse(content));

    const result = {
      reasoning: aggregatedResult.reasoning,
      strengths: aggregatedResult.strengths,
      challenges: aggregatedResult.challenges,
      recommendations: aggregatedResult.recommendations,
      scoreJustification: aggregatedResult.scoreJustification,
      offTheRecordInsights: aggregatedResult.offTheRecordInsights,
      exampleInteractions: [],
      overallScore: aggregatedResult.overallScore,
    };

    return result;
  } catch (error) {
    console.error("Error in final analysis aggregation:", error);
    return DEFAULT_COMPATIBILITY_RESULT;
  }
};
